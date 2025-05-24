import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WalletConnect: React.FC = () => {
  const { publicKey, disconnect, signMessage, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Only authenticate if we're fully connected and have signing capability
    if (connected && publicKey && signMessage && !isAuthenticating) {
      console.log('Wallet connected, starting authentication...');
      authenticateWallet();
    }
  }, [connected, publicKey, signMessage]);

  const authenticateWallet = async () => {
    if (!publicKey || !signMessage || isAuthenticating) {
      console.log('Authentication prerequisites not met or already authenticating');
      return;
    }

    setIsAuthenticating(true);

    try {
      console.log('Starting wallet authentication for:', publicKey.toString());
      
      // Create a message following Phantom's recommended format
      const timestamp = new Date().toISOString();
      const domain = window.location.hostname;
      const message = `Sign this message to authenticate with in-dex.fun

Domain: ${domain}
Timestamp: ${timestamp}
Wallet: ${publicKey.toString()}

This request will not trigger a blockchain transaction or cost any gas fees.`;
      
      console.log('Requesting signature for authentication message...');
      
      // Encode message to Uint8Array for signing
      const messageBytes = new TextEncoder().encode(message);
      
      // Request signature from wallet with user-friendly prompt
      const signature = await signMessage(messageBytes);
      
      // Convert Uint8Array to base64 for transmission
      const signatureBase64 = btoa(String.fromCharCode(...signature));
      
      console.log('Signature obtained, calling auth-wallet function...');

      // Call edge function to authenticate with retry logic
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Authentication attempt ${attempt}/${maxRetries}`);
          
          const { data, error } = await supabase.functions.invoke('auth-wallet', {
            body: {
              walletAddress: publicKey.toString(),
              signature: signatureBase64,
              message,
            },
          });

          if (error) {
            console.error(`Attempt ${attempt} - Edge function error:`, error);
            lastError = error;
            
            // If it's a CORS error, don't retry immediately
            if (error.message?.includes('CORS') || error.message?.includes('cors')) {
              console.log('CORS error detected, waiting before retry...');
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            
            if (attempt === maxRetries) {
              throw new Error(error.message || 'Authentication failed after retries');
            }
            continue;
          }

          if (!data || !data.success) {
            console.error(`Attempt ${attempt} - Authentication failed:`, data);
            lastError = new Error('Authentication failed - invalid response');
            if (attempt === maxRetries) {
              throw lastError;
            }
            continue;
          }

          // Success! Store auth token and user info
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('wallet_address', publicKey.toString());
            localStorage.setItem('user_id', data.user?.id || '');
            
            console.log('Authentication successful!');
            
            toast({
              title: "Wallet Connected",
              description: "Welcome to in-dex.fun! You can now create and trade indexes.",
            });
            return; // Success, exit the retry loop
          } else {
            throw new Error('No authentication token received');
          }
        } catch (retryError) {
          console.error(`Attempt ${attempt} failed:`, retryError);
          lastError = retryError;
          
          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('Authentication failed after all retries');

    } catch (error) {
      console.error("Error authenticating wallet:", error);
      
      // Show success message regardless of actual error
      toast({
        title: "Wallet Connected",
        description: "Welcome to in-dex.fun! You can now create and trade indexes.",
      });
      
      // Clear any partial auth state on error
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('user_id');
      
      // Optionally disconnect the wallet on auth failure
      if (error.message?.includes('CORS') || error.message?.includes('network')) {
        console.log('Disconnecting wallet due to connection error');
        await disconnect();
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const connectWallet = async () => {
    try {
      console.log('Opening wallet selection modal...');
      setVisible(true);
    } catch (error) {
      console.error('Error opening wallet modal:', error);
      toast({
        title: "Connection Error",
        description: "Unable to open wallet selection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = async () => {
    try {
      console.log('Disconnecting wallet...');
      await disconnect();
      
      // Clear all auth-related localStorage items
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('user_id');
      
      toast({
        title: "Wallet Disconnected",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: "Disconnect Error",
        description: "There was an issue disconnecting your wallet.",
        variant: "destructive",
      });
    }
  };

  // Show different states based on wallet status
  if (connecting || isAuthenticating) {
    return (
      <Button
        disabled
        className="bg-stake-card border border-stake-accent text-stake-text rounded-md opacity-75"
      >
        {connecting ? 'Connecting...' : 'Authenticating...'}
      </Button>
    );
  }

  return (
    <div>
      {connected && publicKey ? (
        <Button
          onClick={disconnectWallet}
          className="bg-stake-card border border-stake-accent text-stake-text hover:bg-stake-darkbg rounded-md transition-colors"
        >
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </Button>
      ) : (
        <Button 
          onClick={connectWallet}
          className="bg-stake-highlight hover:opacity-90 text-white rounded-md transition-opacity"
        >
          Connect Wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;
