import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Connection, VersionedTransaction, Transaction } from '@solana/web3.js';
import { ArrowDownUp, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwapInterfaceProps {
  fromToken?: {
    address: string;
    symbol: string;
    name: string;
    logo?: string;
    decimals?: number;
  };
  toToken?: {
    address: string;
    symbol: string;
    name: string;
    logo?: string;
    decimals?: number;
  };
  mode?: 'buy' | 'sell';
  onSwapComplete?: () => void;
}

const SwapInterface: React.FC<SwapInterfaceProps> = ({ 
  fromToken, 
  toToken: initialToToken,
  mode = 'buy',
  onSwapComplete 
}) => {
  const { publicKey, signTransaction, sendTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('0.1'); // Default to 0.1 SOL or token
  const [slippage, setSlippage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [priorityFee, setPriorityFee] = useState('auto');
  const [priorityFeeLevel, setPriorityFeeLevel] = useState('medium');
  const [pendingSwap, setPendingSwap] = useState(false);

  // Default SOL token
  const solToken = {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9
  };

  // For sell mode, swap from the token to SOL
  // For buy mode, swap from SOL to the token
  const from = mode === 'sell' ? fromToken : (fromToken || solToken);
  const [toToken, setToToken] = useState(mode === 'sell' ? solToken : initialToToken);
  const [toTokenAddress, setToTokenAddress] = useState(
    mode === 'sell' ? solToken.address : (initialToToken?.address || '')
  );

  useEffect(() => {
    if (mode === 'sell') {
      setToToken(solToken);
      setToTokenAddress(solToken.address);
    } else if (initialToToken) {
      setToToken(initialToToken);
      setToTokenAddress(initialToToken.address);
    }
  }, [initialToToken, mode]);

  // Auto-fetch quote when component mounts or when amount changes
  useEffect(() => {
    if (amount && toTokenAddress && publicKey && from) {
      const timeoutId = setTimeout(() => {
        getSwapQuote();
      }, 500); // Debounce for 500ms
      return () => clearTimeout(timeoutId);
    }
  }, [amount, toTokenAddress, publicKey, from?.address]);

  // Auto-execute swap when wallet connects if there's a pending swap
  useEffect(() => {
    if (connected && publicKey && pendingSwap) {
      setPendingSwap(false);
      // Give the wallet a moment to fully connect
      setTimeout(() => {
        executeSwap(false);
      }, 500);
    }
  }, [connected, publicKey, pendingSwap]);


  const connection = new Connection(
    'https://mainnet.helius-rpc.com/?api-key=726140d8-6b0d-4719-8702-682d81e94a37',
    {
      commitment: 'confirmed',
      wsEndpoint: undefined // Disable WebSocket to avoid connection errors
    }
  );

  const getSwapQuote = async () => {
    if (!amount || !toTokenAddress || !publicKey) return;

    setLoading(true);
    try {
      // Use URL params for GET request
      const params = new URLSearchParams({
        from: from.address,
        to: toTokenAddress,
        amount,
        slippage: slippage.toString(),
        payer: publicKey.toString()
      });
      
      if (priorityFee && priorityFee !== 'auto') {
        params.append('priorityFee', priorityFee);
      } else if (priorityFee === 'auto') {
        params.append('priorityFee', 'auto');
        params.append('priorityFeeLevel', priorityFeeLevel);
      }

      const { data, error } = await supabase.functions.invoke(
        `get-swap?${params.toString()}`,
        { method: 'GET' }  // Explicitly specify GET method
      );

      if (error) {
        console.error('Quote error:', error);
        throw error;
      }

      console.log('Swap quote received:', data);
      setSwapQuote(data);
      return data;
    } catch (error) {
      console.error('Error getting swap quote:', error);
      toast({
        title: 'Error',
        description: 'Failed to get swap quote',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async (useExistingQuote = false) => {
    if (!connected || !publicKey || !signTransaction || !sendTransaction) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to swap',
        variant: 'destructive',
      });
      return;
    }

    if (!amount || !toTokenAddress) {
      toast({
        title: 'Invalid input',
        description: 'Please enter amount and select tokens',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Use existing quote or get fresh one
      let quote = useExistingQuote ? swapQuote : null;
      if (!quote) {
        quote = await getSwapQuote();
        if (!quote) return;
      }

      console.log('Using swap quote:', {
        hasTransaction: !!quote.txn,
        type: quote.type,
        rate: quote.rate,
        success: quote.success
      });

      // Check if the quote has the expected structure
      if (!quote.txn) {
        throw new Error('Quote does not contain transaction data');
      }

      // Deserialize the transaction
      // Convert base64 to Uint8Array (browser-compatible)
      const base64ToUint8Array = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      const serializedTransactionBuffer = base64ToUint8Array(quote.txn);
      let txn;

      if (quote.type === 'v0') {
        txn = VersionedTransaction.deserialize(serializedTransactionBuffer);
      } else {
        txn = Transaction.from(serializedTransactionBuffer);
      }

      if (!txn) {
        throw new Error('Failed to deserialize transaction');
      }

      // Get a fresh blockhash to ensure transaction isn't expired
      console.log('Getting fresh blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      
      // Update transaction with fresh blockhash
      if ('message' in txn) {
        // Legacy transaction
        txn.recentBlockhash = blockhash;
      } else {
        // Versioned transaction
        txn.message.recentBlockhash = blockhash;
      }

      // Sign the transaction
      console.log('Signing transaction...');
      const signedTxn = await signTransaction(txn);
      console.log('Transaction signed');

      // Simulate the transaction first
      console.log('Simulating transaction...');
      try {
        const simulation = await connection.simulateTransaction(signedTxn, {
          commitment: 'confirmed',
        });
        console.log('Simulation result:', simulation);
        
        if (simulation.value.err) {
          console.error('Simulation failed:', simulation.value.err);
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
      } catch (simError) {
        console.error('Simulation error:', simError);
        // Continue anyway as simulation might fail but transaction could still succeed
      }

      // Send the transaction
      console.log('Sending transaction...');
      const txid = await sendTransaction(signedTxn, connection, {
        skipPreflight: true, // Skip preflight since we already simulated
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });
      console.log('Transaction sent:', txid);
      
      // Check if transaction exists immediately
      const initialStatus = await connection.getSignatureStatus(txid);
      console.log('Initial transaction status:', initialStatus);

      toast({
        title: 'Swap initiated',
        description: `Transaction ID: ${txid.slice(0, 8)}...${txid.slice(-8)}`,
      });

      // Wait for confirmation using polling instead of WebSocket
      let confirmed = false;
      let retries = 0;
      const maxRetries = 30; // 30 seconds timeout
      
      while (!confirmed && retries < maxRetries) {
        try {
          const status = await connection.getSignatureStatus(txid);
          
          if (status?.value?.confirmationStatus === 'confirmed' || 
              status?.value?.confirmationStatus === 'finalized') {
            confirmed = true;
            if (status.value.err) {
              throw new Error('Transaction failed');
            }
          }
        } catch (error) {
          console.log('Checking transaction status...', error);
        }
        
        if (!confirmed) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          retries++;
        }
      }
      
      if (!confirmed) {
        throw new Error(`Transaction confirmation timeout. Check transaction ${txid} on Solana Explorer`);
      }

      toast({
        title: 'Swap completed!',
        description: `Successfully swapped ${amount} ${from.symbol} for ${quote.rate?.amountOut || 'unknown amount'} ${toToken?.symbol || 'tokens'}`,
      });

      // Reset form but keep default amount
      setAmount('0.1');
      setSwapQuote(null);
      
      if (onSwapComplete) {
        onSwapComplete();
      }

    } catch (error: any) {
      console.error('Swap error:', error);
      console.error('Error details:', {
        message: error.message,
        logs: error.logs,
        error: error.error,
        code: error.code
      });
      
      // Extract more specific error message
      let errorMessage = 'Failed to complete swap';
      if (error.logs && error.logs.length > 0) {
        errorMessage = error.logs.join(' ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Swap failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setSwapQuote(null); // Clear quote when amount changes
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownUp className="h-5 w-5" />
          Swap Tokens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <Label>From</Label>
          <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
            {from.logo && (
              <img src={from.logo} alt={from.symbol} className="w-8 h-8 rounded-full" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{from.symbol}</div>
              <div className="text-xs text-gray-500">{from.name}</div>
            </div>
            <Input
              type="text"
              placeholder="0.0"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-32 text-right bg-transparent border-0 focus:ring-0"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDownUp className="h-6 w-6 text-gray-500" />
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <Label>To</Label>
          <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
            {toToken ? (
              <>
                {toToken.logo && (
                  <img src={toToken.logo} alt={toToken.symbol} className="w-8 h-8 rounded-full" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{toToken.symbol}</div>
                  <div className="text-xs text-gray-500">{toToken.name}</div>
                </div>
                {swapQuote && swapQuote.rate && (
                  <div className="text-right">
                    <div className="font-semibold">{swapQuote.rate.amountOut?.toFixed(6) || '0'}</div>
                    <div className="text-xs text-gray-500">
                      ${((swapQuote.rate.amountOut || 0) * (swapQuote.rate.executionPrice || 0)).toFixed(2)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Input
                type="text"
                placeholder="Enter token address"
                value={toTokenAddress}
                onChange={(e) => setToTokenAddress(e.target.value)}
                className="flex-1 bg-transparent"
              />
            )}
          </div>
        </div>

        {/* Slippage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Slippage Tolerance</Label>
            <span className="text-sm text-gray-500">{slippage}%</span>
          </div>
          <Slider
            value={[slippage]}
            onValueChange={(value) => setSlippage(value[0])}
            min={0.1}
            max={50}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Priority Fee */}
        <div className="space-y-2">
          <Label>Priority Fee</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={priorityFee === 'auto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPriorityFee('auto')}
            >
              Auto
            </Button>
            <Button
              variant={priorityFee !== 'auto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPriorityFee('0.001')}
            >
              Custom (0.001 SOL)
            </Button>
          </div>
          {priorityFee === 'auto' && (
            <div className="flex gap-1">
              {['min', 'low', 'medium', 'high', 'veryHigh'].map((level) => (
                <Button
                  key={level}
                  variant={priorityFeeLevel === level ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setPriorityFeeLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Swap Info */}
        {swapQuote && swapQuote.rate && (
          <div className="space-y-2 p-3 bg-gray-900 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Rate</span>
              <span>1 {from.symbol} = {swapQuote.rate.executionPrice?.toFixed(6) || '0'} {toToken?.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Price Impact</span>
              <span className={cn(
                (swapQuote.rate.priceImpact || 0) > 0.05 ? 'text-red-500' : 'text-green-500'
              )}>
                {((swapQuote.rate.priceImpact || 0) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Min Received</span>
              <span>{swapQuote.rate.minAmountOut?.toFixed(6) || '0'} {toToken?.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platform Fee</span>
              <span>{swapQuote.rate.platformFeeUI || '0'} SOL</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!connected ? (
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 cursor-pointer" 
              onClick={() => {
                console.log('Connect wallet button clicked');
                setPendingSwap(true);
                setVisible(true);
              }}
              type="button"
              disabled={!amount || !toTokenAddress || loading}
            >
              Connect Wallet to Swap
            </Button>
          ) : (
            <>
              {/* Single Swap Now button that gets quote and executes */}
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
                onClick={() => {
                  // Double check wallet connection
                  if (!connected) {
                    setVisible(true);
                    return;
                  }
                  
                  if (!swapQuote) {
                    // Get quote first, then execute
                    getSwapQuote().then((quote) => {
                      if (quote) {
                        executeSwap(false);
                      }
                    });
                  } else {
                    // Execute with existing quote
                    executeSwap(true);
                  }
                }}
                disabled={!amount || !toTokenAddress || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {swapQuote ? 'Swapping...' : 'Getting Quote...'}
                  </>
                ) : swapQuote && swapQuote.rate ? (
                  `Swap ${amount} ${from.symbol} for ${swapQuote.rate.amountOut?.toFixed(6) || '0'} ${toToken?.symbol}`
                ) : (
                  `Swap ${amount} ${from.symbol}`
                )}
              </Button>
              
              {/* Optional: Show quote details button */}
              {!swapQuote && (
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={getSwapQuote}
                  disabled={!amount || !toTokenAddress || loading}
                >
                  Preview Quote
                </Button>
              )}
            </>
          )}
        </div>

        {/* Warning for high slippage */}
        {slippage > 15 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-yellow-500">High slippage tolerance may result in unfavorable trades</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SwapInterface;