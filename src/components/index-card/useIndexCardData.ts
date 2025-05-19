
import { useState, useEffect, useCallback } from 'react';
import { TokenData, getTokenData, calculateIndexWeightedMarketCap, generateChartData } from '@/lib/token';
import { Token } from '@/stores/useIndexStore';
import { useToast } from '@/hooks/use-toast';
import { useTokenSubscription } from '@/hooks/useTokenSubscription';
import { useTokenStore } from '@/stores/useTokenStore';

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
  const [gainPercentages, setGainPercentages] = useState({
    change1h: 0,
    change6h: 0,
    change24h: 0
  });
  
  const { toast } = useToast();
  const { getToken } = useTokenStore();
  
  // Subscribe to real-time token updates
  const { tokenData: liveTokenData, isSubscribed } = useTokenSubscription(tokens, {
    onTokenUpdate: (tokenData) => {
      // Update token details with live data
      setTokenDetails(prev => ({
        ...prev,
        [tokenData.address]: {
          ...prev[tokenData.address],
          ...tokenData
        }
      }));
      
      // Update market cap and gain percentages
      updateMarketCapAndGains();
    }
  });
  
  // Update market cap and gain percentages based on latest token data
  const updateMarketCapAndGains = useCallback(() => {
    if (tokens.length === 0) return;
    
    try {
      // Calculate weighted market cap using live token data
      let totalMarketCap = 0;
      let validTokenCount = 0;
      
      // Calculate weighted average for gain percentages
      let totalWeight = 0;
      let weightedChange1h = 0;
      let weightedChange6h = 0;
      let weightedChange24h = 0;
      
      // Process each token
      tokens.forEach(token => {
        const tokenData = getToken(token.address);
        
        if (tokenData?.marketCap) {
          const marketCap = tokenData.marketCap;
          totalMarketCap += marketCap;
          validTokenCount++;
          
          // Use market cap as weight for percentage changes
          const weight = marketCap;
          totalWeight += weight;
          
          if (tokenData.change1h !== undefined) {
            weightedChange1h += tokenData.change1h * weight;
          }
          
          if (tokenData.change6h !== undefined) {
            weightedChange6h += tokenData.change6h * weight;
          }
          
          if (tokenData.change24h !== undefined) {
            weightedChange24h += tokenData.change24h * weight;
          }
        }
      });
      
      // Only update market cap if we have valid data
      if (validTokenCount > 0) {
        setWeightedMarketCap(totalMarketCap);
      }
      
      // Update gain percentages if we have valid weights
      if (totalWeight > 0) {
        setGainPercentages({
          change1h: parseFloat((weightedChange1h / totalWeight).toFixed(2)),
          change6h: parseFloat((weightedChange6h / totalWeight).toFixed(2)),
          change24h: parseFloat((weightedChange24h / totalWeight).toFixed(2))
        });
      }
    } catch (error) {
      console.error("Error updating market cap and gains:", error);
    }
  }, [tokens, getToken]);
  
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
        // We don't set to null here in case we already have a value from a previous successful fetch
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
              // Check if we already have live data from WebSocket
              const liveData = liveTokenData[token.address];
              if (liveData) {
                details[token.address] = liveData;
                return;
              }
              
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
  }, [showSwapSheet, tokens, tokenDetails, liveTokenData, toast, fetchWeightedMarketCap, weightedMarketCap]);

  // Update market cap and gains when live token data changes
  useEffect(() => {
    if (Object.keys(liveTokenData).length > 0) {
      updateMarketCapAndGains();
    }
  }, [liveTokenData, updateMarketCapAndGains]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "address copied",
      description: "token address copied to clipboard",
    });
  };
  
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
    weightedMarketCap,
    isLoadingMarketCap,
    handleCopyAddress,
    formatMarketCap,
    formatVolume,
    refreshMarketCap,
    // Helper function for percentage color
    getPercentageColor: (value: number): string => {
      return value >= 0 ? 'text-green-500' : 'text-red-500';
    },
    // Live percentage changes
    gainPercentages,
    isSubscribed
  };
}
