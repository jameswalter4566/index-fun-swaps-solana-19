
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { SupabaseIndex, SupabaseToken } from '@/lib/token/types';

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
  addIndex: (index: Omit<IndexData, "id" | "createdAt" | "upvotes" | "upvotedBy" | "totalVolume" | "percentChange1h" | "percentChange6h">) => Promise<string>;
  removeIndex: (id: string) => Promise<void>;
  upvoteIndex: (id: string, walletAddress: string) => Promise<void>;
  downvoteIndex: (id: string, walletAddress: string) => Promise<void>;
  updateIndexGains: (id: string, gainPercentage: number, marketCap: number, percentChange1h: number, percentChange6h: number) => Promise<void>;
  updateIndexVolume: (id: string, volume: number) => Promise<void>;
  getIndexesByCreator: (creatorAddress: string) => IndexData[];
  getAllIndexes: () => IndexData[];
  fetchAllIndexes: () => Promise<void>;
  setIndexes: (indexes: Record<string, IndexData>) => void;
}

// Helper function to convert Supabase data to our app's format
const convertSupabaseData = (
  indexData: SupabaseIndex, 
  tokensData: SupabaseToken[]
): IndexData => {
  const tokens: Token[] = tokensData.map(token => ({
    address: token.address,
    name: token.name,
    symbol: token.symbol || "",
    imageUrl: token.image_url || undefined,
    decimals: token.decimals || undefined,
  }));

  return {
    id: indexData.id,
    name: indexData.name,
    tokens,
    createdAt: indexData.created_at,
    creatorAddress: indexData.creator_address,
    upvotes: indexData.upvotes,
    upvotedBy: indexData.upvoted_by || [],
    gainPercentage: indexData.gain_percentage || 0,
    marketCap: indexData.market_cap || 0,
    lastPriceUpdate: indexData.last_price_update || undefined,
    totalVolume: indexData.total_volume,
    percentChange1h: indexData.percent_change_1h,
    percentChange6h: indexData.percent_change_6h,
  };
};

