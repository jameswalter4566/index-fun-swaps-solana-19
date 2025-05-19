
import { create } from 'zustand';
import { supabase } from '@/lib/supabase-client';
import { TokenData } from '@/lib/token/types';
import { Database } from '@/types/database';

export interface Token {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  decimals?: number;
}

export interface IndexData {
  id: string;
  name: string;
  tokens: Token[];
  createdAt: string;
  creatorAddress: string;
  upvotes: number;
  upvotedBy: string[]; // array of wallet addresses that have upvoted
  gainPercentage?: number;
  marketCap?: number;
  lastPriceUpdate?: string;
  totalVolume: number; // Total volume in SOL
  percentChange1h: number;
  percentChange6h: number;
}

interface IndexState {
  indexes: Record<string, IndexData>;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  addIndex: (index: Omit<IndexData, "id" | "createdAt" | "upvotes" | "upvotedBy" | "totalVolume" | "percentChange1h" | "percentChange6h">) => Promise<string>;
  removeIndex: (id: string) => Promise<void>;
  upvoteIndex: (id: string, walletAddress: string) => Promise<void>;
  downvoteIndex: (id: string, walletAddress: string) => Promise<void>;
  updateIndexGains: (id: string, gainPercentage: number, marketCap: number, percentChange1h: number, percentChange6h: number) => Promise<void>;
  updateIndexVolume: (id: string, volume: number) => Promise<void>;
  getIndexesByCreator: (creatorAddress: string) => IndexData[];
  getAllIndexes: () => IndexData[];
  fetchIndexes: () => Promise<void>;
}

// Helper function to convert between Supabase record and app model
const mapRecordToIndexData = (
  indexRecord: Database['public']['Tables']['indexes']['Row'], 
  tokenRecords: { address: string; name: string; symbol: string | null; image_url: string | null; decimals: number | null }[]
): IndexData => {
  return {
    id: indexRecord.id,
    name: indexRecord.name,
    creatorAddress: indexRecord.creator_address,
    createdAt: indexRecord.created_at,
    upvotes: indexRecord.upvotes,
    upvotedBy: indexRecord.upvoted_by,
    gainPercentage: indexRecord.gain_percentage ?? 0,
    marketCap: indexRecord.market_cap ?? undefined,
    lastPriceUpdate: indexRecord.last_price_update ?? undefined,
    totalVolume: indexRecord.total_volume,
    percentChange1h: indexRecord.percent_change_1h,
    percentChange6h: indexRecord.percent_change_6h,
    tokens: tokenRecords.map(token => ({
      address: token.address,
      name: token.name,
      symbol: token.symbol || '???',
      imageUrl: token.image_url ?? undefined,
      decimals: token.decimals ?? undefined,
    })),
  };
};

