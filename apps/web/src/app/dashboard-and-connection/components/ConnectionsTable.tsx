'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Plug,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  type: string;
  host: string;
  database: string;
  env: 'Production' | 'Staging' | 'Development';
  status: 'Connected' | 'Failed' | 'Degraded';
  latency: number;
  queriesDay: number;
  lastUsed: string;
  owner: string;
  version: string;
}

const connections: Connection[] = [
  {
    id: 'conn-001', name: 'prod-postgres-01', type: 'PostgreSQL', host: 'db-prod-01.internal:5432',
    database: 'analytics_core', env: 'Production', status: 'Connected', latency: 12, queriesDay: 847,
    lastUsed: '2m ago', owner: 'Arjun Kumar', version: '15.4',
  },
  {
    id: 'conn-002', name: 'analytics-redshift', type: 'Redshift', host: 'cluster.us-east-1.redshift.amazonaws.com',
    database: 'dw_prod', env: 'Production', status: 'Degraded', latency: 340, queriesDay: 213,
    lastUsed: '7m ago', owner: 'Sneha Reddy', version: '1.0.50780',
  },
  {
    id: 'conn-003', name: 'staging-mysql-02', type: 'MySQL', host: 'mysql-staging.internal:3306',
    database: 'app_staging', env: 'Staging', status: 'Connected', latency: 8, queriesDay: 124,
    lastUsed: '14m ago', owner: 'Priya Menon', version: '8.0.33',
  },
  {
    id: 'conn-004', name: 'prod-bigquery-01', type: 'BigQuery', host: 'bigquery.googleapis.com',
    database: 'analytics-prod-gcp', env: 'Production', status: 'Connected', latency: 180, queriesDay: 312,
    lastUsed: '1h ago', owner: 'Nikhil Patel', version: 'v2',
  },
  {
    id: 'conn-005', name: 'dev-sqlite-local', type: 'SQLite', host: 'localhost',
    database: 'dev_sandbox.db', env: 'Development', status: 'Connected', latency: 1, queriesDay: 56,
    lastUsed: '3h ago', owner: 'Arjun Kumar', version: '3.43.2',
  },
  {
    id: 'conn-006', name: 'staging-snowflake', type: 'Snowflake', host: 'xy12345.snowflakecomputing.com',
    database: 'STAGING_DB', env: 'Staging', status: 'Failed', latency: 0, queriesDay: 0,
    lastUsed: '6h ago', owner: 'Sneha Reddy', version: '7.44',
  },
  {
    id: 'conn-007', name: 'prod-mongodb-01', type: 'MongoDB', host: 'mongo-prod.cluster.internal:27017',
    database: 'events_store', env: 'Production', status: 'Connected', latency: 24, queriesDay: 189,
    lastUsed: '22m ago', owner: 'Priya Menon', version: '6.0.8',
  },
];

const statusConfig = {
  Connected: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Connected' },
  Failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Failed' },
  Degraded: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Degraded' },
};

const envConfig = {
  Production: 'bg-blue-600/15 text-blue-400',
  Staging: 'bg-amber-600/15 text-amber-400',
  Development: 'bg-slate-600/20 text-slate-400',
};

const dbTypeColors: Record<string, string> = {
  PostgreSQL: 'bg-sky-600/15 text-sky-400',
  Redshift: 'bg-red-600/15 text-red-400',
  MySQL: 'bg-orange-600/15 text-orange-400',
  BigQuery: 'bg-blue-600/15 text-blue-400',
  SQLite: 'bg-slate-600/15 text-slate-400',
  Snowflake: 'bg-cyan-600/15 text-cyan-400',
  MongoDB: 'bg-green-600/15 text-green-400',
};