export const useIndexStore = create<IndexState>()(
  persist(
    (set, get) => ({
      indexes: {},
      isLoading: false,
      error: null,

      setIndexes: (indexes) => {
        set({ indexes });
      },
      
      fetchAllIndexes: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Fetch all indexes
          const { data: indexesData, error: indexesError } = await supabase
            .from('indexes')
            .select('*');
          
          if (indexesError) throw new Error(indexesError.message);
          
          const indexes: Record<string, IndexData> = {};
          
          // For each index, fetch its tokens
          await Promise.all(
            indexesData.map(async (indexData) => {
              const { data: tokensData, error: tokensError } = await supabase
                .from('tokens')
                .select('*')
                .eq('index_id', indexData.id);
                
              if (tokensError) throw new Error(tokensError.message);
              
              // Convert data to our format
              indexes[indexData.id] = convertSupabaseData(indexData, tokensData);
            })
          );
          
          set({ indexes, isLoading: false });
        } catch (error) {
          console.error('Error fetching indexes:', error);
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
        }
      },
      
      addIndex: async (indexData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Generate a unique ID
          const id = `index_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          // Prepare initial volume and change data
          const totalVolume = 0.1 + Math.random() * 14.9; // Mock initial volume between 0.1 and 15 SOL
          const percentChange1h = parseFloat((Math.random() * 10 - 5).toFixed(2)); // Mock 1h change
          const percentChange6h = parseFloat((Math.random() * 20 - 10).toFixed(2)); // Mock 6h change
          
          // Insert the index into Supabase
          const { error: indexError } = await supabase
            .from('indexes')
            .insert({
              id,
              name: indexData.name,
              creator_address: indexData.creatorAddress,
              upvotes: 0,
              upvoted_by: [],
              total_volume: totalVolume,
              percent_change_1h: percentChange1h,
              percent_change_6h: percentChange6h
            });
          
          if (indexError) throw new Error(indexError.message);
          
          // Insert the tokens for this index
          const tokensToInsert = indexData.tokens.map(token => ({
            index_id: id,
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            image_url: token.imageUrl,
            decimals: token.decimals
          }));
          
          const { error: tokensError } = await supabase
            .from('tokens')
            .insert(tokensToInsert);
          
          if (tokensError) throw new Error(tokensError.message);
          
          // Update local state
          const newIndex: IndexData = {
            ...indexData,
            id,
            createdAt: new Date().toISOString(),
            upvotes: 0,
            upvotedBy: [],
            totalVolume,
            percentChange1h,
            percentChange6h,
          };
          
          set((state) => ({
            indexes: {
              ...state.indexes,
              [id]: newIndex,
            },
            isLoading: false
          }));
          
          return id;
        } catch (error) {
          console.error('Error adding index:', error);
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
          throw error;
        }
      },
      
      removeIndex: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          // Delete tokens first due to foreign key constraint
          const { error: tokensError } = await supabase
            .from('tokens')
            .delete()
            .eq('index_id', id);
          
          if (tokensError) throw new Error(tokensError.message);
          
          // Delete the index
          const { error: indexError } = await supabase
            .from('indexes')
            .delete()
            .eq('id', id);
          
          if (indexError) throw new Error(indexError.message);
          
          // Update local state
          set((state) => {
            const newIndexes = { ...state.indexes };
            delete newIndexes[id];
            return { indexes: newIndexes, isLoading: false };
          });
          
        } catch (error) {
          console.error('Error removing index:', error);
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
          throw error;
        }
      },
      
      upvoteIndex: async (id, walletAddress) => {
        set({ isLoading: true, error: null });
        
        try {
          const index = get().indexes[id];
          if (!index || index.upvotedBy.includes(walletAddress)) {
            set({ isLoading: false });
            return;
          }
          
          // Update Supabase
          const { error } = await supabase
            .from('indexes')
            .update({ 
              upvotes: index.upvotes + 1,
              upvoted_by: [...index.upvotedBy, walletAddress]
            })
            .eq('id', id);
          
          if (error) throw new Error(error.message);
          
          // Update local state
          set((state) => ({
            indexes: {
              ...state.indexes,
              [id]: {
                ...index,
                upvotes: index.upvotes + 1,
                upvotedBy: [...index.upvotedBy, walletAddress],
              },
            },
            isLoading: false
          }));
          
        } catch (error) {
          console.error('Error upvoting index:', error);
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
          throw error;
        }
      },
      
      downvoteIndex: async (id, walletAddress) => {
        set({ isLoading: true, error: null });
        
        try {
          const index = get().indexes[id];
          if (!index || !index.upvotedBy.includes(walletAddress)) {
            set({ isLoading: false });
            return;
          }
          
          // Update Supabase
          const { error } = await supabase
            .from('indexes')
            .update({ 
              upvotes: Math.max(0, index.upvotes - 1),
              upvoted_by: index.upvotedBy.filter(addr => addr !== walletAddress)
            })
            .eq('id', id);
          
          if (error) throw new Error(error.message);
          
          // Update local state
          set((state) => ({
            indexes: {
              ...state.indexes,
              [id]: {
                ...index,
                upvotes: Math.max(0, index.upvotes - 1),
                upvotedBy: index.upvotedBy.filter(addr => addr !== walletAddress),
              },
            },
            isLoading: false
          }));
          
        } catch (error) {
          console.error('Error downvoting index:', error);
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
          throw error;
        }
      },
      
      updateIndexGains: async (id, gainPercentage, marketCap, percentChange1h, percentChange6h) => {
        set({ isLoading: true, error: null });
        
        try {
          const index = get().indexes[id];
          if (!index) {
            set({ isLoading: false });
            return;
          }
          
          const lastPriceUpdate = new Date().toISOString();
          
          // Update Supabase
          const { error } = await supabase
            .from('indexes')
            .update({ 
              gain_percentage: gainPercentage,
              market_cap: marketCap,
              percent_change_1h: percentChange1h || index.percentChange1h,
              percent_change_6h: percentChange6h || index.percentChange6h,
              last_price_update: lastPriceUpdate
            })
            .eq('id', id);
          
          if (error) throw new Error(error.message);
          
          // Update local state
          set((state) => ({
            indexes: {
              ...state.indexes,
              [id]: {
                ...index,
                gainPercentage,
                marketCap,
                percentChange1h: percentChange1h || index.percentChange1h,
                percentChange6h: percentChange6h || index.percentChange6h,
                lastPriceUpdate
              },
            },
            isLoading: false
          }));
          
        } catch (error) {
          console.error('Error updating index gains:', error);
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
          throw error;
        }
      },
      
      updateIndexVolume: async (id, volume) => {
        set({ isLoading: true, error: null });
        
        try {
          const index = get().indexes[id];
          if (!index) {
            set({ isLoading: false });
            return;
          }
          
          // Update Supabase
          const { error } = await supabase
            .from('indexes')
            .update({ total_volume: volume })
            .eq('id', id);
          
          if (error) throw new Error(error.message);
          
          // Update local state
          set((state) => ({
            indexes: {
              ...state.indexes,
              [id]: {
                ...index,
                totalVolume: volume,
              },
            },
            isLoading: false
          }));
          
        } catch (error) {
          console.error('Error updating index volume:', error);
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
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
    }),
    {
      name: 'index-storage', // keep the same storage name for backward compatibility
    }
  )
);
