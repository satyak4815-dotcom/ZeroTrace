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
 * Uses MAX aggregation: each output pixel represents the maximum magnitude
 * among all source STFT bins that map to that pixel column.
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
 * Normalized input [0, 1] -> RGB color map:
 *   [0.00 - 0.15] Dark navy / deep purple
 *   [0.15 - 0.40] Electric blue -> Cyan
 *   [0.40 - 0.70] Bright Cyan -> Neon Green -> Yellow
 *   [0.70 - 0.90] Yellow -> Vibrant Orange -> Red
 *   [0.90 - 1.00] Red -> Intense White-Hot Peak
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

/** Compute p2 and p98 percentiles on an array of numbers for robust display contrast scaling. */
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

    // ── 1. Setup physical canvas pixel buffer dimensions ──
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

    // ── 2. Scan REAL matrix for truthful telemetry & log-transformed display values ──
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
        // Logarithmic display transform: log10(1 + magnitude)
        const logVal = Math.log10(1 + Math.max(0, v));
        displayValues.push(logVal);
      }
    }

    if (displayValues.length === 0) return;

    // Truthful telemetry readouts derived strictly from raw matrix
    setPeakBin(`BIN ${peakSrcBin + 1} / ${srcCols}`);
    setPeakMagnitude(Number.isFinite(peakRawMag) ? peakRawMag.toFixed(2) : 'N/A');

    // ── 3. Percentile normalization bounds for DISPLAY ONLY ──
    const { p2, p98 } = computePercentiles(displayValues);
    const pRange = p98 === p2 ? 1 : p98 - p2;

    // ── 4. Build offscreen image buffer (srcRows x targetCols) ──
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
        // Clamp display norm using robust 2nd-98th percentiles
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

    // ── 5. Render onto main canvas with image smoothing ──
    ctx.clearRect(0, 0, bufferW, bufferH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreen, 0, 0, targetCols, srcRows, 0, 0, bufferW, bufferH);

    // ── 6. Resize listener ──
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
    <div className="relative bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Tactical HUD Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center space-x-2">
          <Waves className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Waterfall Spectrogram // Time-Frequency Domain
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          {hasData && (
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 transition-colors"
            >
              {isPlaying ? (
                <><Pause className="w-3 h-3" /> <span>FREEZE</span></>
              ) : (
                <><Play className="w-3 h-3" /> <span>RUN SWEEP</span></>
              )}
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-bold">
            {hasData ? `MATRIX: ${srcRows}×${srcCols}` : 'DSP STREAM'}
          </span>
        </div>
      </div>

      {/* Canvas Waterfall Container */}
      <div
        ref={containerRef}
        className="w-full h-72 sm:h-80 relative bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden"
      >
        {!hasData ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-mono text-sm">
            <Waves className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <span>Waterfall unavailable</span>
          </div>
        ) : (
          <>
            {/* Waterfall Canvas */}
            <canvas
              ref={canvasRef}
              className="block w-full h-full"
            />

            {/* Center Carrier Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="h-full w-px bg-cyan-500/30 border-r border-dashed border-cyan-400/40" />
            </div>

            {/* Frequency Scale Top Bar */}
            <div className="absolute top-0 left-0 right-0 px-2 py-1 bg-slate-950/70 backdrop-blur-sm border-b border-slate-800 flex justify-between text-[9px] font-mono text-slate-400 pointer-events-none">
              <span>LOWER BIN (0)</span>
              <span className="text-cyan-400 font-bold">CENTER BIN</span>
              <span>UPPER BIN</span>
            </div>

            {/* Time Axis Legend on Left */}
            <div className="absolute left-2 bottom-8 text-[8px] font-mono text-slate-500 pointer-events-none flex flex-col gap-3">
              <span>FRAME 0</span>
              <span>↓ TIME SLICES</span>
            </div>

            {/* Colour Scale Legend */}
            <div className="absolute bottom-2 right-2 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded flex items-center gap-2 pointer-events-none text-[8px] font-mono text-slate-400">
              <span>MIN</span>
              <div className="w-16 h-2 rounded-sm bg-gradient-to-r from-slate-900 via-cyan-500 via-amber-400 to-red-600" />
              <span>MAX</span>
            </div>
          </>
        )}
      </div>

      {/* Telemetry Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-3">
          <span>SPAN: <span className="text-cyan-400">{samplingFreq}</span></span>
          <span>PEAK BIN: <span className="text-emerald-400 font-bold">{hasData ? peakBin : 'N/A'}</span></span>
        </div>
        <div className="flex items-center space-x-3">
          <span>PEAK MAGNITUDE: <span className="text-orange-400">{hasData ? peakMagnitude : 'N/A'}</span></span>
          <span className="text-cyan-400 font-bold">CASCADE: {hasData ? 'ACTIVE' : 'IDLE'}</span>
        </div>
      </div>
    </div>
  );
}
