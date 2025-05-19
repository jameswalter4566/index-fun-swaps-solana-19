
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIndexStore } from '@/stores/useIndexStore';
import { toast } from 'sonner';

export function useRealtimeIndexes() {
  const { fetchAllIndexes } = useIndexStore();

  useEffect(() => {
    // Initial fetch of all indexes
    fetchAllIndexes().catch(error => {
      console.error('Failed to fetch indexes:', error);
      toast.error('Failed to load indexes', {
        description: 'Please check your connection and try again'
      });
    });

    // Subscribe to real-time changes
    const indexesSubscription = supabase
      .channel('public:indexes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'indexes' }, 
        () => {
          console.log('Indexes table changed, refreshing data...');
          fetchAllIndexes().catch(console.error);
        }
      )
      .subscribe();

    const tokensSubscription = supabase
      .channel('public:tokens')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tokens' }, 
        () => {
          console.log('Tokens table changed, refreshing data...');
          fetchAllIndexes().catch(console.error);
        }
      )
      .subscribe();

    // Cleanup subscriptions when component unmounts
    return () => {
      indexesSubscription.unsubscribe();
      tokensSubscription.unsubscribe();
    };
  }, [fetchAllIndexes]);
}
