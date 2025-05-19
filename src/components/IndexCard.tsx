import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, CircleDot } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/hooks/use-toast';
import { useIndexStore, IndexData, Token } from '@/stores/useIndexStore';
import { generateChartData, getTokenData, TokenData } from '@/lib/tokenService';

interface IndexCardProps {
  index: IndexData;
}

const IndexCard: React.FC<IndexCardProps> = ({ index }) => {
  const { 
    id, 
    name, 
    tokens, 
    upvotes, 
    gainPercentage = 0, 
    marketCap = 0,
    totalVolume = 0,
    percentChange1h = 0,
    percentChange6h = 0
  } = index;
  
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [solanaAmount, setSolanaAmount] = useState('1');
  const [chartData, setChartData] = useState<any[]>([]);
  const [tokenDetails, setTokenDetails] = useState<Record<string, TokenData>>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadedTokenAddresses, setLoadedTokenAddresses] = useState<string[]>([]);
  
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const { upvoteIndex, downvoteIndex } = useIndexStore();
  
  // Check if the current user has upvoted this index
  const isUpvoted = publicKey && index.upvotedBy.includes(publicKey.toString());
  
  useEffect(() => {
    // Generate chart data when component mounts
    setChartData(generateChartData());
  }, [id]);

  // Fetch token details when the swap sheet is opened
  useEffect(() => {
    if (showSwapSheet && tokens.length > 0) {
      const fetchTokenDetails = async () => {
        setIsLoadingDetails(true);
        try {
          const details: Record<string, TokenData> = {};
          const newlyLoadedAddresses: string[] = [];
          
          await Promise.all(
            tokens.map(async (token) => {
              // Skip tokens we've already loaded
              if (tokenDetails[token.address]) {
                details[token.address] = tokenDetails[token.address];
                return;
              }
              
              try {
                const tokenData = await getTokenData(token.address);
                if (tokenData) {
                  details[token.address] = tokenData;
                  newlyLoadedAddresses.push(token.address);
                }
              } catch (error) {
                console.error(`Error fetching details for token ${token.address}:`, error);
                // Create fallback entry for failed tokens
                details[token.address] = {
                  address: token.address,
                  name: token.name || `Unknown Token`,
                  symbol: token.symbol || "???",
                  imageUrl: token.imageUrl,
                  change24h: 0
                };
              }
            })
          );
          
          // Update token details and track which ones we've loaded
          setTokenDetails(prevDetails => ({...prevDetails, ...details}));
          setLoadedTokenAddresses(prev => [...prev, ...newlyLoadedAddresses]);
        } catch (error) {
          console.error("Error fetching token details:", error);
          toast({
            title: "Error loading tokens",
            description: "Some token data couldn't be loaded",
            variant: "destructive",
          });
        } finally {
          setIsLoadingDetails(false);
        }
      };
      
      fetchTokenDetails();
    }
  }, [showSwapSheet, tokens]);
  
  const handleUpvote = () => {
    if (!connected || !publicKey) {
      toast({
        title: "wallet not connected",
        description: "please connect your wallet to upvote",
        variant: "destructive",
      });
      setVisible(true);
      return;
    }
    
    const walletAddress = publicKey.toString();
    
    if (isUpvoted) {
      downvoteIndex(id, walletAddress);
    } else {
      upvoteIndex(id, walletAddress);
    }
  };
  
  const handleSwap = () => {
    if (!connected) {
      toast({
        title: "wallet not connected",
        description: "please connect your wallet to swap",
        variant: "destructive",
      });
      setVisible(true);
      return;
    }
    
    setShowSwapSheet(true);
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "address copied",
      description: "token address copied to clipboard",
    });
  };
  
  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    
    if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    } else if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(1)}K`;
    } else {
      return `$${marketCap}`;
    }
  };
  
  // Format volume number with appropriate suffix (in SOL)
  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M SOL`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K SOL`;
    } else {
      return `${volume.toFixed(2)} SOL`;
    }
  };
  
  // Helper function for percentage color
  const getPercentageColor = (value: number): string => {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };
  
  const gainColor = getPercentageColor(gainPercentage);
  const formattedMarketCap = marketCap ? formatMarketCap(marketCap) : 'Calculating...';
  const formattedVolume = formatVolume(totalVolume);
  
  return (
    <>
      <Card className="overflow-hidden card-hover border border-stake-card bg-stake-card">
        <CardHeader className="p-4 bg-stake-darkbg border-b border-stake-background">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-stake-text">{name}</CardTitle>
            <span className={`font-bold ${gainColor}`}>
              {gainPercentage >= 0 ? '+' : ''}{gainPercentage}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-stake-muted mb-2">tokens</h4>
              <div className="flex flex-wrap gap-2">
                {tokens.map((token) => (
                  <span 
                    key={token.address} 
                    className="inline-flex items-center gap-1 bg-stake-darkbg rounded-full px-3 py-1 text-xs text-stake-text"
                  >
                    {token.symbol || token.name}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Volume information */}
            <div className="bg-stake-darkbg/50 p-2 rounded-md">
              <span className="text-xs text-stake-muted">volume</span>
              <p className="text-sm font-semibold text-stake-text">{formattedVolume}</p>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-stake-background">
              <button 
                onClick={handleUpvote} 
                className={`flex items-center gap-1 text-sm ${isUpvoted ? 'text-stake-accent' : 'text-stake-muted'} hover:text-stake-accent transition-colors`}
              >
                <Heart size={16} className={isUpvoted ? 'fill-stake-accent' : ''} />
                <span>{upvotes}</span>
              </button>
              
              <button 
                className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-4 rounded-full transition-colors"
                onClick={handleSwap}
              >
                swap
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Sheet open={showSwapSheet} onOpenChange={setShowSwapSheet}>
        <SheetContent className="w-[90%] sm:max-w-[540px] bg-stake-background border-stake-card">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-stake-text">{name} index</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-stake-muted">total market cap</h3>
                <p className="text-xl font-bold text-stake-text">{formattedMarketCap}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-stake-muted">total volume</h3>
                <p className="text-xl font-bold text-stake-text">{formattedVolume}</p>
              </div>
            </div>
            
            {/* Percentage changes grid */}
            <div className="grid grid-cols-3 gap-3 mb-4 bg-stake-card rounded-lg p-3">
              <div className="text-center">
                <h4 className="text-xs text-stake-muted">1h %</h4>
                <p className={`text-sm font-semibold ${getPercentageColor(percentChange1h)}`}>
                  {percentChange1h >= 0 ? '+' : ''}{percentChange1h}%
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-xs text-stake-muted">6h %</h4>
                <p className={`text-sm font-semibold ${getPercentageColor(percentChange6h)}`}>
                  {percentChange6h >= 0 ? '+' : ''}{percentChange6h}%
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-xs text-stake-muted">24h %</h4>
                <p className={`text-sm font-semibold ${getPercentageColor(gainPercentage)}`}>
                  {gainPercentage >= 0 ? '+' : ''}{gainPercentage}%
                </p>
              </div>
            </div>
            
            <div className="h-[200px] mb-6 bg-stake-card rounded-lg p-2">
              <ChartContainer config={{}} className="h-full rounded-md">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{fill: '#9CA3AF'}} />
                  <YAxis tick={{fill: '#9CA3AF'}} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-stake-text mb-3">tokens</h3>
              
              {isLoadingDetails ? (
                <div className="text-center py-4 text-stake-muted">
                  loading token details...
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => {
                    const tokenDetail = tokenDetails[token.address];
                    const marketCap = tokenDetail?.marketCap;
                    const change24h = tokenDetail?.change24h || 0;
                    const changeColor = getPercentageColor(change24h);
                    
                    return (
                      <div 
                        key={token.address} 
                        className="flex justify-between items-center bg-stake-card p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={tokenDetail?.imageUrl || token.imageUrl} 
                              alt={tokenDetail?.name || token.name} 
                            />
                            <AvatarFallback className="bg-stake-darkbg text-xs">
                              {token.symbol ? token.symbol.substring(0, 2) : 
                               (tokenDetail?.symbol ? tokenDetail.symbol.substring(0, 2) : 
                               token.name.substring(0, 2).toUpperCase())}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-stake-text">
                              {tokenDetail?.name || token.name}
                              {tokenDetail?.symbol && <span className="ml-1 text-stake-muted text-xs">({tokenDetail.symbol})</span>}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stake-muted">
                                {marketCap ? formatMarketCap(marketCap) : 'n/a'}
                              </span>
                              {change24h !== undefined && (
                                <span className={`text-xs ${changeColor}`}>
                                  {change24h >= 0 ? '+' : ''}{change24h}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-stake-muted mr-2 truncate max-w-[120px]">
                            {`${token.address.substring(0, 6)}...${token.address.substring(token.address.length - 4)}`}
                          </span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleCopyAddress(token.address)}
                              >
                                copy
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 text-xs">
                              address copied!
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="bg-stake-card p-4 rounded-lg">
              <h3 className="text-lg font-bold text-stake-text mb-3">swap</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">sol</span>
                </div>
                <Input
                  type="number"
                  placeholder="amount"
                  className="bg-stake-darkbg border-stake-card text-stake-text"
                  value={solanaAmount}
                  onChange={(e) => setSolanaAmount(e.target.value)}
                />
              </div>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full py-2"
              >
                swap {solanaAmount} sol for {name}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default IndexCard;
