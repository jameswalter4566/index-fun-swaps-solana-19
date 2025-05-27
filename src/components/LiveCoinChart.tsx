import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, DollarSign, Users, Droplets, Activity, BarChart3 } from 'lucide-react';
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

interface CandleData {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  time: number;
}

const LiveCoinChart: React.FC<ChartProps> = ({ selectedCoin, onCoinSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchedCoin, setSearchedCoin] = useState<CoinData | null>(null);
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [timeframe, setTimeframe] = useState('15m');
  const [loadingChart, setLoadingChart] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const displayCoin = selectedCoin || searchedCoin;

  // Timeframe options
  const timeframes = [
    { value: '1m', label: '1M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '30m', label: '30M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
  ];

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Fetch chart data
  const fetchChartData = async (coin: CoinData) => {
    setLoadingChart(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-chart-data', {
        body: { 
          tokenAddress: coin.address,
          type: timeframe,
          removeOutliers: true
        }
      });

      if (error) throw error;

      if (data && data.oclhv) {
        setChartData(data.oclhv);
        // Update current price to latest close
        if (data.oclhv.length > 0) {
          setCurrentPrice(data.oclhv[data.oclhv.length - 1].close);
        }
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast({
        title: 'Chart Error',
        description: 'Failed to load chart data',
        variant: 'destructive',
      });
    } finally {
      setLoadingChart(false);
    }
  };

  // Fetch chart data when coin or timeframe changes
  useEffect(() => {
    if (!displayCoin) return;

    fetchChartData(displayCoin);

    // Refresh chart data every 30 seconds
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      fetchChartData(displayCoin);
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [displayCoin?.address, timeframe]);

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

  // Render candlestick chart
  const renderCandlestickChart = () => {
    if (chartData.length === 0) return null;

    const width = 800;
    const height = 400;
    const padding = 60;
    const candleWidth = Math.max(2, (width - 2 * padding) / chartData.length - 2);

    // Calculate price range
    const prices = chartData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Helper to convert price to Y coordinate
    const priceToY = (price: number) => {
      return height - padding - ((price - minPrice) / priceRange) * (height - 2 * padding);
    };

    // Format price for display
    const formatChartPrice = (price: number) => {
      if (price < 0.00001) return price.toExponential(2);
      if (price < 0.01) return price.toFixed(6);
      return price.toFixed(4);
    };

    return (
      <svg width={width} height={height} className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Background */}
        <rect width={width} height={height} fill="#0a0a0a" />
        
        {/* Grid lines and price labels */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const y = padding + i * (height - 2 * padding) / 5;
          const price = maxPrice - (i * priceRange / 5);
          return (
            <g key={i}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#333"
                strokeDasharray="5,5"
              />
              <text
                x={width - padding + 5}
                y={y + 4}
                fill="#999"
                fontSize="10"
                textAnchor="start"
              >
                ${formatChartPrice(price)}
              </text>
            </g>
          );
        })}

        {/* Candlesticks */}
        {chartData.map((candle, index) => {
          const x = padding + index * ((width - 2 * padding) / chartData.length) + candleWidth / 2;
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? '#10b981' : '#ef4444';
          
          const bodyTop = priceToY(Math.max(candle.open, candle.close));
          const bodyBottom = priceToY(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(1, bodyBottom - bodyTop);

          return (
            <g key={index}>
              {/* Wick */}
              <line
                x1={x}
                y1={priceToY(candle.high)}
                x2={x}
                y2={priceToY(candle.low)}
                stroke={color}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                stroke={color}
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* Volume bars at bottom */}
        {chartData.length > 0 && (() => {
          const maxVolume = Math.max(...chartData.map(c => c.volume));
          const volumeHeight = 60;
          
          return chartData.map((candle, index) => {
            const x = padding + index * ((width - 2 * padding) / chartData.length) + candleWidth / 2;
            const barHeight = (candle.volume / maxVolume) * volumeHeight;
            const isGreen = candle.close >= candle.open;
            
            return (
              <rect
                key={`vol-${index}`}
                x={x - candleWidth / 2}
                y={height - padding + 10}
                width={candleWidth}
                height={barHeight}
                fill={isGreen ? '#10b98133' : '#ef444433'}
              />
            );
          });
        })()}

        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#666" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#666" />
        
        {/* Current price line */}
        {currentPrice > 0 && (
          <>
            <line
              x1={padding}
              y1={priceToY(currentPrice)}
              x2={width - padding}
              y2={priceToY(currentPrice)}
              stroke="#fbbf24"
              strokeDasharray="5,5"
              strokeWidth="1"
            />
            <rect
              x={width - padding - 60}
              y={priceToY(currentPrice) - 10}
              width="60"
              height="20"
              fill="#fbbf24"
              rx="2"
            />
            <text
              x={width - padding - 30}
              y={priceToY(currentPrice) + 4}
              fill="#000"
              fontSize="10"
              textAnchor="middle"
              fontWeight="bold"
            >
              ${formatChartPrice(currentPrice)}
            </text>
          </>
        )}
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
                  <h3 className="font-semibold flex items-center gap-2">
                    {displayCoin.symbol}
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                  </h3>
                  <p className="text-sm text-gray-500">{displayCoin.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Timeframe selector */}
                <div className="flex gap-1">
                  {timeframes.map(tf => (
                    <Button
                      key={tf.value}
                      size="sm"
                      variant={timeframe === tf.value ? "default" : "outline"}
                      onClick={() => setTimeframe(tf.value)}
                      className="px-2 py-1 text-xs"
                    >
                      {tf.label}
                    </Button>
                  ))}
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
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {displayCoin ? (
            <div className="h-[400px] flex items-center justify-center bg-black rounded-lg p-4">
              {loadingChart ? (
                <div className="text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Loading chart data...</p>
                </div>
              ) : (
                renderCandlestickChart()
              )}
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
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