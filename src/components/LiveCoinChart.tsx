import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, DollarSign, Users, Droplets, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface CoinData {
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  liquidity: number;
  supply: number;
  logo?: string;
}

interface ChartProps {
  selectedCoin: CoinData | null;
  onCoinSelect: (coin: CoinData) => void;
}

interface PriceDataPoint {
  time: number;
  price: number;
}

const LiveCoinChart: React.FC<ChartProps> = ({ selectedCoin, onCoinSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchedCoin, setSearchedCoin] = useState<CoinData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Subscribe to price updates when a coin is selected
  useEffect(() => {
    if (!selectedCoin) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // For now, simulate price updates with random data
    // In production, this would connect to Solana Tracker WebSocket
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 0.002; // ±0.2% variation
      const newPrice = currentPrice * (1 + variation) || selectedCoin.price;
      
      setCurrentPrice(newPrice);
      setPriceHistory(prev => {
        const newHistory = [...prev, { time: Date.now(), price: newPrice }];
        // Keep only last 100 data points
        return newHistory.slice(-100);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedCoin, currentPrice]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('query-new-coin', {
        body: { tokenAddress: searchQuery.trim() }
      });

      if (error) throw error;

      if (data && data.token && data.pools?.[0]) {
        const coinData: CoinData = {
          address: data.token.mint,
          name: data.token.name,
          symbol: data.token.symbol,
          price: data.formattedPrice,
          priceChange24h: data.priceChange24h,
          marketCap: data.formattedMarketCap,
          liquidity: data.formattedLiquidity,
          supply: data.pools[0].tokenSupply,
          logo: data.token.image
        };

        setSearchedCoin(coinData);
        onCoinSelect(coinData);
        setCurrentPrice(coinData.price);
        setPriceHistory([{ time: Date.now(), price: coinData.price }]);
      }
    } catch (error) {
      console.error('Error searching coin:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to find coin. Please check the address.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const displayCoin = selectedCoin || searchedCoin;

  // Simple line chart rendering
  const renderChart = () => {
    if (priceHistory.length < 2) return null;

    const width = 600;
    const height = 300;
    const padding = 40;

    const minPrice = Math.min(...priceHistory.map(p => p.price));
    const maxPrice = Math.max(...priceHistory.map(p => p.price));
    const priceRange = maxPrice - minPrice || 1;

    const points = priceHistory.map((point, index) => {
      const x = padding + (index / (priceHistory.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const isPositive = priceHistory[priceHistory.length - 1].price >= priceHistory[0].price;

    return (
      <svg width={width} height={height} className="w-full h-full">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={padding}
            y1={padding + i * (height - 2 * padding) / 4}
            x2={width - padding}
            y2={padding + i * (height - 2 * padding) / 4}
            stroke="#e5e7eb"
            strokeDasharray="5,5"
          />
        ))}
        
        {/* Price line */}
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="2"
        />
        
        {/* Area under curve */}
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill={isPositive ? '#10b98120' : '#ef444420'}
        />
      </svg>
    );
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Chart Section */}
      <Card className="flex-1 bg-stake-card border-stake-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="Enter token address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              size="icon"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {displayCoin && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {displayCoin.logo && (
                  <img src={displayCoin.logo} alt={displayCoin.name} className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <h3 className="font-semibold">{displayCoin.symbol}</h3>
                  <p className="text-sm text-gray-500">{displayCoin.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${currentPrice.toFixed(8)}</p>
                <p className={cn(
                  "text-sm flex items-center gap-1",
                  displayCoin.priceChange24h >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {displayCoin.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {displayCoin.priceChange24h >= 0 ? '+' : ''}{displayCoin.priceChange24h.toFixed(2)}%
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {displayCoin ? (
            <div className="h-[300px] flex items-center justify-center">
              {renderChart()}
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Search for a token or select from recommendations</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swap Panel */}
      {displayCoin && (
        <Card className="w-80 bg-stake-card border-stake-border">
          <CardHeader>
            <CardTitle className="text-lg">Coin Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Coin Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Price USD
                </span>
                <span className="font-semibold">${displayCoin.price.toFixed(8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Market Cap
                </span>
                <span className="font-semibold">${(displayCoin.marketCap / 1e6).toFixed(2)}M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Droplets className="h-3 w-3" /> Liquidity
                </span>
                <span className="font-semibold">${(displayCoin.liquidity / 1e6).toFixed(2)}M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Supply
                </span>
                <span className="font-semibold">{(displayCoin.supply / 1e9).toFixed(2)}B</span>
              </div>
            </div>

            <hr className="border-stake-border" />

            {/* Buy/Sell Tabs */}
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
              
              <TabsContent value="buy" className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Amount (SOL)</label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    className="mt-1"
                  />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Buy {displayCoin.symbol}
                </Button>
              </TabsContent>
              
              <TabsContent value="sell" className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm">20%</Button>
                  <Button variant="outline" size="sm">50%</Button>
                  <Button variant="outline" size="sm">100%</Button>
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Sell {displayCoin.symbol}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveCoinChart;