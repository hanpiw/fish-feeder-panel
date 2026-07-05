import { supabase } from '@/lib/supabase';

export interface FeedLog {
  id: string;
  device_id: string;
  source: string; // 'web_manual', 'web_schedule', 'hardware_button', etc.
  duration: number;
  executed_at: string;
  status: string; // 'success', 'failed'
}

export const historyService = {
  async getFeedLogs(deviceId: string, limit = 50) {
    const { data, error } = await supabase
      .from('feed_logs')
      .select('*')
      .eq('device_id', deviceId)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as FeedLog[];
  },

  subscribeToFeedLogs(deviceId: string, onInsert: () => void) {
    const channel = supabase
      .channel(`feed_logs_device_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_logs',
          filter: `device_id=eq.${deviceId}`
        },
        () => {
          onInsert();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
