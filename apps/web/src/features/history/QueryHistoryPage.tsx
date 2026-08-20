'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Code2,
  Copy,
  Database,
  History,
  LoaderCircle,
  Search,
} from 'lucide-react';
import InlineAlert from '@/app/components/InlineAlert';
import PageHeader from '@/app/components/PageHeader';
import { api, ApiError } from '@/lib/api';
import type { QueryHistoryItem, SavedConnection } from '@/types/api';

export default function QueryHistoryPage() {
  const [items, setItems] = useState<QueryHistoryItem[]>([]);
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [history, savedConnections] = await Promise.all([api.history(), api.listConnections()]);
      setItems(history.items);
      setConnections(savedConnections);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : 'Could not load query history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const connectionNames = useMemo(
    () => new Map(connections.map((connection) => [connection.id, connection.name])),
    [connections]
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(term) ||
        item.sql.toLowerCase().includes(term) ||
        (item.connection_id
          ? connectionNames.get(item.connection_id)?.toLowerCase().includes(term)
          : false)
    );
  }, [connectionNames, items, search]);

  async function copySql(item: QueryHistoryItem) {
    try {
      await navigator.clipboard.writeText(item.sql);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setError('Your browser could not copy the SQL to the clipboard.');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow="Query History"
        title="A record of approved executions."
        description="History is written only after you click Run query. QueryMindAI keeps the question, generated SQL, status, and execution metadata—not result row data."
        action={
          <Link
            href="/query"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Ask a question <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {error && (
        <div className="mt-6">
          <InlineAlert kind="error">{error}</InlineAlert>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-lg">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions, SQL, or connection name"
            aria-label="Search query history"
            className="input pl-10"
          />
        </div>
        {!loading && items.length > 0 && (
          <p className="text-xs font-semibold text-slate-500">
            Showing {filtered.length} of {items.length} executions
          </p>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading query history…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <History className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-5 text-xl font-bold text-slate-950">No query executions yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Generate SQL in the Query workspace, review it, and click Run query. The approved
              execution will appear here.
            </p>
            <Link
              href="/query"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900"
            >
              Open the Query workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
            No history entries match “{search}”.
          </div>
        ) : (
          filtered.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                          item.execution_status === 'success'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.execution_status || 'recorded'}
                      </span>
                      <span className="text-xs text-slate-400">Query #{item.id}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-bold leading-7 text-slate-950">
                      {item.question}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5" />
                        {item.connection_id
                          ? connectionNames.get(item.connection_id) || 'Deleted connection'
                          : 'Legacy query'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" /> {item.duration_ms} ms
                      </span>
                      <span>
                        {item.row_count} {item.row_count === 1 ? 'row' : 'rows'}
                      </span>
                      <time dateTime={item.created_at}>
                        {new Date(item.created_at).toLocaleString()}
                      </time>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copySql(item)}
                    className="button-secondary w-fit"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedId === item.id ? 'Copied' : 'Copy SQL'}
                  </button>
                </div>
              </div>
              <div className="border-t border-slate-200 bg-slate-950">
                <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-xs font-bold text-slate-400">
                  <Code2 className="h-3.5 w-3.5" /> Generated SQL
                </div>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-5 text-xs leading-6 text-slate-100">
                  {item.sql}
                </pre>
              </div>
              {item.warnings.length > 0 && (
                <div className="border-t border-slate-200 bg-amber-50 px-5 py-3 text-xs leading-5 text-amber-800">
                  {item.warnings.join(' ')}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
