import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import AgentChat from '@/components/AgentChat';
import LiveCoinChart from '@/components/LiveCoinChart';

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
  // All hooks must be defined before any conditional returns
  const [index, setIndex] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);

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
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
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
        {/* Left Side - Agent Chat with Monitored Accounts */}
        <div className="w-96 flex-shrink-0 h-full">
          <div className="h-full bg-gray-800/30 backdrop-blur-xl rounded-lg border border-gray-700 relative overflow-hidden">
            <AgentChat 
              agentName={index.name} 
              agentId={index.id} 
              isPersistent={true}
              indexTokens={index.tokens}
              twitterAccounts={twitterAccounts}
              onCoinSelect={setSelectedCoin}
            />
          </div>
        </div>

        {/* Right Side - Live Chart */}
        <div className="flex-1">
          <LiveCoinChart 
            selectedCoin={selectedCoin}
            onCoinSelect={setSelectedCoin}
          />
        </div>
      </div>
    </div>
  );
};

export default IndexDetail;