'use client';

import React, { useState } from 'react';
import { RefreshCw, Download, Play, ChevronRight, Database, Key, Mail, DollarSign, Grid3X3, Code2, SlidersHorizontal, ChevronLeft, Sparkles,  } from 'lucide-react';

interface SchemaItem {
  name: string;
  type: 'table' | 'view';
  selected?: boolean;
}

interface Schema {
  name: string;
  expanded: boolean;
  items?: SchemaItem[];
}

const initialSchemas: Schema[] = [
  {
    name: 'production_db',
    expanded: true,
    items: [
      { name: 'orders_v2', type: 'table', selected: true },
      { name: 'customer_profiles', type: 'table' },
      { name: 'revenue_daily_view', type: 'view' },
      { name: 'inventory_tracking', type: 'table' },
    ],
  },
  { name: 'staging_analytics', expanded: false },
  { name: 'raw_events', expanded: false },
];

const columnData = [
  {
    name: 'order_id',
    type: 'UUID',
    badge: 'PK',
    badgeColor: 'bg-gray-100 text-gray-600',
    icon: <Key className="w-3.5 h-3.5 text-gray-400" />,
    detail: 'Unique constraint enforced',
    fill: 100,
    fillLabel: '100% Non-null',
  },
  {
    name: 'customer_email',
    type: 'VARCHAR(255)',
    badge: null,
    icon: <Mail className="w-3.5 h-3.5 text-gray-400" />,
    detail: 'Email pattern validation',
    fill: 98.2,
    fillLabel: '98.2% Filled',
  },
  {
    name: 'amount_usd',
    type: 'DECIMAL(12,2)',
    badge: null,
    icon: <DollarSign className="w-3.5 h-3.5 text-gray-400" />,
    detail: 'Range: $0.00 - $14k',
    fill: 100,
    fillLabel: '100% Non-null',
  },
];

const previewRows = [
  {
    id: 1,
    orderId: '550e8400-e29...',
    createdAt: '2023-11-21 09:12:04',
    customerId: 'USR_8829',
    status: 'COMPLETED',
    amountUsd: '$129.40',
  },
  {
    id: 2,
    orderId: '7e21124a-f38...',
    createdAt: '2023-11-21 09:15:22',
    customerId: 'USR_1042',
    status: 'SHIPPED',
    amountUsd: '$2,450.00',
  },
  {
    id: 3,
    orderId: 'bf12c40c-372...',
    createdAt: '2023-11-21 10:01:05',
    customerId: 'USR_9001',
    status: 'PENDING',
    amountUsd: '$89.12',
  },
  {
    id: 4,
    orderId: 'a1288c12-f38...',
    createdAt: '2023-11-21 10:04:44',
    customerId: 'USR_4211',
    status: 'COMPLETED',
    amountUsd: '$552.00',
  },
  {
    id: 5,
    orderId: 'd4422e1a-c71...',
    createdAt: '2023-11-21 10:12:11',
    customerId: 'USR_3321',
    status: 'CANCELLED',
    amountUsd: '$34.50',
  },
];

const statusConfig: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
  SHIPPED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
};

const tabs = ['Columns & Types', 'Sample Data', 'Dependencies', 'Permissions'];

