'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Copy, RefreshCw, ChevronDown, Lightbulb, Code2, ThumbsUp, ThumbsDown,  } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  type?: 'suggestion' | 'explanation' | 'error' | 'optimization';
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: 'msg-001',
    role: 'assistant',
    content: 'Hello! I\'m your QueryMind AI assistant. I can help you write SQL, optimize queries, explain schemas, and debug errors. I\'m connected to **prod-postgres-01**.',
    timestamp: '03:50',
  },
  {
    id: 'msg-002',
    role: 'user',
    content: 'Can you optimize the retention query? It\'s taking too long on large date ranges.',
    timestamp: '03:52',
  },
  {
    id: 'msg-003',
    role: 'assistant',
    type: 'optimization',
    content: 'I found two performance issues in your retention query:\n\n1. **Missing index** on `events.user_id` + `events.occurred_at` — the join is doing a sequential scan on 89M rows.\n2. **NULLIF in SELECT** is fine, but the `BETWEEN` on `occurred_at` can be rewritten as a range condition for better index use.\n\nHere\'s the optimized version:',
    sql: `-- Optimized: uses composite index on (user_id, occurred_at)
-- Add index: CREATE INDEX CONCURRENTLY idx_events_user_time
--   ON events(user_id, occurred_at) WHERE occurred_at > NOW() - INTERVAL '90 days';

SELECT
  DATE_TRUNC('week', u.created_at) AS cohort_week,
  COUNT(DISTINCT u.id) AS total_users,
  COUNT(DISTINCT e.user_id) AS retained_users,
  ROUND(COUNT(DISTINCT e.user_id)::numeric /
    NULLIF(COUNT(DISTINCT u.id), 0) * 100, 2) AS retention_rate_pct
FROM users u
LEFT JOIN events e ON e.user_id = u.id
  AND e.event_type = 'app_opened'
  AND e.occurred_at >= u.created_at
  AND e.occurred_at < u.created_at + INTERVAL '7 days'
WHERE u.created_at >= NOW() - INTERVAL '90 days'
  AND u.is_active = true
GROUP BY 1
ORDER BY 1 DESC
LIMIT 12;`,
    timestamp: '03:52',
  },
  {
    id: 'msg-004',
    role: 'user',
    content: 'What indexes exist on the events table?',
    timestamp: '03:53',
  },
  {
    id: 'msg-005',
    role: 'assistant',
    type: 'explanation',
    content: 'Running schema introspection on `public.events`...\n\nCurrent indexes on **events**:\n- `events_pkey` — PRIMARY KEY on `event_id` (btree)\n- `idx_events_user_id` — btree on `user_id` only\n- `idx_events_type_time` — btree on `(event_type, occurred_at)`\n\n**Missing:** A composite index on `(user_id, occurred_at)` — this is exactly what your retention query needs. Estimated query speedup: **8–12×** for 90-day windows.',
    timestamp: '03:53',
  },
];

