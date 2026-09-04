'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileCheck, AlertCircle, RefreshCw, Radio, HardDrive, Clock, CheckCircle2 } from 'lucide-react';
import { FileInfo, SignalData, signalPresets } from '@/lib/mockData';
import { SignalMetadata } from '@/services/signalApi';

interface SignalUploadProps {
  currentFileInfo?: FileInfo;
  onFileUpload: (file: File, metadata?: SignalMetadata) => Promise<void>;
  onPresetSelect?: (preset: SignalData) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export default function SignalUpload({
  currentFileInfo,
  onFileUpload,
  onPresetSelect,
  isUploading,
  uploadProgress,
}: SignalUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metaErrorMessage, setMetaErrorMessage] = useState<string | null>(null);
  const [sampleRate, setSampleRate] = useState<string>('');
  const [centerFrequency, setCenterFrequency] = useState<string>('');
  const [sigmfInfo, setSigmfInfo] = useState<{
    datatype?: string;
    sample_rate?: number;
    center_frequency?: number;
  } | null>(null);

  const sampleRateRef = useRef<string>('');
  const centerFrequencyRef = useRef<string>('');
  const sampleRateInputRef = useRef<HTMLInputElement>(null);
  const centerFrequencyInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const metaFileInputRef = useRef<HTMLInputElement>(null);

