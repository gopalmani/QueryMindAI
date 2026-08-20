'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  Database,
  Download,
  LoaderCircle,
  Play,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import InlineAlert from '@/app/components/InlineAlert';
import PageHeader from '@/app/components/PageHeader';
import { api, ApiError } from '@/lib/api';
import type { QueryDraft, QueryExecution, SavedConnection } from '@/types/api';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function QueryWorkspace() {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [connectionId, setConnectionId] = useState('');
  const [question, setQuestion] = useState('');
  const [draft, setDraft] = useState<QueryDraft | null>(null);
  const [result, setResult] = useState<QueryExecution | null>(null);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [busy, setBusy] = useState<'generate' | 'execute' | 'save' | ''>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadConnections = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const items = await api.listConnections();
      setConnections(items);
      setConnectionId((current) => current || items[0]?.id || '');
    } catch (loadError) {
      setError(errorMessage(loadError, 'Could not load database connections.'));
    } finally {
      setLoadingConnections(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  function resetDraft() {
    setDraft(null);
    setResult(null);
    setError('');
    setNotice('');
  }

  async function generate() {
    if (!connectionId || !question.trim()) return;
    setBusy('generate');
    setError('');
    setNotice('');
    setDraft(null);
    setResult(null);
    try {
      setDraft(await api.generateQuery(connectionId, question.trim()));
    } catch (generationError) {
      setError(errorMessage(generationError, 'SQL generation failed.'));
    } finally {
      setBusy('');
    }
  }

  async function execute() {
    if (!draft) return;
    setBusy('execute');
    setError('');
    setNotice('');
    try {
      setResult(await api.executeDraft(draft.draft_id));
    } catch (executionError) {
      setError(errorMessage(executionError, 'Query execution failed.'));
    } finally {
      setBusy('');
    }
  }

  async function saveVerifiedExample() {
    if (!result) return;
    setBusy('save');
    setError('');
    setNotice('');
    try {
      await api.saveExecutedAsVerified(result.query_id);
      setNotice('Saved as a verified example for future semantic retrieval.');
    } catch (saveError) {
      setError(errorMessage(saveError, 'The verified example could not be saved.'));
    } finally {
      setBusy('');
    }
  }

  function downloadCsv() {
    if (!result) return;
    const escapeCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [
      result.columns.map(escapeCell).join(','),
      ...result.rows.map((row) =>
        result.columns.map((column) => escapeCell(row[column])).join(',')
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `querymind-query-${result.query_id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const selectedConnection = connections.find((connection) => connection.id === connectionId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow="AI Query Assistant"
        title="Ask a business question. Review the SQL."
        description="QueryMindAI uses the selected database catalog to generate explainable PostgreSQL. Nothing runs until you approve the validated draft."
        action={
          <Link href="/history" className="button-secondary">
            View query history <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {loadingConnections ? (
        <div className="mt-8 flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading your workspace…
        </div>
      ) : connections.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
          <Database className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Connect a database before generating SQL
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            QueryMindAI needs a live schema catalog to ground table names, columns, and
            relationships.
          </p>
          <Link
            href="/connections"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Add a PostgreSQL connection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <label className="block">
                <span className="text-sm font-bold text-slate-800">Database connection</span>
                <select
                  value={connectionId}
                  onChange={(event) => {
                    setConnectionId(event.target.value);
                    resetDraft();
                  }}
                  className="input mt-2"
                >
                  {connections.map((connection) => (
                    <option key={connection.id} value={connection.id}>
                      {connection.name}
                    </option>
                  ))}
                </select>
                {selectedConnection && (
                  <span className="mt-2 block truncate text-xs text-slate-500">
                    {selectedConnection.host}/{selectedConnection.database}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Business question</span>
                <textarea
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value);
                    resetDraft();
                  }}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void generate();
                  }}
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe what you want to learn from this database…"
                  className="input mt-2 resize-y leading-6"
                />
                <span className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Use table-neutral business language; schema context is added automatically.
                  </span>
                  <span>{question.length}/2000</span>
                </span>
              </label>
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Generation never executes a
                query.
              </p>
              <button
                type="button"
                onClick={() => void generate()}
                disabled={!connectionId || !question.trim() || Boolean(busy)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'generate' ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {busy === 'generate' ? 'Generating and validating…' : 'Generate SQL'}
              </button>
            </div>
          </section>

          {(error || notice) && (
            <div className="mt-5">
              <InlineAlert kind={error ? 'error' : 'success'}>{error || notice}</InlineAlert>
            </div>
          )}

          {draft && (
            <section className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
                      <Code2 className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="font-bold text-slate-950">Generated SQL</h2>
                      <p className="text-xs text-slate-500">
                        Parsed and validated against the selected catalog
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <Check className="h-3 w-3" /> Safe to review
                  </span>
                </div>
                <pre className="max-h-[440px] overflow-auto whitespace-pre-wrap bg-slate-950 p-5 text-sm leading-7 text-slate-100">
                  {draft.sql}
                </pre>
                <div className="border-t border-slate-200 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
                      <Clock3 className="h-4 w-4 shrink-0" /> Draft expires at{' '}
                      {new Date(draft.expires_at).toLocaleTimeString()}. SQL is revalidated
                      immediately before execution.
                    </p>
                    <button
                      type="button"
                      onClick={() => void execute()}
                      disabled={Boolean(busy)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busy === 'execute' ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {busy === 'execute' ? 'Running read-only…' : 'Run query'}
                    </button>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-slate-950">What this query does</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{draft.explanation}</p>
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="uppercase tracking-[0.14em] text-slate-400">
                        Model confidence
                      </span>
                      <span className="text-slate-700">{Math.round(draft.confidence * 100)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${Math.max(0, Math.min(100, draft.confidence * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <DetailList
                  title="Assumptions"
                  items={draft.assumptions}
                  empty="No assumptions reported."
                />
                <DetailList
                  title="Warnings"
                  items={draft.warnings}
                  empty="No validation warnings."
                  tone="warning"
                />
              </aside>
            </section>
          )}

          {result && (
            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h2 className="font-bold text-slate-950">Query results</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {result.row_count} {result.row_count === 1 ? 'row' : 'rows'} ·{' '}
                    {result.duration_ms} ms · saved to Query History
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={downloadCsv} className="button-secondary">
                    <Download className="h-4 w-4" /> Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveVerifiedExample()}
                    disabled={Boolean(busy)}
                    className="button-secondary"
                  >
                    {busy === 'save' ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save verified example
                  </button>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <div className="border-b border-slate-200 p-4">
                  <InlineAlert>{result.warnings.join(' ')}</InlineAlert>
                </div>
              )}

              {result.columns.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">
                  The query completed without tabular results.
                </p>
              ) : (
                <div className="max-h-[560px] overflow-auto">
                  <table className="w-full min-w-max text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        {result.columns.map((column) => (
                          <th
                            key={column}
                            className="border-b border-slate-200 px-5 py-3 font-bold"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-50">
                          {result.columns.map((column) => (
                            <td
                              key={column}
                              className="max-w-sm px-5 py-3 font-mono text-xs text-slate-700"
                            >
                              <span className="line-clamp-3">
                                {row[column] === null ? (
                                  <em className="text-slate-400">null</em>
                                ) : (
                                  String(row[column])
                                )}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.rows.length === 0 && (
                    <p className="p-8 text-center text-sm text-slate-500">
                      The query ran successfully and returned no rows.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function DetailList({
  title,
  items,
  empty,
  tone = 'default',
}: {
  title: string;
  items: string[];
  empty: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-950">{title}</h2>
      {items.length > 0 ? (
        <ul
          className={`mt-3 space-y-2 text-sm leading-6 ${tone === 'warning' ? 'text-amber-800' : 'text-slate-600'}`}
        >
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      )}
    </div>
  );
}
