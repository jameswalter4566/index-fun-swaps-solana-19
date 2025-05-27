import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, DollarSign, Users, Droplets, Activity, BarChart3, Trophy, Wallet, Eye, EyeOff, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SwapInterface from '@/components/SwapInterface';
import { useWallet } from '@solana/wallet-adapter-react';

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

interface TopTrader {
  rank: number;
  wallet: string;
  held: number;
  sold: number;
  holding: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  totalInvested: number;
  roi: string;
  status: string;
}

interface TokenHolder {
  rank: number;
  wallet: string;
  amount: number;
  valueUSD: number;
  percentage: number;
  isWhale: boolean;
  isTop10: boolean;
}

interface TokenStats {
  totalBuyers24h: number;
  totalSellers24h: number;
  volume24h: number;
  transactions24h: number;
  uniqueWallets24h: number;
  priceChange24h: number;
  buyPressure: string;
}

const LiveCoinChart: React.FC<ChartProps> = ({ selectedCoin, onCoinSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchedCoin, setSearchedCoin] = useState<CoinData | null>(null);
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [timeframe, setTimeframe] = useState('15m');
  const [loadingChart, setLoadingChart] = useState(false);
  const [topTraders, setTopTraders] = useState<TopTrader[]>([]);
  const [tokenHolders, setTokenHolders] = useState<TokenHolder[]>([]);
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [loadingTraders, setLoadingTraders] = useState(false);
  const [loadingHolders, setLoadingHolders] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [revealedWallets, setRevealedWallets] = useState<Set<string>>(new Set());
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [swapMode, setSwapMode] = useState<'buy' | 'sell'>('buy');
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { connected } = useWallet();

  const displayCoin = selectedCoin || searchedCoin;

  // Toggle wallet reveal
  const toggleWalletReveal = (wallet: string) => {
    setRevealedWallets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(wallet)) {
        newSet.delete(wallet);
      } else {
        newSet.add(wallet);
      }
      return newSet;
    });
  };

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

  // Fetch top traders
  const fetchTopTraders = async (coin: CoinData) => {
    setLoadingTraders(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-top-traders', {
        body: { tokenAddress: coin.address }
      });

      if (error) throw error;
      if (data && data.traders) {
        setTopTraders(data.traders);
      }
    } catch (error) {
      console.error('Error fetching top traders:', error);
    } finally {
      setLoadingTraders(false);
    }
  };

  // Fetch token holders
  const fetchTokenHolders = async (coin: CoinData) => {
    setLoadingHolders(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-token-holders', {
        body: { tokenAddress: coin.address }
      });

      if (error) throw error;
      if (data && data.holders) {
        setTokenHolders(data.holders.topHolders);
      }
    } catch (error) {
      console.error('Error fetching token holders:', error);
    } finally {
      setLoadingHolders(false);
    }
  };

  // Fetch token stats
  const fetchTokenStats = async (coin: CoinData) => {
    setLoadingStats(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-token-stats', {
        body: { tokenAddress: coin.address }
      });

      if (error) throw error;
      if (data && data.summary) {
        setTokenStats(data.summary);
      }
    } catch (error) {
      console.error('Error fetching token stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch all data when coin changes
  useEffect(() => {
    if (!displayCoin) return;

    // Fetch all data
    fetchChartData(displayCoin);
    fetchTopTraders(displayCoin);
    fetchTokenHolders(displayCoin);
    fetchTokenStats(displayCoin);

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
    const candleSpacing = 0; // No space between candles - they should touch
    const maxCandleWidth = 20; // Increased max candle width
    const candleWidth = Math.min(maxCandleWidth, Math.max(1, (width - 2 * padding) / chartData.length));

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
          const totalWidth = width - 2 * padding;
          const x = padding + (index * candleWidth) + (candleWidth / 2);
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
                opacity="0.8"
              />
              {/* Body */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                stroke={color}
                strokeWidth="0"
                rx="0"
              />
            </g>
          );
        })}

        {/* Volume bars at bottom */}
        {chartData.length > 0 && (() => {
          const maxVolume = Math.max(...chartData.map(c => c.volume));
          const volumeHeight = 40;
          
          return chartData.map((candle, index) => {
            const x = padding + (index * candleWidth) + (candleWidth / 2);
            const barHeight = (candle.volume / maxVolume) * volumeHeight;
            const isGreen = candle.close >= candle.open;
            
            return (
              <rect
                key={`vol-${index}`}
                x={x - candleWidth / 2}
                y={height - 40 - barHeight}
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
      <GlassCard className="flex-1" glow>
        <div className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="Enter token address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 neon-glow-input"
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700 border-purple-500"
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
                {/* Buy/Sell Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSwapMode('buy');
                      setShowSwapDialog(true);
                    }}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Buy
                  </Button>
                  <Button
                    onClick={() => {
                      setSwapMode('sell');
                      setShowSwapDialog(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    Sell
                  </Button>
                </div>
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
        </div>
        
        <div>
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
            <div className="h-[400px] flex items-center justify-center text-gray-400 bg-black/50 rounded-lg">
              <div className="text-center px-8">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50 text-purple-500" />
                <p className="text-lg font-medium mb-2">Chart Will Display Here!</p>
                <p className="text-sm text-gray-500">Search coin now or click a recommendation from the AI agent!</p>
              </div>
            </div>
          )}
          
          {/* Data Tabs - Always visible */}
          <div className="mt-6">
            <Tabs defaultValue="traders" className="w-full">
              <TabsList className="w-full justify-start bg-gray-800 border border-gray-700 rounded-full p-1">
                <TabsTrigger 
                  value="traders" 
                  className="rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Top Traders
                </TabsTrigger>
                <TabsTrigger 
                  value="holders" 
                  className="rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Holders
                </TabsTrigger>
              </TabsList>
                
                <TabsContent value="traders" className="mt-4">
                  {!displayCoin ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20 text-purple-500" />
                      <p className="text-gray-400">Our AI will populate this with trader information once available</p>
                    </div>
                  ) : loadingTraders ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading top traders...</p>
                    </div>
                  ) : topTraders.length > 0 ? (
                    <div className="max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700">
                            <TableHead>Rank</TableHead>
                            <TableHead>Wallet</TableHead>
                            <TableHead>Total PnL</TableHead>
                            <TableHead>ROI</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topTraders.slice(0, 10).map((trader) => (
                            <TableRow key={trader.wallet} className="border-gray-700">
                              <TableCell className="font-medium">#{trader.rank}</TableCell>
                              <TableCell className="font-mono text-xs">
                                <div className="flex items-center gap-2">
                                  <span>
                                    {revealedWallets.has(trader.wallet) 
                                      ? trader.wallet 
                                      : `${trader.wallet.slice(0, 4)}...${trader.wallet.slice(-4)}`}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleWalletReveal(trader.wallet)}
                                  >
                                    {revealedWallets.has(trader.wallet) ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className={trader.totalPnL >= 0 ? "text-green-600" : "text-red-600"}>
                                ${trader.totalPnL.toFixed(2)}
                              </TableCell>
                              <TableCell className={trader.totalPnL >= 0 ? "text-green-600" : "text-red-600"}>
                                {trader.roi}
                              </TableCell>
                              <TableCell>
                                <span className={cn(
                                  "text-xs px-2 py-1 rounded-full",
                                  trader.status === "holding" 
                                    ? "bg-green-500/20 text-green-500 border border-green-500/30" 
                                    : "bg-gray-500/20 text-gray-500 border border-gray-500/30"
                                )}>
                                  {trader.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No trader data available</p>
                  )}
                </TabsContent>
                
                <TabsContent value="holders" className="mt-4">
                  {!displayCoin ? (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20 text-purple-500" />
                      <p className="text-gray-400">Our AI will populate this with holder information once available</p>
                    </div>
                  ) : loadingHolders ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading holders...</p>
                    </div>
                  ) : tokenHolders.length > 0 ? (
                    <div className="max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700">
                            <TableHead>Rank</TableHead>
                            <TableHead>Wallet</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>%</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tokenHolders.slice(0, 10).map((holder) => (
                            <TableRow key={holder.wallet} className="border-gray-700">
                              <TableCell className="font-medium">
                                #{holder.rank}
                                {holder.isWhale && <span className="ml-1 text-yellow-500">🐋</span>}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                <div className="flex items-center gap-2">
                                  <span>
                                    {revealedWallets.has(holder.wallet) 
                                      ? holder.wallet 
                                      : `${holder.wallet.slice(0, 4)}...${holder.wallet.slice(-4)}`}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleWalletReveal(holder.wallet)}
                                  >
                                    {revealedWallets.has(holder.wallet) ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{(holder.amount / 1e9).toFixed(2)}B</TableCell>
                              <TableCell>${(holder.valueUSD / 1e3).toFixed(1)}K</TableCell>
                              <TableCell className={holder.isTop10 ? "text-yellow-500 font-semibold" : ""}>
                                {holder.percentage.toFixed(2)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No holder data available</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
        </div>
      </GlassCard>

      {/* Swap Panel - Always visible */}
      <GlassCard className="w-80" glow>
        {displayCoin ? (
          <>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Coin Details</h3>
          </div>
          <div className="space-y-4">
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

            {/* Token Stats from API */}
            {tokenStats && (
              <>
                <hr className="border-gray-700" />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    24h Activity
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-500">Volume</p>
                      <p className="font-semibold">${(tokenStats.volume24h / 1e6).toFixed(2)}M</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Transactions</p>
                      <p className="font-semibold">{tokenStats.transactions24h.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Buyers</p>
                      <p className="font-semibold text-green-600">{tokenStats.totalBuyers24h.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Sellers</p>
                      <p className="font-semibold text-red-600">{tokenStats.totalSellers24h.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-500 text-sm">Buy Pressure</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{ width: tokenStats.buyPressure }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{tokenStats.buyPressure}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <hr className="border-gray-700" />

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
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    setSwapMode('buy');
                    setShowSwapDialog(true);
                  }}
                >
                  Buy {displayCoin.symbol}
                </Button>
              </TabsContent>
              
              <TabsContent value="sell" className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm">20%</Button>
                  <Button variant="outline" size="sm">50%</Button>
                  <Button variant="outline" size="sm">100%</Button>
                </div>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    setSwapMode('sell');
                    setShowSwapDialog(true);
                  }}
                >
                  Sell {displayCoin.symbol}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30 text-purple-500" />
              <p className="text-sm text-gray-500">Select a coin to view details</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Swap Dialog */}
      <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {swapMode === 'buy' ? `Buy ${displayCoin?.symbol || 'Token'}` : `Sell ${displayCoin?.symbol || 'Token'}`}
            </DialogTitle>
          </DialogHeader>
          <SwapInterface 
            fromToken={swapMode === 'sell' && displayCoin ? {
              address: displayCoin.address,
              symbol: displayCoin.symbol,
              name: displayCoin.name,
              logo: displayCoin.logo
            } : undefined}
            toToken={swapMode === 'buy' && displayCoin ? {
              address: displayCoin.address,
              symbol: displayCoin.symbol,
              name: displayCoin.name,
              logo: displayCoin.logo
            } : undefined}
            mode={swapMode}
            onSwapComplete={() => {
              setShowSwapDialog(false);
              // Optionally refresh data
              if (displayCoin) {
                fetchChartData(displayCoin);
                fetchTokenStats(displayCoin);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveCoinChart;