
import { useQuery } from '@tanstack/react-query';

export interface TokenMetadata {
  name: string;
  symbol: string;
  address: string;
  image?: string;
  price?: number;
  marketCap?: number;
}

// Birdeye API to get token data
const API_KEY = 'ae627906-aa82-432d-9d4f-511db3fe7b70'; // Public API key for demo purposes

// Token information we know about 
const KNOWN_TOKENS: Record<string, Partial<TokenMetadata>> = {
  'CgZTsf3rNnXsy3YkXmRr988p1Lrv9FpqBpLPWrAbmoon': {
    name: 'MOON',
    symbol: 'MOON',
    image: 'https://arweave.net/Vk8dpgYIYu3BnQgm0JP4UjwbYm9P1FYdvFYGsQTz3Ow',
    price: 0.0123,
    marketCap: 12300000,
  },
  'F63yhiWVe8k338Lt8TyeyN242ECxgv7cbffM8zUNpump': {
    name: 'PUMP',
    symbol: 'PUMP',
    image: 'https://arweave.net/DrMnV8ixLcH17oamJ12BiooQh-JBFtjLbcH3WQ5qQ7s',
    price: 0.0456,
    marketCap: 45600000,
  },
  'E5sJv2tTUVdBzqcrG5BfsLCmCukUrXgb9bC9Soidpump': {
    name: 'POMP',
    symbol: 'POMP',
    image: 'https://arweave.net/g1JmYC9FOG2bUJN1m7gsKCAgQhCLCgvySD7wxZGc9Ao',
    price: 0.0789,
    marketCap: 78900000,
  }
};

export async function fetchTokenMetadata(address: string): Promise<TokenMetadata> {
  try {
    // First check if we have this token in our known list
    if (KNOWN_TOKENS[address]) {
      console.log(`Using cached data for token: ${address}`);
      const knownData = KNOWN_TOKENS[address];
      return {
        name: knownData.name || 'Unknown',
        symbol: knownData.symbol || 'Unknown',
        address: address,
        image: knownData.image,
        price: knownData.price || 0,
        marketCap: knownData.marketCap || 0,
      };
    }
    
    // If not in our known list, try the API
    console.log(`Fetching token data from Birdeye for: ${address}`);
    const response = await fetch(`https://public-api.birdeye.so/public/token_list/solana?address=${address}`, {
      headers: {
        'X-API-KEY': API_KEY,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token data: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      const tokenData = data.data[0];
      return {
        name: tokenData.name || tokenData.symbol || 'Unknown',
        symbol: tokenData.symbol || 'Unknown',
        address: address,
        image: tokenData.logoURI || undefined,
        price: tokenData.price || 0,
        marketCap: tokenData.marketCap || 0,
      };
    }
    
    throw new Error('Token data not found');
  } catch (error) {
    console.error(`Error fetching token metadata for ${address}:`, error);
    
    // Fall back to mock data for demo purposes
    return {
      name: KNOWN_TOKENS[address]?.name || 'Unknown',
      symbol: KNOWN_TOKENS[address]?.symbol || 'Unknown',
      address: address,
      image: KNOWN_TOKENS[address]?.image,
      price: KNOWN_TOKENS[address]?.price || 0,
      marketCap: KNOWN_TOKENS[address]?.marketCap || 0
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
