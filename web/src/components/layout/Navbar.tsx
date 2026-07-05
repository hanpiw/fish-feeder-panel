'use client';

import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LogOut, Fish, User, Activity } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Fish className="h-6 w-6 animate-pulse" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              SmartFeeder
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-all duration-200 text-sm active:scale-95 cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