export default function ConnectionsTable() {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<keyof Connection>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [envFilter, setEnvFilter] = useState<string>('All');

  const handleSort = (col: keyof Connection) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filtered = connections
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.type.toLowerCase().includes(search.toLowerCase()) ||
        c.database.toLowerCase().includes(search.toLowerCase());
      const matchEnv = envFilter === 'All' || c.env === envFilter;
      return matchSearch && matchEnv;
    })
    .sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ col }: { col: keyof Connection }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`w-2.5 h-2.5 -mb-0.5 ${sortCol === col && sortDir === 'asc' ? 'text-blue-400' : 'text-slate-600'}`} />
      <ChevronDown className={`w-2.5 h-2.5 ${sortCol === col && sortDir === 'desc' ? 'text-blue-400' : 'text-slate-600'}`} />
    </span>
  );

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: 'hsl(222 40% 9%)', borderColor: 'hsl(222 30% 16%)' }}
    >
      {/* Table header */}
      <div className="px-5 py-4 flex items-center justify-between gap-3 border-b flex-wrap" style={{ borderColor: 'hsl(222 30% 14%)' }}>
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Database Connections</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/15 text-blue-400 font-medium tabular-nums">
            {connections.length}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Env filter */}
          <div className="flex items-center gap-1">
            {['All', 'Production', 'Staging', 'Development'].map((env) => (
              <button
                key={`env-${env}`}
                onClick={() => setEnvFilter(env)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  envFilter === env
                    ? 'bg-blue-600/20 text-blue-400' :'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'hsl(215 20% 45%)' }} />
            <input
              type="text"
              placeholder="Search connections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border bg-transparent text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors w-44"
              style={{ borderColor: 'hsl(222 30% 20%)' }}
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors hover:bg-white/5"
            style={{ borderColor: 'hsl(222 30% 20%)', color: 'hsl(215 20% 55%)' }}>
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors active:scale-95">
            <Plus className="w-3 h-3" />
            Add Connection
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(222 30% 14%)', background: 'hsl(222 40% 8%)' }}>
              {[
                { label: 'Connection', col: 'name' as keyof Connection },
                { label: 'Type', col: 'type' as keyof Connection },
                { label: 'Environment', col: 'env' as keyof Connection },
                { label: 'Status', col: 'status' as keyof Connection },
                { label: 'Latency', col: 'latency' as keyof Connection },
                { label: 'Queries / Day', col: 'queriesDay' as keyof Connection },
                { label: 'Database', col: 'database' as keyof Connection },
                { label: 'Last Used', col: 'lastUsed' as keyof Connection },
                { label: 'Owner', col: 'owner' as keyof Connection },
              ].map(({ label, col }) => (
                <th
                  key={`th-${col}`}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 text-left text-[11px] font-semibold tracking-wide uppercase cursor-pointer select-none whitespace-nowrap"
                  style={{ color: 'hsl(215 20% 45%)' }}
                >
                  <span className="inline-flex items-center gap-0.5 hover:text-slate-300 transition-colors">
                    {label}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'hsl(215 20% 45%)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <Plug className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm font-medium text-slate-500">No connections match your search</p>
                  <p className="text-xs text-slate-600 mt-1">Try adjusting the filter or search term</p>
                </td>
              </tr>
            ) : (
              filtered.map((conn, idx) => {
                const sc = statusConfig[conn.status];
                const isHovered = hoveredRow === conn.id;
                return (
                  <tr
                    key={conn.id}
                    onMouseEnter={() => setHoveredRow(conn.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="transition-colors"
                    style={{
                      background: isHovered ? 'rgba(255,255,255,0.025)' : idx % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent',
                      borderBottom: '1px solid hsl(222 30% 13%)',
                    }}
                  >
                    {/* Name */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: conn.status === 'Connected' ? '#4ade80' : conn.status === 'Failed' ? '#f87171' : '#fbbf24' }} />
                        <span className="text-xs font-semibold text-white font-mono">{conn.name}</span>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${dbTypeColors[conn.type] || 'bg-slate-600/15 text-slate-400'}`}>
                        {conn.type}
                      </span>
                    </td>
                    {/* Env */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${envConfig[conn.env]}`}>
                        {conn.env}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    {/* Latency */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold tabular-nums ${conn.latency === 0 ? 'text-slate-600' : conn.latency > 200 ? 'text-amber-400' : 'text-green-400'}`}>
                        {conn.latency === 0 ? '—' : `${conn.latency}ms`}
                      </span>
                    </td>
                    {/* Queries */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-300 tabular-nums font-medium">
                        {conn.queriesDay.toLocaleString()}
                      </span>
                    </td>
                    {/* Database */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-400 font-mono truncate max-w-[140px] block">{conn.database}</span>
                    </td>
                    {/* Last used */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs" style={{ color: 'hsl(215 20% 50%)' }}>{conn.lastUsed}</span>
                    </td>
                    {/* Owner */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-400">{conn.owner}</span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className={`flex items-center justify-end gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <button title="Edit connection" className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button title="Delete connection — this cannot be undone" className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button title="More options" className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="px-5 py-3 flex items-center justify-between border-t"
        style={{ borderColor: 'hsl(222 30% 14%)' }}
      >
        <p className="text-xs" style={{ color: 'hsl(215 20% 45%)' }}>
          Showing {filtered.length} of {connections.length} connections
        </p>
        <div className="flex items-center gap-1">
          {[1].map((page) => (
            <button
              key={`page-${page}`}
              className="w-7 h-7 text-xs rounded-md bg-blue-600/20 text-blue-400 font-semibold"
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}