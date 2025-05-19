
import { TokenData, TokenUpdateMessage, WebSocketMessage, WebSocketReadyState } from './types';
import { tokenStore } from './tokenStore';
import { isValidSolanaAddress } from './utils';

// Websocket connection URL
const WS_URL = 'wss://datastream.solanatracker.io/9fc6b1dd-daae-4ade-97d7-e2fb8c085895';

// How often to attempt reconnection if connection drops (ms)
const RECONNECT_INTERVAL = 5000;

// How long to wait before considering a connection failed (ms)
const CONNECTION_TIMEOUT = 10000;

class TokenWebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private subscribedTokens: Set<string> = new Set();
  private pendingSubscriptions: Set<string> = new Set();
  private pendingUnsubscriptions: Set<string> = new Set();
  private isInitialized = false;
  private connectPromise: Promise<boolean> | null = null;
  private connectResolve: ((value: boolean) => void) | null = null;

  /**
   * Initialize and connect the WebSocket
   */
  public init(): Promise<boolean> {
    if (this.isInitialized && this.socket && this.socket.readyState === WebSocketReadyState.OPEN) {
      return Promise.resolve(true);
    }

    // If we're already trying to connect, return the existing promise
    if (this.connectPromise) {
      return this.connectPromise;
    }

    // Create a new connection promise
    this.connectPromise = new Promise<boolean>((resolve) => {
      this.connectResolve = resolve;
      this.connect();

      // Set timeout for connection
      this.connectionTimeout = setTimeout(() => {
        console.error('WebSocket connection timeout');
        if (this.connectResolve) {
          this.connectResolve(false);
          this.connectResolve = null;
          this.connectPromise = null;
        }
      }, CONNECTION_TIMEOUT);
    });

    return this.connectPromise;
  }

  /**
   * Connect to the WebSocket server
   */
  private connect() {
    try {
      console.log('Connecting to token WebSocket...');
      
      // Create new WebSocket connection
      this.socket = new WebSocket(WS_URL);

      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen() {
    console.log('WebSocket connected');
    this.isInitialized = true;
    
    // Clear reconnection timeout if it exists
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Resolve the connect promise if it exists
    if (this.connectResolve) {
      this.connectResolve(true);
      this.connectResolve = null;
      this.connectPromise = null;
    }
    
    // Re-subscribe to any tokens that were subscribed before
    this.resubscribeAll();
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent) {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.isInitialized = false;
    this.socket = null;
    
    // Resolve any pending connection promise with failure
    if (this.connectResolve) {
      this.connectResolve(false);
      this.connectResolve = null;
      this.connectPromise = null;
    }
    
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event) {
    console.error('WebSocket error:', event);
    
    // Resolve any pending connection promise with failure
    if (this.connectResolve) {
      this.connectResolve(false);
      this.connectResolve = null;
      this.connectPromise = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (!this.reconnectTimeout) {
      console.log(`Scheduling reconnect in ${RECONNECT_INTERVAL / 1000}s`);
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        this.connect();
      }, RECONNECT_INTERVAL);
    }
  }

  /**
   * Process incoming WebSocket message
   */
  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      if (message.type === 'token_update' && message.data) {
        this.processTokenUpdate(message.data as TokenUpdateMessage);
      } else if (message.type === 'subscription_status') {
        console.log('Subscription status:', message.data);
      } else {
        console.log('Unknown message type:', message);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error, event.data);
    }
  }
  
  /**
   * Process token updates from WebSocket
   */
  private processTokenUpdate(update: TokenUpdateMessage) {
    if (!update.address || !isValidSolanaAddress(update.address)) {
      console.warn('Invalid token update received:', update);
      return;
    }
    
    const tokenUpdate: Partial<TokenData> = {
      address: update.address
    };
    
    // Copy over price data if available
    if (update.price !== undefined) tokenUpdate.price = update.price;
    if (update.change1h !== undefined) tokenUpdate.change1h = update.change1h;
    if (update.change6h !== undefined) tokenUpdate.change6h = update.change6h;
    if (update.change24h !== undefined) tokenUpdate.change24h = update.change24h;
    
    // Add timestamp for when this update occurred
    tokenUpdate.lastUpdated = Date.now();
    
    // Calculate marketCap if we have price and totalSupply
    const existingTokenData = tokenStore.getTokenData(update.address);
    if (tokenUpdate.price !== undefined && existingTokenData?.totalSupply) {
      tokenUpdate.marketCap = tokenUpdate.price * existingTokenData.totalSupply;
    }
    
    // Update the token store with new data
    tokenStore.updateToken(update.address, tokenUpdate);
  }

  /**
   * Subscribe to token updates
   */
  public subscribe(tokenAddress: string): boolean {
    if (!isValidSolanaAddress(tokenAddress)) {
      console.warn(`Not subscribing to invalid address: ${tokenAddress}`);
      return false;
    }
    
    // If already subscribed, don't do anything
    if (this.subscribedTokens.has(tokenAddress)) {
      return true;
    }
    
    console.log(`Subscribing to token: ${tokenAddress}`);
    
    // Add to pending subscriptions
    this.pendingSubscriptions.add(tokenAddress);
    this.pendingUnsubscriptions.delete(tokenAddress);
    
    // If connected, send subscription immediately
    this.processPendingSubscriptions();
    
    return true;
  }

  /**
   * Unsubscribe from token updates
   */
  public unsubscribe(tokenAddress: string): boolean {
    if (!isValidSolanaAddress(tokenAddress)) {
      return false;
    }
    
    // If not subscribed, don't do anything
    if (!this.subscribedTokens.has(tokenAddress)) {
      return true;
    }
    
    console.log(`Unsubscribing from token: ${tokenAddress}`);
    
    // Add to pending unsubscriptions
    this.pendingUnsubscriptions.add(tokenAddress);
    this.pendingSubscriptions.delete(tokenAddress);
    
    // If connected, send unsubscription immediately
    this.processPendingUnsubscriptions();
    
    return true;
  }

  /**
   * Send subscribe message for all pending subscriptions
   */
  private processPendingSubscriptions() {
    if (
      this.pendingSubscriptions.size === 0 || 
      !this.socket || 
      this.socket.readyState !== WebSocketReadyState.OPEN
    ) {
      return;
    }
    
    const tokensToSubscribe = Array.from(this.pendingSubscriptions);
    
    try {
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        tokens: tokensToSubscribe
      }));
      
      // Mark tokens as subscribed
      tokensToSubscribe.forEach(token => {
        this.subscribedTokens.add(token);
        this.pendingSubscriptions.delete(token);
      });
      
      console.log(`Subscribed to ${tokensToSubscribe.length} tokens`);
    } catch (error) {
      console.error('Failed to send subscription message:', error);
    }
  }

  /**
   * Send unsubscribe message for all pending unsubscriptions
   */
  private processPendingUnsubscriptions() {
    if (
      this.pendingUnsubscriptions.size === 0 || 
      !this.socket || 
      this.socket.readyState !== WebSocketReadyState.OPEN
    ) {
      return;
    }
    
    const tokensToUnsubscribe = Array.from(this.pendingUnsubscriptions);
    
    try {
      this.socket.send(JSON.stringify({
        type: 'unsubscribe',
        tokens: tokensToUnsubscribe
      }));
      
      // Mark tokens as unsubscribed
      tokensToUnsubscribe.forEach(token => {
        this.subscribedTokens.delete(token);
        this.pendingUnsubscriptions.delete(token);
      });
      
      console.log(`Unsubscribed from ${tokensToUnsubscribe.length} tokens`);
    } catch (error) {
      console.error('Failed to send unsubscription message:', error);
    }
  }

  /**
   * Resubscribe to all tokens after reconnection
   */
  private resubscribeAll() {
    if (this.subscribedTokens.size === 0) {
      return;
    }
    
    // Add all currently subscribed tokens to pending subscriptions
    this.subscribedTokens.forEach(token => {
      this.pendingSubscriptions.add(token);
    });
    
    // Clear subscribed tokens set since we need to resubscribe
    this.subscribedTokens.clear();
    
    // Process pending subscriptions
    this.processPendingSubscriptions();
  }
  
  /**
   * Check if a token is currently subscribed
   */
  public isSubscribed(tokenAddress: string): boolean {
    return this.subscribedTokens.has(tokenAddress);
  }
  
  /**
   * Get WebSocket ready state
   */
  public getReadyState(): WebSocketReadyState {
    if (!this.socket) {
      return WebSocketReadyState.CLOSED;
    }
    
    return this.socket.readyState as WebSocketReadyState;
  }
  
  /**
   * Close the WebSocket connection
   */
  public close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.isInitialized = false;
    this.subscribedTokens.clear();
    this.pendingSubscriptions.clear();
    this.pendingUnsubscriptions.clear();
    
    if (this.connectResolve) {
      this.connectResolve(false);
      this.connectResolve = null;
      this.connectPromise = null;
    }
  }
}

// Create singleton instance
export const tokenWebSocketService = new TokenWebSocketService();

// Initialize service when module is loaded
tokenWebSocketService.init().catch(error => {
  console.error("Failed to initialize token WebSocket service:", error);
});
