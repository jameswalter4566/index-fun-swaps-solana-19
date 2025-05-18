
import { useState, useEffect } from 'react';
import { calculateIndexGainPercentage, calculateIndexMarketCap } from '@/lib/tokenService';
import { useIndexStore, IndexData } from '@/stores/useIndexStore';

// How often to refresh token data (ms)
const REFRESH_INTERVAL = 60000; // 1 minute

export function useTokenRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { getAllIndexes, updateIndexGains } = useIndexStore();

  const refreshTokenData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const indexes = getAllIndexes();
      
      // Update each index with latest data
      await Promise.all(
        indexes.map(async (index) => {
          // Extract token addresses
          const tokenAddresses = index.tokens.map(token => token.address);
          
          // Get updated market cap and gain percentage
          const [marketCap, gainPercentage] = await Promise.all([
            calculateIndexMarketCap(tokenAddresses),
            calculateIndexGainPercentage(tokenAddresses)
          ]);
          
          // Update the index in the store
          updateIndexGains(index.id, gainPercentage, marketCap);
        })
      );
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error refreshing token data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set up periodic refresh
  useEffect(() => {
    // Initial refresh
    refreshTokenData();
    
    // Set up interval for regular refreshing
    const intervalId = setInterval(refreshTokenData, REFRESH_INTERVAL);
    
    // Clean up
    return () => clearInterval(intervalId);
  }, []);

  return {
    isRefreshing,
    lastRefreshed,
    refreshData: refreshTokenData
  };
}
