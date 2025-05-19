import { TokenData } from './types';
import { isValidSolanaAddress } from './utils';

// This would normally be hidden in environment variables or server-side
// For demonstration purposes we're keeping it in the code
const JUPITER_API_BASE = 'https://quote-api.jup.ag/v4';
const TOKEN_LIST_URL = 'https://token.jup.ag/all';
const SOLANA_TRACKER_API_BASE = 'https://data.solanatracker.io';
const SOLANA_TRACKER_API_KEY = '76a0b17d-089f-4069-973b-51b9ba1571a3';

// Singleton instance of the token list for caching
let tokenListSingleton: Record<string, any> | null = null;

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
