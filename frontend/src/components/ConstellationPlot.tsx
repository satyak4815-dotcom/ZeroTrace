'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ConstellationPoint } from '@/lib/mockData';
import { Crosshair } from 'lucide-react';

interface ConstellationPlotProps {
  points?: ConstellationPoint[] | null;
  modulation?: string;
  isWav?: boolean;
}

// Custom tooltip for tactical I/Q readouts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-orange-500/60 p-2.5 rounded shadow-[0_0_15px_rgba(249,115,22,0.4)] text-[11px] font-mono">
        <p className="text-orange-400 font-bold tracking-wider mb-1">
          SYMBOL POINT VECTOR
        </p>
        <div className="flex justify-between gap-3 text-slate-300">
          <span>In-Phase (I):</span>
          <span className="text-cyan-400 font-bold">{data.x.toFixed(3)}</span>
        </div>
        <div className="flex justify-between gap-3 text-slate-300">
          <span>Quadrature (Q):</span>
          <span className="text-cyan-400 font-bold">{data.y.toFixed(3)}</span>
        </div>
        <div className="flex justify-between gap-3 text-slate-400 text-[9px] mt-1 pt-1 border-t border-slate-800">
          <span>MAGNITUDE:</span>
          <span>{Math.sqrt(data.x * data.x + data.y * data.y).toFixed(3)}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Glowing Dot Component
const GlowingDot = (props: any) => {
  const { cx, cy } = props;
  if (cx === undefined || cy === undefined) return null;
  return (
    <g>
      {/* Outer ambient glow */}
      <circle cx={cx} cy={cy} r={8} fill="#f97316" fillOpacity={0.25} />
      {/* Middle bright ring */}
      <circle cx={cx} cy={cy} r={5} fill="#ea580c" />
      {/* Core bright dot */}
      <circle cx={cx} cy={cy} r={2.5} fill="#fef08a" />
    </g>
  );
};

export default function ConstellationPlot({
  points,
  modulation = '16-QAM',
  isWav = false,
}: ConstellationPlotProps) {
  const validPoints = useMemo(() => {
    return Array.isArray(points) ? points : null;
  }, [points]);

  const hasData = !isWav && validPoints !== null && validPoints.length > 0;

  return (
    <div className="relative bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Tactical HUD Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-4 h-4 text-orange-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Constellation Diagram // I/Q Polar Domain
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/40 text-orange-300 font-bold">
            {hasData ? `${modulation} SYMBOLS (${validPoints.length} PTS)` : 'N/A SYMBOLS'}
          </span>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="w-full h-72 sm:h-80 relative bg-slate-950/90 border border-slate-800/80 rounded-lg p-2 overflow-hidden flex flex-col justify-center items-center">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center text-slate-500 font-mono text-sm">
            <Crosshair className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <span>
              {isWav
                ? 'Constellation not applicable for audio WAV'
                : 'Constellation unavailable'}
            </span>
          </div>
        ) : (
          <>
            {/* Quadrant Identification Labels */}
            <div className="absolute top-3 right-3 text-[9px] font-mono text-slate-600 select-none pointer-events-none z-10">
              Q1 (+I, +Q)
            </div>
            <div className="absolute top-3 left-3 text-[9px] font-mono text-slate-600 select-none pointer-events-none z-10">
              Q2 (-I, +Q)
            </div>
            <div className="absolute bottom-3 left-3 text-[9px] font-mono text-slate-600 select-none pointer-events-none z-10">
              Q3 (-I, -Q)
            </div>
            <div className="absolute bottom-3 right-3 text-[9px] font-mono text-slate-600 select-none pointer-events-none z-10">
              Q4 (+I, -Q)
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
                {/* Dark gridlines */}
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="#1e293b"
                  vertical={true}
                  horizontal={true}
                />

                {/* Zero Crosshairs */}
                <ReferenceLine x={0} stroke="#334155" strokeWidth={1.5} />
                <ReferenceLine y={0} stroke="#334155" strokeWidth={1.5} />

                {/* In-Phase Axis (X: -1 to 1) */}
                <XAxis
                  type="number"
                  dataKey="x"
                  name="In-Phase (I)"
                  domain={[-1, 1]}
                  ticks={[-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                />

                {/* Quadrature Axis (Y: -1 to 1) */}
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Quadrature (Q)"
                  domain={[-1, 1]}
                  ticks={[-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#06b6d4' }} />

                {/* Orange Neon Scatter Points */}
                <Scatter
                  name="Constellation Points"
                  data={validPoints}
                  shape={<GlowingDot />}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Telemetry Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-3">
          <span>EVM: <span className="text-emerald-400 font-bold">{hasData ? '1.82% RMS' : 'N/A'}</span></span>
          <span>PHASE JITTER: <span className="text-cyan-400">{hasData ? '0.42°' : 'N/A'}</span></span>
        </div>
        <div className="flex items-center space-x-3">
          <span>MAG RESIDUAL: <span className="text-amber-400">{hasData ? '0.014' : 'N/A'}</span></span>
          <span className="text-orange-400 font-bold">GRID: {hasData ? 'LOCKED [-1, 1]' : 'IDLE'}</span>
        </div>
      </div>
    </div>
  );
}
