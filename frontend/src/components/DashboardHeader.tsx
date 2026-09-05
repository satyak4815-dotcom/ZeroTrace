'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Activity, Wifi, WifiOff } from 'lucide-react';

interface DashboardHeaderProps {
  currentBand?: string;
  samplingFreq?: string;
  isBackendConnected?: boolean;
}

export default function DashboardHeader({
  isBackendConnected = false,
}: DashboardHeaderProps) {
  const [timestamp, setTimestamp] = useState<string>('');
  const [zuluTime, setZuluTime] = useState<string>('');

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setTimestamp(
        now.toISOString().replace('T', ' ').substring(0, 10)
      );
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setZuluTime(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 shadow-xs">
      <div className="max-w-[1530px] mx-auto flex items-center justify-between gap-4">

        {/* Left: Logo + Title + Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200/60 text-cyan-600 shadow-xs flex-shrink-0">
            <Radio className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              ZeroTrace <span className="text-cyan-600 font-extrabold">Intel</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              Automated Signal Intelligence &amp; Demodulation Command
            </p>
          </div>
        </div>

        {/* Right: Backend status + UTC clock */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Backend Status Indicator */}
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            isBackendConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {isBackendConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5" />
                <span>Backend Connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <WifiOff className="w-3.5 h-3.5" />
                <span>Standalone Mode</span>
              </>
            )}
          </div>

          {/* Clean UTC Clock */}
          <div className="hidden sm:flex flex-col items-end px-3 py-1 text-right border-l border-slate-200/80 pl-4">
            <span className="text-xs font-semibold text-slate-800 tabular-nums">
              {zuluTime || '00:00:00 UTC'}
            </span>
            <span className="text-[10px] text-slate-400 tabular-nums font-medium">
              {timestamp}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}

