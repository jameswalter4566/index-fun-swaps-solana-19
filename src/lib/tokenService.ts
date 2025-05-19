
import { PublicKey } from '@solana/web3.js';

export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  decimals?: number;
  price?: number;
  marketCap?: number;
  change24h?: number;
}

// This would normally be hidden in environment variables or server-side
// For demonstration purposes we're keeping it in the code
const JUPITER_API_BASE = 'https://quote-api.jup.ag/v4';
const TOKEN_LIST_URL = 'https://token.jup.ag/all';

/**
 * Validates if a string is a valid Solana address
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Fetches the list of all tokens from Jupiter API
 */
export const fetchTokenList = async (): Promise<Record<string, any>> => {
  try {
    const response = await fetch(TOKEN_LIST_URL);
    if (!response.ok) throw new Error('Failed to fetch token list');
    const tokens = await response.json();
    
    // Create a map for quick lookups
    const tokenMap: Record<string, any> = {};
    tokens.forEach((token: any) => {
      tokenMap[token.address] = token;
    });
    
    return tokenMap;
  } catch (error) {
    console.error('Error fetching token list:', error);
    return {};
  }
};

/**
 * Fetches token data for a specific address
 */
export const fetchTokenData = async (address: string): Promise<TokenData | null> => {
  if (!isValidSolanaAddress(address)) {
    return null;
  }

  try {
    // Get the token list data
    const tokenMap = await fetchTokenList();
    
    // Check if token exists in the list
    if (tokenMap[address]) {
      const tokenInfo = tokenMap[address];
      
      return {
        address,
        name: tokenInfo.name || 'Unknown Token',
        symbol: tokenInfo.symbol || '???',
        imageUrl: tokenInfo.logoURI || undefined,
        decimals: tokenInfo.decimals,
      };
    }
    
    // Fallback if token isn't in the list - create basic info
    return {
      address,
      name: `Token ${address.substring(0, 4)}...${address.substring(address.length - 4)}`,
      symbol: '???',
    };
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
};

/**
 * Calculate weighted market cap for an index based on its tokens
 */
export const calculateIndexMarketCap = (tokens: string[]): Promise<number> => {
  // In a real implementation, we would:
  // 1. Get market cap for each token
  // 2. Sum them with appropriate weighting
  // For demo purposes, we'll return a reasonable mock value
  return Promise.resolve(Math.round(10000 + Math.random() * 25000000));
};

/**
 * Calculate gain percentage for an index based on token performance
 */
export const calculateIndexGainPercentage = (tokens: string[]): Promise<number> => {
  // In a real implementation, this would calculate the actual gain percentage
  // For demo purposes, we'll return a random value between -30% and +50%
  return Promise.resolve(parseFloat((Math.random() * 80 - 30).toFixed(2)));
};

/**
 * Calculate 1-hour gain percentage for an index
 */
export const calculate1HourGainPercentage = (tokens: string[]): Promise<number> => {
  // Mock 1-hour gain percentage (-10% to +10%)
  return Promise.resolve(parseFloat((Math.random() * 20 - 10).toFixed(2)));
};

/**
 * Calculate 6-hour gain percentage for an index
 */
export const calculate6HourGainPercentage = (tokens: string[]): Promise<number> => {
  // Mock 6-hour gain percentage (-15% to +15%)
  return Promise.resolve(parseFloat((Math.random() * 30 - 15).toFixed(2)));
};

/**
 * Generate mock volume data for an index
 */
export const generateMockVolume = (baseVolume?: number): number => {
  // If a base volume is provided, vary it slightly to simulate changes
  if (baseVolume) {
    const change = baseVolume * (Math.random() * 0.1 - 0.05); // -5% to +5%
    return Math.max(0, Math.round(baseVolume + change));
  }
  
  // Generate a new random volume (more realistic distribution)
  const randomFactor = Math.random();
  
  if (randomFactor > 0.95) {
    // Top 5% of indices have very high volume
    return Math.floor(5000000 + Math.random() * 20000000);
  } else if (randomFactor > 0.7) {
    // Next 25% have moderate volume
    return Math.floor(500000 + Math.random() * 4500000);
  } else {
    // Remaining 70% have lower volume
    return Math.floor(1000 + Math.random() * 499000);
  }
};

/**
 * Generate chart data for a token or index
 */
export const generateChartData = (days: number = 30): { date: string, value: number }[] => {
  const data = [];
  const baseValue = 1000 + Math.random() * 500;
  const volatility = Math.random() * 0.15 + 0.05; // 5% to 20% volatility
  
  let currentValue = baseValue;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random daily change with momentum
    const change = (Math.random() * 2 - 1) * volatility * currentValue;
    currentValue = Math.max(currentValue + change, 100); // Ensure value doesn't go below 100
    
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      value: Math.round(currentValue),
    });
  }
  
  return data;
};

// Singleton instance of the token list for caching
let tokenListSingleton: Record<string, any> | null = null;

/**
 * Get token data with caching for efficiency
 */
export const getTokenData = async (address: string): Promise<TokenData | null> => {
  if (!tokenListSingleton) {
    tokenListSingleton = await fetchTokenList();
  }
  
  if (!isValidSolanaAddress(address)) {
    return null;
  }
  
  const token = tokenListSingleton[address];
  if (token) {
    return {
      address,
      name: token.name || 'Unknown Token',
      symbol: token.symbol || '???',
      imageUrl: token.logoURI || undefined,
      decimals: token.decimals,
      // We would get these from a price API in a real implementation
      price: parseFloat((Math.random() * 100).toFixed(4)),
      marketCap: Math.round(Math.random() * 10000000),
      change24h: parseFloat((Math.random() * 40 - 20).toFixed(2)),
    };
  }
  
  return null;
};
