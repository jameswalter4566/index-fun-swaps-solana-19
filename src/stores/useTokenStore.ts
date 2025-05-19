
import { create } from 'zustand';
import { TokenData } from '@/lib/token/types';
import { WebSocketState, tokenWebSocketService } from '@/lib/token/websocket';

interface TokenState {
  // Token data indexed by address
  tokens: Record<string, TokenData>;
  
  // Track which tokens are currently visible on screen
  visibleTokens: Set<string>;
  
  // WebSocket connection state
  connectionState: WebSocketState;
  
  // Functions to update state
  updateToken: (tokenData: TokenData) => void;
  addVisibleTokens: (tokenAddresses: string[]) => void;
  removeVisibleTokens: (tokenAddresses: string[]) => void;
  clearVisibleTokens: () => void;
  setConnectionState: (state: WebSocketState) => void;
  
  // Get token data by address
  getToken: (address: string) => TokenData | null;
  
  // Get multiple tokens by address
  getTokens: (addresses: string[]) => Record<string, TokenData>;
}

export const useTokenStore = create<TokenState>()((set, get) => ({
  tokens: {},
  visibleTokens: new Set<string>(),
  connectionState: WebSocketState.CLOSED,
  
  updateToken: (tokenData: TokenData) => {
    set((state) => ({
      tokens: {
        ...state.tokens,
        [tokenData.address]: {
          // Preserve existing data if any
          ...state.tokens[tokenData.address],
          // Update with new data
          ...tokenData
        }
      }
    }));
  },
  
  addVisibleTokens: (tokenAddresses: string[]) => {
    set((state) => {
      const newVisibleTokens = new Set(state.visibleTokens);
      
      // Add new token addresses to visible set
      tokenAddresses.forEach(address => {
        if (!newVisibleTokens.has(address)) {
          newVisibleTokens.add(address);
        }
      });
      
      // If changes were made, subscribe to these tokens
      if (tokenAddresses.length > 0) {
        tokenWebSocketService.subscribe(tokenAddresses);
      }
      
      return { visibleTokens: newVisibleTokens };
    });
  },
  
  removeVisibleTokens: (tokenAddresses: string[]) => {
    set((state) => {
      const newVisibleTokens = new Set(state.visibleTokens);
      
      // Remove token addresses from visible set
      tokenAddresses.forEach(address => {
        newVisibleTokens.delete(address);
      });
      
      // Unsubscribe from tokens that are no longer visible
      tokenWebSocketService.unsubscribe(tokenAddresses);
      
      return { visibleTokens: newVisibleTokens };
    });
  },
  
  clearVisibleTokens: () => {
    const { visibleTokens } = get();
    const tokensArray = Array.from(visibleTokens);
    
    // Unsubscribe from all tokens
    if (tokensArray.length > 0) {
      tokenWebSocketService.unsubscribe(tokensArray);
    }
    
    set({ visibleTokens: new Set() });
  },
  
  setConnectionState: (state: WebSocketState) => {
    set({ connectionState: state });
  },
  
  getToken: (address: string) => {
    return get().tokens[address] || null;
  },
  
  getTokens: (addresses: string[]) => {
    const result: Record<string, TokenData> = {};
    const { tokens } = get();
    
    addresses.forEach(address => {
      if (tokens[address]) {
        result[address] = tokens[address];
      }
    });
    
    return result;
  }
}));

// Initialize WebSocket connection state change listener
tokenWebSocketService.addStateChangeListener((state) => {
  useTokenStore.getState().setConnectionState(state);
});
