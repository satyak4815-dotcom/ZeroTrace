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
import CodingStructureAnalysis from '@/components/CodingStructureAnalysis';
import CodingErrorCorrectionPipeline from '@/components/CodingErrorCorrectionPipeline';


export default function DashboardPage() {
  const [signalData, setSignalData] = useState<SignalData>(mockSignalData);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

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

  const handleFileUpload = async (
    file: File,
    metadata?: SignalMetadata
  ) => {
    console.log(
      '[ZT Page] handleFileUpload called with:',
      file.name,
      metadata
    );

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

      console.log(
        '[ZT Page] Upload complete, updating signalData:',
        updatedData?.fileInfo?.name
      );

      setSignalData(updatedData);
      setLastAnalyzed(new Date().toLocaleTimeString());
      setIsBackendConnected(true);

    } catch (error) {
      console.error(
        '[ZT Page] File upload error:',
        error
      );

      setSignalData((prev) => ({
        ...prev,

        fileInfo: {
          ...prev.fileInfo,
          name: file.name,
        },

        parameters: {
          ...prev.parameters,

          center_frequency:
            metadata?.center_frequency !== undefined
              ? String(metadata.center_frequency)
              : prev.parameters.center_frequency,

          center_frequency_source:
            metadata?.center_frequency_source ??
            prev.parameters.center_frequency_source,
        },
      }));

    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 selection:bg-cyan-600 selection:text-white">

      <DashboardHeader
        samplingFreq={signalData?.parameters?.sampling_frequency}
        isBackendConnected={isBackendConnected}
      />

      <main className="max-w-[1530px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        <section aria-label="Signal Ingestion">
          <SignalUpload
            currentFileInfo={signalData?.fileInfo}
            onFileUpload={handleFileUpload}
            onPresetSelect={(preset) => {
              setSignalData(preset);
              setLastAnalyzed(
                new Date().toLocaleTimeString()
              );
            }}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </section>

        <section aria-labelledby="section-params">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-cyan-500 inline-block" />

            <h2
              id="section-params"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Signal Analysis &amp; Telemetry
            </h2>
          </div>

          <ParameterGrid
            parameters={signalData?.parameters}
          />
        </section>

        <section aria-labelledby="section-coding-structure">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-purple-500 inline-block" />

            <h2
              id="section-coding-structure"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Coding Structure Analysis
            </h2>
          </div>

          <CodingStructureAnalysis
            signalData={signalData}
          />
        </section>

        <section aria-labelledby="section-coding-pipeline">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-indigo-500 inline-block" />

            <h2
              id="section-coding-pipeline"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Coding &amp; Error-Correction Pipeline
            </h2>
          </div>

          <CodingErrorCorrectionPipeline
            signalData={signalData}
          />
        </section>


        <section aria-labelledby="section-viz">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-blue-500 inline-block" />

            <h2
              id="section-viz"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Signal Visualizations
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <WaterfallVisualizer
              waterfallMatrix={
                signalData?.plot_data?.waterfall_matrix
              }
              samplingFreq={
                signalData?.parameters?.sampling_frequency ||
                'N/A'
              }
              isWav={
                signalData?.fileInfo?.name
                  ?.toLowerCase()
                  .endsWith('.wav')
              }
            />

            <ConstellationPlot
              points={
                signalData?.plot_data?.constellation_points
              }
              modulation={
                signalData?.parameters?.modulation ||
                'N/A'
              }
              isWav={
                signalData?.fileInfo?.name
                  ?.toLowerCase()
                  .endsWith('.wav')
              }
            />

          </div>
        </section>

        <section aria-labelledby="section-bitstream">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-emerald-500 inline-block" />

            <h2
              id="section-bitstream"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Structural &amp; Decoded Stream Feed
            </h2>

          </div>

          <BitstreamTerminal
            bitstream={signalData?.bitstream}
            correlation={signalData?.bitstream_correlation}
            decoding={signalData?.decoding}
            candidateBitstream={signalData?.candidate_bitstream}
            periodicityAnalysis={signalData?.periodicity_analysis}
          />

        </section>

      </main>


      <footer className="border-t border-slate-200/80 bg-white/85 backdrop-blur-md px-6 py-5 mt-12">

        <div className="max-w-[1530px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">

          <span>
            ZeroTrace Intel &copy; 2026 — Automated Signal Intelligence &amp; Demodulation Platform
          </span>

          <div className="flex items-center gap-4">

            {lastAnalyzed && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">

                <span className="w-2 h-2 rounded-full bg-emerald-500" />

                Last analyzed: {lastAnalyzed}

              </span>
            )}

            <span className="text-slate-300">
              |
            </span>

            <span>
              Scientific Dashboard v2.4
            </span>

          </div>

        </div>

      </footer>

    </div>
  );
}