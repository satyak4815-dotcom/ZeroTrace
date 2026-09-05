'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Waves, Play, Pause } from 'lucide-react';

interface WaterfallVisualizerProps {
  waterfallMatrix?: number[][] | null;
  samplingFreq?: string;
  isWav?: boolean;
}

/**
 * Downsample a single row of STFT frequency bins to a target pixel width.
 */
function downsampleRow(row: number[], targetCols: number): number[] {
  const srcCols = row.length;
  if (srcCols <= targetCols) {
    const out = new Array(targetCols).fill(0);
    for (let c = 0; c < srcCols; c++) {
      const v = row[c];
      out[c] = Number.isFinite(v) ? Math.max(0, v) : 0;
    }
    return out;
  }

  const out = new Array(targetCols).fill(-Infinity);
  const ratio = srcCols / targetCols;

  for (let px = 0; px < targetCols; px++) {
    const srcStart = Math.floor(px * ratio);
    const srcEnd = Math.min(srcCols, Math.ceil((px + 1) * ratio));
    let maxVal = -Infinity;
    for (let s = srcStart; s < srcEnd; s++) {
      const v = Number(row[s]);
      if (Number.isFinite(v) && v > maxVal) maxVal = v;
    }
    out[px] = maxVal === -Infinity ? 0 : Math.max(0, maxVal);
  }

  return out;
}

/**
 * High-contrast SDR spectrum colour gradient for display only.
 */
function getDisplayColor(norm: number): [number, number, number] {
  const n = Math.min(1, Math.max(0, norm));
  if (n < 0.15) {
    const t = n / 0.15;
    return [
      Math.floor(2 + t * 18),
      Math.floor(5 + t * 10),
      Math.floor(20 + t * 45),
    ];
  } else if (n < 0.40) {
    const t = (n - 0.15) / 0.25;
    return [
      Math.floor(20 - t * 20),
      Math.floor(15 + t * 185),
      Math.floor(65 + t * 175),
    ];
  } else if (n < 0.70) {
    const t = (n - 0.40) / 0.30;
    return [
      Math.floor(0 + t * 230),
      Math.floor(200 + t * 30),
      Math.floor(240 - t * 220),
    ];
  } else if (n < 0.90) {
    const t = (n - 0.70) / 0.20;
    return [
      Math.floor(230 + t * 25),
      Math.floor(230 - t * 160),
      Math.floor(20 - t * 10),
    ];
  } else {
    const t = (n - 0.90) / 0.10;
    return [
      255,
      Math.floor(70 + t * 180),
      Math.floor(10 + t * 245),
    ];
  }
}

/** Compute percentiles on an array of numbers for display contrast scaling. */
function computePercentiles(values: number[]): { p2: number; p98: number } {
  if (values.length === 0) return { p2: 0, p98: 1 };
  const sorted = Float32Array.from(values).sort();
  const idxP2 = Math.floor(sorted.length * 0.02);
  const idxP98 = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.98));
  return {
    p2: sorted[idxP2],
    p98: sorted[idxP98],
  };
}

