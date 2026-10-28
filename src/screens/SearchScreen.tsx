import React, { useState, useEffect } from 'react';
import { Search, Filter, Layers, Code, ArrowUpDown, Download } from 'lucide-react';
import { sqliteService } from '../db/sqlite';
import { fetchDepartments, fetchCompanies } from '../db/queries';
import { Department, Company } from '../db/types';
import { exportToCsv } from '../utils/exportCsv';

export const SearchScreen: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Filters
  const [studentName, setStudentName] = useState<string>('');
  const [deptId, setDeptId] = useState<string>('ALL');
  const [minCgpa, setMinCgpa] = useState<string>('0.0');
  const [maxCgpa, setMaxCgpa] = useState<string>('10.0');
  const [companyId, setCompanyId] = useState<string>('ALL');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [placementStatus, setPlacementStatus] = useState<string>('ALL');

  const [results, setResults] = useState<any[]>([]);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([fetchDepartments(), fetchCompanies()]).then(([d, c]) => {
      setDepartments(d);
      setCompanies(c);
    });
  }, []);

  // Dynamically build and execute query
  const executeSearch = async () => {
    setLoading(true);

    const whereClauses: string[] = ['1=1'];

    if (studentName.trim().length > 0) {
      const escaped = studentName.trim().replace(/'/g, "''");
      whereClauses.push(`LOWER(s.name) LIKE '%${escaped.toLowerCase()}%'`);
    }

    if (deptId !== 'ALL') {
      whereClauses.push(`s.dept_id = ${Number(deptId)}`);
    }

    const minC = parseFloat(minCgpa);
    if (!isNaN(minC) && minC > 0) {
      whereClauses.push(`s.cgpa >= ${minC}`);
    }

    const maxC = parseFloat(maxCgpa);
    if (!isNaN(maxC) && maxC < 10) {
      whereClauses.push(`s.cgpa <= ${maxC}`);
    }

    if (placementStatus !== 'ALL') {
      whereClauses.push(`s.placement_status = '${placementStatus}'`);
    }

    if (companyId !== 'ALL') {
      whereClauses.push(`j.company_id = ${Number(companyId)}`);
    }

    if (jobTitle.trim().length > 0) {
      const escaped = jobTitle.trim().replace(/'/g, "''");
      whereClauses.push(`LOWER(j.job_title) LIKE '%${escaped.toLowerCase()}%'`);
    }

    const sql = `SELECT 
    s.student_id,
    s.name AS student_name,
    s.email,
    d.dept_name,
    s.cgpa,
    s.backlogs,
    s.placement_status,
    IFNULL(j.job_title, 'None') AS applied_job_title,
    IFNULL(c.company_name, 'None') AS company_name,
    IFNULL(a.status, 'No Application') AS application_status,
    o.offered_package_lpa
FROM Students s
INNER JOIN Departments d ON s.dept_id = d.dept_id
LEFT JOIN Applications a ON s.student_id = a.student_id
LEFT JOIN Jobs j ON a.job_id = j.job_id
LEFT JOIN Companies c ON j.company_id = c.company_id
LEFT JOIN Offers o ON a.application_id = o.application_id
WHERE ${whereClauses.join('\n  AND ')}
ORDER BY s.cgpa DESC, s.name ASC;`;

    setGeneratedSql(sql);

    try {
      const rows = await sqliteService.query(sql);
      setResults(rows);
    } catch (err) {
      console.error('Search query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [studentName, deptId, minCgpa, maxCgpa, companyId, jobTitle, placementStatus]);

  const handleExport = () => {
    exportToCsv('placement_search_results', results);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-500" />
            Multi-Criteria Search & Filter Engine
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generates dynamic SQL SELECT queries combining student parameters, CGPA ranges, and corporate roles
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Search CSV</span>
        </button>
      </div>

      {/* Filter Controls Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span>Filter Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Student Name */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Student Name
            </label>
            <input
              type="text"
              placeholder="e.g. Aarav"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Department
            </label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.dept_id} value={d.dept_id}>
                  {d.dept_name}
                </option>
              ))}
            </select>
          </div>

          {/* Min CGPA */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Min CGPA ({minCgpa})
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Max CGPA */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Max CGPA ({maxCgpa})
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={maxCgpa}
              onChange={(e) => setMaxCgpa(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Placement Status */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Placement Status
            </label>
            <select
              value={placementStatus}
              onChange={(e) => setPlacementStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Status</option>
              <option value="Unplaced">Unplaced</option>
              <option value="Placed">Placed</option>
            </select>
          </div>

          {/* Company */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Visiting Company
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Companies</option>
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Job Title */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Job Title Contains
            </label>
            <input
              type="text"
              placeholder="e.g. Engineer or Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Generated SQL Query Box */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-indigo-400">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            <span>Live Generated SQL Query (Executing against SQLite WASM)</span>
          </div>
          <span className="text-slate-400 text-[11px]">{results.length} rows matched</span>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
          {generatedSql}
        </pre>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">CGPA</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Applied Company & Role</th>
                <th className="px-4 py-3">Application Stage</th>
                <th className="px-4 py-3">Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {r.student_name}
                      <span className="block text-[11px] font-normal text-slate-400">{r.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.dept_name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {Number(r.cgpa).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.placement_status === 'Placed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {r.placement_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {r.company_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{r.applied_job_title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.application_status === 'Selected'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : r.application_status === 'Shortlisted'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : r.application_status === 'Applied'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {r.application_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {r.offered_package_lpa ? `${r.offered_package_lpa} LPA` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
