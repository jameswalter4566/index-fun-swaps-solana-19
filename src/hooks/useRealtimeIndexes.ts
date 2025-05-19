
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useIndexStore } from '@/stores/useIndexStore';
import { Database } from '@/types/database';

type IndexRecord = Database['public']['Tables']['indexes']['Row'];
type TokenRecord = Database['public']['Tables']['tokens']['Row'];

export function useRealtimeIndexes() {
  const { indexes, fetchIndexes } = useIndexStore();
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchIndexes();
  }, [fetchIndexes]);
  
  // Set up real-time listeners for indexes and tokens
  useEffect(() => {
    const indexesChannel = supabase
      .channel('public:indexes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'indexes' 
      }, async (payload) => {
        console.log('Indexes change:', payload);
        // Refetch all indexes when any change occurs
        // This is a simple approach that ensures we have all related data
        await fetchIndexes();
      })
      .subscribe();
      
    const tokensChannel = supabase
      .channel('public:tokens')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tokens' 
      }, async (payload) => {
        console.log('Tokens change:', payload);
        // Refetch all indexes when tokens change too
        await fetchIndexes();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(indexesChannel);
      supabase.removeChannel(tokensChannel);
    };
  }, [fetchIndexes]);
  
  return {
    indexes,
    loading: useIndexStore((state) => state.isLoading),
    error: useIndexStore((state) => state.error),
    initialized: useIndexStore((state) => state.initialized),
  };
}
