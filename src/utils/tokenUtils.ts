
import { useQuery } from '@tanstack/react-query';

export interface TokenMetadata {
  name: string;
  symbol: string;
  address: string;
  image?: string;
  price?: number;
  marketCap?: number;
}

interface JupiterToken {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
  extensions?: Record<string, any>;
}

interface JupiterPriceResponse {
  data: Record<string, {
    id: string;
    mintSymbol: string;
    vsToken: string;
    vsTokenSymbol: string;
    price: number;
  }>;
}

// Fallback token information for when API fails
export const KNOWN_TOKENS: Record<string, Partial<TokenMetadata>> = {
  'CgZTsf3rNnXsy3YkXmRr988p1Lrv9FpqBpLPWrAbmoon': {
    name: 'Moon Token',
    symbol: 'MOON',
    image: 'https://arweave.net/Vk8dpgYIYu3BnQgm0JP4UjwbYm9P1FYdvFYGsQTz3Ow',
    price: 0.0123,
    marketCap: 12300000,
  },
  'F63yhiWVe8k338Lt8TyeyN242ECxgv7cbffM8zUNpump': {
    name: 'Pump Token',
    symbol: 'PUMP',
    image: 'https://arweave.net/DrMnV8ixLcH17oamJ12BiooQh-JBFtjLbcH3WQ5qQ7s',
    price: 0.0456,
    marketCap: 45600000,
  },
  'E5sJv2tTUVdBzqcrG5BfsLCmCukUrXgb9bC9Soidpump': {
    name: 'Pomp Token',
    symbol: 'POMP',
    image: 'https://arweave.net/g1JmYC9FOG2bUJN1m7gsKCAgQhCLCgvySD7wxZGc9Ao',
    price: 0.0789,
    marketCap: 78900000,
  }
};

// Cache for Jupiter token list to avoid repeated fetches
let jupiterTokensCache: Record<string, JupiterToken> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get Jupiter token list and create a lookup map
async function getJupiterTokenMap(): Promise<Record<string, JupiterToken>> {
  const now = Date.now();
  
  // Return from cache if available and not expired
  if (jupiterTokensCache && (now - lastFetchTime < CACHE_DURATION)) {
    console.log('Using cached Jupiter token list');
    return jupiterTokensCache;
  }
  
  try {
    console.log('Fetching Jupiter token list...');
    const response = await fetch('https://quote-api.jup.ag/v6/tokens');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token list: ${response.status}`);
    }
    
    const tokens = await response.json() as JupiterToken[];
    
    // Create lookup by mint address
    const map: Record<string, JupiterToken> = {};
    tokens.forEach(token => {
      map[token.address] = token;
    });
    
    // Update cache
    jupiterTokensCache = map;
    lastFetchTime = now;
    
    console.log(`Loaded ${tokens.length} tokens from Jupiter API`);
    return map;
  } catch (error) {
    console.error('Error fetching Jupiter token list:', error);
    throw error;
  }
}

// Function to fetch token price from Jupiter
async function getTokenPrice(address: string): Promise<number | undefined> {
  try {
    console.log(`Fetching price for token: ${address}`);
    const response = await fetch(`https://price.jup.ag/v4/price?ids=${address}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token price: ${response.status}`);
    }
    
    const data = await response.json() as JupiterPriceResponse;
    return data.data[address]?.price;
  } catch (error) {
    console.error(`Error fetching price for ${address}:`, error);
    return undefined;
  }
}

// Main function to fetch token metadata from Jupiter API
export async function fetchTokenMetadata(address: string): Promise<TokenMetadata> {
  try {
    // Get Jupiter token data
    const tokenMap = await getJupiterTokenMap();
    const jupiterToken = tokenMap[address];
    
    if (jupiterToken) {
      console.log(`Found Jupiter data for token: ${address}`);
      
      // Try to get the price
      let price: number | undefined;
      try {
        price = await getTokenPrice(address);
      } catch (priceError) {
        console.error(`Error fetching price, using default: ${priceError}`);
      }
      
      // Estimate market cap - this is a very rough estimation
      // In reality, we would need circulating supply data which Jupiter doesn't provide
      const marketCap = price ? price * 100000000 : undefined; // Arbitrary multiplier
      
      return {
        name: jupiterToken.name || 'Unknown',
        symbol: jupiterToken.symbol || 'Unknown',
        address: address,
        image: jupiterToken.logoURI,
        price,
        marketCap,
      };
    }
    
    throw new Error('Token not found in Jupiter list');
  } catch (error) {
    console.error(`Error fetching Jupiter metadata for ${address}:`, error);
    
    // Fall back to known tokens
    const fallbackData = KNOWN_TOKENS[address];
    if (fallbackData) {
      console.log(`Using fallback data for token: ${address}`);
      return {
        name: fallbackData.name || 'Unknown',
        symbol: fallbackData.symbol || 'Unknown',
        address: address,
        image: fallbackData.image,
        price: fallbackData.price || 0,
        marketCap: fallbackData.marketCap || 0
      };
    }
    
    // If all else fails, return minimal data
    return {
      name: 'Unknown',
      symbol: 'Unknown',
      address: address,
      price: 0,
      marketCap: 0
    };
  }
}

export function useTokenMetadata(address: string) {
  return useQuery({
    queryKey: ['tokenMetadata', address],
    queryFn: () => fetchTokenMetadata(address),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function formatMarketCap(marketCap: number | undefined): string {
  if (!marketCap) return 'Unknown';
  
  if (marketCap >= 1000000000) {
    return `$${(marketCap / 1000000000).toFixed(2)}B`;
  }
  
  if (marketCap >= 1000000) {
    return `$${(marketCap / 1000000).toFixed(2)}M`;
  }
  
  if (marketCap >= 1000) {
    return `$${(marketCap / 1000).toFixed(2)}K`;
  }
  
  return `$${marketCap.toFixed(2)}`;
}

export function useMultipleTokenMetadata(addresses: string[]) {
  return useQuery({
    queryKey: ['multipleTokenMetadata', addresses],
    queryFn: async () => {
      const metadataPromises = addresses.map(address => fetchTokenMetadata(address));
      return Promise.all(metadataPromises);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