export const useIndexStore = create<IndexState>()((set, get) => ({
  indexes: {},
  isLoading: false,
  error: null,
  initialized: false,
  
  fetchIndexes: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all indexes
      const { data: indexData, error: indexError } = await supabase
        .from('indexes')
        .select('*');
      
      if (indexError) throw indexError;
      
      // Fetch all tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('tokens')
        .select('*');
      
      if (tokenError) throw tokenError;
      
      // Group tokens by index_id
      const tokensByIndex: Record<string, any[]> = {};
      tokenData?.forEach(token => {
        if (!tokensByIndex[token.index_id]) {
          tokensByIndex[token.index_id] = [];
        }
        tokensByIndex[token.index_id].push(token);
      });
      
      // Map data to our model and create indexes object
      const indexesMap: Record<string, IndexData> = {};
      indexData?.forEach(index => {
        const tokens = tokensByIndex[index.id] || [];
        indexesMap[index.id] = mapRecordToIndexData(index, tokens);
      });
      
      set({ 
        indexes: indexesMap, 
        isLoading: false, 
        initialized: true 
      });
    } catch (error) {
      console.error('Error fetching indexes:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error fetching indexes',
        isLoading: false,
        initialized: true
      });
    }
  },
  
  addIndex: async (indexData) => {
    const id = `index_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      // Create the index record
      const { error: indexError } = await supabase
        .from('indexes')
        .insert({
          id,
          name: indexData.name,
          creator_address: indexData.creatorAddress,
          total_volume: 0.1 + Math.random() * 14.9, // Mock initial volume between 0.1 and 15 SOL
          percent_change_1h: parseFloat((Math.random() * 10 - 5).toFixed(2)), // Mock 1h change
          percent_change_6h: parseFloat((Math.random() * 20 - 10).toFixed(2)), // Mock 6h change
        });
      
      if (indexError) throw indexError;
      
      // Create token records
      const tokenInserts = indexData.tokens.map(token => ({
        index_id: id,
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        image_url: token.imageUrl || null,
        decimals: token.decimals || null,
      }));
      
      const { error: tokensError } = await supabase
        .from('tokens')
        .insert(tokenInserts);
      
      if (tokensError) throw tokensError;
      
      // We don't set the state here as it will come through the realtime subscription
      return id;
    } catch (error) {
      console.error('Error creating index:', error);
      throw error;
    }
  },
  
  removeIndex: async (id) => {
    try {
      // Delete the index (cascade will delete related tokens)
      const { error } = await supabase
        .from('indexes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      set((state) => {
        const newIndexes = { ...state.indexes };
        delete newIndexes[id];
        return { indexes: newIndexes };
      });
    } catch (error) {
      console.error('Error removing index:', error);
      throw error;
    }
  },
  
  upvoteIndex: async (id, walletAddress) => {
    const index = get().indexes[id];
    if (!index || index.upvotedBy.includes(walletAddress)) return;
    
    try {
      // Update the index
      const { error } = await supabase
        .from('indexes')
        .update({
          upvotes: index.upvotes + 1,
          upvoted_by: [...index.upvotedBy, walletAddress],
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // We don't set state as it will come through the realtime subscription
    } catch (error) {
      console.error('Error upvoting index:', error);
      throw error;
    }
  },
  
  downvoteIndex: async (id, walletAddress) => {
    const index = get().indexes[id];
    if (!index || !index.upvotedBy.includes(walletAddress)) return;
    
    try {
      // Update the index
      const { error } = await supabase
        .from('indexes')
        .update({
          upvotes: Math.max(0, index.upvotes - 1),
          upvoted_by: index.upvotedBy.filter(addr => addr !== walletAddress),
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // We don't set state as it will come through the realtime subscription
    } catch (error) {
      console.error('Error downvoting index:', error);
      throw error;
    }
  },
  
  updateIndexGains: async (id, gainPercentage, marketCap, percentChange1h, percentChange6h) => {
    const index = get().indexes[id];
    if (!index) return;
    
    try {
      // Update the index
      const { error } = await supabase
        .from('indexes')
        .update({
          gain_percentage: gainPercentage,
          market_cap: marketCap,
          percent_change_1h: percentChange1h || index.percentChange1h,
          percent_change_6h: percentChange6h || index.percentChange6h,
          last_price_update: new Date().toISOString(),
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // We don't set state as it will come through the realtime subscription
    } catch (error) {
      console.error('Error updating index gains:', error);
      throw error;
    }
  },
  
  updateIndexVolume: async (id, volume) => {
    const index = get().indexes[id];
    if (!index) return;
    
    try {
      // Update the index
      const { error } = await supabase
        .from('indexes')
        .update({
          total_volume: volume,
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // We don't set state as it will come through the realtime subscription
    } catch (error) {
      console.error('Error updating index volume:', error);
      throw error;
    }
  },
  
  getIndexesByCreator: (creatorAddress) => {
    return Object.values(get().indexes).filter(
      index => index.creatorAddress === creatorAddress
    );
  },
  
  getAllIndexes: () => {
    return Object.values(get().indexes);
  },
}));
