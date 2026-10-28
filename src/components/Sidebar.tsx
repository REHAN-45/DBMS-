import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileCheck2,
  Sparkles,
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  FileSpreadsheet,
  Terminal,
  Code2,
  GitFork,
  Database,
  Moon,
  Sun,
  X,
  GraduationCap,
} from 'lucide-react';

export type ScreenId =
  | 'dashboard'
  | 'students'
  | 'companies_jobs'
  | 'applications'
  | 'auto_shortlist'
  | 'add_record'
  | 'update_record'
  | 'delete_record'
  | 'search'
  | 'reports'
  | 'sql_console'
  | 'query_showcase'
  | 'normalization'
  | 'schema_ddl';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ElementType;
  badge?: string;
  isSpecial?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  isDark,
  onToggleTheme,
  isOpenMobile,
  onCloseMobile,
}) => {
  const sections: NavSection[] = [
    {
      title: 'OVERVIEW & ENTITIES',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'companies_jobs', label: 'Companies & Jobs', icon: Building2 },
        { id: 'applications', label: 'Applications & Offers', icon: FileCheck2 },
      ],
    },
    {
      title: 'INTELLIGENT RECRUITMENT',
      items: [
        {
          id: 'auto_shortlist',
          label: 'Auto-Shortlist Engine',
          icon: Sparkles,
          badge: 'FEATURE',
          isSpecial: true,
        },
      ],
    },
    {
      title: 'DATA OPERATIONS (CRUD)',
      items: [
        { id: 'add_record', label: 'Add Record', icon: PlusCircle },
        { id: 'update_record', label: 'Update Record', icon: Pencil },
        { id: 'delete_record', label: 'Delete Record', icon: Trash2 },
        { id: 'search', label: 'Search & Filters', icon: Search },
        { id: 'reports', label: 'DBMS Reports (3)', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'DBMS LAB & EXAMINER DEMO',
      items: [
        { id: 'sql_console', label: 'Interactive SQL Console', icon: Terminal },
        { id: 'query_showcase', label: 'Query Showcase', icon: Code2 },
        { id: 'normalization', label: 'Normalization (3NF)', icon: GitFork },
        { id: 'schema_ddl', label: 'schema.sql & DDL Demo', icon: Database },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                Placement DBMS
              </h1>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                SQLite 3NF Prototype
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectScreen(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? item.isSpecial
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : item.isSpecial
                          ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive
                              ? item.isSpecial
                                ? 'text-white'
                                : 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer with Engine Info & Theme Toggle */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                SQLite 3.x WASM
              </span>
            </div>
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
