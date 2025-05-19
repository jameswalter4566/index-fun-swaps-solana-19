import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, CircleDot } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/components/ui/sonner';

interface Token {
  id: string;
  name: string;
  address: string;
  image_url?: string;
}

interface IndexCardProps {
  id: string;
  name: string;
  tokens: Token[];
  gainPercentage: number;
  upvotes: number;
  creatorUsername?: string;
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

const IndexCard: React.FC<IndexCardProps> = ({ id, name, tokens, gainPercentage, upvotes, creatorUsername }) => {
  const [upvoted, setUpvoted] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [solanaAmount, setSolanaAmount] = useState('1');
  const { isAuthenticated } = useAuth();
  
  const chartData = generateChartData();
  const totalMarketCap = 12500000; // Mock total weighted market cap
  
  const handleUpvote = async () => {
    if (!isAuthenticated) {
      toast("Authentication required", {
        description: "Please connect your wallet to upvote",
        position: "bottom-center",
      });
      return;
    }

    if (!upvoted) {
      try {
        // Update upvotes in Supabase
        const { error } = await supabase
          .from('indexes')
          .update({ upvotes: currentUpvotes + 1 })
          .eq('id', id);
          
        if (error) {
          throw new Error(error.message);
        }
        
        setCurrentUpvotes(currentUpvotes + 1);
        setUpvoted(true);
      } catch (error: any) {
        console.error("Error upvoting index:", error);
        toast("Failed to upvote", {
          description: error.message || "An error occurred while upvoting",
          position: "bottom-center",
        });
      }
    } else {
      try {
        // Remove upvote in Supabase
        const { error } = await supabase
          .from('indexes')
          .update({ upvotes: currentUpvotes - 1 })
          .eq('id', id);
          
        if (error) {
          throw new Error(error.message);
        }
        
        setCurrentUpvotes(currentUpvotes - 1);
        setUpvoted(false);
      } catch (error: any) {
        console.error("Error removing upvote:", error);
        toast("Failed to remove upvote", {
          description: error.message || "An error occurred while removing upvote",
          position: "bottom-center",
        });
      }
    }
  };

  const gainColor = gainPercentage >= 0 ? 'text-green-500' : 'text-red-500';
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast("Address copied", {
      description: "Token address copied to clipboard",
      position: "bottom-center",
    });
  };
  
  return (
    <>
      <Card className="overflow-hidden card-hover border border-stake-card bg-stake-card">
        <CardHeader className="p-4 bg-stake-darkbg border-b border-stake-background">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <CardTitle className="text-lg font-bold text-stake-text">{name}</CardTitle>
              {creatorUsername && (
                <p className="text-xs text-stake-muted mt-1">by @{creatorUsername}</p>
              )}
            </div>
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
                {tokens.map((token) => (
                  <span 
                    key={token.id || token.address} 
                    className="inline-block bg-stake-darkbg rounded-full px-3 py-1 text-xs text-stake-text"
                  >
                    {token.name}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-stake-background">
              <button 
                onClick={handleUpvote} 
                className={`flex items-center gap-1 text-sm ${upvoted ? 'text-stake-accent' : 'text-stake-muted'} hover:text-stake-accent transition-colors`}
                disabled={!isAuthenticated}
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
              <p className="text-2xl font-bold text-green-500">${totalMarketCap.toLocaleString()}</p>
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
                {tokens.map((token) => (
                  <div 
                    key={token.id || token.address} 
                    className="flex justify-between items-center bg-stake-card p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={token.image_url} alt={token.name} />
                        <AvatarFallback className="bg-stake-darkbg text-xs">
                          {token.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-stake-text">{token.name}</span>
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
                ))}
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
                disabled={!isAuthenticated}
              >
                {isAuthenticated ? `Swap ${solanaAmount} SOL for ${name}` : 'Connect wallet to swap'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default IndexCard;
