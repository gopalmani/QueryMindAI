'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,  } from 'recharts';

const data = [
  { date: 'Mar 13', production: 820, staging: 210, failed: 14 },
  { date: 'Mar 14', production: 1140, staging: 340, failed: 8 },
  { date: 'Mar 15', production: 980, staging: 290, failed: 22 },
  { date: 'Mar 16', production: 1320, staging: 410, failed: 11 },
  { date: 'Mar 17', production: 760, staging: 180, failed: 6 },
  { date: 'Mar 18', production: 640, staging: 120, failed: 4 },
  { date: 'Mar 19', production: 1580, staging: 520, failed: 31 },
  { date: 'Mar 20', production: 1720, staging: 480, failed: 19 },
  { date: 'Mar 21', production: 1450, staging: 390, failed: 15 },
  { date: 'Mar 22', production: 1890, staging: 560, failed: 28 },
  { date: 'Mar 23', production: 1240, staging: 320, failed: 9 },
  { date: 'Mar 24', production: 2100, staging: 640, failed: 37 },
  { date: 'Mar 25', production: 1960, staging: 590, failed: 21 },
  { date: 'Mar 26', production: 1284, staging: 312, failed: 23 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-4 py-3 shadow-xl"
      style={{ background: 'hsl(222 40% 11%)', borderColor: 'hsl(222 30% 20%)' }}
    >
      <p className="text-xs font-semibold text-slate-300 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={`tooltip-${entry.name}`} className="flex items-center gap-2 text-xs mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-400 capitalize">{entry.name}:</span>
          <span className="font-semibold text-white tabular-nums">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function QueryVolumeChart() {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: 'hsl(222 40% 9%)', borderColor: 'hsl(222 30% 16%)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Query Volume</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(215 20% 45%)' }}>
            Production vs staging executions — last 14 days
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span style={{ color: 'hsl(215 20% 55%)' }}>Production</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
            <span style={{ color: 'hsl(215 20% 55%)' }}>Staging</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span style={{ color: 'hsl(215 20% 55%)' }}>Failed</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradStaging" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 14%)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'hsl(215 20% 40%)', fontSize: 10, fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(215 20% 40%)', fontSize: 10, fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="production" stroke="#3b82f6" strokeWidth={2} fill="url(#gradProd)" />
          <Area type="monotone" dataKey="staging" stroke="#64748b" strokeWidth={1.5} fill="url(#gradStaging)" />
          <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={1.5} fill="url(#gradFailed)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}