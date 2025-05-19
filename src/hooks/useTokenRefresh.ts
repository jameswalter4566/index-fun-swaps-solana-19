import { useState, useEffect, useCallback } from 'react';
import { 
  calculateIndexGainPercentage, 
  calculate1HourGainPercentage,
  calculate6HourGainPercentage,
  generateMockVolume,
  calculateIndexWeightedMarketCap
} from '@/lib/token';
import { useIndexStore } from '@/stores/useIndexStore';

// How often to refresh token data (ms)
const REFRESH_INTERVAL = 60000; // 1 minute
const MARKET_CAP_RETRY_INTERVAL = 10000; // 10 seconds

export function useTokenRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { 
    getAllIndexes, 
    updateLocalIndexGains, 
    updateLocalIndexVolume 
  } = useIndexStore();
  
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
          
          // Get updated market cap and gain percentages using real data when possible
          const [weightedMarketCap, gainPercentage, change1h, change6h] = await Promise.all([
            calculateIndexWeightedMarketCap(tokenAddresses),
            calculateIndexGainPercentage(tokenAddresses),
            calculate1HourGainPercentage(tokenAddresses),
            calculate6HourGainPercentage(tokenAddresses)
          ]);
          
          console.log(`Index ${index.id} refresh results:`, {
            weightedMarketCap,
            gainPercentage,
            change1h,
            change6h
          });
          
          // Use the weighted market cap for updating the index
          // If weightedMarketCap is null, we keep the previous value (don't override with null)
          const marketCapToUse = weightedMarketCap !== null ? weightedMarketCap : index.marketCap || 0;
          
          // Update the index gains locally in the store without writing to Supabase
          updateLocalIndexGains(index.id, gainPercentage, marketCapToUse, change1h, change6h);
          
          // Generate mock volume data based on existing volume (if any)
          const newVolume = generateMockVolume(index.totalVolume);
          updateLocalIndexVolume(index.id, newVolume);
        })
      );
      
      setLastRefreshed(new Date());
      console.log("Token data refresh completed");
    } catch (error) {
      console.error("Error refreshing token data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [getAllIndexes, updateLocalIndexGains, updateLocalIndexVolume, isRefreshing]);
  
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
          const weightedMarketCap = await calculateIndexWeightedMarketCap(tokenAddresses);
          
          if (weightedMarketCap !== null) {
            console.log(`Successfully fetched market cap for index ${index.id}: ${weightedMarketCap}`);
            // Only update the market cap locally, keep other values the same
            updateLocalIndexGains(
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
  }, [getAllIndexes, updateLocalIndexGains]);

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
