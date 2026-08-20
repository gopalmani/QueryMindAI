export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface ApiErrorBody {
  error?: { code?: string; message?: string; request_id?: string };
  detail?: string | Array<{ msg: string }>;
}

export interface SavedConnection {
  id: string;
  name: string;
  database_type: 'postgresql';
  host: string;
  database: string;
  username: string;
  ssl_mode: string;
  status: string;
  last_connected_at?: string;
  created_at: string;
  warnings?: string[];
}

export interface CatalogForeignKey {
  columns: string[];
  referred_schema: string;
  referred_table: string;
  referred_columns: string[];
}

export interface CatalogObject {
  name: string;
  type: 'table' | 'view';
  columns: SchemaColumn[];
  primary_key: string[];
  foreign_keys: CatalogForeignKey[];
  indexes: Array<{ name: string; columns: string[]; unique: boolean }>;
}

export interface CatalogResponse {
  connection_id: string;
  schema_hash: string;
  metadata: {
    database_type: string;
    schemas: Array<{ name: string; objects: CatalogObject[] }>;
  };
  updated_at: string;
}

export interface QueryDraft {
  draft_id: string;
  connection_id: string;
  sql: string;
  explanation: string;
  assumptions: string[];
  warnings: string[];
  confidence: number;
  expires_at: string;
}

export interface QueryExecution {
  query_id: number;
  sql: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  row_count: number;
  duration_ms: number;
  warnings: string[];
}

export interface QueryHistoryItem {
  id: number;
  connection_id: string | null;
  question: string;
  sql: string;
  execution_status: string | null;
  row_count: number;
  duration_ms: number;
  warnings: string[];
  created_at: string;
}
