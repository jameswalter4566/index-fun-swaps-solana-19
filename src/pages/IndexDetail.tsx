import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import NodeVisualizer from '@/components/NodeVisualizer';
import AgentChat from '@/components/AgentChat';

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
  metadata?: any;
}

interface IndexData {
  id: string;
  name: string;
  tokens: Token[];
  creator_wallet: string;
  total_market_cap: number;
  average_market_cap: number;
  created_at: string;
}

const IndexDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [index, setIndex] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIndexData();
  }, [id]);

  const fetchIndexData = async () => {
    try {
      const { data, error } = await supabase
        .from('indexes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setIndex(data);
    } catch (error) {
      console.error('Error fetching index:', error);
      toast({
        title: 'Error',
        description: 'Failed to load index data',
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!index) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-gray-600">Index not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        onClick={() => navigate('/')}
        variant="ghost"
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Indexes
      </Button>

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">{index.name}</h1>
        <div className="flex gap-4 text-sm text-gray-600 justify-center">
          <span>Created {new Date(index.created_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>{index.tokens.length} tokens</span>
        </div>
      </div>

      <div className="flex gap-6 justify-center">
        {/* Agent Chat - Center Screen */}
        <div className="w-full max-w-4xl">
          <Card className="h-[calc(100vh-12rem)] bg-stake-card border-stake-border">
            <CardContent className="p-0 h-full">
              <AgentChat 
                agentName={index.name} 
                agentId={index.id} 
                isPersistent={true}
                indexTokens={index.tokens}
              />
            </CardContent>
          </Card>
        </div>

        {/* Twitter Accounts Being Monitored - Right Side */}
        <div className="w-80 space-y-4">
          <h2 className="text-xl font-bold">Monitored Accounts</h2>
          <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {index.tokens.map((token) => {
              const metadata = token.metadata as any;
              const isTwitterAccount = token.name?.startsWith('@');
              
              if (isTwitterAccount && metadata) {
                return (
                  <Card key={token.address} className="overflow-hidden bg-stake-card border-stake-border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={token.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.name}`} 
                          alt={token.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">{metadata.display_name || token.name}</h3>
                            {metadata.verified && (
                              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">{token.name}</p>
                          <div className="flex gap-4 text-xs mt-1">
                            <span className="text-gray-600">
                              <strong>{metadata.followers_count?.toLocaleString() || '0'}</strong> followers
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              // Fallback for old token data
              return (
                <Card key={token.address} className="overflow-hidden bg-stake-card border-stake-border">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={token.image || '/placeholder.svg'} 
                        alt={token.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{token.name}</h3>
                        <p className="text-xs text-gray-600">{token.symbol}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexDetail;