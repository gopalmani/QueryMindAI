export interface QueryMetadata {
  attempts: number;
  duration_ms: number;
  verified_example_used: boolean;
  request_id?: string;
}

export interface QueryResponse {
  sql: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  row_count: number;
  explanation: string;
  warnings: string[];
  metadata: QueryMetadata;
}

export interface SchemaColumn { name: string; type: string; nullable: boolean }
export interface SchemaTable { name: string; columns: SchemaColumn[] }
export interface SchemaResponse { connection_key: string; tables: SchemaTable[]; source: 'real_api_data' }
export interface VerifiedExampleResponse { id: number; status: string; message: string; created_at: string }

export interface ApiErrorBody {
  error?: { code?: string; message?: string; request_id?: string };
  detail?: string | Array<{ msg: string }>;
}
