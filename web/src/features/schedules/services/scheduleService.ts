import { supabase } from '@/lib/supabase';

export interface Schedule {
  id: string;
  device_id: string;
  feed_time: string; // HH:MM:SS format
  duration: number; // in seconds
  enabled: boolean;
  created_at: string;
}

export const scheduleService = {
  async getSchedules(deviceId: string) {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('device_id', deviceId)
      .order('feed_time', { ascending: true });

    if (error) throw error;
    return data as Schedule[];
  },

  async addSchedule(deviceId: string, feedTime: string, durationSeconds: number) {
    const { data, error } = await supabase
      .from('schedules')
      .insert([
        {
          device_id: deviceId,
          feed_time: feedTime,
          duration: durationSeconds,
          enabled: true
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Schedule;
  },

  async toggleSchedule(scheduleId: string, enabled: boolean) {
    const { error } = await supabase
      .from('schedules')
      .update({ enabled })
      .eq('id', scheduleId);

    if (error) throw error;
  },

  async deleteSchedule(scheduleId: string) {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
  },

  subscribeToSchedules(deviceId: string, onChange: () => void) {
    const channel = supabase
      .channel(`schedules_device_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
          filter: `device_id=eq.${deviceId}`
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
