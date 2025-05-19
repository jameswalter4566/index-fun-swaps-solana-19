
import { TokenData } from './types';

// WebSocket connection states
export enum WebSocketState {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSED = 'closed',
  ERROR = 'error'
}

// WebSocket subscription message types
type SubscribeMessage = {
  action: 'subscribe';
  channel: 'ticker';
  tokens: string[];
}

type UnsubscribeMessage = {
  action: 'unsubscribe';
  channel: 'ticker';
  tokens: string[];
}

// WebSocket response data structure
type WebSocketTickerUpdate = {
  token: string;
  price: number;
  change_1h: number;
  change_6h: number;
  change_24h: number;
  market_cap?: number;
  volume_24h?: number;
  total_supply?: number;
}

// The API key for authentication
const API_KEY = '76a0b17d-089f-4069-973b-51b9ba1571a3';

// Singleton WebSocket service
class TokenWebSocketService {
  private ws: WebSocket | null = null;
  private socketState: WebSocketState = WebSocketState.CLOSED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // in milliseconds
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();
  private listeners: Map<string, Set<(data: TokenData) => void>> = new Map();
  private stateChangeListeners: Set<(state: WebSocketState) => void> = new Set();
  
  // Connect to the WebSocket server
  connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket connection already exists');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('Connecting to SolanaTracker WebSocket...');
        this.updateState(WebSocketState.CONNECTING);
        
        this.ws = new WebSocket(`wss://datastream.solanatracker.io`);
        
        this.ws.onopen = () => {
          console.log('WebSocket connection established');
          this.updateState(WebSocketState.OPEN);
          this.reconnectAttempts = 0;
          
          // Authenticate with the API key
          this.authenticate();
          
          // Resubscribe to tokens if any
          this.resubscribeToTokens();
          
          resolve();
        };
        
        this.ws.onclose = (event) => {
          console.log('WebSocket connection closed', event);
          this.updateState(WebSocketState.CLOSED);
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.updateState(WebSocketState.ERROR);
          reject(error);
        };
        
