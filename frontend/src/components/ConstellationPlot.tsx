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

// Custom tooltip for scientific I/Q readouts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-md text-xs text-slate-800 font-medium">
        <p className="text-cyan-600 font-bold tracking-wide mb-1">
          Symbol Point Vector
        </p>
        <div className="flex justify-between gap-4 text-slate-600">
          <span>In-Phase (I):</span>
          <span className="text-slate-900 font-bold font-mono">{data.x.toFixed(3)}</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-600">
          <span>Quadrature (Q):</span>
          <span className="text-slate-900 font-bold font-mono">{data.y.toFixed(3)}</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-500 text-[10px] mt-1.5 pt-1.5 border-t border-slate-100">
          <span>Magnitude:</span>
          <span className="font-mono">{Math.sqrt(data.x * data.x + data.y * data.y).toFixed(3)}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Scientific Dot Component
const ScientificDot = (props: any) => {
  const { cx, cy } = props;
  if (cx === undefined || cy === undefined) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#0284c7" fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={3.5} fill="#0284c7" />
      <circle cx={cx} cy={cy} r={1.5} fill="#ffffff" />
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
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-teal-50 border border-teal-100 text-teal-600">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Constellation Plot</h3>
            <p className="text-xs text-slate-500">I/Q symbol distribution</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
            {hasData ? `${modulation} (${validPoints.length} Pts)` : 'No Symbols'}
          </span>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="w-full h-72 sm:h-80 relative bg-slate-50/50 border border-slate-200/80 rounded-xl p-2 overflow-hidden flex flex-col justify-center items-center">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
            <Crosshair className="w-8 h-8 text-slate-300 mb-2" />
            <span>
              {isWav
                ? 'Constellation not applicable for audio WAV'
                : 'Constellation unavailable'}
            </span>
          </div>
        ) : (
          <>
            {/* Quadrant Identification Labels */}
            <div className="absolute top-3 right-3 text-[10px] text-slate-400 select-none pointer-events-none z-10 font-medium">
              Q1 (+I, +Q)
            </div>
            <div className="absolute top-3 left-3 text-[10px] text-slate-400 select-none pointer-events-none z-10 font-medium">
              Q2 (-I, +Q)
            </div>
            <div className="absolute bottom-3 left-3 text-[10px] text-slate-400 select-none pointer-events-none z-10 font-medium">
              Q3 (-I, -Q)
            </div>
            <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 select-none pointer-events-none z-10 font-medium">
              Q4 (+I, -Q)
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="#e2e8f0"
                  vertical={true}
                  horizontal={true}
                />

                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1.5} />

                <XAxis
                  type="number"
                  dataKey="x"
                  name="In-Phase (I)"
                  domain={[-1, 1]}
                  ticks={[-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]}
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />

                <YAxis
                  type="number"
                  dataKey="y"
                  name="Quadrature (Q)"
                  domain={[-1, 1]}
                  ticks={[-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]}
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#0284c7' }} />

                <Scatter
                  name="Constellation Points"
                  data={validPoints}
                  shape={<ScientificDot />}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Telemetry Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center space-x-3">
          <span>Points: <strong className="text-slate-800">{hasData ? validPoints?.length : 0}</strong></span>
          <span>Scheme: <strong className="text-slate-800">{modulation}</strong></span>
        </div>
        <div>
          <span>Domain: Polar I/Q [-1, 1]</span>
        </div>
      </div>
    </div>
  );
}


