
import { useEffect, useState, useMemo } from 'react';
import { useMultiTokenSubscription } from './useTokenSubscription';
import { Token } from '@/stores/useIndexStore';
import { TokenData } from '@/lib/token/types';

export interface LiveIndexData {
  percentChange1h: number;
  percentChange6h: number;
  gainPercentage: number; // 24h change
  weightedMarketCap: number;
  isLoading: boolean;
}

/**
 * Hook to get live index data from WebSocket feeds
 */
export function useLiveIndexData(tokens: Token[]): LiveIndexData {
  const [isLoading, setIsLoading] = useState(true);
  const tokenAddresses = useMemo(() => tokens.map(token => token.address), [tokens]);
  
  // Subscribe to real-time token data
  const liveTokenData = useMultiTokenSubscription(tokenAddresses);
  
  // Calculate aggregated index data
  const {
    percentChange1h,
    percentChange6h,
    gainPercentage,
    weightedMarketCap
  } = useMemo(() => {
    const initialValue = {
      percentChange1h: 0,
      percentChange6h: 0,
      gainPercentage: 0,
      weightedMarketCap: 0
    };
    
    if (tokenAddresses.length === 0) {
      return initialValue;
    }
    
    // Get the number of tokens with valid data
    const tokensWithData = tokenAddresses.filter(address => liveTokenData[address]);
    
    if (tokensWithData.length === 0) {
      return initialValue;
    }
    
    // Calculate sum of all changes and market caps
    const sums = tokensWithData.reduce(
      (acc, address) => {
        const token = liveTokenData[address];
        if (token) {
          if (token.change1h !== undefined) acc.change1h += token.change1h;
          if (token.change6h !== undefined) acc.change6h += token.change6h;
          if (token.change24h !== undefined) acc.change24h += token.change24h;
          if (token.marketCap !== undefined) acc.marketCap += token.marketCap;
        }
        return acc;
      },
      { change1h: 0, change6h: 0, change24h: 0, marketCap: 0 }
    );
    
    // Calculate the average change percentages
    const validCount1h = tokensWithData.filter(addr => 
      liveTokenData[addr]?.change1h !== undefined).length;
    const validCount6h = tokensWithData.filter(addr => 
      liveTokenData[addr]?.change6h !== undefined).length;
    const validCount24h = tokensWithData.filter(addr => 
      liveTokenData[addr]?.change24h !== undefined).length;
      
    return {
      percentChange1h: validCount1h > 0 ? sums.change1h / validCount1h : 0,
      percentChange6h: validCount6h > 0 ? sums.change6h / validCount6h : 0,
      gainPercentage: validCount24h > 0 ? sums.change24h / validCount24h : 0,
      weightedMarketCap: sums.marketCap
    };
  }, [tokenAddresses, liveTokenData]);
  
  // Update loading state
  useEffect(() => {
    if (Object.keys(liveTokenData).length > 0 && tokenAddresses.length > 0) {
      setIsLoading(false);
    }
  }, [liveTokenData, tokenAddresses]);
  
  return {
    percentChange1h,
    percentChange6h,
    gainPercentage,
    weightedMarketCap,
    isLoading
  };
}
