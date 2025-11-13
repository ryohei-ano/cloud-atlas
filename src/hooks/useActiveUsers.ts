import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useActiveUsers = () => {
  const [activeUserCount, setActiveUserCount] = useState<number>(0);

  useEffect(() => {
    const userId = crypto.randomUUID();

    const presenceChannel: RealtimeChannel = supabase.channel('space-presence', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const count = Object.keys(state).length;
        setActiveUserCount(count);
      })
      .on('presence', { event: 'join' }, () => {
        // ユーザー情報はログに出力しない（プライバシー保護）
      })
      .on('presence', { event: 'leave' }, () => {
        // ユーザー情報はログに出力しない（プライバシー保護）
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
    };
  }, []);

  return { activeUserCount };
};
