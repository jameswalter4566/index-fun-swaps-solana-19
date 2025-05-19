
import { useState, useEffect, useCallback } from 'react';
import { 
  calculateIndexGainPercentage, 
  calculate1HourGainPercentage,
  calculate6HourGainPercentage,
  generateMockVolume,
  calculateIndexWeightedMarketCap
} from '@/lib/token';
import { useIndexStore } from '@/stores/useIndexStore';
import { tokenWebSocketService, WebSocketState } from '@/lib/token/websocket';
import { useTokenStore } from '@/stores/useTokenStore';

// How often to refresh token data (ms)
const REFRESH_INTERVAL = 60000; // 1 minute
const MARKET_CAP_RETRY_INTERVAL = 10000; // 10 seconds

export function useTokenRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { getAllIndexes, updateIndexGains, updateIndexVolume } = useIndexStore();
  const { connectionState, getToken } = useTokenStore();
  
  // Initialize WebSocket connection when the hook is first used
  useEffect(() => {
    // Connect to the WebSocket server
    tokenWebSocketService.connect().catch(error => {
      console.error('Failed to connect to WebSocket server:', error);
    });
    
    // Clean up WebSocket connection when component unmounts
    return () => {
      tokenWebSocketService.disconnect();
    };
  }, []);
  
  const refreshTokenData = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log("Starting token data refresh");
    
    try {
      const indexes = getAllIndexes();
      console.log(`Refreshing data for ${indexes.length} indexes`);
      
      // Update each index with latest data
      await Promise.all(
        indexes.map(async (index) => {
          // Extract token addresses
          const tokenAddresses = index.tokens.map(token => token.address);
          
          // Check if we have real-time data from WebSocket
          let hasLiveData = connectionState === WebSocketState.OPEN;
          let weightedMarketCap: number | null = null;
          let gainPercentage: number | null = null;
          let change1h: number | null = null;
          let change6h: number | null = null;
          
          // Try to calculate market cap from live data first
          if (hasLiveData) {
            // Calculate weighted market cap from live data
            let totalMarketCap = 0;
            let validTokenCount = 0;
            let totalWeight = 0;
            let weighted1hChange = 0;
            let weighted6hChange = 0;
            let weighted24hChange = 0;
            
            // Process each token
            for (const address of tokenAddresses) {
              const tokenData = getToken(address);
              
              if (tokenData?.marketCap) {
                const marketCap = tokenData.marketCap;
                totalMarketCap += marketCap;
                validTokenCount++;
                
                // Use market cap as weight for percentage changes
                const weight = marketCap;
                totalWeight += weight;
                
                if (tokenData.change1h !== undefined) {
                  weighted1hChange += tokenData.change1h * weight;
                }
                
                if (tokenData.change6h !== undefined) {
                  weighted6hChange += tokenData.change6h * weight;
                }
                
                if (tokenData.change24h !== undefined) {
                  weighted24hChange += tokenData.change24h * weight;
                }
              }
            }
            
            // Only use live data if we have enough valid tokens
            if (validTokenCount > 0) {
              weightedMarketCap = totalMarketCap;
              
              if (totalWeight > 0) {
                change1h = parseFloat((weighted1hChange / totalWeight).toFixed(2));
                change6h = parseFloat((weighted6hChange / totalWeight).toFixed(2));
                gainPercentage = parseFloat((weighted24hChange / totalWeight).toFixed(2));
              }
            } else {
              hasLiveData = false;
            }
          }
          
          // Fall back to API calls if we don't have live data
          if (!hasLiveData || weightedMarketCap === null) {
            // Get updated market cap and gain percentages using REST API
            [weightedMarketCap, gainPercentage, change1h, change6h] = await Promise.all([
              calculateIndexWeightedMarketCap(tokenAddresses),
              calculateIndexGainPercentage(tokenAddresses),
              calculate1HourGainPercentage(tokenAddresses),
              calculate6HourGainPercentage(tokenAddresses)
            ]);
          }
          
          console.log(`Index ${index.id} refresh results:`, {
            weightedMarketCap,
            gainPercentage,
            change1h,
            change6h,
            hasLiveData
          });
          
          // Use the weighted market cap for updating the index
          // If weightedMarketCap is null, we keep the previous value (don't override with null)
          const marketCapToUse = weightedMarketCap !== null ? weightedMarketCap : index.marketCap || 0;
          const gainToUse = gainPercentage !== null ? gainPercentage : index.gainPercentage || 0;
          const change1hToUse = change1h !== null ? change1h : index.percentChange1h || 0;
          const change6hToUse = change6h !== null ? change6h : index.percentChange6h || 0;
          
          // Update the index gains in the store
          updateIndexGains(index.id, gainToUse, marketCapToUse, change1hToUse, change6hToUse);
          
          // Generate mock volume data based on existing volume (if any)
          const newVolume = generateMockVolume(index.totalVolume);
          updateIndexVolume(index.id, newVolume);
        })
      );
      
      setLastRefreshed(new Date());
      console.log("Token data refresh completed");
    } catch (error) {
      console.error("Error refreshing token data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [getAllIndexes, updateIndexGains, updateIndexVolume, isRefreshing, connectionState, getToken]);
  
  // Retry function specifically for market cap data when not initially available
  const retryMarketCapFetch = useCallback(async () => {
    console.log("Retrying market cap fetch for all indexes");
    
    try {
      const indexes = getAllIndexes();
      
      // Filter indexes with no market cap data
      const indexesNeedingMarketCap = indexes.filter(index => !index.marketCap);
      
      if (indexesNeedingMarketCap.length === 0) {
        console.log("All indexes have market cap data, no retry needed");
        return;
      }
      
      console.log(`Retrying market cap fetch for ${indexesNeedingMarketCap.length} indexes`);
      
      await Promise.all(
        indexesNeedingMarketCap.map(async (index) => {
          const tokenAddresses = index.tokens.map(token => token.address);
          
          // Try to get market cap from live data first
          let hasLiveData = connectionState === WebSocketState.OPEN;
          let weightedMarketCap: number | null = null;
          
          if (hasLiveData) {
            let totalMarketCap = 0;
            let validTokenCount = 0;
            
            // Calculate from live data
            for (const address of tokenAddresses) {
              const tokenData = getToken(address);
              
              if (tokenData?.marketCap) {
                totalMarketCap += tokenData.marketCap;
                validTokenCount++;
              }
            }
            
            if (validTokenCount > 0) {
              weightedMarketCap = totalMarketCap;
            } else {
              // Fall back to API if not enough live data
              weightedMarketCap = await calculateIndexWeightedMarketCap(tokenAddresses);
            }
          } else {
            // Fall back to API
            weightedMarketCap = await calculateIndexWeightedMarketCap(tokenAddresses);
          }
          
          if (weightedMarketCap !== null) {
            console.log(`Successfully fetched market cap for index ${index.id}: ${weightedMarketCap}`);
            // Only update the market cap, keep other values the same
            updateIndexGains(
              index.id, 
              index.gainPercentage || 0, 
              weightedMarketCap,
              index.percentChange1h, 
              index.percentChange6h
            );
          } else {
            console.log(`Failed to fetch market cap for index ${index.id} on retry attempt`);
          }
        })
      );
    } catch (error) {
      console.error("Error in market cap retry:", error);
    }
  }, [getAllIndexes, updateIndexGains, connectionState, getToken]);

  // Set up periodic refresh
  useEffect(() => {
    // Initial refresh
    refreshTokenData();
    
    // Set up interval for regular refreshing
    const intervalId = setInterval(refreshTokenData, REFRESH_INTERVAL);
    
    // Set up retry interval for market cap data
    const marketCapRetryId = setInterval(retryMarketCapFetch, MARKET_CAP_RETRY_INTERVAL);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      clearInterval(marketCapRetryId);
    };
  }, [refreshTokenData, retryMarketCapFetch]);

  return {
    isRefreshing,
    lastRefreshed,
    refreshData: refreshTokenData
  };
}
