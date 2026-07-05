'use client';

import React, { useState, useEffect } from 'react';
import { Device } from '@/features/device/services/deviceService';
import { FeedLog, historyService } from '../services/historyService';
import { Loader2, History, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface HistoryTableProps {
  device: Device | null;
  refreshTrigger: number; // to allow parents to trigger refreshes
}

export default function HistoryTable({ device, refreshTrigger }: HistoryTableProps) {
  const [logs, setLogs] = useState<FeedLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!device) return;
    try {
      const data = await historyService.getFeedLogs(device.id);
      setLogs(data);
    } catch (err) {
      console.error('Gagal mengambil riwayat pakan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!device) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchLogs();

    // Subscribe to realtime logs
    const unsubscribe = historyService.subscribeToFeedLogs(device.id, () => {
      fetchLogs();
    });

    return () => {
      unsubscribe();
    };
  }, [device, refreshTrigger]);

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSourceBadge = (source: string) => {
    if (source === 'web_manual') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
          Manual Web
        </span>
      );
    }
    if (source === 'web_schedule' || source === 'schedule') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          Jadwal Otomatis
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 border border-slate-500/20 text-slate-400">
        {source}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status.toLowerCase() === 'success' || status.toLowerCase() === 'done' || status.toLowerCase() === 'berhasil') {
      return (
        <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
          <Check className="h-4 w-4 stroke-[3]" />
          Sukses
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-rose-400 text-xs font-semibold">
        <AlertCircle className="h-4 w-4" />
        Gagal
      </span>
    );
  };

  if (!device) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-xl text-center py-12">
        <History className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">Pilih perangkat untuk melihat riwayat</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <History className="h-5 w-5 text-blue-400" />
          Riwayat Pemberian Pakan
        </h3>
        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          title="Segarkan Riwayat"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80">
          <p className="text-slate-400 text-sm mb-1">Belum ada riwayat pakan tercatat</p>
          <p className="text-slate-500 text-xs px-4">Pemberian pakan manual atau terjadwal akan muncul di sini.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium text-xs uppercase tracking-wider">
                <th className="pb-3.5 font-semibold">Waktu Eksekusi</th>
                <th className="pb-3.5 font-semibold">Sumber</th>
                <th className="pb-3.5 font-semibold">Durasi</th>
                <th className="pb-3.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-950/20 transition-colors">
                  <td className="py-3.5 text-slate-300 font-medium">{formatDateTime(log.executed_at)}</td>
                  <td className="py-3.5">{getSourceBadge(log.source)}</td>
                  <td className="py-3.5 text-slate-300">{log.duration} detik</td>
                  <td className="py-3.5 text-right">{getStatusBadge(log.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
