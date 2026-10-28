import React, { useState, useEffect } from 'react';
import { sqliteService } from '../db/sqlite';
import { SqlLogEntry } from '../db/types';
import { Terminal, Copy, Check, Trash2, X, Filter } from 'lucide-react';

interface SqlLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlLogModal: React.FC<SqlLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<SqlLogEntry[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = sqliteService.subscribeLogs((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleCopy = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Live SQLite Query Execution Log
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {logs.length} statements
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Observes all real-time SQL statements executed by the in-browser SQLite WASM engine.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => sqliteService.clearLogs()}
              className="p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
              title="Clear all logs"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close SQL Log modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter by Type:
          </span>
          {['ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DDL', 'PRAGMA'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-md font-mono transition-colors ${
                filterType === type
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Terminal className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-sans">No SQL queries recorded yet in this category.</p>
              <p className="text-xs text-slate-600 mt-1">
                Interact with the application or run queries in the SQL Console.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`rounded-xl border p-4 transition-all ${
                  log.error
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        log.type === 'SELECT'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : log.type === 'INSERT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : log.type === 'UPDATE'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : log.type === 'DELETE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : log.type === 'DDL'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="text-slate-400">{log.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      ⚡ <span className="text-emerald-400 font-semibold">{log.durationMs}ms</span>
                    </span>
                    {log.rowsAffected !== undefined && (
                      <span className="text-slate-400">
                        Rows: <span className="text-indigo-300 font-semibold">{log.rowsAffected}</span>
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(log.id, log.sql)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="Copy SQL Query"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* SQL Body */}
                <pre className="whitespace-pre-wrap break-words text-slate-200 overflow-x-auto selection:bg-indigo-600 selection:text-white leading-relaxed">
                  {log.sql}
                </pre>

                {/* Error Banner */}
                {log.error && (
                  <div className="mt-3 p-2.5 rounded bg-rose-950/60 border border-rose-700 text-rose-300 text-xs">
                    <div className="font-semibold mb-0.5">SQLite Exception:</div>
                    <p className="font-mono">{log.error}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            DBMS Engine: <span className="text-slate-200 font-semibold">SQLite WASM (sql.js)</span> | PRAGMA foreign_keys = ON
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
