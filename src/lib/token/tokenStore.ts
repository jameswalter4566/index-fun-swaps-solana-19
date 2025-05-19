
import { create } from 'zustand';
import { TokenData } from './types';
import { getTokenData as fetchTokenData } from './service';

interface TokenState {
  tokens: Record<string, TokenData>;
  visibleTokens: Set<string>;
  lastFetchTimestamps: Record<string, number>;
  
  // Methods for managing token data
  getTokenData: (address: string) => TokenData | null;
  updateToken: (address: string, data: Partial<TokenData>) => void;
  fetchTokenData: (address: string, force?: boolean) => Promise<TokenData | null>;
  
  // Methods for tracking visible tokens
  addVisibleToken: (address: string) => void;
  removeVisibleToken: (address: string) => void;
  isTokenVisible: (address: string) => boolean;
  getAllVisibleTokens: () => string[];
}

// Maximum age of token data before we should refetch (5 minutes)
const MAX_DATA_AGE_MS = 5 * 60 * 1000;

export const useTokenStore = create<TokenState>((set, get) => ({
  tokens: {},
  visibleTokens: new Set<string>(),
  lastFetchTimestamps: {},
  
  // Get token data from the store
  getTokenData: (address: string) => {
    const state = get();
    return state.tokens[address] || null;
  },
  
  // Update token data in the store
  updateToken: (address: string, data: Partial<TokenData>) => {
    set((state) => {
      const existingToken = state.tokens[address] || { address };
      const updatedToken: TokenData = {
        ...existingToken,
        ...data,
      } as TokenData;
      
      return {
        tokens: {
          ...state.tokens,
          [address]: updatedToken
        }
      };
    });
  },
  
  // Fetch token data from the API and update the store
  fetchTokenData: async (address: string, force = false) => {
    const state = get();
    const now = Date.now();
    const lastFetch = state.lastFetchTimestamps[address] || 0;
    
    // If we have recent data and not forced, return from cache
    if (!force && lastFetch > now - MAX_DATA_AGE_MS && state.tokens[address]) {
      return state.tokens[address];
    }
    
    try {
      const tokenData = await fetchTokenData(address);
      
      if (tokenData) {
        // Update the token in the store
        set((state) => ({
          tokens: {
            ...state.tokens,
            [address]: tokenData
          },
          lastFetchTimestamps: {
            ...state.lastFetchTimestamps,
            [address]: now
          }
        }));
        
        return tokenData;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching token data for ${address}:`, error);
      return null;
    }
  },
  
  // Add a token to the visible set
  addVisibleToken: (address: string) => {
    set((state) => {
      const newVisibleTokens = new Set(state.visibleTokens);
      newVisibleTokens.add(address);
      return { visibleTokens: newVisibleTokens };
    });
  },
  
  // Remove a token from the visible set
  removeVisibleToken: (address: string) => {
    set((state) => {
      const newVisibleTokens = new Set(state.visibleTokens);
      newVisibleTokens.delete(address);
      return { visibleTokens: newVisibleTokens };
    });
  },
  
  // Check if a token is currently visible
  isTokenVisible: (address: string) => {
    return get().visibleTokens.has(address);
  },
  
  // Get all visible token addresses
  getAllVisibleTokens: () => {
    return Array.from(get().visibleTokens);
  }
}));

// Create a singleton instance of the token store for direct import
export const tokenStore = {
  getTokenData: (address: string) => useTokenStore.getState().getTokenData(address),
  updateToken: (address: string, data: Partial<TokenData>) => 
    useTokenStore.getState().updateToken(address, data),
  fetchTokenData: (address: string, force?: boolean) => 
    useTokenStore.getState().fetchTokenData(address, force),
  addVisibleToken: (address: string) => 
    useTokenStore.getState().addVisibleToken(address),
  removeVisibleToken: (address: string) => 
    useTokenStore.getState().removeVisibleToken(address),
  isTokenVisible: (address: string) => 
    useTokenStore.getState().isTokenVisible(address),
  getAllVisibleTokens: () => 
    useTokenStore.getState().getAllVisibleTokens(),
};
