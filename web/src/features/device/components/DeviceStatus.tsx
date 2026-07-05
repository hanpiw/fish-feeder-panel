'use client';

import React from 'react';
import { Device } from '../services/deviceService';
import { Wifi, Cpu, Clock, RefreshCw } from 'lucide-react';

interface DeviceStatusProps {
  device: Device | null;
}

export default function DeviceStatus({ device }: DeviceStatusProps) {
  if (!device) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[160px] text-center">
        <p className="text-slate-400 text-sm">Pilih perangkat terlebih dahulu</p>
      </div>
    );
  }

  // Helper for relative time formatting
  const formatLastSeen = (timestamp: string | null) => {
    if (!timestamp) return 'Belum pernah terhubung';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWifiQuality = (rssi: number | null) => {
    if (rssi === null) return { label: 'Tidak Ada Sinyal', color: 'text-slate-500', bars: 0 };
    if (rssi >= -50) return { label: 'Sangat Baik', color: 'text-emerald-400', bars: 4 };
    if (rssi >= -65) return { label: 'Baik', color: 'text-teal-400', bars: 3 };
    if (rssi >= -80) return { label: 'Cukup', color: 'text-yellow-500', bars: 2 };
    return { label: 'Buruk', color: 'text-rose-500', bars: 1 };
  };

  const wifi = getWifiQuality(device.wifi_strength);

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-slate-100 mb-5 flex items-center gap-2">
        <Cpu className="h-5 w-5 text-blue-400" />
        Status Perangkat
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Connection Status */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-slate-500 text-xs font-medium">Koneksi</span>
          <div className="mt-2 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${device.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className={`font-semibold text-sm ${device.online ? 'text-emerald-400' : 'text-slate-400'}`}>
              {device.online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* WiFi Signal Strength */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-xs font-medium">WiFi Sinyal</span>
            <Wifi className={`h-4 w-4 ${wifi.color}`} />
          </div>
          <div className="mt-2">
            <span className={`font-semibold text-sm ${wifi.color}`}>
              {device.wifi_strength !== null ? `${device.wifi_strength} dBm` : '-'}
            </span>
            <span className="text-slate-500 text-[10px] block mt-0.5">{wifi.label}</span>
          </div>
        </div>

        {/* Last Heartbeat */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between col-span-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Terakhir Dilihat (Heartbeat)</span>
          </div>
          <p className="mt-2 text-slate-300 font-semibold text-sm">
            {formatLastSeen(device.last_seen)}
          </p>
        </div>

        {/* Firmware Version */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between col-span-2">
          <span className="text-slate-500 text-xs font-medium">Versi Firmware</span>
          <p className="mt-1.5 text-slate-400 text-sm font-mono font-medium">
            {device.firmware_version || 'v1.0.0 (Default)'}
          </p>
        </div>
      </div>
    </div>
  );
}
