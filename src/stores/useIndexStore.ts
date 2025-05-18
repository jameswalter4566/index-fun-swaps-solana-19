
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

interface IndexState {
  indexes: Record<string, IndexData>;
  addIndex: (index: Omit<IndexData, "id" | "createdAt" | "upvotes" | "upvotedBy">) => string;
  removeIndex: (id: string) => void;
  upvoteIndex: (id: string, walletAddress: string) => void;
  downvoteIndex: (id: string, walletAddress: string) => void;
  updateIndexGains: (id: string, gainPercentage: number, marketCap: number) => void;
  getIndexesByCreator: (creatorAddress: string) => IndexData[];
  getAllIndexes: () => IndexData[];
}

export const useIndexStore = create<IndexState>()(
  persist(
    (set, get) => ({
      indexes: {},
      
      addIndex: (indexData) => {
        const id = `index_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newIndex: IndexData = {
          ...indexData,
          id,
          createdAt: new Date().toISOString(),
          upvotes: 0,
          upvotedBy: [],
        };
        
        set((state) => ({
          indexes: {
            ...state.indexes,
            [id]: newIndex,
          },
        }));
        
        return id;
      },
      
      removeIndex: (id) => {
        set((state) => {
          const newIndexes = { ...state.indexes };
          delete newIndexes[id];
          return { indexes: newIndexes };
        });
      },
      
      upvoteIndex: (id, walletAddress) => {
        set((state) => {
          const index = state.indexes[id];
          if (!index || index.upvotedBy.includes(walletAddress)) return state;
          
          return {
            indexes: {
              ...state.indexes,
              [id]: {
                ...index,
                upvotes: index.upvotes + 1,
                upvotedBy: [...index.upvotedBy, walletAddress],
              },
            },
          };
        });
      },
      
      downvoteIndex: (id, walletAddress) => {
        set((state) => {
          const index = state.indexes[id];
          if (!index || !index.upvotedBy.includes(walletAddress)) return state;
          
          return {
            indexes: {
              ...state.indexes,
              [id]: {
                ...index,
                upvotes: Math.max(0, index.upvotes - 1),
                upvotedBy: index.upvotedBy.filter(addr => addr !== walletAddress),
              },
            },
          };
        });
      },
      
      updateIndexGains: (id, gainPercentage, marketCap) => {
        set((state) => {
          const index = state.indexes[id];
          if (!index) return state;
          
          return {
            indexes: {
              ...state.indexes,
              [id]: {
                ...index,
                gainPercentage,
                marketCap,
                lastPriceUpdate: new Date().toISOString(),
              },
            },
          };
        });
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
      name: 'index-storage', // unique name for localStorage
    }
  )
);
