
import { PublicKey } from '@solana/web3.js';

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
 * Format market cap value to human-readable string with appropriate suffix
 * @param marketCap The market cap value in USD
 * @returns Formatted market cap string (e.g. $1.2B, $500M, etc.)
 */
export const formatMarketCap = (marketCap?: number | null): string => {
  if (marketCap === undefined || marketCap === null) return 'N/A';
  
  if (marketCap >= 1000000000) {
    return `$${(marketCap / 1000000000).toFixed(1)}B`;
  } else if (marketCap >= 1000000) {
    return `$${(marketCap / 1000000).toFixed(1)}M`;
  } else if (marketCap >= 1000) {
    return `$${(marketCap / 1000).toFixed(1)}K`;
  } else {
    return `$${marketCap}`;
  }
};