export default function WaterfallVisualizer({
  waterfallMatrix,
  samplingFreq = '2.4 MHz',
  isWav = false,
}: WaterfallVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [peakBin, setPeakBin] = useState('N/A');
  const [peakMagnitude, setPeakMagnitude] = useState('N/A');

  const srcRows = Array.isArray(waterfallMatrix) ? waterfallMatrix.length : 0;
  const srcCols = srcRows > 0 && Array.isArray(waterfallMatrix![0]) ? waterfallMatrix![0].length : 0;
  const hasData = srcRows > 0 && srcCols > 0;

  useEffect(() => {
    if (!hasData || !waterfallMatrix) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = container.clientWidth || 500;
    const cssHeight = 280;

    if (cssWidth <= 0) return;

    const bufferW = Math.floor(cssWidth * dpr);
    const bufferH = Math.floor(cssHeight * dpr);

    canvas.width = bufferW;
    canvas.height = bufferH;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const targetCols = Math.min(srcCols, cssWidth);

    let peakSrcBin = 0;
    let peakRawMag = -Infinity;
    const displayValues: number[] = [];

    for (let r = 0; r < srcRows; r++) {
      const row = waterfallMatrix[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const v = Number(row[c]);
        if (!Number.isFinite(v)) continue;
        if (v > peakRawMag) {
          peakRawMag = v;
          peakSrcBin = c;
        }
        const logVal = Math.log10(1 + Math.max(0, v));
        displayValues.push(logVal);
      }
    }

    if (displayValues.length === 0) return;

    setPeakBin(`Bin ${peakSrcBin + 1} / ${srcCols}`);
    setPeakMagnitude(Number.isFinite(peakRawMag) ? peakRawMag.toFixed(2) : 'N/A');

    const { p2, p98 } = computePercentiles(displayValues);
    const pRange = p98 === p2 ? 1 : p98 - p2;

    const offscreen = document.createElement('canvas');
    offscreen.width = targetCols;
    offscreen.height = srcRows;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    const imgData = offCtx.createImageData(targetCols, srcRows);
    const pixels = imgData.data;

    for (let r = 0; r < srcRows; r++) {
      const srcRow = waterfallMatrix[r];
      if (!Array.isArray(srcRow)) continue;

      const dsRow = downsampleRow(srcRow, targetCols);

      for (let c = 0; c < targetCols; c++) {
        const rawV = dsRow[c];
        const logV = Math.log10(1 + Math.max(0, rawV));
        const norm = Math.min(1, Math.max(0, (logV - p2) / pRange));
        const [red, green, blue] = getDisplayColor(norm);

        const idx = (r * targetCols + c) * 4;
        pixels[idx] = red;
        pixels[idx + 1] = green;
        pixels[idx + 2] = blue;
        pixels[idx + 3] = 255;
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    ctx.clearRect(0, 0, bufferW, bufferH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreen, 0, 0, targetCols, srcRows, 0, 0, bufferW, bufferH);

    const handleResize = () => {
      const newCssW = container.clientWidth || 500;
      if (newCssW <= 0) return;
      const newBufW = Math.floor(newCssW * dpr);
      canvas.width = newBufW;
      canvas.height = bufferH;
      canvas.style.width = `${newCssW}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offscreen, 0, 0, targetCols, srcRows, 0, 0, newBufW, bufferH);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [waterfallMatrix, hasData]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Waterfall Spectrogram</h3>
            <p className="text-xs text-slate-500">Time-frequency representation</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hasData && (
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {isPlaying ? (
                <><Pause className="w-3.5 h-3.5" /> <span>Freeze Sweep</span></>
              ) : (
                <><Play className="w-3.5 h-3.5" /> <span>Run Sweep</span></>
              )}
            </button>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60">
            {hasData ? `${srcRows}×${srcCols} Matrix` : 'DSP Active'}
          </span>
        </div>
      </div>

      {/* Canvas Waterfall Container */}
      <div
        ref={containerRef}
        className="w-full h-72 sm:h-80 relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden"
      >
        {!hasData ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
            <Waves className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <span>Waterfall data unavailable</span>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="block w-full h-full"
            />

            {/* Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="h-full w-px bg-cyan-400/50 border-r border-dashed border-cyan-400/60" />
            </div>

            {/* Scale Top Bar */}
            <div className="absolute top-0 left-0 right-0 px-3 py-1 bg-slate-900/80 backdrop-blur-xs border-b border-slate-800/80 flex justify-between text-[10px] text-slate-300 font-medium pointer-events-none">
              <span>Lower Bin (0)</span>
              <span className="text-cyan-300 font-semibold">Center Carrier</span>
              <span>Upper Bin ({srcCols})</span>
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 right-2 bg-slate-900/85 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-2 pointer-events-none text-[10px] text-slate-300 font-medium">
              <span>Min</span>
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-slate-900 via-cyan-500 via-amber-400 to-red-600" />
              <span>Max</span>
            </div>
          </>
        )}
      </div>

      {/* Telemetry Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center space-x-3">
          <span>Span: <strong className="text-slate-800">{samplingFreq}</strong></span>
          <span>Peak: <strong className="text-slate-800">{hasData ? peakBin : 'N/A'}</strong></span>
        </div>
        <div>
          <span>Magnitude: <strong className="text-slate-800">{hasData ? peakMagnitude : 'N/A'}</strong></span>
        </div>
      </div>
    </div>
  );
}


