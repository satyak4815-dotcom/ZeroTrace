'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Binary, ShieldAlert, ShieldCheck, Cpu, Activity, ListFilter, AlignLeft, TrendingUp } from 'lucide-react';
import {
  Bitstream,
  BitstreamCorrelation,
  DecodingResult,
  CandidateBitstreamAnalysis,
  PeriodicityAnalysis,
} from '@/lib/mockData';

interface BitstreamTerminalProps {
  bitstream?: Bitstream;
  correlation?: BitstreamCorrelation | null;
  decoding?: DecodingResult | null;
  candidateBitstream?: CandidateBitstreamAnalysis | null;
  periodicityAnalysis?: PeriodicityAnalysis | null;
}

export default function BitstreamTerminal({
  bitstream,
  correlation,
  decoding,
  candidateBitstream,
  periodicityAnalysis,
}: BitstreamTerminalProps) {
  const [displayedHeader, setDisplayedHeader] = useState('');
  const [displayedPayload, setDisplayedPayload] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hexPayload, setHexPayload] = useState('');
  const [asciiPayload, setAsciiPayload] = useState('');
  const [updateKey, setUpdateKey] = useState(0);

  const isCorrelationSuccess = correlation?.status === 'success';
  const isDecoded = decoding?.decoded === true;

  let headerStr = '';
  let payloadStr = '';

  if (isCorrelationSuccess && correlation) {
    if (correlation.header_detected) {
      headerStr = correlation.header_bits ?? bitstream?.header ?? '';
    } else {
      headerStr = '';
    }
    payloadStr = correlation.payload_bits ?? bitstream?.payload ?? '';
  } else {
    headerStr = bitstream?.header ?? '';
    payloadStr = bitstream?.payload ?? '';
  }

  const isBinaryHeader = /^[01]+$/.test(headerStr);
  const isBinaryPayload = /^[01]+$/.test(payloadStr);
  const hasHeaderData = headerStr.trim().length > 0;
  const hasPayloadData = payloadStr.trim().length > 0;
  const hasRecoveredData = isDecoded || isCorrelationSuccess || hasHeaderData || hasPayloadData;

  const headerHex = isBinaryHeader
    ? `0x${parseInt(headerStr, 2).toString(16).toUpperCase()}`
    : (headerStr || 'N/A');

  const parseBinary = (binStr?: string) => {
    if (!binStr || !/^[01]+$/.test(binStr)) {
      return { hex: 'N/A (Analog / Non-Binary)', ascii: binStr || 'N/A' };
    }
    let hex = '';
    let ascii = '';
    for (let i = 0; i < binStr.length; i += 8) {
      const byteStr = binStr.substring(i, i + 8);
      if (byteStr.length === 8) {
        const val = parseInt(byteStr, 2);
        hex += '0x' + val.toString(16).toUpperCase().padStart(2, '0') + ' ';
        ascii += (val >= 32 && val <= 126) ? String.fromCharCode(val) : '.';
      }
    }
    return { hex: hex.trim() || 'N/A', ascii: ascii || 'N/A' };
  };

  const runTypingEffect = () => {
    setIsTyping(true);
    setDisplayedHeader('');
    setDisplayedPayload('');

    const targetHeader = headerStr;
    const targetPayload = payloadStr;

    if (!targetHeader && !targetPayload) {
      setIsTyping(false);
      return;
    }

    let hIdx = 0;
    const headerInterval = setInterval(() => {
      if (hIdx <= targetHeader.length) {
        setDisplayedHeader(targetHeader.substring(0, hIdx));
        hIdx++;
      } else {
        clearInterval(headerInterval);

        let pIdx = 0;
        const payloadInterval = setInterval(() => {
          if (pIdx <= targetPayload.length) {
            setDisplayedPayload(targetPayload.substring(0, pIdx));
            pIdx += 2;
          } else {
            setDisplayedPayload(targetPayload);
            clearInterval(payloadInterval);
            setIsTyping(false);
          }
        }, 30);
      }
    }, 45);
  };

  useEffect(() => {
    setUpdateKey((k) => k + 1);
  }, [headerStr, payloadStr]);

  useEffect(() => {
    runTypingEffect();
    const { hex, ascii } = parseBinary(payloadStr);
    setHexPayload(hex);
    setAsciiPayload(ascii);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateKey]);

  const handleCopy = () => {
    const fullText = `${hasHeaderData ? `[HEADER]: ${headerStr}\n` : ''}[PAYLOAD]: ${payloadStr || 'N/A'}\n[HEX]: ${hexPayload}\n[ASCII]: ${asciiPayload}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Candidate Bitstream analysis values
  const candBits = candidateBitstream?.bits || '';
  const candBits128 = candBits.length > 0 ? candBits.slice(0, 128) : '';
  const hasMoreCandBits = candBits.length > 128;
  const candEntropy = candidateBitstream?.entropy ?? candidateBitstream?.binary_entropy;

  // Periodicity Analysis values
  const hasCandidatePeriodicity = periodicityAnalysis && (periodicityAnalysis.status === 'success' || periodicityAnalysis.peak_lag !== undefined);
  const candidateLags = Array.isArray(periodicityAnalysis?.candidate_lags)
    ? periodicityAnalysis!.candidate_lags
    : [];

  // Peak Score and Correlation Strength calculation
  const peakScore = periodicityAnalysis?.peak_score;
  const signedPeakScore = periodicityAnalysis?.signed_peak_score;
  const peakLag = periodicityAnalysis?.peak_lag;
  const corrStrengthPercent = peakScore !== undefined && peakScore !== null
    ? (Math.abs(peakScore) * 100).toFixed(2) + '%'
    : 'N/A';

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-8">
      
      {/* ====================================================== */}
      {/* ACTUAL RECOVERED BITSTREAM ANALYSIS (WHEN AVAILABLE)   */}
      {/* ====================================================== */}
      {hasRecoveredData && (
        <div className="space-y-4 pb-6 border-b border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
                <Binary className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Actual Recovered Bitstream Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  {decoding?.message || 'Demodulated bitstream extracted from the analyzed signal'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {(hasHeaderData || hasPayloadData) && (
                <>
                  <button
                    type="button"
                    onClick={runTypingEffect}
                    disabled={isTyping}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
                    title="Replay stream typing animation"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTyping ? 'animate-spin text-cyan-600' : ''}`} />
                    <span>Replay Stream</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-colors shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Stream'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Recovered Status Banner */}
          {isDecoded && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 rounded-xl p-3.5 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Recovered Bitstream:</strong> Demodulated payload available ({decoding?.bit_count ?? (headerStr.length + payloadStr.length)} bits)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                DECODED
              </span>
            </div>
          )}

          {/* Recovered Correlation Telemetry */}
          {isCorrelationSuccess && correlation && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
                    Recovered Bitstream Correlation Telemetry
                  </span>
                  {correlation.method && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      {correlation.method}
                    </span>
                  )}
                </div>
                <div>
                  {correlation.header_detected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      HEADER DETECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      HEADER NOT DETECTED
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Ref Preamble
                  </span>
                  <span className="font-mono font-bold text-cyan-300 break-all text-xs">
                    {correlation.reference_pattern ?? 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Best Match
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {correlation.match_percent !== null && correlation.match_percent !== undefined
                      ? `${correlation.match_percent}%`
                      : 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Corr Score
                  </span>
                  <span className="font-mono font-bold text-cyan-400 text-xs">
                    {correlation.correlation_score !== null && correlation.correlation_score !== undefined
                      ? correlation.correlation_score
                      : 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Bit Offset
                  </span>
                  <span className="font-mono font-bold text-amber-300 text-xs">
                    {correlation.best_offset !== null && correlation.best_offset !== undefined
                      ? correlation.best_offset
                      : 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Header Status
                  </span>
                  <span className="font-semibold text-xs text-slate-200">
                    {correlation.header_detected ? 'HEADER DETECTED' : 'HEADER NOT DETECTED'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Payload Start
                  </span>
                  <span className="font-mono font-bold text-indigo-300 text-xs">
                    {correlation.payload_start !== null && correlation.payload_start !== undefined
                      ? `Payload Starts Bit ${correlation.payload_start}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recovered Payload Feed */}
          {(hasHeaderData || hasPayloadData) && (
            <div className="space-y-4">
              {hasHeaderData && (
                <div className="bg-cyan-50/60 border border-cyan-100 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-cyan-900 mb-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      Frame Header Preamble
                    </span>
                    <span className="text-[11px] text-cyan-700 font-mono">
                      {headerStr.length} Bits ({Math.ceil(headerStr.length / 8)} Byte)
                    </span>
                  </div>

                  <div className="font-mono text-base font-bold tracking-widest text-cyan-950 break-all">
                    <span>{displayedHeader || (isTyping ? '' : headerStr)}</span>
                    {isTyping && displayedHeader.length < headerStr.length && (
                      <span className="inline-block w-2 h-4 bg-cyan-600 ml-1 animate-pulse" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1.5">
                    Hex: <strong className="text-slate-800">{headerHex}</strong>
                  </div>
                </div>
              )}

              {hasPayloadData && (
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Demodulated Payload Bitstream
                    </span>
                    <span className="text-[11px] text-emerald-700 font-mono">
                      {payloadStr.length} Bits ({Math.ceil(payloadStr.length / 8)} Bytes)
                    </span>
                  </div>

                  <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-slate-900 break-all leading-relaxed select-all">
                    {isBinaryPayload && displayedPayload.length > 0 ? (
                      displayedPayload.match(/.{1,8}/g)?.map((chunk, idx) => (
                        <span key={idx} className="mr-2 inline-block">
                          <span className="text-emerald-900">{chunk}</span>
                        </span>
                      ))
                    ) : (
                      <span>{displayedPayload || (isTyping ? '' : payloadStr || 'N/A')}</span>
                    )}
                    <span className="inline-block w-2 h-4 bg-emerald-600 ml-1 align-middle animate-blink" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <span className="text-slate-500 font-semibold block mb-1">Hexadecimal Dump</span>
                  <div className="font-mono font-bold text-amber-800 tracking-wider break-all">
                    {hexPayload}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <span className="text-slate-500 font-semibold block mb-1">ASCII Interpretation</span>
                  <div className="font-mono font-bold text-cyan-900 tracking-wider break-all">
                    &quot;{asciiPayload}&quot;
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================== */}
      {/* CANDIDATE BITSTREAM STRUCTURAL ANALYSIS                */}
      {/* ====================================================== */}
      {(candidateBitstream || periodicityAnalysis) && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Bitstream Structural Analysis
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                    STRUCTURAL
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Derived from IQ statistics for structural analysis. This is not a confirmed demodulated payload.
                </p>
              </div>
            </div>
          </div>

          {/* Prominent Bitstream Correlation Card */}
          {hasCandidatePeriodicity && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
                        Structural Bitstream Correlation
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                        AUTOCORRELATION
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Structural autocorrelation of the IQ-derived bit representation.
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded bg-slate-800 text-purple-300 border border-slate-700 font-mono">
                    Method: Bipolar Lag Autocorrelation
                  </span>
                </div>
              </div>

              {/* 4 Telemetry Metric Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Best Lag
                  </span>
                  <span className="font-mono font-extrabold text-purple-300 text-base">
                    {peakLag ?? 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Peak Correlation
                  </span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {peakScore !== undefined && peakScore !== null ? peakScore.toFixed(6) : 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Signed Correlation
                  </span>
                  <span className="font-mono font-bold text-slate-300 text-sm">
                    {signedPeakScore !== undefined && signedPeakScore !== null ? signedPeakScore.toFixed(6) : 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Correlation Strength
                  </span>
                  <span className="font-mono font-extrabold text-emerald-400 text-base">
                    {corrStrengthPercent}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-snug pt-1">
                This correlation measures repeating structure within the IQ-derived bit representation. It does not indicate a confirmed protocol header or decoded payload.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Structural Bitstream Panel */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlignLeft className="w-4 h-4 text-amber-600" />
                  Structural Bit Features
                </span>
                <span className="text-xs font-mono text-slate-600 font-semibold">
                  {candidateBitstream?.bit_count !== undefined ? `${candidateBitstream.bit_count} Bits` : 'N/A'}
                </span>
              </div>

              {/* First 128 Bits Preview */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>Bit Stream Preview (First 128 Bits)</span>
                  <span>{candBits128.length} Bits Rendered</span>
                </div>
                <div className="font-mono text-xs font-bold tracking-widest text-amber-300 break-all leading-relaxed">
                  {candBits128 || 'N/A'}
                  {hasMoreCandBits && <span className="text-slate-500 ml-1">...</span>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Method</span>
                  <span className="font-semibold text-slate-800 text-xs truncate block">
                    {candidateBitstream?.method || 'N/A'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Transition Rate</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {candidateBitstream?.transition_rate !== undefined ? candidateBitstream.transition_rate.toFixed(4) : 'N/A'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Entropy</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {candEntropy !== undefined ? candEntropy.toFixed(3) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Structural Periodicity Panel & Lags Spectrum Table */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ListFilter className="w-4 h-4 text-purple-600" />
                  Lags Spectrum
                </span>
                <span className="text-xs font-mono text-purple-700 font-semibold">
                  Status: {periodicityAnalysis?.status || 'N/A'}
                </span>
              </div>

              {/* Lags Spectrum Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>Top Structural Correlations ({candidateLags.length} Lags)</span>
                </div>
                {candidateLags.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-slate-200/80 rounded-lg bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase font-semibold sticky top-0">
                        <tr>
                          <th className="py-1.5 px-3">Lag</th>
                          <th className="py-1.5 px-3">Score</th>
                          <th className="py-1.5 px-3">Strength (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {candidateLags.map((item, i) => {
                          const strVal = item.strength !== undefined && item.strength !== null
                            ? item.strength
                            : (item.score !== undefined && item.score !== null ? Math.abs(item.score) : 0);
                          const strPct = (strVal * 100).toFixed(2) + '%';
                          return (
                            <tr key={i} className="hover:bg-purple-50/40 transition-colors">
                              <td className="py-1.5 px-3 font-bold text-purple-900">{item.lag ?? 'N/A'}</td>
                              <td className="py-1.5 px-3 text-slate-700">
                                {item.score !== undefined && item.score !== null ? item.score.toFixed(6) : 'N/A'}
                              </td>
                              <td className="py-1.5 px-3 text-emerald-700 font-bold">
                                {strPct}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-slate-200/70 rounded-lg text-xs text-slate-400 text-center font-medium">
                    No structural lags detected.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
        <div>
          Stream Bit Count: <strong className="text-slate-800 font-mono">{candidateBitstream?.bit_count ?? 'N/A'}</strong>
        </div>
        <div>
          Analysis Mode: <strong className="text-slate-800 font-semibold">DSP Statistical Autocorrelation</strong>
        </div>
      </div>
    </div>
  );
}