        this.ws.onmessage = this.handleMessage.bind(this);
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        this.updateState(WebSocketState.ERROR);
        reject(error);
      }
    });
  }
  
  // Send authentication message
  private authenticate(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const authMessage = {
      action: 'authenticate',
      apiKey: API_KEY
    };
    
    this.ws.send(JSON.stringify(authMessage));
    console.log('Sent authentication message');
  }
  
  // Handle incoming WebSocket messages
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle authentication response
      if (data.type === 'auth') {
        if (data.status === 'success') {
          console.log('Authentication successful');
        } else {
          console.error('Authentication failed:', data.message);
        }
        return;
      }
      
      // Handle ticker updates
      if (data.channel === 'ticker') {
        this.processTickerUpdate(data.data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }
  
  // Process ticker update data and notify listeners
  private processTickerUpdate(update: WebSocketTickerUpdate): void {
    const tokenAddress = update.token;
    
    // Create token data from update
    const tokenData: Partial<TokenData> = {
      address: tokenAddress,
      price: update.price,
      change1h: update.change_1h,
      change6h: update.change_6h,
      change24h: update.change_24h,
      marketCap: update.market_cap,
      totalSupply: update.total_supply
    };
    
    // Calculate market cap if not provided but we have price and total supply
    if (!update.market_cap && update.price && update.total_supply) {
      tokenData.marketCap = update.price * update.total_supply;
    }
    
    // Notify all listeners for this token
    const tokenListeners = this.listeners.get(tokenAddress);
    if (tokenListeners) {
      tokenListeners.forEach(listener => {
        listener(tokenData as TokenData);
      });
    }
  }
  
  // Subscribe to token updates
  subscribe(tokenAddresses: string[]): void {
    if (!tokenAddresses.length) return;
    
    // Filter out tokens that are already subscribed
    const newTokens = tokenAddresses.filter(address => !this.subscriptions.has(address));
    if (!newTokens.length) return;
    
    console.log(`Subscribing to ${newTokens.length} tokens:`, newTokens);
    
    // Connect if not already connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect().then(() => this.sendSubscription(newTokens));
      
      // Add to subscriptions set now to avoid duplicate subscription attempts
      newTokens.forEach(token => this.subscriptions.add(token));
      return;
    }
    
    this.sendSubscription(newTokens);
    
    // Add to subscriptions set
    newTokens.forEach(token => this.subscriptions.add(token));
  }
  
  // Send subscription message to WebSocket server
  private sendSubscription(tokens: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !tokens.length) return;
    
    const message: SubscribeMessage = {
      action: 'subscribe',
      channel: 'ticker',
      tokens
    };
    
    this.ws.send(JSON.stringify(message));
    console.log(`Sent subscription for ${tokens.length} tokens`);
  }
  
  // Unsubscribe from token updates
  unsubscribe(tokenAddresses: string[]): void {
    if (!tokenAddresses.length) return;
    
    // Filter to only include tokens we're actually subscribed to
    const tokensToUnsubscribe = tokenAddresses.filter(address => this.subscriptions.has(address));
    if (!tokensToUnsubscribe.length) return;
    
    console.log(`Unsubscribing from ${tokensToUnsubscribe.length} tokens:`, tokensToUnsubscribe);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: UnsubscribeMessage = {
        action: 'unsubscribe',
        channel: 'ticker',
        tokens: tokensToUnsubscribe
      };
      
      this.ws.send(JSON.stringify(message));
    }
    
    // Remove from subscriptions set
    tokensToUnsubscribe.forEach(token => this.subscriptions.delete(token));
  }
  
  // Resubscribe to all previously subscribed tokens
  private resubscribeToTokens(): void {
    const tokens = Array.from(this.subscriptions);
    if (tokens.length > 0) {
      this.sendSubscription(tokens);
    }
  }
  
  // Register a listener for token updates
  addListener(tokenAddress: string, listener: (data: TokenData) => void): void {
    if (!this.listeners.has(tokenAddress)) {
      this.listeners.set(tokenAddress, new Set());
    }
    
    this.listeners.get(tokenAddress)!.add(listener);
  }
  
  // Remove a listener for token updates
  removeListener(tokenAddress: string, listener: (data: TokenData) => void): void {
    const tokenListeners = this.listeners.get(tokenAddress);
    if (tokenListeners) {
      tokenListeners.delete(listener);
      
      // Clean up if no listeners left for this token
      if (tokenListeners.size === 0) {
        this.listeners.delete(tokenAddress);
      }
    }
  }
  
  // Add a state change listener
  addStateChangeListener(listener: (state: WebSocketState) => void): void {
    this.stateChangeListeners.add(listener);
    // Immediately notify the listener of the current state
    listener(this.socketState);
  }
  
  // Remove a state change listener
  removeStateChangeListener(listener: (state: WebSocketState) => void): void {
    this.stateChangeListeners.delete(listener);
  }
  
  // Update the socket state and notify listeners
  private updateState(state: WebSocketState): void {
    this.socketState = state;
    this.stateChangeListeners.forEach(listener => listener(state));
  }
  
  // Attempt to reconnect to the WebSocket server
  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(() => {
          // If reconnect fails, it will try again via the onclose handler
          console.log(`Reconnect attempt ${this.reconnectAttempts} failed`);
        });
      }, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts)); // Exponential backoff
    } else {
      console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached`);
    }
  }
  
  // Disconnect from the WebSocket server
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.updateState(WebSocketState.CLOSED);
    console.log('WebSocket disconnected');
  }
  
  // Get the current WebSocket state
  getState(): WebSocketState {
    return this.socketState;
  }
}

// Export a singleton instance
export const tokenWebSocketService = new TokenWebSocketService();
