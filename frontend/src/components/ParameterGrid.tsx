'use client';

import React from 'react';
import { SignalParameters } from '@/lib/mockData';
import { Gauge, Radio, Cpu, Layers, CheckCircle2, ShieldCheck, Sparkles, Activity } from 'lucide-react';

interface ParameterGridProps {
  parameters?: SignalParameters;
}

export default function ParameterGrid({ parameters }: ParameterGridProps) {
  const samplingFreq = parameters?.sampling_frequency || '2.4 MHz';
  const modulation = parameters?.modulation || 'N/A';
  const fec = parameters?.fec || 'None';
  const interleaving = parameters?.interleaving || 'None';

  // Supported capability matrices specified in the SIGINT requirement
  const modulationOptions = ['FSK', '16-QAM', 'PSK', 'BPSK', 'QPSK'];
  const fecOptions = ['Viterbi', 'RS Block', 'Concatenated', 'LDPC'];
  const interleavingOptions = ['Block', 'Convolution', 'Diagonal', 'Pseudo Random'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Demodulation & Extraction Telemetry
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-bold">STATUS: DECODE_SUCCESS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Card 1: Sampling Frequency */}
        <div className="relative bg-slate-900/90 border-2 border-emerald-500/60 rounded-xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.18)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 group overflow-hidden">
          {/* Subtle corner tech accent */}
          <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
            <div className="bg-emerald-500/20 rotate-45 transform origin-bottom-left w-6 h-6 border-b border-emerald-400/50"></div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 group-hover:scale-105 transition-transform">
                <Gauge className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Sampling Rate
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              NYQUIST PASS
            </span>
          </div>

          <div className="mt-1">
            <div className="text-2xl font-mono font-black text-slate-100 tracking-tight flex items-baseline gap-1.5">
              <span>{samplingFreq}</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Baseband Bandwidth: <span className="text-emerald-400">1.2 MHz (I/Q Complex)</span>
            </p>
          </div>

          {/* Telemetry bottom bar */}
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>ADC RESOLUTION: 16-BIT</span>
            <span className="text-emerald-400 font-bold">SNR: +24.6 dB</span>
          </div>
        </div>

        {/* Card 2: Modulation */}
        <div className="relative bg-slate-900/90 border-2 border-emerald-500/60 rounded-xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.18)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
            <div className="bg-emerald-500/20 rotate-45 transform origin-bottom-left w-6 h-6 border-b border-emerald-400/50"></div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 group-hover:scale-105 transition-transform">
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Modulation Type
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              DEMOD LOCKED
            </span>
          </div>

          <div className="mt-1">
            <div className="text-2xl font-mono font-black text-emerald-300 tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              {modulation}
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Symbol Constellation: <span className="text-emerald-400">16 States (4 bps)</span>
            </p>
          </div>

          {/* Engine Capability Indicators (FSK, QAM, PSK options ready) */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
            <span className="text-[8px] font-mono text-slate-500">READY:</span>
            {['FSK', 'QAM', 'PSK'].map((mod) => (
              <span
                key={mod}
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                  modulation.includes(mod)
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}
              >
                {mod}
              </span>
            ))}
          </div>
        </div>

        {/* Card 3: FEC (Forward Error Correction) */}
        <div className="relative bg-slate-900/90 border-2 border-emerald-500/60 rounded-xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.18)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
            <div className="bg-emerald-500/20 rotate-45 transform origin-bottom-left w-6 h-6 border-b border-emerald-400/50"></div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                FEC Decoder
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              K=7, R=1/2
            </span>
          </div>

          <div className="mt-1">
            <div className="text-2xl font-mono font-black text-slate-100 tracking-tight">
              {fec}
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Convolution Algorithm: <span className="text-emerald-400">Soft-Decision Viterbi</span>
            </p>
          </div>

          {/* Engine Capability Indicators (Viterbi, RS block, Concatenated, LDPC ready) */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1 flex-wrap">
            {fecOptions.map((opt) => (
              <span
                key={opt}
                className={`text-[8px] font-mono px-1 py-0.2 rounded border ${
                  fec.toLowerCase().includes(opt.toLowerCase())
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}
              >
                {opt}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: Interleaving */}
        <div className="relative bg-slate-900/90 border-2 border-emerald-500/60 rounded-xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.18)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
            <div className="bg-emerald-500/20 rotate-45 transform origin-bottom-left w-6 h-6 border-b border-emerald-400/50"></div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                De-Interleaving
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              SYNCHRONIZED
            </span>
          </div>

          <div className="mt-1">
            <div className="text-2xl font-mono font-black text-slate-100 tracking-tight">
              {interleaving}
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Matrix Depth: <span className="text-emerald-400">128 x 64 Permutation</span>
            </p>
          </div>

          {/* Engine Capability Indicators (Block, Convolution, Diagonal, Pseudo Random ready) */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1 flex-wrap">
            {interleavingOptions.map((intlv) => (
              <span
                key={intlv}
                className={`text-[8px] font-mono px-1 py-0.2 rounded border ${
                  interleaving.toLowerCase().includes(intlv.toLowerCase())
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}
              >
                {intlv}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