export default function DatabaseBrowserContent() {
  const [schemas, setSchemas] = useState<Schema[]>(initialSchemas);
  const [activeTab, setActiveTab] = useState('Columns & Types');
  const [previewMode, setPreviewMode] = useState<'Grid' | 'JSON'>('Grid');
  const [promptValue, setPromptValue] = useState('');

  const toggleSchema = (name: string) => {
    setSchemas((prev) =>
      prev.map((s) => (s.name === name ? { ...s, expanded: !s.expanded } : s))
    );
  };

  return (
    <div className="flex h-full" style={{ background: '#f9fafb' }}>
      {/* Top Header */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b bg-white flex-shrink-0"
          style={{ borderColor: '#e5e7eb' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900">Query.AI</span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ background: '#eff6ff', color: '#2563eb' }}
            >
              V4.2
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-400"
              style={{ borderColor: '#e5e7eb', background: '#f9fafb', minWidth: '220px' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search tables, schemas...
            </div>
            <nav className="flex items-center gap-5 text-sm text-gray-600">
              <button className="hover:text-gray-900 transition-colors">Connections</button>
              <button className="hover:text-gray-900 transition-colors">Documentation</button>
            </nav>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </button>
            </div>
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              style={{ background: '#2563eb' }}
            >
              Connect Database
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Schemas Panel */}
          <div
            className="flex flex-col border-r flex-shrink-0 overflow-y-auto"
            style={{ width: '240px', borderColor: '#e5e7eb', background: '#ffffff' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#e5e7eb' }}>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-500">Schemas</span>
              <button className="p-1 rounded hover:bg-gray-100">
                <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            <div className="py-2">
              {schemas.map((schema) => (
                <div key={schema.name}>
                  <button
                    onClick={() => toggleSchema(schema.name)}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${schema.expanded ? 'rotate-90' : ''}`}
                    />
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">{schema.name}</span>
                  </button>

                  {schema.expanded && schema.items && (
                    <div className="ml-4">
                      {schema.items.map((item) => (
                        <button
                          key={item.name}
                          className={`w-full flex items-center gap-2 px-4 py-2 transition-colors rounded-lg mx-1 ${
                            item.selected
                              ? 'bg-blue-50' :'hover:bg-gray-50'
                          }`}
                          style={{ width: 'calc(100% - 8px)' }}
                        >
                          {item.type === 'view' ? (
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                          ) : (
                            <Grid3X3 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm flex-1 text-left ${
                              item.selected ? 'text-blue-600 font-semibold' : 'text-gray-600'
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.type === 'view' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#fff7ed', color: '#ea580c' }}>
                              VIEW
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Panel */}
          <div className="flex-1 overflow-y-auto p-6 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
              <span className="hover:text-blue-600 cursor-pointer">production_db</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-800 font-medium">orders_v2</span>
            </div>

            {/* Title Row */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">orders_v2</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    PostgreSQL 14.2
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Updated 4m ago
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4s8 1.79 8 4" />
                    </svg>
                    1.4 GB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#d1d5db' }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  style={{ background: '#2563eb' }}
                >
                  <Play className="w-4 h-4 fill-white" />
                  Run Query
                </button>
              </div>
            </div>

            {/* AI Prompt Section */}
            <div
              className="rounded-xl p-5 mb-6"
              style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#2563eb' }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Prompt to Query this Table</p>
                  <p className="text-sm text-gray-500">Let Query.AI write the SQL for you based on natural language.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="e.g., Show me total revenue by month for the last year..."
                  className="flex-1 px-4 py-2.5 rounded-lg border text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db', background: '#ffffff' }}
                />
                <button
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:bg-blue-700 flex-shrink-0"
                  style={{ background: '#2563eb' }}
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 border-b mb-6" style={{ borderColor: '#e5e7eb' }}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Column Cards */}
            {activeTab === 'Columns & Types' && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {columnData.map((col) => (
                    <div
                      key={col.name}
                      className="rounded-xl p-4 border"
                      style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-900">{col.name}</span>
                        {col.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${col.badgeColor}`}>
                            {col.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{col.type}</p>
                      <div className="flex items-center gap-1.5 mb-3">
                        {col.icon}
                        <span className="text-xs text-gray-500">{col.detail}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full mb-1.5" style={{ background: '#e5e7eb' }}>
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${col.fill}%`, background: '#2563eb' }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 text-right">{col.fillLabel}</p>
                    </div>
                  ))}
                </div>

                {/* Preview Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700 tracking-wider uppercase">
                      Preview (Top 50 Rows)
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: '#d1d5db' }}>
                        <button
                          onClick={() => setPreviewMode('Grid')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                            previewMode === 'Grid' ?'bg-white text-gray-800' :'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <Grid3X3 className="w-3.5 h-3.5" />
                          Grid
                        </button>
                        <button
                          onClick={() => setPreviewMode('JSON')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors border-l ${
                            previewMode === 'JSON' ?'bg-white text-gray-800' :'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                          style={{ borderColor: '#d1d5db' }}
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          JSON
                        </button>
                      </div>
                      <button className="p-1.5 rounded-lg border hover:bg-gray-50" style={{ borderColor: '#d1d5db' }}>
                        <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-10">#</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">order_id</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">created_at</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">customer_id</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">status</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">amount_usd</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row) => (
                          <tr
                            key={row.id}
                            className="border-t hover:bg-gray-50 transition-colors"
                            style={{ borderColor: '#f3f4f6' }}
                          >
                            <td className="px-4 py-3 text-gray-400 text-xs">{row.id}</td>
                            <td className="px-4 py-3">
                              <span className="text-blue-600 font-mono text-xs hover:underline cursor-pointer">
                                {row.orderId}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs font-mono">{row.createdAt}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{row.customerId}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                  statusConfig[row.status]?.bg
                                } ${statusConfig[row.status]?.text}`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-800 text-xs font-semibold">
                              {row.amountUsd}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div
                      className="flex items-center justify-between px-4 py-3 border-t"
                      style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}
                    >
                      <span className="text-xs text-gray-500">Showing 5 of 8,241 results</span>
                      <div className="flex items-center gap-2">
                        <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                          <ChevronLeft className="w-4 h-4 text-gray-500" />
                        </button>
                        <span className="text-xs text-gray-600 font-medium">Page 1 of 1,648</span>
                        <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab !== 'Columns & Types' && (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                {activeTab} content coming soon
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
