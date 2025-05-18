
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
      
      // Generate more realistic price and market cap data
      const price = generateRealisticPrice(tokenInfo.symbol);
      const marketCap = generateRealisticMarketCap(tokenInfo.symbol);
      
      return {
        address,
        name: tokenInfo.name || 'Unknown Token',
        symbol: tokenInfo.symbol || '???',
        imageUrl: tokenInfo.logoURI || undefined,
        decimals: tokenInfo.decimals,
        price,
        marketCap,
        change24h: parseFloat((Math.random() * 40 - 20).toFixed(2)), // Mock 24h change
      };
    }
    
    // Fallback if token isn't in the list - create basic info
    return {
      address,
      name: `Token ${address.substring(0, 4)}...${address.substring(address.length - 4)}`,
      symbol: '???',
      price: 0.01,
      marketCap: 100000,
      change24h: parseFloat((Math.random() * 20 - 10).toFixed(2)),
    };
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
};

// Generate more realistic price data based on token symbol
const generateRealisticPrice = (symbol: string): number => {
  if (!symbol) return 0.01;
  
  // Common known tokens with more realistic prices
  const knownTokens: Record<string, number> = {
    'SOL': 65.75,
    'ETH': 3250.50,
    'BTC': 67500.25,
    'USDC': 1.00,
    'USDT': 1.00,
    'BONK': 0.00002,
    'PYTH': 0.85,
    'RAY': 1.25,
    'SRM': 0.45,
    'MNGO': 0.07,
    'JTO': 2.35,
    'COPE': 0.15,
    'FIDA': 0.30,
  };
  
  if (knownTokens[symbol.toUpperCase()]) {
    // Add some small variation
    const variation = (Math.random() * 0.05) - 0.025; // -2.5% to +2.5%
    return knownTokens[symbol.toUpperCase()] * (1 + variation);
  }
  
  // For unknown tokens, return a small random price
  return parseFloat((0.01 + (Math.random() * 2)).toFixed(4));
};

// Generate more realistic market cap data based on token symbol
const generateRealisticMarketCap = (symbol: string): number => {
  if (!symbol) return 100000;
  
  // Common known tokens with more realistic market caps
  const knownTokens: Record<string, number> = {
    'SOL': 28000000000,
    'ETH': 390000000000,
    'BTC': 1300000000000,
    'USDC': 25000000000,
    'USDT': 95000000000,
    'BONK': 950000000,
    'PYTH': 320000000,
    'RAY': 180000000,
    'SRM': 45000000,
    'MNGO': 25000000,
    'JTO': 370000000,
    'COPE': 18000000,
    'FIDA': 35000000,
  };
  
  if (knownTokens[symbol.toUpperCase()]) {
    // Add some small variation
    const variation = (Math.random() * 0.1) - 0.05; // -5% to +5%
    return Math.round(knownTokens[symbol.toUpperCase()] * (1 + variation));
  }
  
  // For unknown tokens, return a modest market cap
  return Math.round(1000000 + Math.random() * 50000000);
};

/**
 * Calculate weighted market cap for an index based on its tokens
 */
export const calculateIndexMarketCap = async (tokens: string[]): Promise<number> => {
  try {
    let totalMarketCap = 0;
    
    // Get market cap for each token and sum them
    for (const tokenAddress of tokens) {
      const tokenData = await getTokenData(tokenAddress);
      if (tokenData && tokenData.marketCap) {
        totalMarketCap += tokenData.marketCap;
      }
    }
    
    return totalMarketCap || 10000000; // Fallback to reasonable value if calculation fails
  } catch (error) {
    console.error('Error calculating index market cap:', error);
    return 10000000; // Fallback value
  }
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
    // Generate more realistic price and market cap data
    const price = generateRealisticPrice(token.symbol);
    const marketCap = generateRealisticMarketCap(token.symbol);
    
    return {
      address,
      name: token.name || 'Unknown Token',
      symbol: token.symbol || '???',
      imageUrl: token.logoURI || undefined,
      decimals: token.decimals,
      price,
      marketCap,
      change24h: parseFloat((Math.random() * 40 - 20).toFixed(2)),
    };
  }
  
  // For tokens not in the list, provide fallback data
  return {
    address,
    name: `Token ${address.substring(0, 4)}...${address.substring(address.length - 4)}`,
    symbol: '???',
    imageUrl: undefined,
    price: 0.01,
    marketCap: 100000,
    change24h: parseFloat((Math.random() * 20 - 10).toFixed(2)),
  };
};
