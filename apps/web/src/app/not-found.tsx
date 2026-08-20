import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">404</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">This page does not exist.</h1>
        <p className="mt-3 text-slate-500">
          QueryMindAI has three workspaces: Connections, Query, and History.
        </p>
        <Link
          href="/connections"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to connections
        </Link>
      </div>
    </div>
  );
}
