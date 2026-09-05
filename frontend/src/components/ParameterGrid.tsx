'use client';

import React from 'react';
import { SignalParameters } from '@/lib/mockData';
import { Gauge, Radio, Layers, ShieldCheck, Target, TrendingUp, Info } from 'lucide-react';

interface ParameterGridProps {
  parameters?: SignalParameters;
}

/**
 * Intelligently format Hz to GHz, MHz, kHz, or Hz without trailing zeros:
 * - 2685000000 Hz -> 2.685 GHz
 * - 915000000 Hz -> 915 MHz
 * - 1000000 Hz -> 1 MHz
 */
function formatFrequency(val?: string | number): string {
  if (val === undefined || val === null || val === '') return 'Unknown';
  const s = String(val).trim();
  if (s.toLowerCase() === 'unknown' || s.toLowerCase() === 'none' || s.toLowerCase() === 'n/a') return 'Unknown';
  if (s.includes('GHz') || s.includes('MHz') || s.includes('kHz') || s.includes('Hz')) return s;

  const num = parseFloat(s.replace(/,/g, ''));
  if (isNaN(num) || num <= 0) return 'Unknown';

  if (num >= 1e9) {
    const ghz = num / 1e9;
    return `${parseFloat(ghz.toFixed(4))} GHz`;
  }
  if (num >= 1e6) {
    const mhz = num / 1e6;
    return `${parseFloat(mhz.toFixed(4))} MHz`;
  }
  if (num >= 1e3) {
    const khz = num / 1e3;
    return `${parseFloat(khz.toFixed(4))} kHz`;
  }
  return `${num} Hz`;
}

/**
 * Parse a frequency value (raw Hz number OR string with units) into a raw Hz number.
 */
function parseFrequencyToHz(val?: string | number): number | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  const lower = s.toLowerCase();
  if (!s || lower === 'unknown' || lower === 'n/a' || lower === 'none') return null;

  const upper = s.toUpperCase();
  const numStr = s.replace(/[^\d.]/g, '');
  const num = parseFloat(numStr);
  if (isNaN(num) || num <= 0) return null;

  if (upper.includes('GHZ')) return num * 1e9;
  if (upper.includes('MHZ')) return num * 1e6;
  if (upper.includes('KHZ')) return num * 1e3;
  if (upper.includes('HZ'))  return num;

  return num;
}

