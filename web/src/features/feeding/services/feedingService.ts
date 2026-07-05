import { supabase } from '@/lib/supabase';

export interface FeedQueueItem {
  id: string;
  device_id: string;
  command: string;
  duration: number;
  source: string;
  status: 'pending' | 'processing' | 'done';
  created_at: string;
}

export const feedingService = {
  async triggerManualFeed(deviceId: string, durationSeconds: number) {
    const { data, error } = await supabase
      .from('feed_queue')
      .insert([
        {
          device_id: deviceId,
          command: 'feed',
          duration: durationSeconds,
          source: 'web_manual',
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as FeedQueueItem;
  },

  // Subscribe to changes on a specific feed queue item to track execution
  subscribeToFeedItem(itemId: string, onUpdate: (item: FeedQueueItem) => void) {
    const channel = supabase
      .channel(`feed_item_${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'feed_queue',
          filter: `id=eq.${itemId}`
        },
        (payload) => {
          onUpdate(payload.new as FeedQueueItem);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
