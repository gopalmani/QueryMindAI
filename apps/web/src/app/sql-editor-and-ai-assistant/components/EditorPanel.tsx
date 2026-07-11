'use client';

import React, { useState } from 'react';
import {
  Play,
  Square,
  Save,
  Copy,
  Download,
  ChevronDown,
  Clock,
  AlertCircle,
  CheckCircle,
  Rows,
  Zap,
  MoreHorizontal,
  Plus,
  X,
} from 'lucide-react';

interface QueryTab {
  id: string;
  name: string;
  sql: string;
  connection: string;
  dirty: boolean;
}

const initialTabs: QueryTab[] = [
  {
    id: 'tab-001',
    name: 'user_analysis.sql',
    connection: 'prod-postgres-01',
    dirty: false,
    sql: `-- User retention analysis
-- Finds users who returned within 7 days of signup

SELECT
  DATE_TRUNC('week', u.created_at) AS cohort_week,
  COUNT(DISTINCT u.id) AS total_users,
  COUNT(DISTINCT CASE
    WHEN e.occurred_at BETWEEN u.created_at AND u.created_at + INTERVAL '7 days'
    THEN u.id
  END) AS retained_users,
  ROUND(
    COUNT(DISTINCT CASE
      WHEN e.occurred_at BETWEEN u.created_at AND u.created_at + INTERVAL '7 days'
      THEN u.id
    END)::numeric / NULLIF(COUNT(DISTINCT u.id), 0) * 100, 2
  ) AS retention_rate_pct
FROM users u
LEFT JOIN events e ON e.user_id = u.id
  AND e.event_type = 'app_opened'
WHERE u.created_at >= NOW() - INTERVAL '90 days'
  AND u.is_active = true
GROUP BY 1
ORDER BY 1 DESC
LIMIT 12;`,
  },
  {
    id: 'tab-002',
    name: 'revenue_by_plan.sql',
    connection: 'analytics-redshift',
    dirty: true,
    sql: `-- Monthly revenue breakdown by subscription plan

SELECT
  DATE_TRUNC('month', order_date) AS month,
  c.segment,
  COUNT(DISTINCT o.order_id) AS order_count,
  SUM(o.total_amount) AS gross_revenue,
  AVG(o.total_amount) AS avg_order_value
FROM fact_orders o
JOIN dim_customers c ON c.customer_id = o.customer_id
WHERE o.order_date >= DATEADD(month, -6, CURRENT_DATE)
  AND o.status = 'completed'
GROUP BY 1, 2
ORDER BY 1 DESC, 4 DESC;`,
  },
  {
    id: 'tab-003',
    name: 'scratch.sql',
    connection: 'prod-postgres-01',
    dirty: false,
    sql: `SELECT * FROM organizations LIMIT 100;`,
  },
];

const mockResults = [
  { cohort_week: '2026-03-23', total_users: 1842, retained_users: 1204, retention_rate_pct: '65.36' },
  { cohort_week: '2026-03-16', total_users: 2104, retained_users: 1398, retention_rate_pct: '66.45' },
  { cohort_week: '2026-03-09', total_users: 1967, retained_users: 1241, retention_rate_pct: '63.09' },
  { cohort_week: '2026-03-02', total_users: 2318, retained_users: 1574, retention_rate_pct: '67.90' },
  { cohort_week: '2026-02-23', total_users: 1753, retained_users: 1102, retention_rate_pct: '62.86' },
  { cohort_week: '2026-02-16', total_users: 2089, retained_users: 1387, retention_rate_pct: '66.40' },
  { cohort_week: '2026-02-09', total_users: 1924, retained_users: 1219, retention_rate_pct: '63.36' },
  { cohort_week: '2026-02-02', total_users: 2241, retained_users: 1509, retention_rate_pct: '67.33' },
];

type RunStatus = 'idle' | 'running' | 'success' | 'error';

