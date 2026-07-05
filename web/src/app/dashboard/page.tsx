'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Device, deviceService, DeviceSelector, DeviceStatus } from '@/features/device';
import { ManualFeedingCard } from '@/features/feeding';
import { SchedulesCard } from '@/features/schedules';
import { HistoryTable } from '@/features/history';
import { DashboardStats } from '@/features/dashboard';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchDevices = async () => {
    try {
      const data = await deviceService.getDevices();
      setDevices(data);

      // Auto select first device or keep existing selection updated
      if (data.length > 0) {
        if (selectedDevice) {
          const updated = data.find(d => d.id === selectedDevice.id);
          if (updated) {
            setSelectedDevice(updated);
          } else {
            setSelectedDevice(data[0]);
          }
        } else {
          setSelectedDevice(data[0]);
        }
      } else {
        setSelectedDevice(null);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar perangkat:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchDevices();

    // Listen to changes in devices table (realtime online/offline, RSSI changes)
    const channel = supabase
      .channel('devices_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleFeedSuccess = () => {
    // Increment trigger to refresh stats and logs
    setRefreshTrigger(prev => prev + 1);
  };

  if (authLoading || (user && loadingDevices)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm">Memuat dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user) return null; // AuthProvider redirects to /login

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] pb-12">
      <Navbar />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Control Panel
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Pantau status pakan dan jadwalkan pemberian makan ikan secara realtime.
            </p>
          </div>
          <button
            onClick={() => {
              setLoadingDevices(true);
              fetchDevices();
              setRefreshTrigger(prev => prev + 1);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats device={selectedDevice} refreshTrigger={refreshTrigger} />

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 flex-1">
          {/* Left Column - Device Management */}
          <div className="space-y-6 lg:col-span-1">
            <DeviceSelector
              devices={devices}
              selectedDevice={selectedDevice}
              onSelect={setSelectedDevice}
              onRefresh={fetchDevices}
            />

            <DeviceStatus device={selectedDevice} />
          </div>

          {/* Right Column - Actuators & Schedules */}
          <div className="space-y-6 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ManualFeedingCard device={selectedDevice} onFeedSuccess={handleFeedSuccess} />
              <SchedulesCard device={selectedDevice} />
            </div>

            {/* Bottom Section - Logs (Full Width under right column) */}
            <HistoryTable device={selectedDevice} refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
}
