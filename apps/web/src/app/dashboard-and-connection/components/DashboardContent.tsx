'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, Zap, BarChart2, Plus, CheckCircle, AlertCircle, Sparkles, ArrowRight,  } from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const metricCards = [
  {
    id: 'total-queries',
    label: 'Total Queries',
    value: '14,208',
    sub: '12% increase this week',
    subIcon: TrendingUp,
    subColor: 'text-green-500',
    bg: 'bg-blue-600',
    textColor: 'text-white',
    subTextColor: 'text-blue-200',
    valueColor: 'text-white',
    labelColor: 'text-blue-200',
    wide: true,
  },
  {
    id: 'successful-conversions',
    label: 'Successful Conversions',
    value: '8,590',
    sub: 'AI Generated',
    subIcon: Zap,
    subColor: 'text-red-500',
    bg: 'bg-white',
    textColor: 'text-gray-900',
    subTextColor: 'text-red-500',
    valueColor: 'text-gray-900',
    labelColor: 'text-gray-500',
    wide: false,
  },
  {
    id: 'avg-latency',
    label: 'Average Latency',
    value: '24ms',
    sub: 'Real-time monitoring active',
    subIcon: BarChart2,
    subColor: 'text-blue-500',
    bg: 'bg-blue-50',
    textColor: 'text-gray-900',
    subTextColor: 'text-gray-500',
    valueColor: 'text-gray-900',
    labelColor: 'text-gray-500',
    wide: false,
  },
];

