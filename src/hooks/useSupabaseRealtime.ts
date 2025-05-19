
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useSupabaseRealtime<T>(
  table: 'indexes' | 'tokens',
  onChange: (payload: T) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
  filter?: string,
) {
  useEffect(() => {
    // Create a channel for receiving real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        } as any, // Type assertion needed due to TypeScript limitation
        (payload: RealtimePostgresChangesPayload<any>) => {
          onChange(payload.new as T);
        }
      )
      .subscribe();

    // Cleanup: remove channel when component unmounts
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, onChange, event, filter]);
}