  const handleSampleRateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    sampleRateRef.current = val;
    setSampleRate(val);
  };

  const handleCenterFrequencyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    centerFrequencyRef.current = val;
    setCenterFrequency(val);
  };

  const handleMetaFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setMetaErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        setMetaErrorMessage('Invalid or incomplete SigMF metadata.');
        return;
      }

      if (!json || typeof json !== 'object') {
        setMetaErrorMessage('Invalid or incomplete SigMF metadata.');
        return;
      }

      const global = json.global || {};
      const captures = Array.isArray(json.captures) ? json.captures : [];

      const rawSampleRate = global['core:sample_rate'];
      const rawDatatype = global['core:datatype'];
      const rawCenterFreq = captures[0]?.['core:frequency'];

      const parsedSr = Number(rawSampleRate);
      const parsedCf = Number(rawCenterFreq);

      const hasValidSr = !isNaN(parsedSr) && isFinite(parsedSr) && parsedSr > 0;
      const hasValidCf = !isNaN(parsedCf) && isFinite(parsedCf) && parsedCf > 0;

      if (!hasValidSr && !hasValidCf) {
        setMetaErrorMessage('Invalid or incomplete SigMF metadata.');
        return;
      }

      const info: { datatype?: string; sample_rate?: number; center_frequency?: number } = {};

      if (rawDatatype && typeof rawDatatype === 'string') {
        info.datatype = rawDatatype;
      }

      if (hasValidSr) {
        info.sample_rate = parsedSr;
        const srStr = String(parsedSr);
        sampleRateRef.current = srStr;
        setSampleRate(srStr);
      }

      if (hasValidCf) {
        info.center_frequency = parsedCf;
        const cfStr = String(parsedCf);
        centerFrequencyRef.current = cfStr;
        setCenterFrequency(cfStr);
      }

      setSigmfInfo(info);
    } catch (err) {
      console.error('[SigMF Parser Error]', err);
      setMetaErrorMessage('Invalid or incomplete SigMF metadata.');
    }
  };

  const validateAndUpload = (file: File) => {
    console.log('[ZT Upload] File selected:', file.name, file.type, file.size);
    setErrorMessage(null);
    const fileName = file.name.toLowerCase();
    const isValid =
      fileName.endsWith('.iq') ||
      fileName.endsWith('.wav') ||
      fileName.endsWith('.bin') ||
      fileName.endsWith('.raw') ||
      fileName.endsWith('.dat') ||
      fileName.endsWith('.sigmf-data');

    console.log('[ZT Upload] Validation result:', isValid, 'for', fileName);

    if (!isValid) {
      setErrorMessage('INVALID FORMAT: Please select an .IQ, .WAV, .BIN, .RAW, .DAT, or .SIGMF-DATA signal capture file.');
      return;
    }

    // Resolve sample rate from ref, state, or DOM input element
    const rawSampleRate =
      sampleRateRef.current ||
      sampleRate ||
      sampleRateInputRef.current?.value ||
      (typeof document !== 'undefined'
        ? (document.getElementById('sample-rate-input') as HTMLInputElement)?.value
        : '') ||
      '';

    // Resolve center frequency from ref, state, or DOM input element
    const rawCenterFreq =
      centerFrequencyRef.current ||
      centerFrequency ||
      centerFrequencyInputRef.current?.value ||
      (typeof document !== 'undefined'
        ? (document.getElementById('center-freq-input') as HTMLInputElement)?.value
        : '') ||
      '';

    const metadata: SignalMetadata = {};

    if (rawSampleRate && String(rawSampleRate).trim() !== '') {
      const parsedSampleRate = parseFloat(String(rawSampleRate).replace(/,/g, '').trim());
      if (!isNaN(parsedSampleRate) && parsedSampleRate > 0) {
        metadata.sample_rate = parsedSampleRate;
      }
    }

    if (rawCenterFreq && String(rawCenterFreq).trim() !== '') {
      const parsedCenterFreq = parseFloat(String(rawCenterFreq).replace(/,/g, '').trim());
      if (!isNaN(parsedCenterFreq) && parsedCenterFreq > 0) {
        metadata.center_frequency = parsedCenterFreq;
      }
    }

    console.log('[ZT Upload] Triggering onFileUpload with metadata:', metadata);
    onFileUpload(file, Object.keys(metadata).length > 0 ? metadata : undefined);
  };

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log('[ZT Upload] handleFileChange fired, files:', e.target.files?.length);
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const handlePreset = (presetKey: string) => {
    const preset = signalPresets[presetKey];
    if (preset && onPresetSelect) {
      onPresetSelect(preset);
    } else if (preset) {
      const mockFile = new File(['mock raw I/Q signal stream data'], preset.fileInfo.name, { type: 'application/octet-stream' });
      onFileUpload(mockFile);
    }
  };

  return (
    <div className="relative bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between overflow-hidden">
      {/* Corner HUD markers */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-500/70 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-500/70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-500/70 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-500/70 pointer-events-none" />

      {/* Header section */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Signal Ingestion Port // RF Baseband
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
          CH-01 I/Q READY
        </span>
      </div>

      {/* Upload Zone States */}
      {isUploading ? (
        /* STATE 2: UPLOADING */
        <div className="border-2 border-cyan-500/60 bg-slate-950/70 rounded-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Scanning line animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-scanline pointer-events-none" />

          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-3 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <h3 className="text-sm font-mono font-bold text-cyan-200 tracking-wider">
            TRANSMITTING RAW BASEBAND TELEMETRY...
          </h3>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            Demodulator Buffering: {uploadProgress}% Completed
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-full h-3 mt-4 p-0.5 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.9)]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          <div className="flex justify-between w-full max-w-md text-[10px] font-mono text-slate-500 mt-2">
            <span>BITRATE: 48.0 MB/s</span>
            <span>BURST: PACKET_BURST_SYNC</span>
            <span className="text-cyan-400 font-bold">{uploadProgress}%</span>
          </div>
        </div>
      ) : currentFileInfo && currentFileInfo.name ? (
        /* STATE 3: SUCCESS & ACTIVE FILE DISPLAY */
        <div className="border border-emerald-500/40 bg-slate-950/80 rounded-lg p-4 relative glow-emerald">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-400">
                <FileCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-900/60 border border-emerald-500/40 text-emerald-300">
                    STATUS: ACTIVE INTERCEPT
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">FILE VERIFIED</span>
                </div>
                <h4 className="text-base font-mono font-bold text-slate-100 mt-1 break-all">
                  {currentFileInfo.name}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-1.5">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Radio className="w-3.5 h-3.5" /> {currentFileInfo.type}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Duration: {currentFileInfo.duration}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Re-upload / Swap action */}
            <div className="flex flex-col sm:items-end gap-2">
              <label
                htmlFor="signal-file-input"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer shadow-sm active:scale-95 select-none"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>LOAD NEW FILE</span>
              </label>
              <span className="text-[9px] font-mono text-slate-500">
                Accepted: .IQ, .WAV, .BIN, .RAW, .SIGMF-DATA
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* STATE 1: IDLE DROPZONE */
        <label
          htmlFor="signal-file-input"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/30 shadow-neon-cyan'
              : 'border-slate-700/80 bg-slate-900/50 hover:border-cyan-500/60 hover:bg-slate-800/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="p-3 rounded-full bg-slate-800 border border-cyan-500/30 text-cyan-400 shadow-neon-cyan">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-slate-200 tracking-wide uppercase">
                Drag & Drop Signal Intercept File (.IQ / .wav / .sigmf-data)
              </p>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Or click to browse local drive
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold">
                .IQ FORMAT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-600 text-slate-300 font-bold">
                .WAV AUDIO IQ
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold">
                .SIGMF-DATA
              </span>
            </div>
          </div>
        </label>
      )}

      {/* Optional SDR Capture Metadata Inputs */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        {/* Header row with Title and Attach .sigmf-meta button */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-semibold text-slate-300">
            SDR Capture Metadata
          </span>
          <label
            htmlFor="sigmf-meta-file-input"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 border border-purple-500/40 hover:border-purple-400 cursor-pointer transition-all shadow-sm active:scale-95 select-none"
          >
            <FileCheck className="w-3 h-3 text-purple-400" />
            <span>Attach .sigmf-meta</span>
          </label>
        </div>

        {/* SigMF Meta Confirmation Badge */}
        {sigmfInfo && (
          <div className="mb-2.5 p-2 rounded bg-purple-950/40 border border-purple-500/40 text-[10px] font-mono text-purple-200 flex flex-col gap-0.5 shadow-sm">
            <div className="flex items-center space-x-1.5 text-purple-300 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span>SIGMF AUTO-LOADED</span>
            </div>
            <div className="text-purple-200/90 pl-5 space-y-0.5 text-[9px]">
              {sigmfInfo.datatype && (
                <div>Datatype: <span className="text-purple-100 font-semibold">{sigmfInfo.datatype}</span></div>
              )}
              {sigmfInfo.sample_rate !== undefined && (
                <div>Sample Rate: <span className="text-purple-100 font-semibold">{sigmfInfo.sample_rate.toLocaleString()} Hz</span></div>
              )}
              {sigmfInfo.center_frequency !== undefined && (
                <div>Center Frequency: <span className="text-purple-100 font-semibold">{sigmfInfo.center_frequency.toLocaleString()} Hz</span></div>
              )}
            </div>
          </div>
        )}

        {/* SigMF Meta Error Message */}
        {metaErrorMessage && (
          <div className="mb-2 p-1.5 rounded bg-red-950/50 border border-red-500/40 text-[10px] font-mono text-red-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span>{metaErrorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="sample-rate-input" className="block text-[10px] font-mono text-slate-400 mb-1">
              Sample Rate (Hz)
            </label>
            <input
              id="sample-rate-input"
              ref={sampleRateInputRef}
              type="text"
              inputMode="numeric"
              value={sampleRate}
              onChange={handleSampleRateChange}
              onInput={handleSampleRateChange}
              placeholder="e.g. 20000000"
              disabled={isUploading}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-200 placeholder:text-slate-600 outline-none transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="center-freq-input" className="block text-[10px] font-mono text-slate-400 mb-1">
              Center Frequency (Hz)
            </label>
            <input
              id="center-freq-input"
              ref={centerFrequencyInputRef}
              type="text"
              inputMode="numeric"
              value={centerFrequency}
              onChange={handleCenterFrequencyChange}
              onInput={handleCenterFrequencyChange}
              placeholder="e.g. 915000000"
              disabled={isUploading}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-200 placeholder:text-slate-600 outline-none transition-colors disabled:opacity-50"
            />
          </div>
        </div>
        <p className="text-[9px] font-mono text-slate-500 mt-1.5">
          Optional capture metadata — use values supplied by the SDR recorder.
        </p>
      </div>

      {/* Hidden File Input for .sigmf-meta */}
      <input
        id="sigmf-meta-file-input"
        ref={metaFileInputRef}
        type="file"
        accept=".sigmf-meta,application/json"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        onChange={handleMetaFileChange}
        className="hidden"
      />

      {/* Hidden File Input linked via id and ref */}
      <input
        id="signal-file-input"
        ref={fileInputRef}
        type="file"
        accept=".iq,.wav,.bin,.raw,.dat,.sigmf-data,audio/*"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-2 flex items-center space-x-2 text-xs font-mono text-red-400 bg-red-950/50 border border-red-500/40 rounded p-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Test Intercept Presets */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="text-slate-500 uppercase tracking-wider">Quick Presets:</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePreset('alpha')}
            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
          >
            Alpha-44 (.IQ)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('covert')}
            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
          >
            Covert-Ch9 (.WAV)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('satcom')}
            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
          >
            Satcom-03 (.IQ)
          </button>
        </div>
      </div>
    </div>
  );
}
