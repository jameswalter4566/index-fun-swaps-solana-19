
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

export interface SupabaseToken {
  id: string;
  index_id: string;
  address: string;
  name: string;
  symbol: string | null;
  image_url: string | null;
  decimals: number | null;
}

export interface SupabaseIndex {
  id: string;
  name: string;
  creator_address: string;
  created_at: string;
  upvotes: number;
  upvoted_by: string[];
  gain_percentage: number | null;
  market_cap: number | null;
  last_price_update: string | null;
  total_volume: number;
  percent_change_1h: number;
  percent_change_6h: number;
}
