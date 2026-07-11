'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Plug, Zap, AlertTriangle, Database, BarChart2 } from 'lucide-react';

const metrics = [
  {
    id: 'kpi-active-connections',
    label: 'Active Connections',
    value: '7',
    sub: '2 staging, 5 production',
    trend: '+1 since yesterday',
    trendUp: true,
    icon: Plug,
    color: 'blue',
    span: 'col-span-1',
  },
  {
    id: 'kpi-queries-today',
    label: 'Queries Run Today',
    value: '1,284',
    sub: 'across all connections',
    trend: '+18% vs yesterday',
    trendUp: true,
    icon: Zap,
    color: 'green',
    span: 'col-span-1',
  },
  {
    id: 'kpi-avg-exec-time',
    label: 'Avg Execution Time',
    value: '342ms',
    sub: 'P95: 1.8s',
    trend: '+12% slower vs last week',
    trendUp: false,
    icon: BarChart2,
    color: 'amber',
    span: 'col-span-1',
  },
  {
    id: 'kpi-rows-scanned',
    label: 'Rows Scanned (24h)',
    value: '2.4B',
    sub: '~890 GB data processed',
    trend: '+34% vs yesterday',
    trendUp: true,
    icon: Database,
    color: 'blue',
    span: 'col-span-1',
  },
  {
    id: 'kpi-failed-queries',
    label: 'Failed Queries (24h)',
    value: '23',
    sub: '1.8% error rate',
    trend: '+8 since yesterday',
    trendUp: false,
    icon: AlertTriangle,
    color: 'red',
    span: 'col-span-1',
    alert: true,
  },
];

const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
  blue: { bg: 'rgba(37,99,235,0.08)', icon: 'text-blue-400', badge: 'bg-blue-600/15 text-blue-400' },
  green: { bg: 'rgba(34,197,94,0.08)', icon: 'text-green-400', badge: 'bg-green-600/15 text-green-400' },
  amber: { bg: 'rgba(245,158,11,0.08)', icon: 'text-amber-400', badge: 'bg-amber-600/15 text-amber-400' },
  red: { bg: 'rgba(239,68,68,0.10)', icon: 'text-red-400', badge: 'bg-red-600/15 text-red-400' },
};

export default function KPIGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
      {metrics.map((m) => {
        const colors = colorMap[m.color];
        return (
          <div
            key={m.id}
            className="rounded-xl p-4 border flex flex-col gap-3 relative overflow-hidden"
            style={{
              background: m.alert ? 'rgba(239,68,68,0.06)' : 'hsl(222 40% 9%)',
              borderColor: m.alert ? 'rgba(239,68,68,0.25)' : 'hsl(222 30% 16%)',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: colors.bg }}
              >
                <m.icon className={`w-4 h-4 ${colors.icon}`} />
              </div>
              {m.alert && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                  Alert
                </span>
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide uppercase mb-1" style={{ color: 'hsl(215 20% 45%)' }}>
                {m.label}
              </p>
              <p className="text-2xl font-bold text-white tabular-nums leading-tight">{m.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(215 20% 45%)' }}>{m.sub}</p>
            </div>
            <div className={`flex items-center gap-1 text-[11px] font-medium`}>
              {m.trendUp ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={m.trendUp ? 'text-green-400' : 'text-red-400'}>{m.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}