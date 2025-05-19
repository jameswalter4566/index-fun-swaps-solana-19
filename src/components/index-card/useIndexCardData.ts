
import { useState, useEffect } from 'react';
import { TokenData, getTokenData, calculateIndexWeightedMarketCap, generateChartData } from '@/lib/tokenService';
import { Token } from '@/stores/useIndexStore';
import { useToast } from '@/hooks/use-toast';

export function useIndexCardData(tokens: Token[]) {
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [solanaAmount, setSolanaAmount] = useState('1');
  const [chartData, setChartData] = useState<any[]>([]);
  const [tokenDetails, setTokenDetails] = useState<Record<string, TokenData>>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadedTokenAddresses, setLoadedTokenAddresses] = useState<string[]>([]);
  const [weightedMarketCap, setWeightedMarketCap] = useState<number | null>(null);
  const [isLoadingMarketCap, setIsLoadingMarketCap] = useState(false);
  
  const { toast } = useToast();
  
  // Calculate weighted market cap when component mounts or tokens change
  useEffect(() => {
    const fetchWeightedMarketCap = async () => {
      setIsLoadingMarketCap(true);
      try {
        // Extract token addresses
        const tokenAddresses = tokens.map(token => token.address);
        
        // Calculate weighted market cap
        const weightedMC = await calculateIndexWeightedMarketCap(tokenAddresses);
        setWeightedMarketCap(weightedMC);
      } catch (error) {
        console.error("Error calculating weighted market cap:", error);
        setWeightedMarketCap(null);
      } finally {
        setIsLoadingMarketCap(false);
      }
    };
    
    fetchWeightedMarketCap();
  }, [tokens]);
  
  // Generate chart data when component mounts
  useEffect(() => {
    setChartData(generateChartData());
  }, [tokens]);

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
  }, [showSwapSheet, tokens, tokenDetails, toast]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "address copied",
      description: "token address copied to clipboard",
    });
  };
  
  // Format market cap value to human-readable string with appropriate suffix
  const formatMarketCap = (marketCap?: number | null) => {
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

  return {
    showSwapSheet,
    setShowSwapSheet,
    solanaAmount,
    setSolanaAmount,
    chartData,
    tokenDetails,
    isLoadingDetails,
    weightedMarketCap,
    isLoadingMarketCap,
    handleCopyAddress,
    formatMarketCap,
    formatVolume,
    // Helper function for percentage color
    getPercentageColor: (value: number): string => {
      return value >= 0 ? 'text-green-500' : 'text-red-500';
    },
  };
}
