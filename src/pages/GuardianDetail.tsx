import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import GuardianChat from '@/components/GuardianChat';
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

interface GuardianData {
  id: string;
  name: string;
  tokens: Token[];
  creator_wallet: string;
  total_market_cap: number;
  average_market_cap: number;
  created_at: string;
}

const GuardianDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  // All hooks must be defined before any conditional returns
  const [guardian, setGuardian] = useState<GuardianData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);

  useEffect(() => {
    fetchGuardianData();
  }, [id]);

  const fetchGuardianData = async () => {
    try {
      const { data, error } = await supabase
        .from('indexes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setGuardian(data);
    } catch (error) {
      console.error('Error fetching guardian:', error);
      toast({
        title: 'Error',
        description: 'Failed to load guardian data',
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

  if (!guardian) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-gray-600">Guardian not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  // Filter only Twitter accounts
  const twitterAccounts = guardian.tokens.filter(token => token.name?.startsWith('@'));

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
        <h1 className="text-xl font-bold">{guardian.name}</h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Side - Guardian Chat with Monitored Accounts */}
        <div className="w-96 flex-shrink-0 h-full">
          <div className="h-full bg-gray-800/30 backdrop-blur-xl rounded-lg border border-gray-700 relative overflow-hidden">
            <GuardianChat 
              agentName={guardian.name} 
              agentId={guardian.id} 
              isPersistent={true}
              indexTokens={guardian.tokens}
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

export default GuardianDetail;