export default function ParameterGrid({ parameters }: ParameterGridProps) {
  const samplingFreq = parameters?.sampling_frequency || '2.4 MHz';
  const modulation = parameters?.modulation || 'N/A';
  const fec = parameters?.fec || 'None';
  const interleaving = parameters?.interleaving || 'None';

  const rawCenterFreq = parameters?.center_frequency;
  const formattedCenterFreq = formatFrequency(rawCenterFreq);
  const hasCenterFreq = formattedCenterFreq !== 'Unknown';
  const centerFreqSource = parameters?.center_frequency_source;

  const hasActiveFec = fec.toLowerCase() !== 'none' && fec.toLowerCase() !== 'unknown' && fec.trim() !== '';
  const hasActiveInterleaving = interleaving.toLowerCase() !== 'none' && interleaving.toLowerCase() !== 'unknown' && interleaving.trim() !== '';

  const fecConfidence = parameters?.fec_confidence;
  const interleavingConfidence = parameters?.interleaving_confidence;

  const isModulationClassified =
    modulation !== 'N/A' &&
    modulation !== 'Unknown' &&
    modulation !== 'unknown' &&
    modulation.trim() !== '';

  // Captured Frequency Range (Fc ± Fs/2)
  const isAudioWav = modulation.toLowerCase().includes('audio');
  const cfHz = parseFrequencyToHz(rawCenterFreq);
  const srHz = parseFrequencyToHz(parameters?.sampling_frequency);
  const canComputeRange = !isAudioWav && cfHz !== null && srHz !== null;
  const lowHz  = canComputeRange ? cfHz! - srHz! / 2 : null;
  const highHz = canComputeRange ? cfHz! + srHz! / 2 : null;

  return (
    <div className="space-y-4">
      {/* 5 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Card 1: Sampling Frequency */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                <Gauge className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Sampling Rate
              </span>
            </div>

            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {samplingFreq}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Complex IQ stream
          </div>
        </div>

        {/* Card 2: Center Frequency */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
                  <Target className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Center Frequency
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  hasCenterFreq
                    ? centerFreqSource === 'sigmf'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {hasCenterFreq
                  ? centerFreqSource === 'sigmf'
                    ? 'SigMF Meta'
                    : 'User Specified'
                  : 'Unavailable'}
              </span>
            </div>

            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formattedCenterFreq}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium leading-snug">
            {hasCenterFreq ? (
              centerFreqSource === 'sigmf'
                ? 'Source: SigMF Capture Metadata'
                : 'Source: User-provided Metadata'
            ) : (
              'Requires SigMF metadata or user entry'
            )}
          </div>
        </div>

        {/* Card 3: Modulation Type */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <Radio className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Modulation Type
                </span>
              </div>
              {isModulationClassified && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Classified
                </span>
              )}
            </div>

            <div className="text-2xl font-extrabold text-blue-600 tracking-tight">
              {modulation}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            {isModulationClassified ? 'Modulation Scheme Identified' : 'Awaiting Ingestion'}
          </div>
        </div>

        {/* Card 4: FEC Decoder */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  FEC Decoder
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {hasActiveFec ? 'Experimental Candidate' : 'No FEC'}
              </span>
            </div>

            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {fec}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>{hasActiveFec ? 'Experimental FEC' : 'Bypass / None'}</span>
            {hasActiveFec && fecConfidence && (
              <span className="text-amber-700 font-semibold">Conf: {fecConfidence}</span>
            )}
          </div>
        </div>

        {/* Card 5: De-Interleaving */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  De-Interleaving
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {hasActiveInterleaving ? 'Experimental Candidate' : 'Direct'}
              </span>
            </div>

            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {interleaving}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>{hasActiveInterleaving ? 'Experimental Interleaving' : 'Direct Stream'}</span>
            {hasActiveInterleaving && interleavingConfidence && (
              <span className="text-purple-700 font-semibold">Conf: {interleavingConfidence}</span>
            )}
          </div>
        </div>

      </div>

      {/* Captured Frequency Range Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Captured Frequency Range</h3>
              <p className="text-xs text-slate-500">Nominal IQ capture span derived from center frequency and sample rate</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
            Fc ± Fs/2
          </span>
        </div>

        {/* Range content area */}
        {isAudioWav ? (
          <div className="py-4 text-center text-xs text-slate-500 font-medium">
            RF center frequency is not applicable for standard audio WAV input.
          </div>
        ) : canComputeRange ? (
          <div className="py-2">
            {/* Numbers row */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
              <span className="text-purple-700 font-extrabold">{formatFrequency(lowHz!)}</span>
              <span className="text-slate-500 font-semibold">
                Span: <strong className="text-slate-800">{formatFrequency(srHz!)}</strong> (Center: {formatFrequency(cfHz!)})
              </span>
              <span className="text-purple-700 font-extrabold">{formatFrequency(highHz!)}</span>
            </div>

            {/* Horizontal Range Line */}
            <div className="relative h-6 flex items-center px-1">
              <div className="w-full h-2 bg-gradient-to-r from-purple-300 via-purple-600 to-purple-300 rounded-full" />
              <div className="absolute left-0 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-xs" />
              <div className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-purple-700 border-2 border-white shadow-md flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="absolute right-0 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-xs" />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
              <span>Low Edge</span>
              <span>Nominal Capture Span</span>
              <span>High Edge</span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-500 font-medium">
            Center frequency unavailable. Attach SigMF metadata or enter center frequency manually.
          </div>
        )}
      </div>
    </div>
  );
}



