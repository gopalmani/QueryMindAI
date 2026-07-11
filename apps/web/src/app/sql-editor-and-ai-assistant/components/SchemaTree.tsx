'use client';

import React, { useState } from 'react';
import {
  Database,
  Table2,
  ChevronRight,
  ChevronDown,
  Search,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Key,
} from 'lucide-react';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  pk?: boolean;
  fk?: boolean;
}

interface TableDef {
  name: string;
  rowCount: string;
  columns: Column[];
}

interface SchemaDef {
  name: string;
  tables: TableDef[];
}

interface DbDef {
  id: string;
  name: string;
  type: string;
  env: 'Production' | 'Staging';
  schemas: SchemaDef[];
}

const databases: DbDef[] = [
  {
    id: 'db-001',
    name: 'prod-postgres-01',
    type: 'PostgreSQL',
    env: 'Production',
    schemas: [
      {
        name: 'public',
        tables: [
          {
            name: 'users',
            rowCount: '2.4M',
            columns: [
              { name: 'id', type: 'uuid', nullable: false, pk: true },
              { name: 'email', type: 'varchar(255)', nullable: false },
              { name: 'full_name', type: 'varchar(100)', nullable: true },
              { name: 'created_at', type: 'timestamptz', nullable: false },
              { name: 'is_active', type: 'boolean', nullable: false },
              { name: 'org_id', type: 'uuid', nullable: true, fk: true },
            ],
          },
          {
            name: 'events',
            rowCount: '89.1M',
            columns: [
              { name: 'event_id', type: 'bigint', nullable: false, pk: true },
              { name: 'user_id', type: 'uuid', nullable: false, fk: true },
              { name: 'event_type', type: 'varchar(64)', nullable: false },
              { name: 'properties', type: 'jsonb', nullable: true },
              { name: 'occurred_at', type: 'timestamptz', nullable: false },
            ],
          },
          {
            name: 'organizations',
            rowCount: '14.2K',
            columns: [
              { name: 'id', type: 'uuid', nullable: false, pk: true },
              { name: 'name', type: 'varchar(200)', nullable: false },
              { name: 'plan', type: 'varchar(32)', nullable: false },
              { name: 'created_at', type: 'timestamptz', nullable: false },
            ],
          },
          {
            name: 'sessions',
            rowCount: '18.7M',
            columns: [
              { name: 'session_id', type: 'uuid', nullable: false, pk: true },
              { name: 'user_id', type: 'uuid', nullable: false, fk: true },
              { name: 'started_at', type: 'timestamptz', nullable: false },
              { name: 'ended_at', type: 'timestamptz', nullable: true },
              { name: 'duration_ms', type: 'int4', nullable: true },
            ],
          },
        ],
      },
      {
        name: 'analytics',
        tables: [
          {
            name: 'daily_metrics',
            rowCount: '4.1K',
            columns: [
              { name: 'metric_date', type: 'date', nullable: false, pk: true },
              { name: 'dau', type: 'int4', nullable: false },
              { name: 'revenue_usd', type: 'numeric(12,2)', nullable: false },
              { name: 'new_signups', type: 'int4', nullable: false },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'db-002',
    name: 'analytics-redshift',
    type: 'Redshift',
    env: 'Production',
    schemas: [
      {
        name: 'dw',
        tables: [
          {
            name: 'fact_orders',
            rowCount: '120M',
            columns: [
              { name: 'order_id', type: 'bigint', nullable: false, pk: true },
              { name: 'customer_id', type: 'bigint', nullable: false, fk: true },
              { name: 'order_date', type: 'date', nullable: false },
              { name: 'total_amount', type: 'decimal(10,2)', nullable: false },
              { name: 'status', type: 'varchar(32)', nullable: false },
            ],
          },
          {
            name: 'dim_customers',
            rowCount: '8.2M',
            columns: [
              { name: 'customer_id', type: 'bigint', nullable: false, pk: true },
              { name: 'segment', type: 'varchar(64)', nullable: true },
              { name: 'country_code', type: 'char(2)', nullable: false },
              { name: 'first_order_date', type: 'date', nullable: true },
            ],
          },
        ],
      },
    ],
  },
];

const typeIcon = (type: string) => {
  if (type.includes('int') || type.includes('bigint') || type.includes('numeric') || type.includes('decimal')) return <Hash className="w-3 h-3 text-blue-400" />;
  if (type.includes('varchar') || type.includes('char') || type.includes('text')) return <Type className="w-3 h-3 text-green-400" />;
  if (type.includes('timestamp') || type.includes('date')) return <Calendar className="w-3 h-3 text-amber-400" />;
  if (type.includes('bool')) return <ToggleLeft className="w-3 h-3 text-purple-400" />;
  return <Hash className="w-3 h-3 text-slate-400" />;
};

const envColors = {
  Production: 'bg-blue-600/15 text-blue-400',
  Staging: 'bg-amber-600/15 text-amber-400',
};

export default function SchemaTree() {
  const [search, setSearch] = useState('');
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set(['db-001']));
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['db-001-public']));
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set(['db-001-public-users']));

  const toggleDb = (id: string) => {
    setExpandedDbs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSchema = (id: string) => {
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleTable = (id: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredDbs = databases.map((db) => ({
    ...db,
    schemas: db.schemas.map((schema) => ({
      ...schema,
      tables: schema.tables.filter(
        (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.columns.some((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      ),
    })).filter((s) => !search || s.tables.length > 0),
  })).filter((db) => !search || db.schemas.some((s) => s.tables.length > 0) || db.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div
      className="w-56 flex-shrink-0 flex flex-col border-r overflow-hidden"
      style={{ background: 'hsl(222 40% 8%)', borderColor: 'hsl(222 30% 14%)' }}
    >
      <div className="px-3 py-3 border-b flex-shrink-0" style={{ borderColor: 'hsl(222 30% 14%)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-white">Schema Browser</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'hsl(215 20% 45%)' }} />
          <input
            type="text"
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-6 pr-2 py-1.5 text-[11px] rounded-md border bg-transparent placeholder-slate-600 text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors"
            style={{ borderColor: 'hsl(222 30% 18%)' }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {filteredDbs.map((db) => {
          const dbExpanded = expandedDbs.has(db.id);
          return (
            <div key={db.id}>
              {/* Database row */}
              <button
                onClick={() => toggleDb(db.id)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 transition-colors group"
              >
                {dbExpanded ? (
                  <ChevronDown className="w-3 h-3 text-slate-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                )}
                <Database className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="text-[11px] font-semibold text-slate-200 truncate flex-1 text-left">{db.name}</span>
                <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${envColors[db.env]}`}>
                  {db.env === 'Production' ? 'PRD' : 'STG'}
                </span>
              </button>

              {dbExpanded && db.schemas.map((schema) => {
                const schemaKey = `${db.id}-${schema.name}`;
                const schemaExpanded = expandedSchemas.has(schemaKey);
                return (
                  <div key={schemaKey}>
                    <button
                      onClick={() => toggleSchema(schemaKey)}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1 pl-6 hover:bg-white/5 transition-colors"
                    >
                      {schemaExpanded ? (
                        <ChevronDown className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                      )}
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{schema.name}</span>
                      <span className="ml-auto text-[9px] text-slate-600">{schema.tables.length}</span>
                    </button>

                    {schemaExpanded && schema.tables.map((table) => {
                      const tableKey = `${schemaKey}-${table.name}`;
                      const tableExpanded = expandedTables.has(tableKey);
                      return (
                        <div key={tableKey}>
                          <button
                            onClick={() => toggleTable(tableKey)}
                            className="w-full flex items-center gap-1.5 px-2.5 py-1 pl-9 hover:bg-white/5 transition-colors group"
                          >
                            {tableExpanded ? (
                              <ChevronDown className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                            )}
                            <Table2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="text-[11px] text-slate-300 font-mono truncate flex-1 text-left">{table.name}</span>
                            <span className="text-[9px] text-slate-600 ml-1">{table.rowCount}</span>
                          </button>

                          {tableExpanded && table.columns.map((col) => (
                            <div
                              key={`${tableKey}-col-${col.name}`}
                              className="flex items-center gap-1.5 px-2.5 py-0.5 pl-14 hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="flex-shrink-0">{typeIcon(col.type)}</div>
                              {col.pk && <Key className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />}
                              <span className="text-[10px] font-mono text-slate-400 truncate">{col.name}</span>
                              <span className="ml-auto text-[9px] text-slate-600 font-mono truncate max-w-[60px]">{col.type.split('(')[0]}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
