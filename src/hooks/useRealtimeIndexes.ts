
import { useState, useEffect } from 'react';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import { supabase } from '@/lib/supabase-client';
import { useIndexStore } from '@/stores/useIndexStore';
import { Database } from '@/types/database';

type IndexRecord = Database['public']['Tables']['indexes']['Row'];
type TokenRecord = Database['public']['Tables']['tokens']['Row'];

export function useRealtimeIndexes() {
  const { 
    indexes, 
    fetchIndexes, 
    updateIndexInStore, 
    updateTokensInStore 
  } = useIndexStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Initial fetch on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchIndexes();
      setIsInitialLoad(false);
    };
    
    loadInitialData();
  }, [fetchIndexes]);
  
  // Handle index changes (structural changes that require refetching)
  useSupabaseRealtime<IndexRecord>(
    'indexes',
    (updatedIndex) => {
      // For INSERT and DELETE events, we want to refetch all data to ensure consistency
      if (isInitialLoad) return; // Skip during initial load to prevent duplicate fetches
      
      // For UPDATE events that only update metrics (gain, market cap, etc.),
      // we update just that specific index in the store
      if (updatedIndex) {
        // Check if only metrics were updated, not structural changes
        const currentIndex = Object.values(indexes).find(idx => idx.id === updatedIndex.id);
        
        if (currentIndex) {
          // Just update the specific index with new metrics
          updateIndexInStore(updatedIndex);
        } else {
          // For structural changes or new indexes, refetch everything
          fetchIndexes();
        }
      }
    },
    '*' // Listen to all event types
  );
  
  // Handle token changes
  useSupabaseRealtime<TokenRecord>(
    'tokens',
    (updatedToken) => {
      if (isInitialLoad) return; // Skip during initial load
      
      // Update the specific token in the store
      if (updatedToken) {
        updateTokensInStore(updatedToken);
      } else {
        // If token was deleted or we can't determine what changed, refetch everything
        fetchIndexes();
      }
    },
    '*' // Listen to all event types
  );
  
  return {
    indexes: Object.values(indexes), // Convert from Record to array for easier use
    loading: useIndexStore((state) => state.isLoading),
    error: useIndexStore((state) => state.error),
    initialized: useIndexStore((state) => state.initialized),
  };
}
