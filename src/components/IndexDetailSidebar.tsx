import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface IndexData {
  id: string;
  name: string;
  tokens: Token[];
  creator_wallet: string;
  total_market_cap: number;
  average_market_cap: number;
  created_at: string;
}

interface IndexDetailSidebarProps {
  indexId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const IndexDetailSidebar: React.FC<IndexDetailSidebarProps> = ({ indexId, isOpen, onClose }) => {
  const { toast } = useToast();
  const [index, setIndex] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (indexId && isOpen) {
      fetchIndexData();
    }
  }, [indexId, isOpen]);

  const fetchIndexData = async () => {
    if (!indexId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('indexes')
        .select('*')
        .eq('id', indexId)
        .single();

      if (error) throw error;

      setIndex(data);
      
      // Generate chart data
      const mockChartData = data.tokens.map((token: Token, index: number) => ({
        name: token.symbol,
        marketCap: token.marketCap,
        cumulative: data.tokens.slice(0, index + 1).reduce((sum: number, t: Token) => sum + t.marketCap, 0)
      }));
      
      setChartData(mockChartData);
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Index Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : index ? (
            <>
              {/* Index Info */}
              <div>
                <h1 className="text-2xl font-bold mb-2">{index.name}</h1>
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  <span>Created {new Date(index.created_at).toLocaleDateString()}</span>
                  <span>{index.tokens.length} tokens</span>
                </div>
              </div>

              {/* Market Cap Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Market Cap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold">{formatNumber(index.total_market_cap)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average</p>
                    <p className="text-xl font-bold">{formatNumber(index.average_market_cap)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Cumulative Market Cap</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis tickFormatter={(value) => formatNumber(value)} fontSize={12} />
                      <Tooltip 
                        formatter={(value: number) => formatNumber(value)}
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCumulative)"
                        dot={{ fill: '#10b981', r: 4, strokeWidth: 1, stroke: '#fff' }}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Token List */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Tokens</h3>
                {index.tokens.map((token) => (
                  <Card key={token.address} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={token.image || '/placeholder.svg'} 
                          alt={token.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm truncate">{token.name}</h4>
                              <p className="text-xs text-gray-600">{token.symbol}</p>
                            </div>
                            {!token.error && (
                              <Badge 
                                variant={token.priceChange24h >= 0 ? 'default' : 'destructive'}
                                className="flex items-center gap-1 text-xs"
                              >
                                {token.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {formatPercentage(token.priceChange24h)}
                              </Badge>
                            )}
                          </div>
                          {token.error ? (
                            <p className="text-xs text-red-500">{token.error}</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-gray-600">Market Cap</p>
                                <p className="font-semibold">{formatNumber(token.marketCap)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Holders</p>
                                <p className="font-semibold">{token.holders.toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Swap Button */}
              <Button 
                className="w-full h-12 text-lg font-bold bg-green-500 hover:bg-green-600 text-black shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.7)] transition-all duration-300"
                onClick={() => {
                  toast({
                    title: "Swap Feature Coming Soon",
                    description: "The swap functionality will be available in the next update.",
                  });
                }}
              >
                SWAP INTO INDEX
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Index not found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IndexDetailSidebar;