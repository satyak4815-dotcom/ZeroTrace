'use client';

import React, { useState, useEffect } from 'react';
import { mockSignalData, SignalData } from '@/lib/mockData';
import { fetchSignalData, uploadSignalFile, SignalMetadata } from '@/services/signalApi';
import DashboardHeader from '@/components/DashboardHeader';
import SignalUpload from '@/components/SignalUpload';
import ParameterGrid from '@/components/ParameterGrid';
import ConstellationPlot from '@/components/ConstellationPlot';
import WaterfallVisualizer from '@/components/WaterfallVisualizer';
import BitstreamTerminal from '@/components/BitstreamTerminal';
import { Shield, Radio, Activity, Cpu, Terminal, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [signalData, setSignalData] = useState<SignalData>(mockSignalData);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    async function initData() {
      try {
        const { data, isFromBackend } = await fetchSignalData();
        setSignalData(data);
        setIsBackendConnected(isFromBackend);
      } catch (err) {
        console.error('Failed to fetch initial signal data, using fallback', err);
        setIsBackendConnected(false);
      } finally {
        setIsInitializing(false);
      }
    }
    initData();
  }, []);

  // Upload handler triggering Axios service with mockData fallback
  const handleFileUpload = async (file: File, metadata?: SignalMetadata) => {
    console.log('[ZT Page] handleFileUpload called with:', file.name, metadata);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const updatedData = await uploadSignalFile(
        file,
        (percent) => {
          setUploadProgress(percent);
        },
        metadata
      );
      console.log('[ZT Page] Upload complete, updating signalData:', updatedData?.fileInfo?.name);
      setSignalData(updatedData);
      setLastAnalyzed(new Date().toLocaleTimeString());
      setIsBackendConnected(true);
    } catch (error) {
      console.error('[ZT Page] File upload error:', error);
      // Still update the UI with at least the filename on error
      setSignalData((prev) => ({
        ...prev,
        fileInfo: { ...prev.fileInfo, name: file.name },
      }));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* 1. Tactical Command Header */}
      <DashboardHeader
        samplingFreq={signalData?.parameters?.sampling_frequency}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Layout Container */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-5">
        {/* Top Operational Section: Upload & Parameter Ingestion */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Signal Ingestion Upload Zone (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col">
            <SignalUpload
              currentFileInfo={signalData?.fileInfo}
              onFileUpload={handleFileUpload}
              onPresetSelect={(preset) => {
              setSignalData(preset);
              setLastAnalyzed(new Date().toLocaleTimeString());
            }}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </div>

          {/* Demodulation Parameter Cards (8 cols on lg) */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <ParameterGrid parameters={signalData?.parameters} />
          </div>
        </section>

        {/* Middle Visualizer Matrix: Constellation Scatter Plot & Waterfall Spectrogram */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Constellation Scatter Plot */}
          <div className="w-full">
            <ConstellationPlot
              points={signalData?.plot_data?.constellation_points}
              modulation={signalData?.parameters?.modulation || 'N/A'}
              isWav={signalData?.fileInfo?.name?.toLowerCase().endsWith('.wav')}
            />
          </div>

          {/* Right: Waterfall Visualizer */}
          <div className="w-full">
            <WaterfallVisualizer
              waterfallMatrix={signalData?.plot_data?.waterfall_matrix}
              samplingFreq={signalData?.parameters?.sampling_frequency || '2.4 MHz'}
              isWav={signalData?.fileInfo?.name?.toLowerCase().endsWith('.wav')}
            />
          </div>
        </section>

        {/* Bottom Section: Extracted Bitstream Feed Terminal */}
        <section className="w-full">
          <BitstreamTerminal bitstream={signalData?.bitstream} />
        </section>
      </main>

      {/* Tactical Footer HUD */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-4 py-2.5 mt-6 text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">SYSTEM STATUS: FULLY OPERATIONAL</span>
          </div>
          <span className="text-slate-700">|</span>
          <span>STATION: NOFORN-ALPHA-7</span>
          <span className="text-slate-700">|</span>
          <span>LAT/LON: 34.0522° N, 118.2437° W</span>
        </div>

        <div className="flex items-center space-x-4">
          {lastAnalyzed && (
            <>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LAST ANALYZED: {lastAnalyzed}
              </span>
              <span className="text-slate-700">|</span>
            </>
          )}
          <span className="text-slate-400">
            CONTRACT VERSION: <span className="text-cyan-400 font-bold">JSON-V1-COMPLIANT</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">ZeroTrace Intel OS &copy; 2026</span>
        </div>
      </footer>
    </div>
  );
}
