
import { useState, useEffect } from 'react';
import { 
  calculateIndexMarketCap, 
  calculateIndexGainPercentage, 
  calculate1HourGainPercentage,
  calculate6HourGainPercentage,
  generateMockVolume
} from '@/lib/tokenService';
import { useIndexStore, IndexData } from '@/stores/useIndexStore';

// How often to refresh token data (ms)
const REFRESH_INTERVAL = 60000; // 1 minute

export function useTokenRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { getAllIndexes, updateIndexGains, updateIndexVolume } = useIndexStore();

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
          
          // Get updated market cap, gain percentages, and volume
          const [marketCap, gainPercentage, change1h, change6h] = await Promise.all([
            calculateIndexMarketCap(tokenAddresses),
            calculateIndexGainPercentage(tokenAddresses),
            calculate1HourGainPercentage(tokenAddresses),
            calculate6HourGainPercentage(tokenAddresses)
          ]);
          
          // Update the index gains in the store
          updateIndexGains(index.id, gainPercentage, marketCap, change1h, change6h);
          
          // Generate mock volume data based on existing volume (if any)
          const newVolume = generateMockVolume(index.totalVolume);
          updateIndexVolume(index.id, newVolume);
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
