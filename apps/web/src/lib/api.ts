import type { ApiErrorBody, CatalogResponse, QueryDraft, QueryExecution, QueryResponse, SavedConnection, SchemaResponse, VerifiedExampleResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 30000);
const TOKEN_KEY = 'querymind_workspace_token';

export class ApiError extends Error {
  constructor(message: string, public status: number, public requestId?: string) { super(message); }
}

async function sessionToken(): Promise<string> {
  const stored = window.localStorage.getItem(TOKEN_KEY);
  if (stored) return stored;
  const response = await fetch(`${API_BASE_URL}/auth/session`, { method: 'POST', headers: {'Content-Type':'application/json'} });
  if (!response.ok) throw new ApiError('Could not create a secure workspace session', response.status);
  const body = await response.json() as {access_token:string};
  window.localStorage.setItem(TOKEN_KEY, body.access_token);
  return body.access_token;
}

async function request<T>(path: string, init?: RequestInit, authenticated = false): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const token = authenticated ? await sessionToken() : null;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}), ...init?.headers },
    });
    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    if (!response.ok) {
      if (response.status === 401 && authenticated) window.localStorage.removeItem(TOKEN_KEY);
      const validation = Array.isArray(body.detail) ? body.detail.map((item) => item.msg).join(', ') : body.detail;
      throw new ApiError(body.error?.message || validation || 'Request failed', response.status,
                         body.error?.request_id || response.headers.get('X-Request-ID') || undefined);
    }
    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new ApiError('Request timed out', 408);
    throw error;
  } finally { window.clearTimeout(timeout); }
}

export const api = {
  executeQuery: (question: string) => request<QueryResponse>('/query', {method:'POST', body:JSON.stringify({question})}),
  getSchema: () => request<SchemaResponse>('/schema'),
  saveVerifiedExample: (question: string, sql: string, connectionKey='demo_ecom_db') => request<VerifiedExampleResponse>('/verified-examples', {method:'POST',body:JSON.stringify({question,sql,connection_key:connectionKey,source:'user'})}),
  listConnections: () => request<SavedConnection[]>('/connections', undefined, true),
  createConnection: (body: Record<string, unknown>) => request<SavedConnection>('/connections', {method:'POST',body:JSON.stringify(body)}, true),
  testConnection: (id:string) => request<{status:string;read_only:boolean|null;warnings:string[]}>(`/connections/${id}/test`, {method:'POST'}, true),
  deleteConnection: (id:string) => request<void>(`/connections/${id}`, {method:'DELETE'}, true),
  refreshSchema: (id:string) => request<CatalogResponse>(`/connections/${id}/refresh-schema`, {method:'POST'}, true),
  connectionSchema: (id:string) => request<CatalogResponse>(`/connections/${id}/schema`, undefined, true),
  generateQuery: (connection_id:string, question:string) => request<QueryDraft>('/queries/generate', {method:'POST',body:JSON.stringify({connection_id,question})}, true),
  executeDraft: (draft_id:string) => request<QueryExecution>('/queries/execute', {method:'POST',body:JSON.stringify({draft_id})}, true),
  saveExecutedAsVerified: (queryId:number) => request<{id:number;status:string}>(`/queries/${queryId}/verified-example`, {method:'POST'}, true),
  history: () => request<{items:Array<Record<string,unknown>>}>('/queries/history', undefined, true),
};
