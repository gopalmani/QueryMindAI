'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Code2,
  Database,
  History,
  Settings,
  HelpCircle,
  Plus,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeRoute?: string;
}

const navItems = [
  { label: 'Data Connections', icon: LayoutDashboard, route: '/dashboard-and-connection' },
  { label: 'AI Query Assistant', icon: Code2, route: '/sql-editor-and-ai-assistant' },
  { label: 'Schema Explorer', icon: Database, route: '/database-browser' },
  { label: 'Query History', icon: History, route: '/query-history' },
];

const bottomNavItems = [
  { label: 'Settings', icon: Settings, route: '/dashboard-and-connection' },
  { label: 'Support', icon: HelpCircle, route: '/dashboard-and-connection' },
];

export default function Sidebar({ collapsed, onToggle: _onToggle, activeRoute }: SidebarProps) {
  return (
    <aside
      className="flex flex-col flex-shrink-0 border-r"
      style={{
        width: collapsed ? '64px' : '210px',
        background: '#ffffff',
        borderColor: '#e5e7eb',
        transition: 'width 0.3s ease',
      }}
    >
      {/* Logo / Branding */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b flex-shrink-0"
        style={{ borderColor: '#e5e7eb', minHeight: '68px' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#2563eb' }}
        >
          <Database className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">QueryMindAI</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#2563eb' }}>
              Open source
            </p>
          </div>
        )}
      </div>

      {/* New Query Button */}
      <div className="px-3 pt-4 pb-2 flex-shrink-0">
        {collapsed ? (
          <button
            className="w-full flex items-center justify-center p-2 rounded-lg text-white transition-colors"
            style={{ background: '#2563eb' }}
            title="New Query"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-colors hover:bg-blue-700"
            style={{ background: '#2563eb' }}
          >
            <Plus className="w-4 h-4" />
            New Query
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeRoute === item.route && item.label !== 'Browser' && item.label !== 'History';
          return (
            <Link
              key={`nav-${item.label}`}
              href={item.route}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold border-r-2 border-blue-600' :'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
              {!collapsed && (
                <span className="text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 pb-2 flex-shrink-0">
        {bottomNavItems.map((item) => (
          <Link
            key={`bottom-nav-${item.label}`}
            href={item.route}
            title={collapsed ? item.label : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-150"
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* User Profile */}
      <div className="border-t px-3 py-3 flex-shrink-0" style={{ borderColor: '#e5e7eb' }}>
        <div className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: '#dbeafe' }}
          >
            <span className="text-xs font-bold text-blue-700">AC</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">Demo workspace</p>
              <p className="text-[10px] text-gray-400 truncate">Preconfigured PostgreSQL</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
