
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useTokenMetadata, useMultipleTokenMetadata, formatMarketCap, TokenMetadata } from '@/utils/tokenUtils';

interface Token {
  name: string;
  address: string;
}

interface IndexCardProps {
  id: string;
  name: string;
  tokens: Token[];
  gainPercentage: number;
  upvotes: number;
}

// Mock chart data
const generateChartData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      date: `Day ${i + 1}`,
      value: 1000 + Math.random() * 500 + (i * 10),
    });
  }
  return data;
};

const IndexCard: React.FC<IndexCardProps> = ({ id, name, tokens, gainPercentage, upvotes }) => {
  const [upvoted, setUpvoted] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [solanaAmount, setSolanaAmount] = useState('1');
  
  const chartData = generateChartData();
  
  const { data: tokenMetadataArray, isLoading: isLoadingTokens } = useMultipleTokenMetadata(
    tokens.map(token => token.address)
  );
  
  const handleUpvote = () => {
    if (!upvoted) {
      setCurrentUpvotes(currentUpvotes + 1);
      setUpvoted(true);
    } else {
      setCurrentUpvotes(currentUpvotes - 1);
      setUpvoted(false);
    }
  };

  const gainColor = gainPercentage >= 0 ? 'text-green-500' : 'text-red-500';
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    // You could add a toast notification here
  };
  
  // Calculate total market cap from all tokens
  const totalMarketCap = tokenMetadataArray
    ? tokenMetadataArray.reduce((sum, token) => sum + (token.marketCap || 0), 0)
    : 0;
  
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
              <h4 className="text-sm font-medium text-stake-muted mb-2">Tokens</h4>
              <div className="flex flex-wrap gap-2">
                {isLoadingTokens ? (
                  <span className="text-xs text-stake-muted">Loading tokens...</span>
                ) : (
                  tokenMetadataArray?.map((token, index) => (
                    <span 
                      key={token.address} 
                      className="inline-block bg-stake-darkbg rounded-full px-3 py-1 text-xs text-stake-text"
                    >
                      {token.symbol}
                    </span>
                  ))
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-stake-background">
              <button 
                onClick={handleUpvote} 
                className={`flex items-center gap-1 text-sm ${upvoted ? 'text-stake-accent' : 'text-stake-muted'} hover:text-stake-accent transition-colors`}
              >
                <Heart size={16} className={upvoted ? 'fill-stake-accent' : ''} />
                <span>{currentUpvotes}</span>
              </button>
              
              <button 
                className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-4 rounded-full transition-colors"
                onClick={() => setShowSwapSheet(true)}
              >
                Swap
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Sheet open={showSwapSheet} onOpenChange={setShowSwapSheet}>
        <SheetContent className="w-[90%] sm:max-w-[540px] bg-stake-background border-stake-card">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-stake-text">{name} Index</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-stake-text mb-1">Total Weighted Market Cap</h3>
              <p className="text-2xl font-bold text-green-500">{formatMarketCap(totalMarketCap)}</p>
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
              <h3 className="text-lg font-bold text-stake-text mb-3">Tokens</h3>
              <div className="space-y-3">
                {isLoadingTokens ? (
                  <div className="bg-stake-card p-3 rounded-lg">
                    <span className="text-stake-muted">Loading token data...</span>
                  </div>
                ) : (
                  tokenMetadataArray?.map((token, index) => (
                    <div 
                      key={token.address} 
                      className="flex justify-between items-center bg-stake-card p-3 rounded-lg"
                    >
                      <div className="flex items-center">
                        {token.image && (
                          <img 
                            src={token.image} 
                            alt={token.symbol} 
                            className="w-6 h-6 rounded-full mr-2"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="font-medium text-stake-text">{token.symbol}</span>
                        <span className="ml-2 text-xs text-stake-muted">
                          {formatMarketCap(token.marketCap)}
                        </span>
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
                              Copy
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2 text-xs">
                            Address copied!
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-stake-card p-4 rounded-lg">
              <h3 className="text-lg font-bold text-stake-text mb-3">Swap</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">SOL</span>
                </div>
                <Input
                  type="number"
                  placeholder="Amount"
                  className="bg-stake-darkbg border-stake-card text-stake-text"
                  value={solanaAmount}
                  onChange={(e) => setSolanaAmount(e.target.value)}
                />
              </div>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full py-2"
              >
                Swap {solanaAmount} SOL for {name}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default IndexCard;
