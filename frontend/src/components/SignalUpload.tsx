'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileCheck, AlertCircle, RefreshCw, Radio, HardDrive, Clock, CheckCircle2, Activity } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metaErrorMessage, setMetaErrorMessage] = useState<string | null>(null);
  const [sigmfInfo, setSigmfInfo] = useState<{
    datatype?: string;
    sample_rate?: number;
    center_frequency?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const metaFileInputRef = useRef<HTMLInputElement>(null);

  const formatFreq = (val?: number): string => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) {
      return 'Not provided';
    }
    if (val >= 1e9) {
      return `${(val / 1e9).toFixed(3)} GHz`;
    }
    if (val >= 1e6) {
      return `${(val / 1e6).toFixed(3)} MHz`;
    }
    if (val >= 1e3) {
      return `${(val / 1e3).toFixed(3)} kHz`;
    }
    return `${val.toLocaleString()} Hz`;
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
      }

      if (hasValidCf) {
        info.center_frequency = parsedCf;
      }

      setSigmfInfo(info);
    } catch (err) {
      console.error('[SigMF Parser Error]', err);
      setMetaErrorMessage('Invalid or incomplete SigMF metadata.');
    }
  };

  const handleSelectFile = (file: File) => {
    console.log('[ZT Upload] File selected for analysis:', file.name, file.type, file.size);
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
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const validateAndUpload = (targetFile?: File | null) => {
    const file = targetFile || selectedFile;
    if (!file) {
      setErrorMessage('Please select a signal file before analyzing.');
      return;
    }
    setErrorMessage(null);

    const metadata: SignalMetadata = {};

    if (sigmfInfo?.sample_rate !== undefined && sigmfInfo.sample_rate > 0) {
      metadata.sample_rate = sigmfInfo.sample_rate;
    }

    if (sigmfInfo?.center_frequency !== undefined && sigmfInfo.center_frequency > 0) {
      metadata.center_frequency = sigmfInfo.center_frequency;
      metadata.center_frequency_source = 'sigmf';
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
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log('[ZT Upload] handleFileChange fired, files:', e.target.files?.length);
    if (e.target.files && e.target.files.length > 0) {
      handleSelectFile(e.target.files[0]);
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

  const activeFileName = selectedFile?.name || currentFileInfo?.name || '';
  const isWavFile = activeFileName.toLowerCase().endsWith('.wav');

  return (
    <div className="relative py-4 sm:py-8 overflow-hidden">
      
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 drop-shadow-md">
            Welcome to <span className="text-cyan-400 bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">ZeroTrace Intel</span>
          </h1>
          <p className="text-base sm:text-lg text-white max-w-2xl mx-auto font-medium drop-shadow-sm">
            Upload a signal file to analyze modulation, spectrum, and signal characteristics.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          
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
          ) : selectedFile ? (
            /* Selected pending file state */
            <div className="border border-cyan-200 bg-cyan-50/60 rounded-xl p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="p-3 rounded-xl bg-cyan-100 text-cyan-700 flex-shrink-0">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 uppercase tracking-wider">
                        File Selected (Pending Analysis)
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-1 break-all">
                      {selectedFile.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1.5 font-medium">
                      <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-cyan-700 font-semibold uppercase">
                        {selectedFile.name.split('.').pop()} Signal Format
                      </span>
                    </div>
                  </div>
                </div>
                <label
                  htmlFor="signal-file-input"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs select-none"
                >
                  <UploadCloud className="w-4 h-4 text-slate-600" />
                  <span>Choose Different File</span>
                </label>
              </div>
            </div>
          ) : currentFileInfo && currentFileInfo.name ? (
            /* Active Analyzed File state */
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="p-3 rounded-xl bg-emerald-100/80 text-emerald-700 flex-shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        Active Analyzed Signal
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
                  <span>Select New Signal File</span>
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

          {/* SDR Capture Metadata Display Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Capture Metadata
                </span>
                {sigmfInfo ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200/80">
                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                    Metadata: DETECTED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    Metadata: NOT ATTACHED
                  </span>
                )}
              </div>

              {!isWavFile && (
                <label
                  htmlFor="sigmf-meta-file-input"
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 cursor-pointer transition-colors shadow-2xs select-none"
                >
                  <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>{sigmfInfo ? 'Change .sigmf-meta' : 'Attach .sigmf-meta'}</span>
                </label>
              )}
            </div>

            {/* SigMF Meta Error Message */}
            {metaErrorMessage && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{metaErrorMessage}</span>
              </div>
            )}

            {isWavFile ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                WAV Audio IQ Signal — metadata will be extracted directly from audio headers by the DSP core.
              </div>
            ) : sigmfInfo ? (
              /* Auto-Extracted Read-Only Metadata Display */
              <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
                      Sample Rate
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {formatFreq(sigmfInfo.sample_rate)}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
                      Center Frequency
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {formatFreq(sigmfInfo.center_frequency)}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
                      Datatype / Source
                    </span>
                    <span className="font-semibold text-purple-900 text-xs">
                      {sigmfInfo.datatype || 'SigMF Metadata'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* No metadata attached state */
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500">
                Attach the matching <code className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800 font-mono text-[11px]">.sigmf-meta</code> file to provide capture metadata such as sample rate and center frequency.
              </div>
            )}
          </div>

          {/* Action Area: Analyze Signal Button */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              {selectedFile ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Ready to analyze <strong className="font-mono text-slate-800">{selectedFile.name}</strong>
                </span>
              ) : (
                <span className="text-slate-400">
                  Select a signal file above before starting analysis.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => validateAndUpload(selectedFile)}
              disabled={!selectedFile || isUploading}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 text-xs font-extrabold rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-blue-600 active:scale-[0.98] select-none"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing Signal...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 text-cyan-100" />
                  <span>Analyze Signal</span>
                </>
              )}
            </button>
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
