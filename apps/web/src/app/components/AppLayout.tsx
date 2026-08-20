import type { ReactNode } from 'react';
import Link from 'next/link';
import { DatabaseZap, GitFork, History, PlugZap, Sparkles } from 'lucide-react';

const navigation = [
  { label: 'Connections', href: '/connections', icon: PlugZap },
  { label: 'Query', href: '/query', icon: Sparkles },
  { label: 'History', href: '/history', icon: History },
];

interface AppLayoutProps {
  children: ReactNode;
  activeRoute: '/connections' | '/query' | '/history';
}

export default function AppLayout({ children, activeRoute }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/connections"
            className="flex items-center gap-3"
            aria-label="QueryMindAI home"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white shadow-sm">
              <DatabaseZap className="h-[18px] w-[18px]" />
            </span>
            <span className="hidden min-[440px]:block">
              <span className="block text-sm font-bold tracking-tight">QueryMindAI</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Open source
              </span>
            </span>
          </Link>

          <nav
            className="flex items-center rounded-xl bg-slate-100 p-1"
            aria-label="Primary navigation"
          >
            {navigation.map((item) => {
              const active = activeRoute === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                    active
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <a
            href="https://github.com/gopalmani/QueryMindAI"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <GitFork className="h-4 w-4" />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
