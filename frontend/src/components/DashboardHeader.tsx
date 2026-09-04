'use client';

import React, { useState, useEffect } from 'react';
import { Radio, ShieldAlert, Wifi, Activity, Terminal, Disc3 } from 'lucide-react';

interface DashboardHeaderProps {
  currentBand?: string;
  samplingFreq?: string;
  isBackendConnected?: boolean;
}

export default function DashboardHeader({
  currentBand = 'UHF',
  samplingFreq = '2.4 MHz',
  isBackendConnected = false,
}: DashboardHeaderProps) {
  const [timestamp, setTimestamp] = useState<string>('');
  const [zuluTime, setZuluTime] = useState<string>('');

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      // Formatted Local Date & Time
      setTimestamp(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
      // Military Zulu format: HHMMZ
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setZuluTime(`${hours}${minutes}:${seconds}Z`);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 lg:px-6 shadow-2xl">
      {/* Top Classification Banner */}
      <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-500 uppercase pb-2 border-b border-slate-900">
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span className={isBackendConnected ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {isBackendConnected ? 'SECURE UPLINK // BACKEND CONNECTED' : 'OFFLINE MODE // MOCK FALLBACK'}
          </span>
          <span className="text-slate-600">|</span>
          <span>CLEARANCE: TOP SECRET // NOFORN</span>
        </div>
        <div className="hidden sm:flex items-center space-x-4">
          <span className="text-slate-400">
            API: <span className={isBackendConnected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isBackendConnected ? 'PORT 5000 (ONLINE)' : 'PORT 5000 (UNREACHABLE)'}
            </span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">SYS: <span className="text-cyan-400">GNU-RADIO v3.10.9</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">DSP CORE: <span className="text-emerald-400">ACTIVE</span></span>
        </div>
      </div>

      {/* Main HUD Row */}
      <div className="mt-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Logo and Name */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl lg:text-2xl font-black tracking-wider text-slate-100 uppercase font-mono">
                ZeroTrace <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">Intel</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                v2.4-MIL
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 tracking-tight flex items-center gap-1.5 mt-0.5">
              <Activity className="w-3 h-3 text-cyan-400 inline" />
              Automated Signal Intelligence & Demodulation Command
            </p>
          </div>
        </div>

        {/* Center: Live Intercept Alert & Timestamps */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Pulsing LIVE INTERCEPT Badge */}
          <div className="flex items-center space-x-2.5 bg-red-950/70 border border-red-500/60 px-3.5 py-1.5 rounded-md shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-mono font-black tracking-widest text-red-400 uppercase">
                LIVE INTERCEPT
              </span>
              <span className="text-[9px] font-mono text-red-300/80 tracking-tighter">
                SAMPLING RATE: {samplingFreq}
              </span>
            </div>
            <ShieldAlert className="w-4 h-4 text-red-400 ml-1 animate-pulse" />
          </div>

          {/* Live Zulu & UTC Clock */}
          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-md font-mono text-right flex flex-col justify-center">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <span className="text-cyan-400">ZULU:</span>
              <span className="tabular-nums tracking-widest text-cyan-300">{zuluTime || '00:00:00Z'}</span>
            </div>
            <div className="text-[10px] text-slate-400 tabular-nums">
              {timestamp || 'SYNCHRONIZING...'}
            </div>
          </div>
        </div>

        {/* Right: Terrestrial Frequency Band Status Tags */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/90 p-1.5 rounded-lg">
          {/* HF Band */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
            <span className="font-bold text-slate-300">HF</span>
            <span className="text-[9px] text-emerald-400/90 font-medium">3-30 MHz</span>
            <span className="text-[9px] px-1 bg-emerald-950/60 text-emerald-300 rounded border border-emerald-600/30">MON</span>
          </div>

          {/* VHF Band */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
            <span className="font-bold text-slate-300">VHF</span>
            <span className="text-[9px] text-amber-400/90 font-medium">30-300 MHz</span>
            <span className="text-[9px] px-1 bg-amber-950/60 text-amber-300 rounded border border-amber-600/30">STANDBY</span>
          </div>

          {/* UHF Band */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-cyan-950/50 border border-cyan-500/50 text-[11px] font-mono shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(6,182,212,1)]"></span>
            <span className="font-bold text-cyan-200">UHF</span>
            <span className="text-[9px] text-cyan-300 font-medium">300-3000 MHz</span>
            <span className="text-[9px] px-1 bg-cyan-900/80 text-cyan-200 rounded border border-cyan-400/40 font-bold animate-pulse">LOCKED</span>
          </div>
        </div>
      </div>
    </header>
  );
}
