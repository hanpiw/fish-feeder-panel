import { supabase } from '@/lib/supabase';

export interface Device {
  id: string;
  device_name: string;
  online: boolean;
  last_seen: string;
  wifi_strength: number | null;
  firmware_version: string | null;
}

export const deviceService = {
  async getDevices() {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('device_name', { ascending: true });

    if (error) throw error;
    return data as Device[];
  },

  async createDevice(deviceName: string) {
    const { data, error } = await supabase
      .from('devices')
      .insert([{ device_name: deviceName }])
      .select()
      .single();

    if (error) throw error;
    return data as Device;
  },

  async deleteDevice(id: string) {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