function syntaxHighlight(sql: string): React.ReactNode[] {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'INNER', 'ON', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'CASE', 'WHEN', 'THEN', 'END', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'ROUND', 'DATE_TRUNC', 'INTERVAL', 'NULLIF', 'NOW', 'BETWEEN', 'WITH', 'INSERT', 'UPDATE', 'DELETE', 'HAVING', 'UNION', 'ALL'];
  const lines = sql.split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/(\s+|[(),;])/);
    return (
      <div key={`line-${li + 1}`} className="flex">
        <span className="select-none w-8 text-right pr-3 flex-shrink-0" style={{ color: 'hsl(215 20% 30%)' }}>
          {li + 1}
        </span>
        <span className="flex-1">
          {parts.map((part, pi) => {
            if (line.trimStart().startsWith('--')) {
              return (
                <span key={`part-${li}-${pi}`} style={{ color: 'hsl(215 20% 45%)' }}>
                  {part}
                </span>
              );
            }
            if (keywords.includes(part.toUpperCase())) {
              return (
                <span key={`part-${li}-${pi}`} className="font-semibold" style={{ color: '#60a5fa' }}>
                  {part}
                </span>
              );
            }
            if (/^'[^']*'$/.test(part)) {
              return (
                <span key={`part-${li}-${pi}`} style={{ color: '#86efac' }}>
                  {part}
                </span>
              );
            }
            if (/^\d+(\.\d+)?$/.test(part)) {
              return (
                <span key={`part-${li}-${pi}`} style={{ color: '#fbbf24' }}>
                  {part}
                </span>
              );
            }
            return (
              <span key={`part-${li}-${pi}`} style={{ color: '#e2e8f0' }}>
                {part}
              </span>
            );
          })}
        </span>
      </div>
    );
  });
}

