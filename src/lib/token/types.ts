
export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  decimals?: number;
  price?: number;
  marketCap?: number;
  change1h?: number;
  change6h?: number;
  change24h?: number;
  totalSupply?: number;
  lastUpdated?: number; // Timestamp of last update
}

export interface TokenSubscription {
  address: string;
  subscribed: boolean;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
}

export interface TokenUpdateMessage {
  address: string;
  price?: number;
  change1h?: number;
  change6h?: number;
  change24h?: number;
  [key: string]: any;
}

export interface SubscriptionMessage {
  type: 'subscribe' | 'unsubscribe';
  tokens: string[];
}

export enum WebSocketReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3
}
