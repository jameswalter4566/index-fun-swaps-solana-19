
import { useEffect, useState, useRef, useCallback } from 'react';
import { useTokenStore } from '@/stores/useTokenStore';
import { tokenWebSocketService } from '@/lib/token/websocket';
import debounce from 'lodash/debounce';
import { Token } from '@/stores/useIndexStore';
import { TokenData } from '@/lib/token/types';

// Options for token subscription
interface UseTokenSubscriptionOptions {
  onTokenUpdate?: (token: TokenData) => void;
  refreshInterval?: number;  // in milliseconds
}

/**
 * Hook to subscribe to real-time token updates
 */
export function useTokenSubscription(
  tokens: Token[],
  options: UseTokenSubscriptionOptions = {}
) {
  const { onTokenUpdate, refreshInterval = 0 } = options;
  
  const [tokenData, setTokenData] = useState<Record<string, TokenData>>({});
  const [isSubscribed, setIsSubscribed] = useState(false);
  const tokenAddresses = tokens.map(token => token.address);
  
  const { 
    addVisibleTokens, 
    removeVisibleTokens, 
    updateToken, 
    getTokens
  } = useTokenStore();
  
  // Store token addresses in a ref to avoid dependency array issues
  const tokenAddressesRef = useRef<string[]>(tokenAddresses);
  useEffect(() => {
    tokenAddressesRef.current = tokenAddresses;
  }, [tokenAddresses]);
  
  // Handle token updates from WebSocket
  const handleTokenUpdate = useCallback((data: TokenData) => {
    updateToken(data);
    
    // Call the callback if provided
    if (onTokenUpdate) {
      onTokenUpdate(data);
    }
    
    // Update the local state
    setTokenData(prev => ({
      ...prev,
      [data.address]: {
        ...prev[data.address],
        ...data
      }
    }));
  }, [updateToken, onTokenUpdate]);

  // Subscribe to token updates
  useEffect(() => {
    if (tokenAddresses.length === 0) return;
    
    // Connect to WebSocket and add tokens to visible set
    tokenWebSocketService.connect().then(() => {
      addVisibleTokens(tokenAddresses);
      
      // Register listeners for each token
      tokenAddresses.forEach(address => {
        tokenWebSocketService.addListener(address, handleTokenUpdate);
      });
      
      setIsSubscribed(true);
      
      // Initial data fetch
      const initialData = getTokens(tokenAddresses);
      if (Object.keys(initialData).length > 0) {
        setTokenData(prev => ({...prev, ...initialData}));
      }
    });
    
    return () => {
      // Clean up listeners and subscriptions
      if (isSubscribed) {
        tokenAddresses.forEach(address => {
          tokenWebSocketService.removeListener(address, handleTokenUpdate);
        });
        
        removeVisibleTokens(tokenAddresses);
        setIsSubscribed(false);
      }
    };
  }, [tokenAddresses, addVisibleTokens, removeVisibleTokens, handleTokenUpdate, getTokens, isSubscribed]);
  
  // Optional periodic refresh
  useEffect(() => {
    if (refreshInterval <= 0 || !isSubscribed) return;
    
    const intervalId = setInterval(() => {
      const updatedData = getTokens(tokenAddressesRef.current);
      setTokenData(prev => ({...prev, ...updatedData}));
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, isSubscribed, getTokens]);
  
  return {
    tokenData,
    isSubscribed
  };
}
