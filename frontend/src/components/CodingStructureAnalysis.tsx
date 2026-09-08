'use client';

import React from 'react';
import {
  SignalData,
} from '@/lib/mockData';
import { Fingerprint, Binary, Layers, ShieldCheck, Info, HelpCircle } from 'lucide-react';

interface CodingStructureAnalysisProps {
  signalData: SignalData;
}

export default function CodingStructureAnalysis({
  signalData,
}: CodingStructureAnalysisProps) {
  const fingerprint = signalData?.signal_fingerprint;
  const candidateBitstream = signalData?.candidate_bitstream;
  const interleaver = signalData?.interleaver_analysis;
  const fec = signalData?.fec_analysis;

  // Format confidence number (0.61 -> 61%, or undefined -> N/A)
  const formatConfidence = (val?: number | null): string => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    const percent = val <= 1 ? Math.round(val * 100) : Math.round(val);
    return `${percent}%`;
  };

  // Helper for floating numbers
  const formatFloat = (val?: number | null, decimals = 3): string => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    return val.toFixed(decimals);
  };

  // Candidate Bit Preview (first 64 bits only)
  const rawBits = candidateBitstream?.bits || '';
  const bitPreview = rawBits.length > 0 ? rawBits.slice(0, 64) : 'N/A';
  const hasMoreBits = rawBits.length > 64;

  const entropyVal =
    candidateBitstream?.entropy ?? candidateBitstream?.binary_entropy;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Coding Structure Analysis</h3>
            <p className="text-xs text-slate-500">
              Statistical stream features, interleaver heuristics, and FEC classification
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
            DSP Structural Heuristics
          </span>
        </div>
      </div>

      {/* 2-Column Responsive Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: SIGNAL FINGERPRINT */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Signal Fingerprint
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 border border-slate-300/60">
                Capture ID
              </span>
            </div>

            <div className="mt-2 p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="font-mono text-lg sm:text-xl font-bold tracking-widest text-cyan-400 break-all">
                {fingerprint || 'Unavailable'}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Deterministic capture signature</span>
            <span className="text-slate-400 font-mono text-[11px]">
              {fingerprint ? 'SHA/DSP Hash' : 'No Hash'}
            </span>
          </div>
        </div>

        {/* Card 2: BIT REPRESENTATION */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                  <Binary className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bit Representation
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100/80 text-amber-800 border border-amber-200 uppercase tracking-wider">
                ANALYSIS ONLY
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight mb-3">
              Statistical binary representation derived from IQ samples. Not a confirmed demodulated payload.
            </p>

            {/* Bit Stream Preview (64 bits max) */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Preview (First 64 Bits)</span>
                <span>{candidateBitstream?.bit_count ? `${candidateBitstream.bit_count} Total Bits` : 'No bits'}</span>
              </div>
              <div className="font-mono text-xs font-bold tracking-widest text-amber-300 break-all leading-relaxed">
                {bitPreview}
                {hasMoreBits && <span className="text-slate-500 ml-1">...</span>}
              </div>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="pt-3 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Method</span>
              <span className="font-semibold text-slate-800 text-xs truncate block">
                {candidateBitstream?.method || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Transition Rate</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {formatFloat(candidateBitstream?.transition_rate, 4)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Entropy</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {formatFloat(entropyVal, 3)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: INTERLEAVER STRUCTURE ANALYSIS */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Interleaver Structure Analysis
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                ESTIMATED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Detected Type</span>
                <span className="font-bold text-slate-900 text-sm">
                  {interleaver?.candidate || 'Undetermined'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Confidence</span>
                <span className="font-mono font-bold text-purple-700 text-sm">
                  {formatConfidence(interleaver?.confidence)}
                </span>
              </div>
            </div>

            {/* Evidence summary */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/70 text-xs space-y-1">
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Analysis Evidence</span>
              <p className="text-slate-600 text-[11px] leading-snug">
                {interleaver?.evidence && interleaver.evidence.length > 0
                  ? interleaver.evidence.join(' ')
                  : 'Statistical classification only — no confirmed de-interleaving.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 grid grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Est. Depth</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {interleaver?.estimated_depth ?? 'Not determined'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Periodicity</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {formatFloat(interleaver?.periodicity_score, 3)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Entropy</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {formatFloat(interleaver?.entropy, 3)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Transition</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {formatFloat(interleaver?.transition_rate, 3)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: FEC CODE ANALYSIS */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  FEC Code Analysis
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                ESTIMATED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Detected Scheme</span>
                <span className="font-bold text-slate-900 text-sm">
                  {fec?.candidate || 'Undetermined'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Confidence</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {formatConfidence(fec?.confidence)}
                </span>
              </div>
            </div>

            {/* Evidence summary */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/70 text-xs space-y-1">
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Analysis Evidence</span>
              <p className="text-slate-600 text-[11px] leading-snug">
                {fec?.evidence && fec.evidence.length > 0
                  ? fec.evidence.join(' ')
                  : 'Statistical code structure estimation — no decoding success implied.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 grid grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Code Rate</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {fec?.estimated_code_rate ?? 'Not determined'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Periodicity</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {formatFloat(fec?.periodicity_score, 3)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Entropy</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {formatFloat(fec?.entropy, 3)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Transition</span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {formatFloat(fec?.transition_rate, 3)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