const suggestions = [
  'Explain the EXPLAIN ANALYZE output',
  'Find slow queries in pg_stat_statements',
  'Generate a cohort retention heatmap query',
  'Check for table bloat and dead tuples',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    // Backend integration point: POST /api/ai/chat with {message, context: {connection, schema, currentSql}}
    await new Promise((r) => setTimeout(r, 1800));
    const assistantMsg: Message = {
      id: `msg-ai-${Date.now()}`,
      role: 'assistant',
      content: 'I\'ve analyzed your query and the current schema context. The `organizations` table has a foreign key relationship with `users.org_id`. For better join performance, consider adding a partial index on `users.org_id` where `is_active = true` — this will reduce the index size by ~40% based on your current data distribution.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  const handleCopySQL = (msgId: string) => {
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSuggestion = (s: string) => setInput(s);

  return (
    <div
      className="w-72 flex-shrink-0 flex flex-col border-l overflow-hidden"
      style={{ background: 'hsl(222 40% 8%)', borderColor: 'hsl(222 30% 14%)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'hsl(222 30% 14%)' }}>
        <div className="w-6 h-6 rounded-lg bg-blue-600/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-white">AI Assistant</p>
          <p className="text-[10px]" style={{ color: 'hsl(215 20% 45%)' }}>Schema Engine · GPT-4o</p>
        </div>
        <button className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: 'hsl(215 20% 50%)' }}>
          <RefreshCw className="w-3 h-3" />
        </button>
        <button className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: 'hsl(215 20% 50%)' }}>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Context bar */}
      <div
        className="px-3 py-2 border-b flex items-center gap-1.5 flex-shrink-0"
        style={{ background: 'hsl(222 40% 7%)', borderColor: 'hsl(222 30% 13%)' }}
      >
        <Code2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
        <span className="text-[10px] font-mono text-slate-500 truncate">
          Context: prod-postgres-01 · public.users, events
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-4 h-4 rounded bg-blue-600/30 flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                </div>
                {msg.type && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{
                    background: msg.type === 'optimization' ? 'rgba(251,191,36,0.1)' : msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                    color: msg.type === 'optimization' ? '#fbbf24' : msg.type === 'error' ? '#f87171' : '#60a5fa',
                  }}>
                    {msg.type}
                  </span>
                )}
              </div>
            )}
            <div
              className={`max-w-full rounded-xl px-3 py-2.5 text-[11px] leading-relaxed ${
                msg.role === 'user' ?'bg-blue-600/20 text-blue-100 rounded-tr-sm' :'rounded-tl-sm'
              }`}
              style={msg.role === 'assistant' ? { background: 'hsl(222 40% 11%)', color: 'hsl(213 31% 82%)' } : {}}
            >
              <p className="whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                {msg.content.replace(/\*\*([^*]+)\*\*/g, '$1')}
              </p>
            </div>

            {/* SQL block */}
            {msg.sql && (
              <div
                className="w-full rounded-lg overflow-hidden border"
                style={{ borderColor: 'hsl(222 30% 18%)' }}
              >
                <div
                  className="flex items-center justify-between px-3 py-1.5"
                  style={{ background: 'hsl(222 40% 7%)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-semibold text-amber-400">Optimized SQL</span>
                  </div>
                  <button
                    onClick={() => handleCopySQL(msg.id)}
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/10"
                    style={{ color: copiedId === msg.id ? '#4ade80' : 'hsl(215 20% 50%)' }}
                  >
                    <Copy className="w-2.5 h-2.5" />
                    {copiedId === msg.id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div
                  className="p-3 overflow-x-auto scrollbar-thin"
                  style={{ background: 'hsl(222 47% 6%)' }}
                >
                  <pre className="text-[10px] font-mono leading-relaxed whitespace-pre" style={{ color: '#94a3b8' }}>
                    {msg.sql.slice(0, 300)}{msg.sql.length > 300 ? '...' : ''}
                  </pre>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 border-t" style={{ borderColor: 'hsl(222 30% 14%)', background: 'hsl(222 40% 7%)' }}>
                  <button className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 transition-colors font-medium">
                    <Code2 className="w-2.5 h-2.5" />
                    Apply to Editor
                  </button>
                </div>
              </div>
            )}

            {/* Feedback for assistant messages */}
            {msg.role === 'assistant' && !isTyping && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px]" style={{ color: 'hsl(215 20% 35%)' }}>{msg.timestamp}</span>
                <button className="p-0.5 rounded hover:bg-white/10 transition-colors ml-1" style={{ color: 'hsl(215 20% 40%)' }}>
                  <ThumbsUp className="w-2.5 h-2.5" />
                </button>
                <button className="p-0.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'hsl(215 20% 40%)' }}>
                  <ThumbsDown className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            {msg.role === 'user' && (
              <span className="text-[9px]" style={{ color: 'hsl(215 20% 35%)' }}>{msg.timestamp}</span>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 rounded bg-blue-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-2.5 h-2.5 text-blue-400" />
            </div>
            <div
              className="rounded-xl rounded-tl-sm px-3 py-2.5"
              style={{ background: 'hsl(222 40% 11%)' }}
            >
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={`dot-${i}`}
                    className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <div className="px-3 py-2 border-t flex-shrink-0" style={{ borderColor: 'hsl(222 30% 13%)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'hsl(215 20% 40%)' }}>
          Suggestions
        </p>
        <div className="space-y-1">
          {suggestions.map((s) => (
            <button
              key={`sug-${s}`}
              onClick={() => handleSuggestion(s)}
              className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/5 flex items-center gap-2"
              style={{ color: 'hsl(215 20% 55%)' }}
            >
              <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t flex-shrink-0" style={{ borderColor: 'hsl(222 30% 14%)' }}>
        <div
          className="flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors focus-within:border-blue-500/50"
          style={{ background: 'hsl(222 47% 6%)', borderColor: 'hsl(222 30% 18%)' }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your schema, query, or data..."
            rows={2}
            className="flex-1 bg-transparent text-[11px] text-slate-300 placeholder-slate-600 resize-none focus:outline-none leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-[9px] mt-1.5 text-center" style={{ color: 'hsl(215 20% 35%)' }}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}