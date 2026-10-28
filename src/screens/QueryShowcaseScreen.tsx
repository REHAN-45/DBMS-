import React, { useState } from 'react';
import { Code2, Play, Check, Copy, Sparkles, BookOpen, Clock, Layers } from 'lucide-react';
import { SHOWCASE_QUERIES, ShowcaseQuery } from '../db/queries';
import { sqliteService } from '../db/sqlite';
import { useToast } from '../components/Toast';

export const QueryShowcaseScreen: React.FC = () => {
  const toast = useToast();
  const [selectedQuery, setSelectedQuery] = useState<ShowcaseQuery>(SHOWCASE_QUERIES[0]);
  const [result, setResult] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [executionMs, setExecutionMs] = useState<number | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRunShowcase = async (query: ShowcaseQuery) => {
    setSelectedQuery(query);
    setRunning(true);
    const start = performance.now();

    try {
      const res = await sqliteService.rawExec(query.sql);
      const timeMs = Math.round((performance.now() - start) * 100) / 100;
      setExecutionMs(timeMs);
      if (res && res.length > 0) {
        setResult(res[0]);
      } else {
        setResult({ columns: ['Result'], values: [['Query executed successfully with 0 rows returned']] });
      }
      toast.success(`Showcase Executed: ${query.title}`, `Finished in ${timeMs}ms`);
    } catch (err: any) {
      toast.error('Query Failed', sqliteService.formatDbError(err));
    } finally {
      setRunning(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(selectedQuery.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.info('SQL Copied to Clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-500" />
          DBMS Course Query Showcase
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Curated demonstrative queries covering joins, aggregates, nested subqueries, and grouping for academic evaluation
        </p>
      </div>

      {/* Showcase Query Selector Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SHOWCASE_QUERIES.map((q) => {
          const isSelected = selectedQuery.id === q.id;
          return (
            <button
              key={q.id}
              onClick={() => handleRunShowcase(q)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-white shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">{q.category}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                <h4 className="text-xs font-bold leading-tight">{q.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {q.concept}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                <span>Run Query</span>
                <Play className="w-3 h-3 fill-current" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Query Details & Code Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                {selectedQuery.category}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Concept: <strong className="text-slate-800 dark:text-slate-200">{selectedQuery.concept}</strong>
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedQuery.title}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={() => handleRunShowcase(selectedQuery)}
              disabled={running}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{running ? 'Running...' : 'Execute Again'}</span>
            </button>
          </div>
        </div>

        {/* Academic Explanation */}
        <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-indigo-900 dark:text-indigo-300">
              DBMS Theory Explanation:
            </strong>{' '}
            <span className="leading-relaxed">{selectedQuery.explanation}</span>
          </div>
        </div>

        {/* SQL Code block */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>SQL Statement</span>
            {executionMs !== null && (
              <span className="text-emerald-400 font-bold">⚡ Executed in {executionMs}ms</span>
            )}
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
            {selectedQuery.sql}
          </pre>
        </div>
      </div>

      {/* Execution Results Table */}
      {result && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
              Output Table ({result.values.length} records returned)
            </h4>
          </div>

          <div className="overflow-x-auto max-h-[450px]">
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
                      Empty result set. No records returned.
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
