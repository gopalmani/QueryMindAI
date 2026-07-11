import type { ApiErrorBody, QueryResponse, SchemaResponse, VerifiedExampleResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 30000);

export class ApiError extends Error {
  constructor(message: string, public status: number, public requestId?: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    if (!response.ok) {
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
  executeQuery: (question: string) => request<QueryResponse>('/query', {
    method: 'POST', body: JSON.stringify({ question }),
  }),
  getSchema: () => request<SchemaResponse>('/schema'),
  saveVerifiedExample: (question: string, sql: string) => request<VerifiedExampleResponse>('/verified-examples', {
    method: 'POST', body: JSON.stringify({ question, sql, connection_key: 'demo_ecom_db', source: 'user' }),
  }),
};
