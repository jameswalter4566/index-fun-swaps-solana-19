
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useSupabaseRealtime = <T,>(
  schema: string,
  table: string,
  events: ('INSERT' | 'UPDATE' | 'DELETE')[] = ['INSERT', 'UPDATE', 'DELETE']
): [T[], boolean] => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        // Fetch initial data
        const { data: initialData, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setData(initialData || []);
        setLoading(false);

        // Create the channel - do this only once
        channel = supabase.channel(`table-changes-${table}`);
        
        // Add event listeners one by one
        events.forEach(event => {
          channel.on(
            'postgres_changes',
            { 
              event,
              schema,
              table
            },
            (payload) => {
              console.log('Change received!', payload);
              
              if (event === 'INSERT') {
                setData(prevData => [payload.new as T, ...prevData]);
              } else if (event === 'UPDATE') {
                setData(prevData => 
                  prevData.map(item => 
                    // @ts-ignore
                    (item.id === payload.new.id ? payload.new : item) as T
                  )
                );
              } else if (event === 'DELETE') {
                setData(prevData => 
                  prevData.filter(item => 
                    // @ts-ignore
                    item.id !== payload.old.id
                  )
                );
              }
            }
          );
        });

        // Subscribe to the channel after all event listeners are added
        channel.subscribe();
      } catch (error) {
        console.error('Error setting up subscription:', error);
        setLoading(false);
      }
    };

    setupSubscription();

    // Cleanup subscription
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [schema, table, events.join('-')]);

  return [data, loading];
};
