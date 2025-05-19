
import { useState, useEffect, useCallback, useMemo } from 'react';
import { TokenData, getTokenData, calculateIndexWeightedMarketCap, generateChartData } from '@/lib/token';
import { Token } from '@/stores/useIndexStore';
import { useToast } from '@/hooks/use-toast';
import { useMultiTokenSubscription } from '@/hooks/useTokenSubscription';

export function useIndexCardData(tokens: Token[]) {
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [solanaAmount, setSolanaAmount] = useState('1');
  const [chartData, setChartData] = useState<any[]>([]);
  const [tokenDetails, setTokenDetails] = useState<Record<string, TokenData>>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadedTokenAddresses, setLoadedTokenAddresses] = useState<string[]>([]);
  const [weightedMarketCap, setWeightedMarketCap] = useState<number | null>(null);
  const [isLoadingMarketCap, setIsLoadingMarketCap] = useState(false);
  const [marketCapFetchAttempts, setMarketCapFetchAttempts] = useState(0);
  
  const { toast } = useToast();
  
  // Get live token data from WebSocket
  const tokenAddresses = tokens.map(token => token.address);
  const liveTokenData = useMultiTokenSubscription(tokenAddresses);
  
  // Calculate live weighted market cap based on real-time price updates
  const liveWeightedMarketCap = useMemo(() => {
    if (Object.keys(liveTokenData).length === 0) return null;

    let totalMarketCap = 0;
    let validTokenCount = 0;
    
    // Calculate weighted market cap from live data
    for (const address of tokenAddresses) {
      const token = liveTokenData[address];
      
      if (token?.price && token?.totalSupply) {
        const marketCap = token.price * token.totalSupply;
        totalMarketCap += marketCap;
        validTokenCount++;
      } else if (token?.marketCap) {
        totalMarketCap += token.marketCap;
        validTokenCount++;
      }
    }
    
    return validTokenCount > 0 ? totalMarketCap / validTokenCount : null;
  }, [liveTokenData, tokenAddresses]);
  
  // Function to fetch market cap with retry capability
  const fetchWeightedMarketCap = useCallback(async () => {
    if (tokens.length === 0) {
      console.log("No tokens available to calculate market cap");
      return;
    }
    
    setIsLoadingMarketCap(true);
    try {
      console.log(`Attempting to fetch weighted market cap (attempt ${marketCapFetchAttempts + 1})`);
      
      // Extract token addresses
      const tokenAddresses = tokens.map(token => token.address);
      
      // Calculate weighted market cap with improved logging
      console.log("Calling calculateIndexWeightedMarketCap with token addresses:", tokenAddresses);
      const weightedMC = await calculateIndexWeightedMarketCap(tokenAddresses);
      
      if (weightedMC !== null) {
        console.log(`Successfully calculated weighted market cap: ${weightedMC}`);
        setWeightedMarketCap(weightedMC);
      } else {
        console.log("Failed to calculate weighted market cap - no valid market cap data available");
      }
    } catch (error) {
      console.error("Error calculating weighted market cap:", error);
    } finally {
      setIsLoadingMarketCap(false);
      setMarketCapFetchAttempts(prev => prev + 1);
    }
  }, [tokens, marketCapFetchAttempts]);
  
  // Calculate weighted market cap when component mounts or tokens change
  useEffect(() => {
    console.log("Tokens changed or component mounted, fetching market cap data");
    fetchWeightedMarketCap();
    
    // Set up a retry if the first attempt fails
    if (marketCapFetchAttempts === 0) {
      const retryTimer = setTimeout(() => {
        if (weightedMarketCap === null) {
          console.log("Initial market cap fetch didn't succeed, retrying...");
          fetchWeightedMarketCap();
        }
      }, 5000); // Retry after 5 seconds
      
      return () => clearTimeout(retryTimer);
    }
  }, [tokens, fetchWeightedMarketCap, marketCapFetchAttempts, weightedMarketCap]);
  
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
              
              // Check if we already have live data from WebSocket
              if (liveTokenData[token.address]) {
                details[token.address] = liveTokenData[token.address];
                newlyLoadedAddresses.push(token.address);
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
          
          // If we don't have market cap data yet, try once more with the full token data
          if (weightedMarketCap === null) {
            console.log("No market cap data yet, attempting another fetch after loading token details");
            fetchWeightedMarketCap();
          }
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
  }, [showSwapSheet, tokens, tokenDetails, toast, fetchWeightedMarketCap, weightedMarketCap, liveTokenData]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "address copied",
      description: "token address copied to clipboard",
    });
  };
  
  // If we have live market cap data, use it instead of the static one
  const effectiveMarketCap = liveWeightedMarketCap !== null ? liveWeightedMarketCap : weightedMarketCap;
  
  // Format market cap value to human-readable string with appropriate suffix
  const formatMarketCap = (marketCap?: number | null) => {
    if (marketCap === null || marketCap === undefined) {
      return isLoadingMarketCap ? 'Loading...' : 'N/A';
    }
    
    if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    } else if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(1)}K`;
    } else {
      return `$${marketCap.toFixed(2)}`;
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

  // Reload market cap data manually if needed
  const refreshMarketCap = () => {
    fetchWeightedMarketCap();
  };

  return {
    showSwapSheet,
    setShowSwapSheet,
    solanaAmount,
    setSolanaAmount,
    chartData,
    tokenDetails,
    isLoadingDetails,
    weightedMarketCap: effectiveMarketCap,
    isLoadingMarketCap,
    handleCopyAddress,
    formatMarketCap,
    formatVolume,
    refreshMarketCap,
    // Helper function for percentage color
    getPercentageColor: (value: number): string => {
      return value >= 0 ? 'text-green-500' : 'text-red-500';
    },
  };
}
