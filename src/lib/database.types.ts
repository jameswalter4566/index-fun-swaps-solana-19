
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      indexes: {
        Row: {
          id: string
          name: string
          creator_address: string
          created_at: string
          upvotes: number
          upvoted_by: string[]
          gain_percentage: number | null
          market_cap: number | null
          last_price_update: string | null
          total_volume: number
          percent_change_1h: number
          percent_change_6h: number
        }
        Insert: {
          id: string
          name: string
          creator_address: string
          created_at?: string
          upvotes?: number
          upvoted_by?: string[]
          gain_percentage?: number | null
          market_cap?: number | null
          last_price_update?: string | null
          total_volume?: number
          percent_change_1h?: number
          percent_change_6h?: number
        }
        Update: {
          id?: string
          name?: string
          creator_address?: string
          created_at?: string
          upvotes?: number
          upvoted_by?: string[]
          gain_percentage?: number | null
          market_cap?: number | null
          last_price_update?: string | null
          total_volume?: number
          percent_change_1h?: number
          percent_change_6h?: number
        }
      }
      tokens: {
        Row: {
          id: string
          index_id: string
          address: string
          name: string
          symbol: string | null
          image_url: string | null
          decimals: number | null
        }
        Insert: {
          id?: string
          index_id: string
          address: string
          name: string
          symbol?: string | null
          image_url?: string | null
          decimals?: number | null
        }
        Update: {
          id?: string
          index_id?: string
          address?: string
          name?: string
          symbol?: string | null
          image_url?: string | null
          decimals?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
