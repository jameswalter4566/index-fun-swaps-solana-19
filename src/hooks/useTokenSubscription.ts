
import { useEffect, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { tokenWebSocketService } from '@/lib/token/websocket';
import { tokenStore } from '@/lib/token/tokenStore';
import { useTokenStore } from '@/lib/token/tokenStore';
import { TokenData } from '@/lib/token/types';

/**
 * Hook for subscribing to token updates via WebSocket
 */
export function useTokenSubscription(tokenAddress: string): TokenData | null {
  // Get token data from the store
  const token = useTokenStore(state => state.tokens[tokenAddress]);
  
  // Track subscription status
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Subscribe to token updates when the component mounts
  useEffect(() => {
    if (!tokenAddress) return;
    
    // Mark the token as visible
    tokenStore.addVisibleToken(tokenAddress);
    
    // Subscribe to updates and track status
    tokenWebSocketService.subscribe(tokenAddress);
    setIsSubscribed(true);
    
    // Fetch initial data if not available
    if (!token) {
      tokenStore.fetchTokenData(tokenAddress);
    }
    
    // Cleanup: unsubscribe when component unmounts
    return () => {
      tokenStore.removeVisibleToken(tokenAddress);
      tokenWebSocketService.unsubscribe(tokenAddress);
      setIsSubscribed(false);
    };
  }, [tokenAddress]);
  
  return token || null;
}

/**
 * Hook for subscribing to multiple tokens at once
 */
export function useMultiTokenSubscription(tokenAddresses: string[]): Record<string, TokenData> {
  const tokens = useTokenStore(state => state.tokens);
  const previousAddressesRef = useRef<Set<string>>(new Set());
  const [subscribedTokens, setSubscribedTokens] = useState<Set<string>>(new Set());
  
  const debouncedSubscriptionUpdate = useRef(
    debounce((toAdd: string[], toRemove: string[]) => {
      // Subscribe to new tokens
      if (toAdd.length > 0) {
        console.log(`Subscribing to ${toAdd.length} new tokens:`, toAdd);
        toAdd.forEach(address => {
          if (!tokenWebSocketService.isSubscribed(address)) {
            tokenWebSocketService.subscribe(address);
          }
        });
        
        // Update the subscribed tokens set
        setSubscribedTokens(prev => {
          const newSet = new Set(prev);
          toAdd.forEach(address => newSet.add(address));
          return newSet;
        });
      }
      
      // Unsubscribe from removed tokens
      if (toRemove.length > 0) {
        console.log(`Unsubscribing from ${toRemove.length} tokens:`, toRemove);
        toRemove.forEach(address => {
          tokenWebSocketService.unsubscribe(address);
        });
        
        // Update the subscribed tokens set
        setSubscribedTokens(prev => {
          const newSet = new Set(prev);
          toRemove.forEach(address => newSet.delete(address));
          return newSet;
        });
      }
    }, 300)
  ).current;
  
  useEffect(() => {
    // Convert current addresses to a Set for efficient operations
    const currentAddresses = new Set(tokenAddresses);
    const previousAddresses = previousAddressesRef.current;
    
    // Mark all tokens as visible
    tokenAddresses.forEach(address => {
      tokenStore.addVisibleToken(address);
    });
    
    // Find addresses that need to be added (in current but not in previous)
    const toAdd = tokenAddresses.filter(address => !previousAddresses.has(address));
    
    // Find addresses that need to be removed (in previous but not in current)
    const toRemove = Array.from(previousAddresses)
      .filter(address => !currentAddresses.has(address));
    
    // Fetch initial data for any new tokens
    if (toAdd.length > 0) {
      toAdd.forEach(address => {
        if (!tokens[address]) {
          tokenStore.fetchTokenData(address);
        }
      });
    }
    
    // Update visible tokens
    toRemove.forEach(address => {
      tokenStore.removeVisibleToken(address);
    });
    
    // Debounce subscription updates to avoid too frequent WebSocket messages
    if (toAdd.length > 0 || toRemove.length > 0) {
      debouncedSubscriptionUpdate(toAdd, toRemove);
    }
    
    // Update the ref for the next render
    previousAddressesRef.current = currentAddresses;
    
    // Cleanup function
    return () => {
      // When component unmounts, remove all tokens from visible set and unsubscribe
      tokenAddresses.forEach(address => {
        tokenStore.removeVisibleToken(address);
        tokenWebSocketService.unsubscribe(address);
      });
    };
  }, [tokenAddresses, debouncedSubscriptionUpdate, tokens]);
  
  // Return token data for all requested addresses
  return tokenAddresses.reduce((acc, address) => {
    if (tokens[address]) {
      acc[address] = tokens[address];
    }
    return acc;
  }, {} as Record<string, TokenData>);
}
