
export interface IndexRecord {
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

export interface TokenRecord {
  id: string;
  index_id: string;
  address: string;
  name: string;
  symbol: string | null;
  image_url: string | null;
  decimals: number | null;
}

export type Database = {
  public: {
    Tables: {
      indexes: {
        Row: IndexRecord;
        Insert: Omit<IndexRecord, 'created_at' | 'upvotes' | 'upvoted_by' | 'gain_percentage' | 'last_price_update' | 'total_volume' | 'percent_change_1h' | 'percent_change_6h'> & Partial<Pick<IndexRecord, 'gain_percentage' | 'market_cap' | 'last_price_update' | 'total_volume' | 'percent_change_1h' | 'percent_change_6h'>>;
        Update: Partial<IndexRecord>;
      };
      tokens: {
        Row: TokenRecord;
        Insert: Omit<TokenRecord, 'id'>;
        Update: Partial<TokenRecord>;
      };
    };
  };
};
