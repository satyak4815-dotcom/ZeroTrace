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
      setErrorMessage('Unsupported format: Please select an .IQ, .WAV, .BIN, .RAW, .DAT, or .SIGMF-DATA signal file.');
      return;
    }

    const rawSampleRate =
      sampleRateRef.current ||
      sampleRate ||
      sampleRateInputRef.current?.value ||
      (typeof document !== 'undefined'
        ? (document.getElementById('sample-rate-input') as HTMLInputElement)?.value
        : '') ||
      '';

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
        const isFromSigmf = Boolean(
          sigmfInfo &&
          sigmfInfo.center_frequency !== undefined &&
          Math.abs(Number(sigmfInfo.center_frequency) - parsedCenterFreq) < 1
        );
        metadata.center_frequency_source = isFromSigmf ? 'sigmf' : 'manual';
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
    <div className="relative rounded-3xl bg-gradient-to-br from-cyan-50/90 via-sky-50/50 to-blue-50/30 border border-cyan-100/80 p-6 sm:p-10 shadow-xs overflow-hidden">
      
      {/* Lightweight SVG Waveform Background Illustration */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
        <svg viewBox="0 0 400 400" className="w-full h-full text-cyan-600 fill-none stroke-current stroke-[1.5]">
          <path d="M 0 200 Q 50 120 100 200 T 200 200 T 300 200 T 400 200" />
          <path d="M 0 200 Q 50 150 100 200 T 200 200 T 300 200 T 400 200" className="opacity-60" />
          <path d="M 0 200 Q 50 80 100 200 T 200 200 T 300 200 T 400 200" className="opacity-30" />
          <circle cx="200" cy="200" r="140" strokeDasharray="4 4" className="opacity-40" />
          <circle cx="200" cy="200" r="80" strokeDasharray="2 2" className="opacity-60" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* Hero Banner Text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Welcome to <span className="text-cyan-600 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">ZeroTrace Intel</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Upload a signal file to analyze modulation, spectrum, and signal characteristics.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {/* Card Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Signal File Ingestion</h2>
                <p className="text-xs text-slate-500">Select raw IQ capture or audio signal</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60">
              IQ / WAV Ready
            </span>
          </div>

          {/* Upload Zone States */}
          {isUploading ? (
            /* Uploading state */
            <div className="border border-cyan-200 bg-cyan-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-10 h-10 text-cyan-600 animate-spin mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                Analyzing signal file...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Processing: {uploadProgress}% complete
              </p>
              <div className="w-full max-w-sm bg-slate-200 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-cyan-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : currentFileInfo && currentFileInfo.name ? (
            /* File loaded state */
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="p-3 rounded-xl bg-emerald-100/80 text-emerald-700 flex-shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        Active Signal File
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-1 break-all">
                      {currentFileInfo.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1.5 font-medium">
                      <span className="flex items-center gap-1.5 text-cyan-700 font-semibold">
                        <Radio className="w-3.5 h-3.5" /> {currentFileInfo.type}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> {currentFileInfo.duration}
                      </span>
                    </div>
                  </div>
                </div>
                <label
                  htmlFor="signal-file-input"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-all cursor-pointer shadow-xs active:scale-95 select-none"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose Another File</span>
                </label>
              </div>
            </div>
          ) : (
            /* Idle dropzone */
            <label
              htmlFor="signal-file-input"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`block border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-cyan-500 bg-cyan-50/70 scale-[0.99]'
                  : 'border-slate-200 bg-slate-50/40 hover:border-cyan-400 hover:bg-cyan-50/30'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 rounded-2xl bg-white text-cyan-600 shadow-xs border border-slate-100">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    Drag &amp; drop your signal file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    or click to browse — supports .IQ, .WAV, .BIN, .RAW, .SIGMF-DATA
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200/60">.IQ</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">.WAV</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/60">.SIGMF-DATA</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">.BIN</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">.RAW</span>
                </div>
              </div>
            </label>
          )}

          {/* SDR Capture Metadata Inputs */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">
                SDR Capture Metadata
              </span>
              <label
                htmlFor="sigmf-meta-file-input"
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 cursor-pointer transition-colors shadow-2xs select-none"
              >
                <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Attach .sigmf-meta</span>
              </label>
            </div>

            {/* SigMF Meta Confirmation Badge */}
            {sigmfInfo && (
              <div className="mb-3 p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 text-xs text-purple-900 flex flex-col gap-1 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-purple-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>SigMF Metadata Attached</span>
                </div>
                <div className="text-purple-800/90 pl-5 space-y-0.5 text-xs font-medium">
                  {sigmfInfo.datatype && (
                    <div>Datatype: <span className="font-semibold text-purple-950">{sigmfInfo.datatype}</span></div>
                  )}
                  {sigmfInfo.sample_rate !== undefined && (
                    <div>Sample Rate: <span className="font-semibold text-purple-950">{sigmfInfo.sample_rate.toLocaleString()} Hz</span></div>
                  )}
                  {sigmfInfo.center_frequency !== undefined && (
                    <div>Center Frequency: <span className="font-semibold text-purple-950">{sigmfInfo.center_frequency.toLocaleString()} Hz</span></div>
                  )}
                </div>
              </div>
            )}

            {/* SigMF Meta Error Message */}
            {metaErrorMessage && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{metaErrorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="sample-rate-input" className="block text-xs font-medium text-slate-600 mb-1">
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
                  className="w-full bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label htmlFor="center-freq-input" className="block text-xs font-medium text-slate-600 mb-1">
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
                  className="w-full bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-normal">
              Optional capture metadata — forwarded directly to the backend DSP core.
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
            <div className="mt-4 flex items-center space-x-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sample Signal Presets */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Sample Signals:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePreset('alpha')}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200/80 text-slate-700 transition-colors text-xs font-medium"
              >
                Alpha-44 (.IQ)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('covert')}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200/80 text-slate-700 transition-colors text-xs font-medium"
              >
                Covert-Ch9 (.WAV)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('satcom')}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200/80 text-slate-700 transition-colors text-xs font-medium"
              >
                Satcom-03 (.IQ)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

