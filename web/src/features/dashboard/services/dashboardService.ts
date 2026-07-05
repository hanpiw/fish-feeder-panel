import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  todayFeedCount: number;
  lastFeedTime: string | null;
  lastFeedDuration: number | null;
}

export const dashboardService = {
  async getStats(deviceId: string): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();

    // Query today's count
    const { count, error: countError } = await supabase
      .from('feed_logs')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', deviceId)
      .eq('status', 'success')
      .gte('executed_at', startOfDay);

    if (countError) throw countError;

    // Query last feed log
    const { data: lastLog, error: lastError } = await supabase
      .from('feed_logs')
      .select('executed_at, duration')
      .eq('device_id', deviceId)
      .eq('status', 'success')
      .order('executed_at', { ascending: false })
      .limit(1);

    if (lastError) throw lastError;

    return {
      todayFeedCount: count || 0,
      lastFeedTime: lastLog && lastLog.length > 0 ? lastLog[0].executed_at : null,
      lastFeedDuration: lastLog && lastLog.length > 0 ? lastLog[0].duration : null,
    };
  },

  subscribeToStats(deviceId: string, onUpdate: () => void) {
    const channel = supabase
      .channel(`dashboard_stats_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_logs',
          filter: `device_id=eq.${deviceId}`
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
