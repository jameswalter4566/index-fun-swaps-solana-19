
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIndexStore } from '@/stores/useIndexStore';
import { toast } from 'sonner';

export function useRealtimeIndexes() {
  const { fetchAllIndexes } = useIndexStore();
  const refreshTimeoutRef = useRef<number | null>(null);
  const refreshInProgressRef = useRef(false);
  const retryAttemptsRef = useRef(0);
  const MAX_RETRY_ATTEMPTS = 3;

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = () => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Set a new timeout
    refreshTimeoutRef.current = window.setTimeout(() => {
      if (!refreshInProgressRef.current) {
        refreshInProgressRef.current = true;
        retryAttemptsRef.current = 0;
        
        console.log('Debounced refresh triggered, fetching indexes...');
        fetchAllIndexes()
          .then(() => {
            console.log('Index refresh completed successfully');
            retryAttemptsRef.current = 0;
          })
          .catch(error => {
            console.error('Failed to fetch indexes:', error);
            
            if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
              retryAttemptsRef.current++;
              console.log(`Retry attempt ${retryAttemptsRef.current}/${MAX_RETRY_ATTEMPTS}`);
              // Wait a bit longer before retrying
              setTimeout(() => {
                refreshInProgressRef.current = false;
                debouncedRefresh();
              }, 2000);
            } else {
              toast.error('Failed to load indexes', {
                description: 'Please check your connection and try again'
              });
            }
          })
          .finally(() => {
            if (retryAttemptsRef.current === 0) {
              refreshInProgressRef.current = false;
            }
          });
      } else {
        console.log('Refresh already in progress, skipping this update');
      }
    }, 1000); // 1 second debounce
  };

  useEffect(() => {
    // Initial fetch of all indexes - only once
    if (!refreshInProgressRef.current) {
      refreshInProgressRef.current = true;
      
      console.log('Initial index fetch started');
      fetchAllIndexes()
        .then(() => {
          console.log('Initial index fetch completed');
        })
        .catch(error => {
          console.error('Failed to fetch indexes:', error);
          toast.error('Failed to load indexes', {
            description: 'Please check your connection and try again'
          });
        })
        .finally(() => {
          refreshInProgressRef.current = false;
        });
    }

    // Subscribe to real-time changes
    const indexesSubscription = supabase
      .channel('public:indexes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'indexes' }, 
        () => {
          console.log('Indexes table changed, triggering debounced refresh...');
          debouncedRefresh();
        }
      )
      .subscribe();

    const tokensSubscription = supabase
      .channel('public:tokens')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tokens' }, 
        () => {
          console.log('Tokens table changed, triggering debounced refresh...');
          debouncedRefresh();
        }
      )
      .subscribe();

    // Cleanup subscriptions when component unmounts
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      indexesSubscription.unsubscribe();
      tokensSubscription.unsubscribe();
    };
  }, [fetchAllIndexes]);
}
