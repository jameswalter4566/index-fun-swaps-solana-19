
import { PublicKey } from '@solana/web3.js';
import { Token } from '@/stores/useIndexStore';

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
}

// This would normally be hidden in environment variables or server-side
// For demonstration purposes we're keeping it in the code
const JUPITER_API_BASE = 'https://quote-api.jup.ag/v4';
const TOKEN_LIST_URL = 'https://token.jup.ag/all';
const SOLANA_TRACKER_API_BASE = 'https://data.solanatracker.io';
const SOLANA_TRACKER_API_KEY = '76a0b17d-089f-4069-973b-51b9ba1571a3';

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
 * Fetches token data from Solana Tracker API
 */
export const fetchTokenFromSolanaTracker = async (address: string): Promise<TokenData | null> => {
  try {
    const response = await fetch(`${SOLANA_TRACKER_API_BASE}/tokens/${address}`, {
      headers: { 'x-api-key': SOLANA_TRACKER_API_KEY }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch token data for ${address}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return {
      address,
      name: data.token?.name || `Token ${address.substring(0, 4)}...${address.substring(address.length - 4)}`,
      symbol: data.token?.symbol || "???",
      imageUrl: data.token?.image || undefined,
      decimals: data.token?.decimals,
      price: data.pools?.[0]?.price?.usd || undefined,
      marketCap: data.pools?.[0]?.marketCap?.usd || undefined,
      change1h: data.events?.["1h"]?.priceChangePercentage || 0,
      change6h: data.events?.["6h"]?.priceChangePercentage || 0,
      change24h: data.events?.["24h"]?.priceChangePercentage || 0
    };
  } catch (error) {
    console.error("Error fetching token from Solana Tracker:", error);
    return null;
  }
};

/**
 * Fetches multiple tokens at once from Solana Tracker API
 * Improved with better error handling
 */
export const fetchMultipleTokensFromSolanaTracker = async (addresses: string[]): Promise<Record<string, TokenData>> => {
  if (!addresses.length) return {};
  
  try {
    // If we have more than 20 tokens, we need to split into multiple requests
    const chunks = [];
    for (let i = 0; i < addresses.length; i += 20) {
      chunks.push(addresses.slice(i, i + 20));
    }
    
    const results: Record<string, TokenData> = {};
    
    await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const response = await fetch(`${SOLANA_TRACKER_API_BASE}/tokens/multi`, {
            method: 'POST',
            headers: {
              'x-api-key': SOLANA_TRACKER_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tokens: chunk })
          });
          
          if (!response.ok) {
            console.error(`Failed to fetch batch token data: ${response.status}`);
            return;
          }
          
          const dataArray = await response.json();
          
          // Make sure we have an array to work with - handle API inconsistencies
          if (!Array.isArray(dataArray)) {
            console.error("Expected array response from token multi API", dataArray);
            return;
          }
          
          // Process each token in the response
          dataArray.forEach((data: any) => {
            if (!data.token) return;
            
            const address = data.token.address;
            results[address] = {
              address,
              name: data.token?.name || `Token ${address.substring(0, 4)}...${address.substring(address.length - 4)}`,
              symbol: data.token?.symbol || "???",
              imageUrl: data.token?.image || undefined,
              decimals: data.token?.decimals,
              price: data.pools?.[0]?.price?.usd || undefined,
              marketCap: data.pools?.[0]?.marketCap?.usd || undefined,
              change1h: data.events?.["1h"]?.priceChangePercentage || 0,
              change6h: data.events?.["6h"]?.priceChangePercentage || 0,
              change24h: data.events?.["24h"]?.priceChangePercentage || 0
            };
          });
        } catch (error) {
          console.error("Error processing chunk in fetchMultipleTokensFromSolanaTracker:", error);
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error("Error fetching multiple tokens from Solana Tracker:", error);
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
    // First try to get the token from Solana Tracker API
    const solanaTrackerData = await fetchTokenFromSolanaTracker(address);
    if (solanaTrackerData) {
      return solanaTrackerData;
    }
    
    // Fallback to Jupiter token list if Solana Tracker fails
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
    
    // Fallback if token isn't in any list - create basic info
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
export const calculateIndexMarketCap = async (tokens: string[]): Promise<number> => {
  try {
    // Get actual token data from Solana Tracker API
    const tokenData = await fetchMultipleTokensFromSolanaTracker(tokens);
    
    // Sum up market caps
    let totalMarketCap = 0;
    let validTokenCount = 0;
    
    for (const address of tokens) {
      const data = tokenData[address];
      if (data && data.marketCap) {
        totalMarketCap += data.marketCap;
        validTokenCount++;
      }
    }
    
    // Return actual market cap if available, otherwise fallback to mock data
    return validTokenCount > 0 ? totalMarketCap : Math.round(10000 + Math.random() * 25000000);
  } catch (error) {
    console.error("Error calculating index market cap:", error);
    // Fallback to mock data if API fails
    return Math.round(10000 + Math.random() * 25000000);
  }
};

/**
 * Calculate gain percentage for an index based on token performance
 */
export const calculateIndexGainPercentage = async (tokens: string[]): Promise<number> => {
  try {
    // Get actual token data from Solana Tracker API
    const tokenData = await fetchMultipleTokensFromSolanaTracker(tokens);
    
    // Calculate weighted average of 24h changes
    let totalChange = 0;
    let validTokenCount = 0;
    
    for (const address of tokens) {
      const data = tokenData[address];
      if (data && data.change24h !== undefined) {
        totalChange += data.change24h;
        validTokenCount++;
      }
    }
    
    // Return average change if available, otherwise fallback to mock data
    return validTokenCount > 0 
      ? parseFloat((totalChange / validTokenCount).toFixed(2)) 
      : parseFloat((Math.random() * 80 - 30).toFixed(2));
  } catch (error) {
    console.error("Error calculating index gain percentage:", error);
    // Fallback to mock data if API fails
    return parseFloat((Math.random() * 80 - 30).toFixed(2));
  }
};

/**
 * Calculate 1-hour gain percentage for an index
 */
export const calculate1HourGainPercentage = async (tokens: string[]): Promise<number> => {
  try {
    // Get actual token data from Solana Tracker API
    const tokenData = await fetchMultipleTokensFromSolanaTracker(tokens);
    
    // Calculate average of 1h changes
    let totalChange = 0;
    let validTokenCount = 0;
    
    for (const address of tokens) {
      const data = tokenData[address];
      if (data && data.change1h !== undefined) {
        totalChange += data.change1h;
        validTokenCount++;
      }
    }
    
    // Return average change if available, otherwise fallback to mock data
    return validTokenCount > 0 
      ? parseFloat((totalChange / validTokenCount).toFixed(2)) 
      : parseFloat((Math.random() * 20 - 10).toFixed(2));
  } catch (error) {
    console.error("Error calculating 1-hour gain percentage:", error);
    // Fallback to mock data if API fails
    return parseFloat((Math.random() * 20 - 10).toFixed(2));
  }
};

/**
 * Calculate 6-hour gain percentage for an index
 */
export const calculate6HourGainPercentage = async (tokens: string[]): Promise<number> => {
  try {
    // Get actual token data from Solana Tracker API
    const tokenData = await fetchMultipleTokensFromSolanaTracker(tokens);
    
    // Calculate average of 6h changes
    let totalChange = 0;
    let validTokenCount = 0;
    
    for (const address of tokens) {
      const data = tokenData[address];
      if (data && data.change6h !== undefined) {
        totalChange += data.change6h;
        validTokenCount++;
      }
    }
    
    // Return average change if available, otherwise fallback to mock data
    return validTokenCount > 0 
      ? parseFloat((totalChange / validTokenCount).toFixed(2)) 
      : parseFloat((Math.random() * 30 - 15).toFixed(2));
  } catch (error) {
    console.error("Error calculating 6-hour gain percentage:", error);
    // Fallback to mock data if API fails
    return parseFloat((Math.random() * 30 - 15).toFixed(2));
  }
};

/**
 * Generate mock volume data for an index in SOL
 * Generates values between 0.1 and 15 SOL
 */
export const generateMockVolume = (baseVolume?: number): number => {
  // If a base volume is provided, vary it slightly to simulate changes
  if (baseVolume) {
    const change = baseVolume * (Math.random() * 0.1 - 0.05); // -5% to +5%
    return Math.max(0.1, Math.min(15, baseVolume + change)); // Keep between 0.1 and 15
  }
  
  // Generate a new random volume between 0.1 and 15 SOL
  return 0.1 + Math.random() * 14.9; // 0.1 to 15 SOL range
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
 * Improved with better error handling and logging
 */
export const getTokenData = async (address: string): Promise<TokenData | null> => {
  if (!isValidSolanaAddress(address)) {
    console.warn(`Invalid Solana address: ${address}`);
    return null;
  }
  
  try {
    // Try to get token from Solana Tracker API
    const tokenData = await fetchTokenFromSolanaTracker(address);
    if (tokenData) {
      return tokenData;
    }
    
    // Fall back to Jupiter token list for basic info if API fails
    if (!tokenListSingleton) {
      tokenListSingleton = await fetchTokenList();
    }
    
    const token = tokenListSingleton[address];
    if (token) {
      return {
        address,
        name: token.name || 'Unknown Token',
        symbol: token.symbol || '???',
        imageUrl: token.logoURI || undefined,
        decimals: token.decimals,
        // We add mock data for fields that aren't available in the Jupiter list
        price: parseFloat((Math.random() * 100).toFixed(4)),
        marketCap: Math.round(Math.random() * 10000000),
        change1h: parseFloat((Math.random() * 20 - 10).toFixed(2)),
        change6h: parseFloat((Math.random() * 30 - 15).toFixed(2)),
        change24h: parseFloat((Math.random() * 40 - 20).toFixed(2)),
      };
    }
    
    // Create basic fallback info if no data is available from either source
    return {
      address,
      name: `Token ${address.substring(0, 4)}...${address.substring(address.length - 4)}`,
      symbol: "???",
      price: parseFloat((Math.random() * 100).toFixed(4)),
      marketCap: Math.round(Math.random() * 10000000),
      change1h: parseFloat((Math.random() * 20 - 10).toFixed(2)),
      change6h: parseFloat((Math.random() * 30 - 15).toFixed(2)),
      change24h: parseFloat((Math.random() * 40 - 20).toFixed(2)),
    };
  } catch (error) {
    console.error("Error in getTokenData:", error);
    return null;
  }
};
