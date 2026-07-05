'use client';

import React, { useState, useEffect } from 'react';
import { Device } from '@/features/device/services/deviceService';
import { feedingService, FeedQueueItem } from '../services/feedingService';
import { Play, Loader2, CheckCircle2, AlertTriangle, Snowflake } from 'lucide-react';

interface ManualFeedingCardProps {
  device: Device | null;
  onFeedSuccess: () => void;
}

export default function ManualFeedingCard({ device, onFeedSuccess }: ManualFeedingCardProps) {
  const [duration, setDuration] = useState<number>(2); // default 2 seconds
  const [feedState, setFeedState] = useState<'idle' | 'pending' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);

  const presets = [
    { label: 'Porsi Kecil', value: 1, desc: '1 detik sweep' },
    { label: 'Porsi Sedang', value: 2, desc: '2 detik sweep' },
    { label: 'Porsi Besar', value: 3, desc: '3 detik sweep' }
  ];

  useEffect(() => {
    if (!activeQueueId) return;

    // Subscribe to queue updates
    const unsubscribe = feedingService.subscribeToFeedItem(activeQueueId, (updatedItem) => {
      if (updatedItem.status === 'processing') {
        setFeedState('processing');
      } else if (updatedItem.status === 'done') {
        setFeedState('success');
        onFeedSuccess();
        setTimeout(() => {
          setFeedState('idle');
          setActiveQueueId(null);
        }, 3000);
      }
    });

    // Timeout fallback (if device doesn't respond in 15 seconds)
    const timer = setTimeout(() => {
      if (feedState === 'pending' || feedState === 'processing') {
        setFeedState('error');
        setErrorMessage('Timeout: Perangkat tidak merespon perintah.');
        setTimeout(() => {
          setFeedState('idle');
          setActiveQueueId(null);
        }, 4000);
      }
    }, 15000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [activeQueueId, onFeedSuccess, feedState]);

  const handleFeed = async () => {
    if (!device) return;
    setFeedState('pending');
    setErrorMessage(null);

    try {
      const queueItem = await feedingService.triggerManualFeed(device.id, duration);
      setActiveQueueId(queueItem.id);
    } catch (err: any) {
      console.error(err);
      setFeedState('error');
      setErrorMessage(err.message || 'Gagal mengirim perintah pakan.');
      setTimeout(() => setFeedState('idle'), 3000);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-2 flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-blue-400 rotate-45" />
          Beri Pakan Manual
        </h3>
        <p className="text-slate-400 text-xs mb-6">
          Kirim instruksi langsung ke servo SG90 untuk memutar katup pakan.
        </p>

        {/* Preset Selector */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {presets.map((preset) => (
            <button
              key={preset.value}
              disabled={feedState !== 'idle' || !device}
              onClick={() => setDuration(preset.value)}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                duration === preset.value
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-semibold'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700/80'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="block text-xs font-semibold">{preset.label}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{preset.desc}</span>
            </button>
          ))}
        </div>

        {/* Custom Duration Input */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-2.5">
            <span>Durasi Servo (Detik)</span>
            <span className="text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              {duration} Detik
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            disabled={feedState !== 'idle' || !device}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-medium">
            <span>1s (Porsi Kecil)</span>
            <span>10s (Porsi Sangat Besar)</span>
          </div>
        </div>

        {/* Device Status Warnings */}
        {!device && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Pilih perangkat untuk mulai memberikan pakan.</span>
          </div>
        )}

        {device && !device.online && feedState === 'idle' && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Perangkat offline. Perintah Anda akan disimpan dalam antrean (pending) sampai perangkat terhubung kembali.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div>
        {feedState === 'idle' && (
          <button
            onClick={handleFeed}
            disabled={!device}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-blue-500/20 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            Beri Pakan Sekarang
          </button>
        )}

        {feedState === 'pending' && (
          <div className="w-full py-3.5 bg-slate-950/60 border border-slate-800 text-slate-300 rounded-xl font-medium flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            Menunggu Perangkat (Polling)...
          </div>
        )}

        {feedState === 'processing' && (
          <div className="w-full py-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl font-semibold flex items-center justify-center gap-2 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            Servo Sedang Bergerak...
          </div>
        )}

        {feedState === 'success' && (
          <div className="w-full py-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Pemberian Pakan Berhasil!
          </div>
        )}

        {feedState === 'error' && !errorMessage && (
          <div className="w-full py-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-semibold flex items-center justify-center gap-2">
            Gagal Mengirim Perintah
          </div>
        )}
      </div>
    </div>
  );
}
