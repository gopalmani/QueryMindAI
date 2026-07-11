'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Database, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { SavedConnection } from '@/types/api';

export default function DashboardContent() {
  const [items,setItems]=useState<SavedConnection[]>([]); const [loading,setLoading]=useState(true);
  const [error,setError]=useState(''); const [mode,setMode]=useState<'fields'|'url'>('fields'); const [saving,setSaving]=useState(false);
  const load=useCallback(async()=>{setLoading(true);try{setItems(await api.listConnections());setError('')}catch(e){setError(e instanceof ApiError?e.message:'Could not load connections')}finally{setLoading(false)}},[]);
  useEffect(()=>{void load()},[load]);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);setError('');const data=new FormData(event.currentTarget);
    const body:Record<string,unknown>={name:data.get('name'),ssl_mode:data.get('ssl_mode')};
    if(mode==='url')body.connection_string=data.get('connection_string'); else Object.assign(body,{host:data.get('host'),port:Number(data.get('port')),database:data.get('database'),username:data.get('username'),password:data.get('password')});
    try{await api.createConnection(body);event.currentTarget.reset();await load()}catch(e){setError(e instanceof ApiError?e.message:'Connection failed')}finally{setSaving(false)}}
  async function remove(id:string){if(!confirm('Delete this connection and its schema, drafts, and query history?'))return;await api.deleteConnection(id);await load()}
  return <div className="h-full overflow-auto bg-slate-50 p-8 text-slate-900">
    <div className="mx-auto max-w-6xl"><h1 className="text-3xl font-bold">Data Connections</h1><p className="mt-2 text-sm text-slate-600">Connect a publicly reachable PostgreSQL database with SSL and dedicated read-only credentials.</p>
    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><ShieldCheck className="mr-2 inline h-4 w-4"/>QueryMindAI does not need write access. Credentials are encrypted in the API; connection details and row data are never sent to the LLM.</div>
    {error&&<div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <form onSubmit={submit} className="mt-6 rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">Add PostgreSQL connection</h2><div className="flex gap-2"><button type="button" onClick={()=>setMode('fields')} className={`rounded px-3 py-1 text-xs ${mode==='fields'?'bg-blue-600 text-white':'bg-slate-100'}`}>Structured fields</button><button type="button" onClick={()=>setMode('url')} className={`rounded px-3 py-1 text-xs ${mode==='url'?'bg-blue-600 text-white':'bg-slate-100'}`}>Connection string</button></div></div>
      <div className="mt-4 grid gap-3 md:grid-cols-3"><input required name="name" placeholder="Connection name" className="rounded border p-2 text-sm"/>
      {mode==='url'?<input required name="connection_string" type="password" autoComplete="off" placeholder="postgresql://user:password@public-host:5432/db" className="rounded border p-2 text-sm md:col-span-2"/>:<><input required name="host" placeholder="Public hostname" className="rounded border p-2 text-sm"/><input required name="port" type="number" defaultValue="5432" className="rounded border p-2 text-sm"/><input required name="database" placeholder="Database" className="rounded border p-2 text-sm"/><input required name="username" placeholder="Read-only username" className="rounded border p-2 text-sm"/><input required name="password" type="password" autoComplete="new-password" placeholder="Password" className="rounded border p-2 text-sm"/></>}
      <select name="ssl_mode" defaultValue="require" className="rounded border p-2 text-sm"><option value="require">SSL require</option><option value="verify-ca">SSL verify CA</option><option value="verify-full">SSL verify full</option></select></div>
      <button disabled={saving} className="mt-4 flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4"/>{saving?'Testing and saving…':'Test and save connection'}</button></form>
    <div className="mt-6 space-y-3"><h2 className="font-semibold">Saved connections</h2>{loading?<p className="text-sm text-slate-500">Loading connections…</p>:items.length===0?<p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">No saved connections yet.</p>:items.map(item=><div key={item.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"><div className="flex gap-3"><Database className="mt-1 h-5 w-5 text-blue-600"/><div><p className="font-semibold">{item.name}</p><p className="text-sm text-slate-600">{item.username}@{item.host}/{item.database} · {item.ssl_mode}</p><p className="mt-1 text-xs text-emerald-600">{item.status}</p></div></div><div className="flex gap-2"><button onClick={async()=>{await api.testConnection(item.id);await load()}} title="Test" className="rounded border p-2"><RefreshCw className="h-4 w-4"/></button><button onClick={()=>remove(item.id)} title="Delete" className="rounded border p-2 text-red-600"><Trash2 className="h-4 w-4"/></button></div></div>)}</div></div></div>
}
