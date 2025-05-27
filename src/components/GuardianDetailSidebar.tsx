import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import PriceChart from './PriceChart';

interface Token {
  address: string;
  name: string;
  symbol: string;
  image: string;
  marketCap: number;
  price: number;
  liquidity: number;
  holders: number;
  priceChange24h: number;
  error?: string;
}

interface GuardianData {
  id: string;
  name: string;
  tokens: Token[];
  creator_wallet: string;
  total_market_cap: number;
  average_market_cap: number;
  created_at: string;
}

interface GuardianDetailSidebarProps {
  guardianId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const GuardianDetailSidebar: React.FC<GuardianDetailSidebarProps> = ({ guardianId, isOpen, onClose }) => {
  const { toast } = useToast();
  const [guardian, setGuardian] = useState<GuardianData | null>(null);
  const [loading, setLoading] = useState(false);
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    if (guardianId && isOpen) {
      fetchGuardianData();
    }
  }, [guardianId, isOpen]);

  const fetchGuardianData = async () => {
    if (!guardianId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('indexes')
        .select('*')
        .eq('id', guardianId)
        .single();

      if (error) throw error;

      setGuardian(data);
    } catch (error) {
      console.error('Error fetching index:', error);
      toast({
        title: 'Error',
        description: 'Failed to load guardian data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-[600px] bg-stake-darkbg shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto border-l border-stake-card ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stake-card sticky top-0 bg-stake-darkbg z-10">
          <h2 className="text-2xl font-bold text-stake-text">guardian details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-stake-muted hover:text-stake-text">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : guardian ? (
            <>
              {/* Guardian Info */}
              <div>
                <h1 className="text-3xl font-bold mb-2 text-stake-text">{guardian.name}</h1>
                <div className="flex flex-col gap-1 text-sm text-stake-muted">
                  <span>created {new Date(index.created_at).toLocaleDateString()}</span>
                  <span>{guardian.tokens.length} tokens</span>
                </div>
              </div>

              {/* Market Cap Summary */}
              <Card className="bg-gray-800 border-stake-accent">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-stake-text">market cap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-stake-muted">total market cap</p>
                      <p className="text-2xl font-bold text-stake-highlight">{formatNumber(guardian.total_market_cap)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stake-muted">average market cap</p>
                      <p className="text-2xl font-bold text-stake-text">{formatNumber(guardian.average_market_cap)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart */}
              <Card className="bg-gray-800 border-stake-accent">
                <CardContent className="pt-4">
                  <PriceChart 
                    tokens={guardian.tokens.filter(t => !t.error)} 
                    height={250}
                  />
                </CardContent>
              </Card>

              {/* Token List */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-stake-text">tokens in this guardian</h3>
                <div className="grid gap-4">
                  {guardian.tokens.map((token) => (
                    <Card key={token.address} className="overflow-hidden bg-gray-800 border-stake-accent hover:border-stake-highlight transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={token.image || '/placeholder.svg'} 
                            alt={token.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-stake-accent"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="min-w-0">
                                <h4 className="font-bold text-base truncate text-stake-text">{token.name}</h4>
                                <p className="text-sm text-stake-muted">{token.symbol}</p>
                              </div>
                              {!token.error && (
                                <Badge 
                                  variant={token.priceChange24h >= 0 ? 'default' : 'destructive'}
                                  className={`flex items-center gap-1 text-sm ${
                                    token.priceChange24h >= 0 
                                      ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                                      : 'bg-red-500/20 text-red-400 border-red-500/50'
                                  }`}
                                >
                                  {token.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {formatPercentage(token.priceChange24h)}
                                </Badge>
                              )}
                            </div>
                            {token.error ? (
                              <p className="text-sm text-red-400">{token.error}</p>
                            ) : (
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-stake-muted">market cap</p>
                                  <p className="font-semibold text-stake-text">{formatNumber(token.marketCap)}</p>
                                </div>
                                <div>
                                  <p className="text-stake-muted">price</p>
                                  <p className="font-semibold text-stake-text">${token.price.toFixed(8)}</p>
                                </div>
                                <div>
                                  <p className="text-stake-muted">holders</p>
                                  <p className="font-semibold text-stake-text">{token.holders.toLocaleString()}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Swap Button */}
              <Button 
                className="w-full h-12 text-lg font-bold bg-green-500 hover:bg-green-600 text-black shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.7)] transition-all duration-300"
                onClick={() => {
                  if (!connected) {
                    setVisible(true);
                  } else {
                    toast({
                      title: "429 Too Many Requests",
                      description: "Rate limit exceeded, retry in 17 seconds.",
                      variant: "destructive",
                      className: "bg-red-600 text-white border-red-700",
                    });
                  }
                }}
              >
                {connected ? 'SWAP INTO GUARDIAN' : 'CONNECT WALLET'}
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-stake-muted">guardian not found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GuardianDetailSidebar;