'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Database,
  KeyRound,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import InlineAlert from '@/app/components/InlineAlert';
import PageHeader from '@/app/components/PageHeader';
import { api, ApiError } from '@/lib/api';
import type { CatalogResponse, SavedConnection } from '@/types/api';

type InputMode = 'fields' | 'url';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<InputMode>('fields');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeAction, setActiveAction] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      setConnections(await api.listConnections());
      setError('');
    } catch (loadError) {
      setError(errorMessage(loadError, 'Could not load connections.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const body: Record<string, unknown> = {
      name: data.get('name'),
      ssl_mode: data.get('ssl_mode'),
    };

    if (mode === 'url') {
      body.connection_string = data.get('connection_string');
    } else {
      Object.assign(body, {
        host: data.get('host'),
        port: Number(data.get('port')),
        database: data.get('database'),
        username: data.get('username'),
        password: data.get('password'),
      });
    }

    try {
      const created = await api.createConnection(body);
      form.reset();
      setNotice(`${created.name} was tested, encrypted, and saved.`);
      await loadConnections();
    } catch (createError) {
      setError(errorMessage(createError, 'The connection could not be tested and saved.'));
    } finally {
      setSaving(false);
    }
  }

  async function testConnection(connection: SavedConnection) {
    setActiveAction(`test:${connection.id}`);
    setError('');
    setNotice('');
    try {
      const response = await api.testConnection(connection.id);
      const readOnly = response.read_only === true ? ' Read-only mode was confirmed.' : '';
      const warnings = response.warnings.length ? ` ${response.warnings.join(' ')}` : '';
      setNotice(`${connection.name} is reachable.${readOnly}${warnings}`);
      await loadConnections();
    } catch (testError) {
      setError(errorMessage(testError, 'The connection test failed.'));
    } finally {
      setActiveAction('');
    }
  }

  async function showSchema(connection: SavedConnection, refresh = false) {
    if (!refresh && expandedId === connection.id) {
      setExpandedId('');
      setCatalog(null);
      return;
    }
    setActiveAction(`schema:${connection.id}`);
    setError('');
    try {
      const response = refresh
        ? await api.refreshSchema(connection.id)
        : await api.connectionSchema(connection.id);
      setCatalog(response);
      setExpandedId(connection.id);
      if (refresh) setNotice(`Schema for ${connection.name} was refreshed.`);
    } catch (schemaError) {
      setError(errorMessage(schemaError, 'The schema could not be loaded.'));
    } finally {
      setActiveAction('');
    }
  }

  async function deleteConnection(connection: SavedConnection) {
    const approved = window.confirm(
      `Delete ${connection.name}? Its encrypted credentials, schema snapshots, drafts, and history will be removed.`
    );
    if (!approved) return;
    setActiveAction(`delete:${connection.id}`);
    setError('');
    try {
      await api.deleteConnection(connection.id);
      setExpandedId('');
      setCatalog(null);
      setNotice(`${connection.name} was deleted.`);
      await loadConnections();
    } catch (deleteError) {
      setError(errorMessage(deleteError, 'The connection could not be deleted.'));
    } finally {
      setActiveAction('');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow="Start here"
        title="Connect a database you already use."
        description="Add a read-only PostgreSQL connection. QueryMindAI tests it, encrypts the credentials, and builds a schema catalog for safe SQL generation."
        action={
          connections.length > 0 ? (
            <Link
              href="/query"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Open query workspace <ArrowRight className="h-4 w-4" />
            </Link>
          ) : undefined
        }
      />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['1', 'Connect', 'Provide a public PostgreSQL host and dedicated read-only user.'],
          [
            '2',
            'Inspect',
            'We catalog tables, columns, keys, views, and relationships—never row data.',
          ],
          [
            '3',
            'Query safely',
            'Generate SQL, review it, then explicitly approve read-only execution.',
          ],
        ].map(([number, title, copy]) => (
          <div key={number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
              {number}
            </span>
            <h2 className="mt-4 font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">New connection</h2>
                <p className="mt-1 text-sm text-slate-500">
                  PostgreSQL is supported in this release.
                </p>
              </div>
              <div className="flex w-fit rounded-xl bg-slate-100 p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('fields')}
                  className={`rounded-lg px-3 py-2 transition ${mode === 'fields' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                >
                  Form fields
                </button>
                <button
                  type="button"
                  onClick={() => setMode('url')}
                  className={`rounded-lg px-3 py-2 transition ${mode === 'url' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                >
                  Connection URL
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
            <Field label="Connection name" hint="A label visible only in this workspace">
              <input
                name="name"
                required
                maxLength={128}
                placeholder="Production analytics"
                className="input"
              />
            </Field>

            {mode === 'url' ? (
              <Field
                label="PostgreSQL connection URL"
                hint="The password is encrypted before storage and never returned by the API"
              >
                <input
                  name="connection_string"
                  required
                  type="password"
                  autoComplete="off"
                  placeholder="postgresql://reader:password@db.example.com:5432/analytics"
                  className="input font-mono text-xs"
                />
              </Field>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Public hostname">
                  <input name="host" required placeholder="db.example.com" className="input" />
                </Field>
                <Field label="Port">
                  <input
                    name="port"
                    required
                    type="number"
                    min={1}
                    max={65535}
                    defaultValue={5432}
                    className="input"
                  />
                </Field>
                <Field label="Database">
                  <input name="database" required placeholder="analytics" className="input" />
                </Field>
                <Field label="Read-only username">
                  <input
                    name="username"
                    required
                    autoComplete="username"
                    placeholder="querymind_reader"
                    className="input"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Password">
                    <input
                      name="password"
                      required
                      type="password"
                      autoComplete="new-password"
                      placeholder="Database password"
                      className="input"
                    />
                  </Field>
                </div>
              </div>
            )}

            <Field
              label="SSL mode"
              hint="Use verify-full when your database certificate and hostname are configured for verification"
            >
              <select name="ssl_mode" defaultValue="require" className="input">
                <option value="require">Require encrypted connection</option>
                <option value="verify-ca">Verify certificate authority</option>
                <option value="verify-full">Verify certificate and hostname</option>
              </select>
            </Field>

            <button
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? 'Testing connection…' : 'Test and save connection'}
            </button>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h2 className="mt-4 text-lg font-bold">Built around least privilege</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Use a dedicated PostgreSQL user with SELECT access only.</li>
              <li>Public deployments reject local, private, and link-local hosts by default.</li>
              <li>
                Credentials go only to the API over HTTPS; they are never returned or sent to the
                LLM.
              </li>
              <li>Every generated statement is parsed and revalidated before execution.</li>
            </ul>
            <a
              href="https://github.com/gopalmani/QueryMindAI/blob/main/docs/local-development.md"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white underline decoration-slate-600 underline-offset-4 hover:decoration-white"
            >
              Local setup and security guide <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {(error || notice) && (
            <InlineAlert kind={error ? 'error' : 'success'}>{error || notice}</InlineAlert>
          )}
        </aside>
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Your workspace
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Saved connections
            </h2>
          </div>
          {!loading && connections.length > 0 && (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
              {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
            </span>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-sm text-slate-500">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading connections…
            </div>
          ) : connections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <Database className="mx-auto h-7 w-7 text-slate-400" />
              <h3 className="mt-4 font-bold text-slate-900">No database connected</h3>
              <p className="mt-1 text-sm text-slate-500">
                Use the form above to create your first encrypted connection.
              </p>
            </div>
          ) : (
            connections.map((connection) => {
              const expanded = expandedId === connection.id;
              const busy = activeAction.endsWith(connection.id);
              return (
                <article
                  key={connection.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                        <Database className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">{connection.name}</h3>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold capitalize text-emerald-700">
                            {connection.status}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {connection.username}@{connection.host}/{connection.database}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          PostgreSQL · SSL {connection.ssl_mode}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void testConnection(connection)}
                        disabled={busy}
                        className="button-secondary"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${activeAction === `test:${connection.id}` ? 'animate-spin' : ''}`}
                        />
                        Test
                      </button>
                      <button
                        type="button"
                        onClick={() => void showSchema(connection)}
                        disabled={busy}
                        className="button-secondary"
                      >
                        {expanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        Schema
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteConnection(connection)}
                        disabled={busy}
                        aria-label={`Delete ${connection.name}`}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {expanded && catalog && catalog.connection_id === connection.id && (
                    <SchemaCatalog
                      catalog={catalog}
                      refreshing={busy}
                      onRefresh={() => void showSchema(connection, true)}
                    />
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      {hint && <span className="mt-0.5 block text-xs leading-5 text-slate-500">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function SchemaCatalog({
  catalog,
  refreshing,
  onRefresh,
}: {
  catalog: CatalogResponse;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const objectCount = catalog.metadata.schemas.reduce(
    (total, schema) => total + schema.objects.length,
    0
  );
  return (
    <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-bold text-slate-950">Schema catalog</h4>
          <p className="mt-1 text-xs text-slate-500">
            {catalog.metadata.schemas.length} schemas · {objectCount} tables and views · updated{' '}
            {new Date(catalog.updated_at).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="button-secondary w-fit"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh schema
        </button>
      </div>

      <div className="mt-5 space-y-5">
        {catalog.metadata.schemas.map((schema) => (
          <div key={schema.name}>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {schema.name}
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {schema.objects.map((object) => (
                <div
                  key={`${schema.name}.${object.name}`}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <code className="font-bold text-slate-900">{object.name}</code>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
                      {object.type}
                    </span>
                  </div>
                  <div className="mt-3 divide-y divide-slate-100">
                    {object.columns.map((column) => (
                      <div
                        key={column.name}
                        className="flex items-center justify-between gap-4 py-2 text-xs"
                      >
                        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-700">
                          {object.primary_key.includes(column.name) && (
                            <KeyRound className="h-3 w-3 shrink-0 text-amber-500" />
                          )}
                          <span className="truncate">{column.name}</span>
                        </span>
                        <code className="shrink-0 text-slate-400">
                          {column.type}
                          {column.nullable ? ' · nullable' : ''}
                        </code>
                      </div>
                    ))}
                  </div>
                  {object.foreign_keys.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                      {object.foreign_keys.map((foreignKey, index) => (
                        <p key={`${foreignKey.columns.join('-')}-${index}`}>
                          {foreignKey.columns.join(', ')} → {foreignKey.referred_schema}.
                          {foreignKey.referred_table}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
