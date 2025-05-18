
import { useQuery } from '@tanstack/react-query';

export interface TokenMetadata {
  name: string;
  symbol: string;
  address: string;
  image?: string;
  price?: number;
  marketCap?: number;
}

// Using Birdeye API to get token data
const API_KEY = 'ae627906-aa82-432d-9d4f-511db3fe7b70'; // Public API key for demo purposes

export async function fetchTokenMetadata(address: string): Promise<TokenMetadata> {
  try {
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
        name: tokenData.symbol || 'Unknown',
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
    // Return fallback data on error
    return {
      name: 'Unknown',
      symbol: 'Unknown',
      address: address
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
