'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  Cloud,
  Database,
  Calendar,
  Tag,
  ChevronDown,
  Clock,
  BarChart2,
  Bookmark,
  Share2,
  Play,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface QueryCard {
  id: string;
  timestamp: string;
  prompt: string;
  sql: string;
  tags: string[];
  executionTime?: string;
  dataScanned?: string;
  status: 'success' | 'failed';
  bookmarked?: boolean;
  shared?: boolean;
  showRunAgain?: boolean;
}

const queryCards: QueryCard[] = [
  {
    id: '1',
    timestamp: '2 mins ago',
    prompt: '"Find the top 10 customers by revenue growth in Q3 2023 comparing to Q3 2022, join with regional office locations."',
    sql: `SELECT c.name, SUM(o.total_price) as growth_revenue, r.office_name
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN regions r ON c.region_id = r.id
WHERE o.order_date BETWEEN '2023-07-01' AND '2023-09-30'
GROUP BY 1, 3
ORDER BY 2 DESC LIMIT 10;`,
    tags: ['#REPORTING', '#QUARTERLY-SYNC'],
    executionTime: '1.2s execution',
    dataScanned: '4.2 MB scanned',
    status: 'success',
    showRunAgain: true,
  },
  {
    id: '2',
    timestamp: '4 hours ago',
    prompt: '"Debug why the latest migration failed for user_profiles table. Show me the last 5 transactions."',
    sql: `SELECT * FROM pg_stat_activity
WHERE query ILIKE '%user_profiles%'
ORDER BY query_start DESC
LIMIT 5;`,
    tags: ['#DEBUG', '#OPS'],
    status: 'failed',
    bookmarked: true,
    shared: true,
  },
  {
    id: '3',
    timestamp: 'Yesterday',
    prompt: '"Analyze average session duration per device type for mobile users in APAC."',
    sql: `SELECT device_type, AVG(duration_ms)/1000/60 as avg_mins
FROM telemetry.sessions
WHERE region = 'APAC' AND platform = 'mobile'
GROUP BY 1;`,
    tags: ['#ANALYTICS', '#MOBILE'],
    status: 'success',
  },
];

function SqlBlock({ code }: { code: string }) {
  const keywords = ['SELECT', 'FROM', 'JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'ON', 'AND', 'AS', 'BETWEEN', 'DESC', 'ILIKE'];

  const highlightLine = (line: string) => {
    let result = line;
    keywords.forEach((kw) => {
      result = result.replace(
        new RegExp(`\\b${kw}\\b`, 'g'),
        `<span style="color:#60a5fa;font-weight:600">${kw}</span>`
      );
    });
    // Highlight strings
    result = result.replace(/'([^']*)'/g, `<span style="color:#86efac">'$1'</span>`);
    // Highlight numbers
    result = result.replace(/\b(\d+)\b/g, `<span style="color:#fbbf24">$1</span>`);
    return result;
  };

  return (
    <div
      className="rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto"
      style={{ background: '#1e2433', border: '1px solid #2d3748' }}
    >
      {code.split('\n').map((line, i) => (
        <div
          key={i}
          dangerouslySetInnerHTML={{ __html: highlightLine(line) || '&nbsp;' }}
          style={{ color: '#e2e8f0' }}
        />
      ))}
    </div>
  );
}

export default function QueryLibraryContent() {
  const [activeTab, setActiveTab] = useState<'all' | 'shared' | 'favorites'>('all');

  return (
    <div className="flex flex-col h-full" style={{ background: '#f9fafb' }}>
      {/* Top Header Bar */}
      <div
        className="flex items-center gap-4 px-6 py-3 border-b flex-shrink-0"
        style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
      >
        <span className="text-base font-bold text-gray-800 mr-2">Query.AI</span>
        <div
          className="flex items-center gap-2 flex-1 max-w-md px-3 py-2 rounded-lg border"
          style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}
        >
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts or SQL..."
            className="flex-1 bg-transparent text-sm text-gray-600 outline-none placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-4 ml-4">
          <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">Connections</button>
          <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">Documentation</button>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <Cloud className="w-5 h-5" />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ background: '#2563eb' }}
          >
            Connect Database
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Page Header + Tabs */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Query Library</h1>
            <p className="text-sm text-gray-500">
              Manage, audit, and reuse your team's computational intelligence
              <br />
              across all connected clusters.
            </p>
          </div>
          {/* Tabs */}
          <div
            className="flex items-center rounded-lg border overflow-hidden"
            style={{ borderColor: '#e5e7eb', background: '#ffffff' }}
          >
            {[
              { key: 'all', label: 'All History' },
              { key: 'shared', label: 'Shared' },
              { key: 'favorites', label: 'Favorites' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'all' | 'shared' | 'favorites')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-gray-100 text-gray-900' :'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <FilterDropdown icon={<Database className="w-4 h-4" />} label="Production Cluster" />
          <FilterDropdown icon={<Calendar className="w-4 h-4" />} label="Last 30 Days" />
          <FilterDropdown icon={<Tag className="w-4 h-4" />} label="Any Tag" />
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <span>Sort by:</span>
            <button className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">
              Most Recent
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Query Cards */}
        <div className="flex flex-col gap-4">
          {queryCards.map((card) => (
            <QueryCardItem key={card.id} card={card} />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-500">
          Showing 42 historical queries •{' '}
          <button className="text-blue-600 font-medium hover:underline">View archive</button>
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      style={{ borderColor: '#e5e7eb', background: '#ffffff' }}
    >
      <span className="text-gray-400">{icon}</span>
      {label}
      <ChevronDown className="w-4 h-4 text-gray-400" />
    </button>
  );
}

function QueryCardItem({ card }: { card: QueryCard }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
    >
      <div className="flex items-start gap-4">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Prompt header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#2563eb' }}>
              PROMPT
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{card.timestamp}</span>
            {(card.bookmarked || card.shared) && (
              <div className="flex items-center gap-2 ml-2">
                {card.bookmarked && (
                  <Bookmark className="w-4 h-4 text-blue-500 fill-blue-500" />
                )}
                {card.shared && (
                  <Share2 className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                )}
              </div>
            )}
          </div>

          {/* Prompt text */}
          <p className="text-base font-semibold text-gray-900 mb-3 leading-snug">
            {card.prompt}
          </p>

          {/* SQL block */}
          <div className="mb-3">
            <SqlBlock code={card.sql} />
          </div>

          {/* Tags + Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md text-xs font-semibold border"
                style={{
                  borderColor: tag === '#QUARTERLY-SYNC' ? '#fbbf24' : '#e5e7eb',
                  color: tag === '#QUARTERLY-SYNC' ? '#d97706' : '#374151',
                  background: tag === '#QUARTERLY-SYNC' ? '#fffbeb' : '#f9fafb',
                }}
              >
                {tag}
              </span>
            ))}

            {card.status === 'success' && card.executionTime && (
              <>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {card.executionTime}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <BarChart2 className="w-3.5 h-3.5" />
                  {card.dataScanned}
                </span>
              </>
            )}

            {card.status === 'failed' && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                Failed to complete
              </span>
            )}
          </div>
        </div>

        {/* Right action buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold whitespace-nowrap transition-colors hover:bg-blue-700"
            style={{ background: '#2563eb' }}
          >
            <ExternalLink className="w-4 h-4" />
            Open in Editor
          </button>
          {card.showRunAgain && (
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#e5e7eb', color: '#374151', background: '#ffffff' }}
            >
              <Play className="w-4 h-4" />
              Run Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
