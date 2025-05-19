import { useState, useEffect, useCallback, useRef } from 'react';
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
const MAX_RETRY_ATTEMPTS = 3;

export function useTokenRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { getAllIndexes, updateIndexGains, updateIndexVolume } = useIndexStore();
  const refreshInProgressRef = useRef(false);
  const retryAttemptsRef = useRef(0);
  
  const refreshTokenData = useCallback(async () => {
    if (refreshInProgressRef.current) {
      console.log("Token refresh already in progress, skipping");
      return;
    }
    
    refreshInProgressRef.current = true;
    setIsRefreshing(true);
    console.log("Starting token data refresh");
    
    try {
      const indexes = getAllIndexes();
      console.log(`Refreshing data for ${indexes.length} indexes`);
      
      // Update each index with latest data, but don't wait for all to complete
      for (const index of indexes) {
        try {
          // Extract token addresses
          const tokenAddresses = index.tokens.map(token => token.address);
          
          // Skip if no tokens (shouldn't happen but just in case)
          if (tokenAddresses.length === 0) {
            console.log(`Index ${index.id} has no tokens, skipping`);
            continue;
          }
          
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
          
          // Update the index gains in the store
          await updateIndexGains(index.id, gainPercentage, marketCapToUse, change1h, change6h);
          
          // Generate mock volume data based on existing volume (if any)
          const newVolume = generateMockVolume(index.totalVolume);
          await updateIndexVolume(index.id, newVolume);
          
          // Small delay between indexes to prevent API rate limits
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error(`Error refreshing index ${index.id}:`, err);
          // Continue with other indexes
        }
      }
      
      setLastRefreshed(new Date());
      retryAttemptsRef.current = 0;
      console.log("Token data refresh completed");
    } catch (error) {
      console.error("Error refreshing token data:", error);
      retryAttemptsRef.current++;
      
      if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
        console.log(`Retry attempt ${retryAttemptsRef.current}/${MAX_RETRY_ATTEMPTS} will occur soon`);
      }
    } finally {
      setIsRefreshing(false);
      // Allow a small delay before another refresh can start
      setTimeout(() => {
        refreshInProgressRef.current = false;
      }, 5000);
    }
  }, [getAllIndexes, updateIndexGains, updateIndexVolume]);
  
  // Retry function specifically for market cap data when not initially available
  const retryMarketCapFetch = useCallback(async () => {
    if (refreshInProgressRef.current) {
      return; // Don't retry if refresh is already in progress
    }
    
    const indexes = getAllIndexes();
    // Filter indexes with no market cap data
    const indexesNeedingMarketCap = indexes.filter(index => !index.marketCap);
    
    if (indexesNeedingMarketCap.length === 0) {
      return;
    }
    
    console.log(`Retrying market cap fetch for ${indexesNeedingMarketCap.length} indexes`);
    
    // Process sequentially to avoid overwhelming the API
    for (const index of indexesNeedingMarketCap) {
      try {
        const tokenAddresses = index.tokens.map(token => token.address);
        const weightedMarketCap = await calculateIndexWeightedMarketCap(tokenAddresses);
        
        if (weightedMarketCap !== null) {
          console.log(`Successfully fetched market cap for index ${index.id}: ${weightedMarketCap}`);
          // Only update the market cap, keep other values the same
          await updateIndexGains(
            index.id, 
            index.gainPercentage || 0, 
            weightedMarketCap,
            index.percentChange1h, 
            index.percentChange6h
          );
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Error retrying market cap for index ${index.id}:`, err);
      }
    }
  }, [getAllIndexes, updateIndexGains]);

  // Set up periodic refresh
  useEffect(() => {
    // Initial refresh with a slight delay to avoid conflicting with real-time updates
    const initialRefreshTimeout = setTimeout(() => {
      refreshTokenData();
    }, 2000);
    
    // Set up interval for regular refreshing
    const intervalId = setInterval(refreshTokenData, REFRESH_INTERVAL);
    
    // Set up retry interval for market cap data, with a delay to start
    const marketCapRetryId = setInterval(retryMarketCapFetch, MARKET_CAP_RETRY_INTERVAL);
    
    // Clean up
    return () => {
      clearTimeout(initialRefreshTimeout);
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
