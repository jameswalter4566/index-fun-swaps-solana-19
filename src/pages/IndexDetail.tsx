import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
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

  // Filter only Twitter accounts
  const twitterAccounts = index.tokens.filter(token => token.name?.startsWith('@'));

  return (
    <div className="h-screen flex flex-col bg-stake-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stake-border flex items-center justify-between">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-bold">{index.name}</h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Chat Container - Takes up most of the screen */}
        <div className="flex-1">
          <Card className="h-full bg-stake-card border-stake-border">
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

        {/* Monitored Accounts - Narrow sidebar */}
        {twitterAccounts.length > 0 && (
          <div className="w-64 flex-shrink-0">
            <Card className="h-full bg-stake-card border-stake-border overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-stake-border">
                <CardTitle className="text-sm font-semibold">Monitored Accounts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-y-auto h-[calc(100%-3.5rem)]">
                  {twitterAccounts.map((token) => {
                    const metadata = token.metadata as any;
                    
                    return (
                      <div key={token.address} className="p-3 border-b border-stake-border hover:bg-stake-darkbg transition-colors">
                        <div className="flex items-center gap-3">
                          <img 
                            src={token.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.name}`} 
                            alt={token.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-sm truncate">
                                {metadata?.display_name || token.name}
                              </p>
                              {metadata?.verified && (
                                <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                </svg>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{token.name}</p>
                            {metadata?.followers_count && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {metadata.followers_count.toLocaleString()} followers
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexDetail;