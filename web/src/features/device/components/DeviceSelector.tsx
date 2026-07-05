'use client';

import React, { useState } from 'react';
import { Device, deviceService } from '../services/deviceService';
import { Plus, Check, Copy, Trash2, Cpu, Loader2 } from 'lucide-react';

interface DeviceSelectorProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelect: (device: Device) => void;
  onRefresh: () => Promise<void>;
}

export default function DeviceSelector({
  devices,
  selectedDevice,
  onSelect,
  onRefresh
}: DeviceSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    setLoading(true);
    try {
      const newDevice = await deviceService.createDevice(newDeviceName);
      setNewDeviceName('');
      setIsAdding(false);
      await onRefresh();
      onSelect(newDevice);
    } catch (err) {
      console.error('Gagal menambahkan perangkat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus perangkat ini? Semua antrean, jadwal, dan log terkait akan ikut terhapus.')) return;

    try {
      await deviceService.deleteDevice(id);
      await onRefresh();
    } catch (err) {
      console.error('Gagal menghapus perangkat:', err);
    }
  };

  const copyToClipboard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-400" />
          Perangkat Anda
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddDevice} className="mb-6 space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-2">Nama Perangkat</label>
            <input
              type="text"
              required
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
              placeholder="Contoh: Aquarium Kamar"
            />
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
              disabled={loading}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-all flex items-center gap-1 font-semibold cursor-pointer"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {devices.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Belum ada perangkat terdaftar</p>
          <p className="text-slate-500 text-xs px-4">Silakan tambah perangkat baru untuk mendapatkan Device ID untuk firmware ESP32.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {devices.map((device) => {
            const isSelected = selectedDevice?.id === device.id;
            return (
              <div
                key={device.id}
                onClick={() => onSelect(device)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-md shadow-blue-500/5'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700/80 hover:bg-slate-950/70'
                }`}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm truncate ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
                      {device.device_name}
                    </p>
                    <span className={`w-1.5 h-1.5 rounded-full ${device.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                    <span className="font-mono truncate select-all">{device.id}</span>
                    <button
                      onClick={(e) => copyToClipboard(device.id, e)}
                      className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors cursor-pointer"
                      title="Salin ID Perangkat"
                    >
                      {copiedId === device.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteDevice(device.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Hapus Perangkat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
