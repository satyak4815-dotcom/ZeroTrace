'use client';

import React from 'react';
import { SignalData } from '@/lib/mockData';
import { Cpu, ArrowRight, ShieldCheck, Layers, Fingerprint, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface CodingErrorCorrectionPipelineProps {
  signalData: SignalData;
}

export default function CodingErrorCorrectionPipeline({
  signalData,
}: CodingErrorCorrectionPipelineProps) {
  const fingerprint = signalData?.signal_fingerprint;
  const simInput = signalData?.simulation_input;
  const deintSim = signalData?.deinterleaving_simulation;
  const fecSim = signalData?.fec_simulation;

  const hasDeintSim = Boolean(deintSim && (deintSim.status || deintSim.profile));
  const hasFecSim = Boolean(fecSim && (fecSim.status || fecSim.profile));
  const hasSimInput = Boolean(simInput && (simInput.bits || simInput.source));

  // Format binary string into groups of 8
  const formatBinaryChunks = (binStr?: string) => {
    if (!binStr) return 'N/A';
    return binStr.match(/.{1,8}/g)?.join(' ') || binStr;
  };

  // Render FEC output string with highlighted corrected positions
  const renderHighlightedOutput = (outputStr?: string, correctedIndices?: number[]) => {
    if (!outputStr) return <span>N/A</span>;
    const indicesSet = new Set(correctedIndices || []);
    if (indicesSet.size === 0) {
      return <span>{formatBinaryChunks(outputStr)}</span>;
    }

    const chars = outputStr.split('');
    return (
      <span className="leading-relaxed break-all">
        {chars.map((char, idx) => {
          const isCorrected = indicesSet.has(idx);
          const isChunkBoundary = idx > 0 && idx % 8 === 0;

          return (
            <React.Fragment key={idx}>
              {isChunkBoundary && ' '}
              {isCorrected ? (
                <span
                  className="bg-amber-300 text-slate-950 font-black px-1 py-0.5 rounded shadow-xs mx-0.5 border border-amber-400 animate-pulse"
                  title={`Correction at bit index ${idx}`}
                >
                  {char}
                </span>
              ) : (
                <span>{char}</span>
              )}
            </React.Fragment>
          );
        })}
      </span>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Coding &amp; Error-Correction Pipeline
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200 uppercase tracking-wider">
                ACTIVE PIPELINE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fingerprint-driven structural de-interleaving and FEC processing pipeline
            </p>
          </div>
        </div>

        {fingerprint && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-xs font-mono">
            <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-400">Fingerprint:</span>
            <strong className="text-cyan-300">{fingerprint}</strong>
          </div>
        )}
      </div>

      {/* Pipeline Input Card */}
      {hasSimInput ? (
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-600" />
              Pipeline Input
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
              Source: {simInput?.source === 'recovered_bitstream' ? 'Recovered Bitstream' : 'Signal-Derived Stream Bits'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Bit Count: <strong className="font-mono text-slate-900">{simInput?.bit_count ?? 'N/A'}</strong></span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs font-bold text-cyan-300 break-all leading-relaxed">
            {formatBinaryChunks(simInput?.bits)}
          </div>
        </div>
      ) : null}

      {/* 2-Column Main Pipeline Grid (De-interleaving & FEC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* DE-INTERLEAVING CARD */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">De-interleaving</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                ACTIVE PROCESSING
              </span>
            </div>

            {hasDeintSim ? (
              <div className="space-y-4 mt-4">
                {/* De-interleaving Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Profile</span>
                    <span className="font-bold text-slate-800 text-xs truncate block">
                      {deintSim?.profile || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Matrix</span>
                    <span className="font-mono font-bold text-purple-700 text-xs">
                      {deintSim?.matrix_rows && deintSim?.matrix_columns
                        ? `${deintSim.matrix_rows} × ${deintSim.matrix_columns}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Reordered</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {deintSim?.reordered_positions ?? 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Permutation</span>
                    <span className="font-bold text-xs text-emerald-700 flex items-center gap-1">
                      {deintSim?.permutation_valid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : null}
                      {deintSim?.permutation_valid ? 'PASS' : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Bit Flow Preview */}
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-slate-700 flex items-center justify-between text-[11px]">
                    <span>INTERLEAVED INPUT</span>
                    <span className="font-mono text-slate-400">{deintSim?.input_bit_count ?? 512} Bits</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-purple-300 break-all leading-relaxed">
                    {formatBinaryChunks(deintSim?.input_preview)}
                  </div>

                  <div className="flex items-center justify-center py-1 text-slate-400 text-xs gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-purple-600 rotate-90" />
                    <span className="font-semibold text-purple-800 text-[11px] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {deintSim?.profile || 'Block'} De-interleaver Processing
                    </span>
                  </div>

                  <div className="font-semibold text-slate-700 flex items-center justify-between text-[11px]">
                    <span>DE-INTERLEAVED OUTPUT</span>
                    <span className="font-mono text-slate-400">{deintSim?.output_bit_count ?? 512} Bits</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 break-all leading-relaxed">
                    {formatBinaryChunks(deintSim?.output_preview)}
                  </div>
                </div>

                {/* Position Mapping Table */}
                {Array.isArray(deintSim?.permutation_preview) && deintSim!.permutation_preview.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">Position Mapping Sample</span>
                    <div className="max-h-36 overflow-y-auto border border-slate-200/80 rounded-lg bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase font-semibold sticky top-0">
                          <tr>
                            <th className="py-1.5 px-3">Input Position</th>
                            <th className="py-1.5 px-3">Output Position</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {deintSim!.permutation_preview.map((item, i) => (
                            <tr key={i} className="hover:bg-purple-50/40 transition-colors">
                              <td className="py-1 px-3 text-slate-700">{item.input}</td>
                              <td className="py-1 px-3 font-bold text-purple-900">{item.output}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-6 h-6 text-slate-300" />
                <span>Pipeline data unavailable for this analysis.</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Status: <strong className="text-slate-800">{deintSim?.status ? 'Processing Complete' : 'Unavailable'}</strong></span>
          </div>
        </div>

        {/* FEC CORRECTION CARD */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">FEC Correction</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                ACTIVE PROCESSING
              </span>
            </div>

            {hasFecSim ? (
              <div className="space-y-4 mt-4">
                {/* FEC Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Profile</span>
                    <span className="font-bold text-slate-800 text-xs truncate block">
                      {fecSim?.profile || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Decoder</span>
                    <span className="font-bold text-indigo-700 text-xs truncate block">
                      {fecSim?.decoder_profile || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Code Rate</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {fecSim?.code_rate || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Constraint (K)</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {fecSim?.constraint_length ?? 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Extracted Errors</span>
                    <span className="font-mono font-bold text-amber-700 text-xs">
                      {fecSim?.simulated_error_count ?? 0}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Corrected</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      {fecSim?.simulated_corrected_count ?? 0}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Initial BER</span>
                    <span className="font-mono font-bold text-amber-700 text-xs">
                      {fecSim?.simulated_ber_before !== undefined
                        ? `${(fecSim.simulated_ber_before * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Corrected BER</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      {fecSim?.simulated_ber_after !== undefined
                        ? `${(fecSim.simulated_ber_after * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Before / After Bit Visualization */}
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-slate-700 flex items-center justify-between text-[11px]">
                    <span>BEFORE CORRECTION</span>
                    <span className="font-mono text-slate-400">{fecSim?.input_bit_count ?? 512} Bits</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-amber-300 break-all leading-relaxed">
                    {formatBinaryChunks(fecSim?.input_preview)}
                  </div>

                  <div className="flex items-center justify-center py-1 text-slate-400 text-xs gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600 rotate-90" />
                    <span className="font-semibold text-indigo-800 text-[11px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {fecSim?.decoder_profile || 'Viterbi'}-profile Processing
                    </span>
                  </div>

                  <div className="font-semibold text-slate-700 flex items-center justify-between text-[11px]">
                    <span>AFTER CORRECTION</span>
                    <span className="font-mono text-slate-400">{fecSim?.output_bit_count ?? 512} Bits</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 break-all leading-relaxed">
                    {renderHighlightedOutput(fecSim?.output_preview, fecSim?.corrected_positions)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-6 h-6 text-slate-300" />
                <span>Pipeline data unavailable for this analysis.</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Status: <strong className="text-slate-800">{fecSim?.status ? 'Processing Complete' : 'Unavailable'}</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