const databases = [
  {
    id: 'pg-prod',
    name: 'PostgreSQL Production',
    host: 'db-prod-cluster-01.aws-east.com',
    status: 'LIVE',
    statusColor: 'text-red-500',
    statusBg: 'bg-red-50',
    statusDot: 'bg-red-500',
    meta: '342 TABLES',
    avatars: ['AC', 'SR', '+4'],
    icon: '≡',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'marketing-lake',
    name: 'Marketing Data Lake',
    host: 'bq-analytics-marketing-v2',
    status: 'IDLE',
    statusColor: 'text-gray-500',
    statusBg: 'bg-gray-100',
    statusDot: 'bg-gray-400',
    meta: '2.4 TB STORED',
    avatars: ['PM'],
    icon: '▦',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
];

type QueryStatus = 'success' | 'ai' | 'error';

interface QueryRow {
  id: string;
  status: QueryStatus;
  snippet: string;
  meta: string;
  connection: string;
  connectionDot: string;
  execTime: string | null;
  execHighlight?: boolean;
}

const queryRows: QueryRow[] = [
  {
    id: 'q1',
    status: 'success',
    snippet: 'SELECT user_id, count(*) FROM transactions...',
    meta: '2 minutes ago by Alex Chen',
    connection: 'PostgreSQL Production',
    connectionDot: 'bg-blue-500',
    execTime: null,
    execHighlight: true,
  },
  {
    id: 'q2',
    status: 'ai',
    snippet: '"Find all customers who bought item X in last 30 days"',
    meta: 'AI GENERATED · 15 MINUTES AGO',
    connection: 'PostgreSQL Production',
    connectionDot: 'bg-blue-500',
    execTime: '0.8s',
  },
  {
    id: 'q3',
    status: 'error',
    snippet: "DELETE FROM logs WHERE created_at < '2020-01-01'",
    meta: 'Permission Denied · 1 hour ago',
    connection: 'Marketing Data Lake',
    connectionDot: 'bg-yellow-500',
    execTime: '--',
  },
  {
    id: 'q4',
    status: 'success',
    snippet: 'SELECT sum(revenue) FROM monthly_reports...',
    meta: '3 hours ago by Sarah Smith',
    connection: 'Marketing Data Lake',
    connectionDot: 'bg-yellow-500',
    execTime: '4.5s',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: QueryStatus }) {
  if (status === 'success') {
    return (
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-4 h-4 text-blue-600" />
      </div>
    );
  }
  if (status === 'ai') {
    return (
      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-purple-500" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
      <AlertCircle className="w-4 h-4 text-red-500" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'connections' | 'documentation'>('connections');
  const [queryFilter, setQueryFilter] = useState<'All' | 'AI Assisted' | 'Errors'>('All');

  const filteredQueries = queryRows.filter((q) => {
    if (queryFilter === 'All') return true;
    if (queryFilter === 'AI Assisted') return q.status === 'ai';
    if (queryFilter === 'Errors') return q.status === 'error';
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Top Header Bar */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b bg-white flex-shrink-0"
        style={{ borderColor: '#e5e7eb' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-gray-900">Query.AI</span>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm text-gray-400"
            style={{ borderColor: '#e5e7eb', background: '#f9fafb', minWidth: '260px' }}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span>Search queries, tables, or connections...</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'connections' ?'text-blue-600 border-b-2 border-blue-600' :'text-gray-500 hover:text-gray-800'
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setActiveTab('documentation')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'documentation'
                ? 'text-blue-600 border-b-2 border-blue-600' :'text-gray-500 hover:text-gray-800'
            }`}
          >
            Documentation
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Workspace Overview Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workspace Overview</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Manage your intelligent data infrastructure and monitor AI-assisted query performance.
            </p>
          </div>
          <div className="flex items-center gap-6 mt-1">
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Active Connections</p>
              <p className="text-3xl font-bold text-gray-900 leading-tight">12</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">AI Accuracy</p>
              <p className="text-3xl font-bold text-blue-600 leading-tight">98.4%</p>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {metricCards.map((card) => (
            <div
              key={card.id}
              className={`rounded-2xl p-6 ${card.bg} relative overflow-hidden`}
              style={card.bg === 'bg-white' ? { border: '1px solid #e5e7eb' } : {}}
            >
              {/* Background decoration for blue card */}
              {card.id === 'total-queries' && (
                <div className="absolute right-4 top-4 opacity-20">
                  <div className="w-24 h-24 rounded-full border-4 border-white/30" />
                  <div className="w-16 h-16 rounded-full border-4 border-white/20 absolute top-4 right-4" />
                </div>
              )}
              <p className={`text-sm font-medium mb-2 ${card.labelColor}`}>{card.label}</p>
              <p className={`text-5xl font-bold leading-none mb-3 ${card.valueColor}`}>{card.value}</p>
              <div className={`flex items-center gap-1.5 text-sm ${card.subTextColor}`}>
                <card.subIcon className={`w-4 h-4 ${card.subColor}`} />
                <span>{card.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Active Databases */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Active Databases</h2>
            <button className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View All Connections
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {databases.map((db) => (
              <div
                key={db.id}
                className="bg-white rounded-2xl p-5 border hover:shadow-md transition-shadow cursor-pointer"
                style={{ borderColor: '#e5e7eb' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${db.iconBg} flex items-center justify-center`}
                  >
                    <span className={`text-lg font-bold ${db.iconColor}`}>{db.icon}</span>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${db.statusBg} ${db.statusColor}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${db.statusDot}`} />
                    {db.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{db.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{db.host}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wide text-gray-400">{db.meta}</span>
                  <div className="flex items-center gap-1">
                    {db.avatars.map((av, i) => (
                      <div
                        key={`av-${db.id}-${i}`}
                        className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-[9px] font-bold text-blue-700 border-2 border-white -ml-1 first:ml-0"
                      >
                        {av}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Node card */}
            <div
              className="bg-white rounded-2xl p-5 border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              style={{ borderColor: '#d1d5db' }}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-base font-bold text-gray-800">Add New Node</p>
              <p className="text-xs text-gray-400 text-center">Connect MySQL, Redshift, or Snowflake clusters</p>
            </div>
          </div>
        </div>

        {/* Recent Query Intelligence */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Query Intelligence</h2>
            <div className="flex items-center gap-1">
              {(['All', 'AI Assisted', 'Errors'] as const).map((f) => (
                <button
                  key={`filter-${f}`}
                  onClick={() => setQueryFilter(f)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    queryFilter === f
                      ? 'bg-gray-100 text-gray-800 font-medium' :'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
            {/* Table Header */}
            <div
              className="grid grid-cols-12 px-6 py-3 border-b"
              style={{ borderColor: '#f3f4f6', background: '#f9fafb' }}
            >
              <div className="col-span-1 text-[11px] font-semibold tracking-widest uppercase text-gray-400">Status</div>
              <div className="col-span-5 text-[11px] font-semibold tracking-widest uppercase text-gray-400">Query Snippet</div>
              <div className="col-span-4 text-[11px] font-semibold tracking-widest uppercase text-gray-400">Connection</div>
              <div className="col-span-2 text-[11px] font-semibold tracking-widest uppercase text-gray-400 text-right">Execution Time</div>
            </div>

            {/* Rows */}
            {filteredQueries.map((row, idx) => (
              <div
                key={row.id}
                className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors"
                style={{ borderBottom: idx < filteredQueries.length - 1 ? '1px solid #f3f4f6' : 'none' }}
              >
                {/* Status */}
                <div className="col-span-1">
                  <StatusIcon status={row.status} />
                </div>

                {/* Query Snippet */}
                <div className="col-span-5 pr-4">
                  <p
                    className={`text-sm font-mono font-medium leading-snug ${
                      row.status === 'error' ? 'text-gray-700' : 'text-gray-800'
                    }`}
                  >
                    {row.snippet}
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 font-medium ${
                      row.status === 'ai' ?'text-red-500'
                        : row.status === 'error' ?'text-red-500' :'text-gray-400'
                    }`}
                  >
                    {row.meta}
                  </p>
                </div>

                {/* Connection */}
                <div className="col-span-4 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${row.connectionDot}`} />
                  <span className="text-sm text-gray-600">{row.connection}</span>
                </div>

                {/* Execution Time */}
                <div className="col-span-2 flex justify-end">
                  {row.execHighlight ? (
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">{row.execTime}</span>
                  )}
                </div>
              </div>
            ))}

            {/* Show More */}
            <div className="px-6 py-4 border-t text-center" style={{ borderColor: '#f3f4f6' }}>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 tracking-wide uppercase transition-colors">
                Show 50 More Queries
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}