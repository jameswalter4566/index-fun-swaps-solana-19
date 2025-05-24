import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import PriceChart from '@/components/PriceChart';

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

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{index.name}</h1>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Created {new Date(index.created_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>{index.tokens.length} tokens</span>
        </div>
      </div>

      {/* Market Cap Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>combined market cap</CardTitle>
          <div className="flex gap-4 mt-2">
            <div>
              <p className="text-sm text-gray-600">total market cap</p>
              <p className="text-2xl font-bold">{formatNumber(index.total_market_cap)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">average market cap</p>
              <p className="text-2xl font-bold">{formatNumber(index.average_market_cap)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PriceChart 
            tokens={index.tokens.filter((t: Token) => !t.error)} 
            height={300}
          />
        </CardContent>
      </Card>

      {/* Token List */}
      <div className="space-y-4 mb-8">
        <h2 className="text-2xl font-bold">tokens in this index</h2>
        {index.tokens.map((token) => (
          <Card key={token.address} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4">
                <img 
                  src={token.image || '/placeholder.svg'} 
                  alt={token.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{token.name}</h3>
                      <p className="text-sm text-gray-600">{token.symbol}</p>
                    </div>
                    <Badge 
                      variant={token.priceChange24h >= 0 ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      {token.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatPercentage(token.priceChange24h)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Market Cap
                      </p>
                      <p className="font-semibold">{formatNumber(token.marketCap)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-semibold">${token.price.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Liquidity</p>
                      <p className="font-semibold">{formatNumber(token.liquidity)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Holders
                      </p>
                      <p className="font-semibold">{token.holders.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Swap Button */}
      <Button 
        className="w-full h-16 text-lg font-bold bg-green-500 hover:bg-green-600 text-black shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.7)] transition-all duration-300"
        onClick={() => {
          toast({
            title: "429 Too Many Requests",
            description: "Rate limit exceeded, retry in 17 seconds.",
            variant: "destructive",
          });
        }}
      >
        SWAP INTO INDEX
      </Button>
    </div>
  );
};

export default IndexDetail;