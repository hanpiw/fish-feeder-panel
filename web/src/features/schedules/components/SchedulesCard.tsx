'use client';

import React, { useState, useEffect } from 'react';
import { Device } from '@/features/device/services/deviceService';
import { Schedule, scheduleService } from '../services/scheduleService';
import { Clock, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, Calendar, AlertCircle } from 'lucide-react';

interface SchedulesCardProps {
  device: Device | null;
}

export default function SchedulesCard({ device }: SchedulesCardProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [time, setTime] = useState('08:00');
  const [duration, setDuration] = useState(2);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchSchedules = async () => {
    if (!device) return;
    try {
      const data = await scheduleService.getSchedules(device.id);
      setSchedules(data);
    } catch (err) {
      console.error('Gagal mengambil jadwal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!device) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchSchedules();

    // Subscribe to realtime changes
    const unsubscribe = scheduleService.subscribeToSchedules(device.id, () => {
      fetchSchedules();
    });

    return () => {
      unsubscribe();
    };
  }, [device]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;

    setSubmitLoading(true);
    try {
      // Append seconds if not present
      const formattedTime = time.split(':').length === 2 ? `${time}:00` : time;
      await scheduleService.addSchedule(device.id, formattedTime, duration);
      setIsAdding(false);
      setTime('08:00');
      setDuration(2);
    } catch (err) {
      console.error('Gagal menambahkan jadwal:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggle = async (schedule: Schedule) => {
    try {
      await scheduleService.toggleSchedule(schedule.id, !schedule.enabled);
      // Optimistic update
      setSchedules(prev =>
        prev.map(s => (s.id === schedule.id ? { ...s, enabled: !s.enabled } : s))
      );
    } catch (err) {
      console.error('Gagal mengubah status jadwal:', err);
      fetchSchedules(); // revert to database state on failure
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      await scheduleService.deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Gagal menghapus jadwal:', err);
    }
  };

  // Helper to format 24h HH:MM:SS to HH:MM
  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  if (!device) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[200px]">
        <Clock className="h-8 w-8 text-slate-600 mb-2" />
        <p className="text-slate-400 text-sm">Pilih perangkat untuk mengelola jadwal</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            Jadwal Harian
          </h3>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Jadwal
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleAddSchedule} className="mb-5 p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Jam Makan</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Durasi (Detik)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                    <option key={s} value={s}>{s} Detik</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                {submitLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Tambah'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80">
            <Clock className="h-6 w-6 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Belum ada jadwal pemberian pakan</p>
            <p className="text-slate-500 text-xs mt-0.5">Mulai tambahkan jadwal rutin harian Anda.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  schedule.enabled
                    ? 'bg-slate-950/50 border-slate-800'
                    : 'bg-slate-950/20 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${schedule.enabled ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-850 text-slate-500'}`}>
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className={`font-semibold text-base ${schedule.enabled ? 'text-slate-100' : 'text-slate-400'}`}>
                      {formatTime(schedule.feed_time)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      Durasi pakan: {schedule.duration} detik
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggle(schedule)}
                    className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={schedule.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {schedule.enabled ? (
                      <ToggleRight className="h-7 w-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-slate-600" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 text-[10px] text-slate-500 flex items-start gap-1 bg-slate-950/30 p-2.5 rounded-lg border border-slate-850">
        <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>Jadwal disimpan di Cloud Supabase dan disinkronkan ke perangkat ESP32 Anda secara otomatis.</span>
      </div>
    </div>
  );
}
