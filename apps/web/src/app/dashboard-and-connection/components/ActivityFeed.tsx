import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Plug, RefreshCw } from 'lucide-react';

const activities = [
  {
    id: 'act-001',
    type: 'query_success',
    icon: CheckCircle,
    iconColor: 'text-green-400',
    text: 'Query completed on',
    entity: 'prod-postgres-01',
    meta: '2,841 rows · 218ms',
    time: '2m ago',
    user: 'AK',
  },
  {
    id: 'act-002',
    type: 'query_error',
    icon: XCircle,
    iconColor: 'text-red-400',
    text: 'Query failed on',
    entity: 'analytics-redshift',
    meta: 'syntax error near "WHER"',
    time: '7m ago',
    user: 'SR',
  },
  {
    id: 'act-003',
    type: 'connection_added',
    icon: Plug,
    iconColor: 'text-blue-400',
    text: 'New connection added',
    entity: 'staging-mysql-02',
    meta: 'MySQL 8.0 · Staging',
    time: '14m ago',
    user: 'PM',
  },
  {
    id: 'act-004',
    type: 'slow_query',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    text: 'Slow query detected on',
    entity: 'prod-postgres-01',
    meta: 'P95 exceeded · 4.2s',
    time: '31m ago',
    user: 'AK',
  },
  {
    id: 'act-005',
    type: 'schema_refresh',
    icon: RefreshCw,
    iconColor: 'text-slate-400',
    text: 'Schema refreshed for',
    entity: 'analytics-redshift',
    meta: '47 tables updated',
    time: '1h ago',
    user: 'SYS',
  },
  {
    id: 'act-006',
    type: 'query_success',
    icon: CheckCircle,
    iconColor: 'text-green-400',
    text: 'Bulk export completed on',
    entity: 'prod-bigquery-01',
    meta: '1.2M rows · 8.4s',
    time: '2h ago',
    user: 'NP',
  },
  {
    id: 'act-007',
    type: 'query_error',
    icon: XCircle,
    iconColor: 'text-red-400',
    text: 'Query timeout on',
    entity: 'prod-postgres-01',
    meta: 'Exceeded 30s limit',
    time: '3h ago',
    user: 'SR',
  },
];

const userColors: Record<string, string> = {
  AK: 'from-blue-500 to-blue-700',
  SR: 'from-purple-500 to-purple-700',
  PM: 'from-emerald-500 to-emerald-700',
  NP: 'from-amber-500 to-amber-700',
  SYS: 'from-slate-500 to-slate-700',
};

export default function ActivityFeed() {
  return (
    <div
      className="rounded-xl border h-full flex flex-col"
      style={{ background: 'hsl(222 40% 9%)', borderColor: 'hsl(222 30% 16%)' }}
    >
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(222 30% 14%)' }}>
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600/20 text-slate-400 font-medium">Demo data</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-[hsl(222_30%_13%)]">
        {activities.map((item) => (
          <div key={item.id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
            <item.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.text}{' '}
                <span className="font-semibold text-blue-400">{item.entity}</span>
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'hsl(215 20% 45%)' }}>{item.meta}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-[10px]" style={{ color: 'hsl(215 20% 40%)' }}>{item.time}</span>
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${userColors[item.user] || 'from-slate-500 to-slate-700'} flex items-center justify-center`}>
                <span className="text-[8px] font-bold text-white">{item.user}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
