'use client';

import React, { useState, useEffect } from 'react';
import { Device } from '@/features/device/services/deviceService';
import { dashboardService, type DashboardStats as IDashboardStats } from '../services/dashboardService';
import { Fish, Clock, Award, Loader2 } from 'lucide-react';

interface DashboardStatsProps {
  device: Device | null;
  refreshTrigger: number;
}

export default function DashboardStats({ device, refreshTrigger }: DashboardStatsProps) {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!device) return;
    try {
      const data = await dashboardService.getStats(device.id);
      setStats(data);
    } catch (err) {
      console.error('Gagal mengambil statistik dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!device) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchStats();

    // Subscribe to feed logs changes to update stats in realtime
    const unsubscribe = dashboardService.subscribeToStats(device.id, () => {
      fetchStats();
    });

    return () => {
      unsubscribe();
    };
  }, [device, refreshTrigger]);

  const formatRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return 'Belum pernah';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin}m yang lalu`;
    if (diffHour < 24) return `${diffHour}j yang lalu`;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!device) return null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex items-center justify-center min-h-[108px]">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
      {/* Today's Feed Count */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex items-center gap-5 group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300 pointer-events-none" />
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
          <Fish className="h-6 w-6" />
        </div>
        <div>
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Pemberian Pakan Hari Ini</span>
          <span className="text-3xl font-extrabold text-slate-100 block mt-1">
            {stats?.todayFeedCount} <span className="text-lg font-medium text-slate-400">Kali</span>
          </span>
        </div>
      </div>

      {/* Last Feed Info */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex items-center gap-5 group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300 pointer-events-none" />
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Pakan Terakhir</span>
          <span className="text-xl font-bold text-slate-200 block mt-1 truncate">
            {formatRelativeTime(stats?.lastFeedTime ?? null)}
          </span>
          {stats?.lastFeedDuration && (
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
              Durasi: {stats.lastFeedDuration} detik
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