export default function EditorPanel() {
  const [tabs, setTabs] = useState<QueryTab[]>(initialTabs);
  const [activeTab, setActiveTab] = useState('tab-001');
  const [runStatus, setRunStatus] = useState<RunStatus>('success');
  const [showResults, setShowResults] = useState(true);
  const [resultTab, setResultTab] = useState<'results' | 'messages' | 'history'>('results');
  const [copied, setCopied] = useState(false);

  const activeQuery = tabs.find((t) => t.id === activeTab);

  const handleRun = async () => {
    setRunStatus('running');
    setShowResults(true);
    // Backend integration point: POST /api/query/execute
    await new Promise((r) => setTimeout(r, 1800));
    setRunStatus('success');
    setResultTab('results');
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) {
      setActiveTab(newTabs[Math.max(0, idx - 1)].id);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Tabs row */}
      <div
        className="flex items-center border-b flex-shrink-0 overflow-x-auto scrollbar-thin"
        style={{ background: 'hsl(222 40% 8%)', borderColor: 'hsl(222 30% 14%)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-r flex-shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-b-blue-500' :'text-slate-500 hover:text-slate-300'
            }`}
            style={{
              background: activeTab === tab.id ? 'hsl(222 47% 6%)' : 'transparent',
              borderRightColor: 'hsl(222 30% 14%)',
            }}
          >
            <span className="truncate max-w-[120px]">{tab.name}</span>
            {tab.dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
            <span
              onClick={(e) => closeTab(tab.id, e)}
              className="ml-0.5 p-0.5 rounded hover:bg-white/10 text-slate-600 hover:text-slate-300 transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        ))}
        <button className="px-3 py-2.5 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
        style={{ background: 'hsl(222 40% 8%)', borderColor: 'hsl(222 30% 14%)' }}
      >
        {/* Connection selector */}
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors hover:bg-white/5"
          style={{ borderColor: 'hsl(222 30% 20%)', color: 'hsl(215 20% 65%)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          {activeQuery?.connection}
          <ChevronDown className="w-3 h-3 ml-0.5" />
        </button>

        <div className="flex-1" />

        {/* Action buttons */}
        <button
          onClick={handleCopy}
          title="Copy SQL"
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
          style={{ color: copied ? '#4ade80' : 'hsl(215 20% 50%)' }}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button title="Save query" className="p-1.5 rounded-md hover:bg-white/10 transition-colors" style={{ color: 'hsl(215 20% 50%)' }}>
          <Save className="w-3.5 h-3.5" />
        </button>
        <button title="Export results" className="p-1.5 rounded-md hover:bg-white/10 transition-colors" style={{ color: 'hsl(215 20% 50%)' }}>
          <Download className="w-3.5 h-3.5" />
        </button>
        <button title="More options" className="p-1.5 rounded-md hover:bg-white/10 transition-colors" style={{ color: 'hsl(215 20% 50%)' }}>
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'hsl(222 30% 18%)' }} />

        {/* Run button */}
        {runStatus === 'running' ? (
          <button
            onClick={() => setRunStatus('idle')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-600/30 text-xs font-semibold hover:bg-red-600/30 transition-colors active:scale-95"
          >
            <Square className="w-3 h-3" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <Play className="w-3 h-3" />
            Run Query
          </button>
        )}
      </div>

      {/* SQL Editor */}
      <div
        className="flex-1 overflow-auto scrollbar-thin p-4 font-mono text-xs leading-relaxed min-h-0"
        style={{ background: 'hsl(222 47% 6%)' }}
      >
        {activeQuery && syntaxHighlight(activeQuery.sql)}
      </div>

      {/* Results panel */}
      {showResults && (
        <div
          className="flex flex-col border-t flex-shrink-0"
          style={{
            background: 'hsl(222 40% 8%)',
            borderColor: 'hsl(222 30% 14%)',
            height: '280px',
          }}
        >
          {/* Results header */}
          <div className="flex items-center gap-1 px-3 py-2 border-b flex-shrink-0" style={{ borderColor: 'hsl(222 30% 14%)' }}>
            {(['results', 'messages', 'history'] as const).map((tab) => (
              <button
                key={`rtab-${tab}`}
                onClick={() => setResultTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  resultTab === tab
                    ? 'bg-blue-600/20 text-blue-400' :'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="flex-1" />
            {runStatus === 'success' && (
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span className="font-medium">8 rows</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: 'hsl(215 20% 50%)' }}>
                  <Clock className="w-3 h-3" />
                  <span>218ms</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: 'hsl(215 20% 50%)' }}>
                  <Rows className="w-3 h-3" />
                  <span>2,841 scanned</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: 'hsl(215 20% 50%)' }}>
                  <Zap className="w-3 h-3" />
                  <span>Seq Scan</span>
                </div>
              </div>
            )}
            {runStatus === 'running' && (
              <div className="flex items-center gap-1.5 text-[11px] text-blue-400">
                <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                Executing...
              </div>
            )}
            {runStatus === 'error' && (
              <div className="flex items-center gap-1 text-[11px] text-red-400">
                <AlertCircle className="w-3 h-3" />
                Query error
              </div>
            )}
          </div>

          {/* Results content */}
          <div className="flex-1 overflow-auto scrollbar-thin">
            {resultTab === 'results' && runStatus === 'success' && (
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'hsl(222 40% 9%)', borderBottom: '1px solid hsl(222 30% 14%)' }}>
                    {Object.keys(mockResults[0]).map((col) => (
                      <th key={`res-th-${col}`} className="px-4 py-2 text-left font-semibold text-[10px] uppercase tracking-wide whitespace-nowrap" style={{ color: 'hsl(215 20% 50%)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockResults.map((row, ri) => (
                    <tr
                      key={`res-row-${ri + 1}`}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: '1px solid hsl(222 30% 11%)' }}
                    >
                      {Object.values(row).map((val, vi) => (
                        <td key={`res-cell-${ri}-${vi}`} className="px-4 py-2 font-mono whitespace-nowrap" style={{ color: typeof val === 'number' ? '#93c5fd' : '#e2e8f0' }}>
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {resultTab === 'results' && runStatus === 'running' && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-xs text-slate-500">Running query on prod-postgres-01...</p>
                </div>
              </div>
            )}
            {resultTab === 'results' && runStatus === 'idle' && (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-slate-600">Run a query to see results</p>
              </div>
            )}
            {resultTab === 'messages' && (
              <div className="p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-400 font-medium">Query executed successfully</p>
                    <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'hsl(215 20% 50%)' }}>
                      SELECT — 8 rows returned in 218ms. Planning: 0.4ms, Execution: 217.6ms.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {resultTab === 'history' && (
              <div className="p-2 space-y-1">
                {[
                  { time: '03:54:12', sql: 'SELECT DATE_TRUNC(\'week\'...', duration: '218ms', status: 'success' },
                  { time: '03:51:08', sql: 'SELECT * FROM organizations LIMIT 100', duration: '12ms', status: 'success' },
                  { time: '03:48:33', sql: 'UPDATE users SET is_active = false WHER...', duration: '—', status: 'error' },
                  { time: '03:42:17', sql: 'SELECT COUNT(*) FROM events WHERE...', duration: '1.2s', status: 'success' },
                ].map((h, hi) => (
                  <div key={`hist-${hi + 1}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${h.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{h.time}</span>
                    <span className="text-[11px] font-mono text-slate-400 truncate flex-1">{h.sql}</span>
                    <span className="text-[10px] text-slate-600 flex-shrink-0">{h.duration}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}