import React, { useState, useEffect } from 'react';
import { Menu, Terminal, RotateCcw, Download, Database } from 'lucide-react';
import { sqliteService } from '../db/sqlite';
import { ScreenId } from './Sidebar';

interface HeaderProps {
  currentScreen: ScreenId;
  onOpenMobileSidebar: () => void;
  onOpenSqlLog: () => void;
  onResetDbClick: () => void;
}

const SCREEN_TITLES: Record<ScreenId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Placement Executive Dashboard',
    subtitle: 'High-level placement drive statistics, department distributions & package metrics',
  },
  students: {
    title: 'Students Entity (3NF)',
    subtitle: 'Academic records, backlogs, skills inventory, and placement status',
  },
  companies_jobs: {
    title: 'Corporate Partners & Job Postings',
    subtitle: 'Registered visiting companies and their open roles with compensation & criteria',
  },
  applications: {
    title: 'Applications & Job Offers',
    subtitle: 'Relational mappings between students, roles, selection stages, and offer packages',
  },
  auto_shortlist: {
    title: 'Auto-Shortlist Eligible Students',
    subtitle: 'Automated candidate screening based on multi-attribute criteria & SQL queries',
  },
  add_record: {
    title: 'Insert Record (DML)',
    subtitle: 'Insert new records into Students, Companies, Jobs, or Applications with FK checks',
  },
  update_record: {
    title: 'Update Record (DML)',
    subtitle: 'Modify candidate attributes, transition application statuses, or issue job offers',
  },
  delete_record: {
    title: 'Delete Record & FK Integrity',
    subtitle: 'Demonstration of SQLite foreign key referential integrity & cascaded deletions',
  },
  search: {
    title: 'Multi-Criteria Search & Filter',
    subtitle: 'Dynamic query generation with multiple parameters, CGPA filters & live tables',
  },
  reports: {
    title: 'Course DBMS Reports',
    subtitle: 'Three analytical reports with GROUP BY, HAVING, and JOINs; exportable to CSV',
  },
  sql_console: {
    title: 'Interactive SQL Console',
    subtitle: 'Direct query execution against browser SQLite WASM database with execution metrics',
  },
  query_showcase: {
    title: 'DBMS Query Showcase',
    subtitle: 'Examiner demonstration: Joins, Aggregates, Subqueries, HAVING, and Set Operators',
  },
  normalization: {
    title: 'Database Normalization (1NF, 2NF, 3NF)',
    subtitle: 'Academic demonstration of functional dependencies and normalization steps',
  },
  schema_ddl: {
    title: 'schema.sql & Live DDL Demo',
    subtitle: 'Raw DDL statements, table schemas, and live CREATE / ALTER / DROP operations',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onOpenMobileSidebar,
  onOpenSqlLog,
  onResetDbClick,
}) => {
  const [logCount, setLogCount] = useState<number>(0);
  const info = SCREEN_TITLES[currentScreen] || {
    title: 'Placement DBMS',
    subtitle: 'Relational Database Management System',
  };

  useEffect(() => {
    const unsub = sqliteService.subscribeLogs((logs) => {
      setLogCount(logs.length);
    });
    return unsub;
  }, []);

  const handleExportDb = () => {
    sqliteService.exportDatabaseFile();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile menu & Screen title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {info.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {info.subtitle}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real SQLite Indicator badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>SQLite 3.x WASM</span>
          </div>

          {/* Export .sqlite file */}
          <button
            onClick={handleExportDb}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            title="Download actual .sqlite binary database file to inspect in SQLite Browser"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export DB</span>
          </button>

          {/* Reset Database Button */}
          <button
            onClick={onResetDbClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 transition-colors shadow-sm"
            title="Recreate all tables and re-seed clean college placement data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset DB</span>
          </button>

          {/* Live SQL Log Trigger Button */}
          <button
            onClick={onOpenSqlLog}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="View live SQLite statements executed"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SQL Log</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/25 text-white font-mono text-[10px]">
              {logCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
