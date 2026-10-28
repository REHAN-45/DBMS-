import React, { useState, useEffect } from 'react';
import {
  Database,
  Copy,
  Download,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  TableProperties,
} from 'lucide-react';
import { SCHEMA_SQL, SEED_DATA_SQL, ALTER_TABLE_EXAMPLE_SQL } from '../db/schema';
import { sqliteService } from '../db/sqlite';
import { useToast } from '../components/Toast';

export const SchemaDdlScreen: React.FC = () => {
  const toast = useToast();
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'schema' | 'ddl_demo'>('schema');

  // DDL Demo table state
  const [demoTableColumns, setDemoTableColumns] = useState<any[] | null>(null);
  const [demoActionLog, setDemoActionLog] = useState<string>('');

  const fullSqlContent = `${SCHEMA_SQL}\n\n-- ALTER TABLE EXAMPLES\n${ALTER_TABLE_EXAMPLE_SQL}\n\n${SEED_DATA_SQL}`;

  const checkDemoTable = async () => {
    try {
      const res = await sqliteService.query(`PRAGMA table_info(Alumni_Mentors);`);
      if (res && res.length > 0) {
        setDemoTableColumns(res);
      } else {
        setDemoTableColumns(null);
      }
    } catch {
      setDemoTableColumns(null);
    }
  };

  useEffect(() => {
    checkDemoTable();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('schema.sql Copied', 'All CREATE TABLE and seed INSERT statements copied.');
  };

  const handleDownloadSql = () => {
    const blob = new Blob([fullSqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'placement_management_schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded schema.sql');
  };

  // DDL Action 1: CREATE TABLE
  const handleCreateDemoTable = async () => {
    const sql = `CREATE TABLE IF NOT EXISTS Alumni_Mentors (
    mentor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_name TEXT NOT NULL,
    current_company TEXT NOT NULL,
    designation TEXT NOT NULL,
    graduation_year INTEGER NOT NULL,
    contact_email TEXT UNIQUE NOT NULL
);`;
    try {
      await sqliteService.execute(sql);
      setDemoActionLog(`Executed: CREATE TABLE Alumni_Mentors (...) successfully!`);
      toast.success('DDL CREATE TABLE Executed', 'Table Alumni_Mentors added to SQLite catalog.');
      await checkDemoTable();
    } catch (err: any) {
      toast.error('CREATE TABLE Failed', sqliteService.formatDbError(err));
    }
  };

  // DDL Action 2: ALTER TABLE ADD COLUMN
  const handleAlterDemoTable = async () => {
    const sql = `ALTER TABLE Alumni_Mentors ADD COLUMN mentorship_rating REAL DEFAULT 5.0;`;
    try {
      await sqliteService.execute(sql);
      setDemoActionLog(`Executed: ALTER TABLE Alumni_Mentors ADD COLUMN mentorship_rating REAL DEFAULT 5.0;`);
      toast.success('DDL ALTER TABLE Executed', 'Column mentorship_rating added with DEFAULT constraint.');
      await checkDemoTable();
    } catch (err: any) {
      toast.error('ALTER TABLE Failed', sqliteService.formatDbError(err));
    }
  };

  // DDL Action 3: DROP TABLE
  const handleDropDemoTable = async () => {
    const sql = `DROP TABLE IF EXISTS Alumni_Mentors;`;
    try {
      await sqliteService.execute(sql);
      setDemoActionLog(`Executed: DROP TABLE IF EXISTS Alumni_Mentors;`);
      toast.info('DDL DROP TABLE Executed', 'Table Alumni_Mentors dropped from SQLite catalog.');
      await checkDemoTable();
    } catch (err: any) {
      toast.error('DROP TABLE Failed', sqliteService.formatDbError(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            schema.sql & Live DDL Operations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exportable course schema with CREATE, ALTER, and DROP demonstrations on live SQLite WASM
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy schema.sql'}</span>
          </button>
          <button
            onClick={handleDownloadSql}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .sql File</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'schema'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Complete schema.sql File
        </button>
        <button
          onClick={() => setActiveTab('ddl_demo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ddl_demo'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Live DDL Demo (CREATE, ALTER, DROP)
        </button>
      </div>

      {/* Tab 1: Full schema.sql View */}
      {activeTab === 'schema' && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>placement_schema.sql (3NF Relational Specifications)</span>
            <span className="text-[11px] text-emerald-400">PRAGMA foreign_keys = ON;</span>
          </div>
          <pre className="p-5 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed max-h-[650px] selection:bg-indigo-600 selection:text-white">
            {fullSqlContent}
          </pre>
        </div>
      )}

      {/* Tab 2: Live DDL Demo */}
      {activeTab === 'ddl_demo' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-indigo-500" />
                Hands-On DDL (Data Definition Language) Playground
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Demonstrate schema definition operations in real time on a demo table <code>Alumni_Mentors</code>.
              </p>
            </div>

            {/* DDL Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleCreateDemoTable}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>1. Execute CREATE TABLE Alumni_Mentors</span>
              </button>

              <button
                onClick={handleAlterDemoTable}
                disabled={!demoTableColumns}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>2. Execute ALTER TABLE (ADD COLUMN mentorship_rating)</span>
              </button>

              <button
                onClick={handleDropDemoTable}
                disabled={!demoTableColumns}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>3. Execute DROP TABLE Alumni_Mentors</span>
              </button>
            </div>

            {/* Action Log Output */}
            {demoActionLog && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-indigo-600 dark:text-indigo-400">
                &gt; {demoActionLog}
              </div>
            )}
          </div>

          {/* Current Table Schema Inspection */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider mb-3">
              SQLite System Catalog (PRAGMA table_info(Alumni_Mentors))
            </h4>

            {demoTableColumns ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">cid</th>
                      <th className="px-4 py-2.5">Column Name</th>
                      <th className="px-4 py-2.5">Data Type</th>
                      <th className="px-4 py-2.5">NOT NULL</th>
                      <th className="px-4 py-2.5">Default Value</th>
                      <th className="px-4 py-2.5">Primary Key</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {demoTableColumns.map((col: any) => (
                      <tr key={col.cid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 text-slate-500">{col.cid}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                          {col.name}
                        </td>
                        <td className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400">
                          {col.type}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                          {col.notnull ? 'YES' : 'NO'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                          {col.dflt_value || 'None'}
                        </td>
                        <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          {col.pk ? 'PRIMARY KEY' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Table <code>Alumni_Mentors</code> does not currently exist in the database.
                Click <strong>"Execute CREATE TABLE Alumni_Mentors"</strong> above to instantiate it!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
