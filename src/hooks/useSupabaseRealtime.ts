
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

export function useSupabaseRealtime<T>(
  table: 'indexes' | 'tokens',
  onChange: (payload: T) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
  filter?: string,
) {
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          onChange(payload.new as T);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onChange, event, filter]);
}
