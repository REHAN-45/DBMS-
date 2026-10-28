import React, { useState } from 'react';
import { Terminal, Play, RotateCcw, HelpCircle, Layers, Check, AlertCircle, Copy } from 'lucide-react';
import { sqliteService } from '../db/sqlite';
import { useToast } from '../components/Toast';

const PRESET_QUERIES = [
  {
    name: 'List All Tables & Schema in SQLite',
    sql: `SELECT type, name, tbl_name, sql FROM sqlite_master WHERE type='table';`,
  },
  {
    name: 'Top 5 Students by CGPA',
    sql: `SELECT s.student_id, s.name, d.dept_name, s.cgpa, s.placement_status 
FROM Students s 
JOIN Departments d ON s.dept_id = d.dept_id 
ORDER BY s.cgpa DESC 
LIMIT 5;`,
  },
  {
    name: 'Total Packages & Offers per Company',
    sql: `SELECT c.company_name, COUNT(o.offer_id) AS offers_count, ROUND(AVG(o.offered_package_lpa), 2) AS avg_pkg_lpa, MAX(o.offered_package_lpa) AS max_pkg_lpa
FROM Companies c
JOIN Jobs j ON c.company_id = j.company_id
JOIN Applications a ON j.job_id = a.job_id
JOIN Offers o ON a.application_id = o.application_id
GROUP BY c.company_name
ORDER BY avg_pkg_lpa DESC;`,
  },
  {
    name: 'Explain Query Plan for Auto-Shortlist',
    sql: `EXPLAIN QUERY PLAN
SELECT s.name, s.cgpa, s.skills
FROM Students s
WHERE s.cgpa >= 8.0 AND s.backlogs = 0 AND s.placement_status = 'Unplaced';`,
  },
  {
    name: 'Students with More Than One Application',
    sql: `SELECT s.name, d.dept_name, COUNT(a.application_id) AS app_count
FROM Students s
JOIN Departments d ON s.dept_id = d.dept_id
JOIN Applications a ON s.student_id = a.student_id
GROUP BY s.student_id, s.name, d.dept_name
HAVING COUNT(a.application_id) > 1;`,
  },
];

export const SqlConsoleScreen: React.FC = () => {
  const toast = useToast();
  const [sqlText, setSqlText] = useState<string>(PRESET_QUERIES[1].sql);
  const [result, setResult] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [executionStats, setExecutionStats] = useState<{ timeMs: number; rowCount: number } | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRunQuery = async () => {
    if (!sqlText.trim()) return;
    setRunning(true);
    setErrorMsg(null);
    const start = performance.now();

    try {
      const res = await sqliteService.rawExec(sqlText);
      const timeMs = Math.round((performance.now() - start) * 100) / 100;

      if (res && res.length > 0) {
        setResult(res[0]);
        setExecutionStats({ timeMs, rowCount: res[0].values.length });
      } else {
        setResult({ columns: ['Result'], values: [['Statement executed successfully. 0 rows returned.']] });
        setExecutionStats({ timeMs, rowCount: 0 });
      }
      toast.success('Query Executed', `Completed in ${timeMs}ms`);
    } catch (err: any) {
      const formatted = sqliteService.formatDbError(err);
      setErrorMsg(formatted);
      setResult(null);
      setExecutionStats(null);
      toast.error('Execution Error', formatted);
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            Interactive SQL Query Console
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Execute any valid SQL statement directly on the live in-browser SQLite 3.x WASM engine
          </p>
        </div>

        {/* Preset query dropdown */}
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                setSqlText(e.target.value);
              }
            }}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Load Sample Query...</option>
            {PRESET_QUERIES.map((q, idx) => (
              <option key={idx} value={q.sql}>
                {q.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor & Controls */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Editor Header */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 font-semibold text-slate-300">SQL Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Copy query"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setSqlText('')}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Clear editor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Code Input */}
        <textarea
          rows={6}
          value={sqlText}
          onChange={(e) => setSqlText(e.target.value)}
          placeholder="Enter any SQL query (e.g. SELECT * FROM Students;)"
          className="w-full p-4 bg-slate-950 text-indigo-300 font-mono text-xs focus:outline-none resize-y selection:bg-indigo-600 selection:text-white leading-relaxed"
        />

        {/* Action bar */}
        <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            {executionStats && (
              <span className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">⚡ {executionStats.timeMs}ms</span>
                <span>•</span>
                <span className="text-indigo-300 font-bold">{executionStats.rowCount} rows</span>
              </span>
            )}
          </div>
          <button
            onClick={handleRunQuery}
            disabled={running || !sqlText.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{running ? 'Executing...' : 'Run Query (Ctrl + Enter)'}</span>
          </button>
        </div>
      </div>

      {/* Error Card */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
          <div className="flex items-center gap-2 font-bold mb-1 text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <span>SQLite Execution Failed:</span>
          </div>
          <p className="leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Results Table */}
      {result && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
              Query Result Set ({result.values.length} rows)
            </h4>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase font-mono sticky top-0 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {result.columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-2.5 font-bold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {result.values.length === 0 ? (
                  <tr>
                    <td colSpan={result.columns.length} className="text-center py-8 text-slate-500">
                      Empty result set. No rows returned.
                    </td>
                  </tr>
                ) : (
                  result.values.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2 text-slate-800 dark:text-slate-200">
                          {cell === null ? (
                            <span className="text-slate-400 italic">NULL</span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
