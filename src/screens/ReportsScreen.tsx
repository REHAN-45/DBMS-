import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Building2,
  Users,
  GraduationCap,
  Layers,
  Code,
} from 'lucide-react';
import {
  fetchReport1,
  fetchReport2,
  fetchReport3,
  Report1Row,
  Report2Row,
  Report3Row,
  REPORT_1_SQL,
  REPORT_2_SQL,
  REPORT_3_SQL,
} from '../db/queries';
import { exportToCsv } from '../utils/exportCsv';

export const ReportsScreen: React.FC = () => {
  const [activeReport, setActiveReport] = useState<1 | 2 | 3>(1);

  const [report1Data, setReport1Data] = useState<Report1Row[]>([]);
  const [report2Data, setReport2Data] = useState<Report2Row[]>([]);
  const [report3Data, setReport3Data] = useState<Report3Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetchReport1(),
        fetchReport2(),
        fetchReport3(),
      ]);
      setReport1Data(r1);
      setReport2Data(r2);
      setReport3Data(r3);
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (activeReport === 1) {
      exportToCsv('department_placement_report', report1Data);
    } else if (activeReport === 2) {
      exportToCsv('company_hiring_packages_report', report2Data);
    } else {
      exportToCsv('unplaced_students_activity_report', report3Data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            Course DBMS Analytical Reports
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Formally drafted reports utilizing GROUP BY, multi-table JOINs, HAVING clauses, and subqueries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden">
        <button
          onClick={() => setActiveReport(1)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeReport === 1
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Report 1: Department-Wise Placements</span>
        </button>

        <button
          onClick={() => setActiveReport(2)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeReport === 2
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Report 2: Company Hiring & Packages (HAVING)</span>
        </button>

        <button
          onClick={() => setActiveReport(3)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeReport === 3
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Report 3: Unplaced Candidates & Pipeline</span>
        </button>
      </div>

      {/* SQL Query Explanation Box */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg print:hidden">
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-indigo-400">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            <span>
              {activeReport === 1 && 'SQL: GROUP BY + 3-Table Multi-JOIN + Aggregate Metrics'}
              {activeReport === 2 && 'SQL: Multi-JOIN + GROUP BY + HAVING COUNT(DISTINCT j.job_id) > 0'}
              {activeReport === 3 && 'SQL: LEFT JOIN + Filter on Unplaced Status + Conditional Sums'}
            </span>
          </div>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
          {activeReport === 1 ? REPORT_1_SQL : activeReport === 2 ? REPORT_2_SQL : REPORT_3_SQL}
        </pre>
      </div>

      {/* Report 1 Table */}
      {activeReport === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Report 1: Department-Wise Placement Performance & Packages
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated across Departments, Students, Applications, and Accepted Offers
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono">
                <tr>
                  <th className="px-4 py-3">Dept ID</th>
                  <th className="px-4 py-3">Department Name</th>
                  <th className="px-4 py-3 text-center">Total Students</th>
                  <th className="px-4 py-3 text-center">Placed</th>
                  <th className="px-4 py-3 text-center">Unplaced</th>
                  <th className="px-4 py-3 text-center">Placement %</th>
                  <th className="px-4 py-3 text-right">Avg CGPA</th>
                  <th className="px-4 py-3 text-right">Highest Package</th>
                  <th className="px-4 py-3 text-right">Avg Package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report1Data.map((row) => (
                  <tr key={row.dept_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-500">#{row.dept_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {row.dept_name}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{row.total_students}</td>
                    <td className="px-4 py-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {row.placed_students}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500">
                      {row.unplaced_students}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {row.placement_percentage}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{row.avg_cgpa?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {row.highest_package_lpa > 0 ? `${row.highest_package_lpa} LPA` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {row.avg_package_lpa > 0 ? `${row.avg_package_lpa} LPA` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2 Table */}
      {activeReport === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Report 2: Company-Wise Hiring Pipeline & Compensation Range
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              JOIN between Companies, Jobs, Applications, Offers with <code>HAVING COUNT(DISTINCT j.job_id) &gt; 0</code>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Industry & Location</th>
                  <th className="px-4 py-3 text-center">Jobs Listed</th>
                  <th className="px-4 py-3 text-center">Total Applicants</th>
                  <th className="px-4 py-3 text-center">Offers Issued</th>
                  <th className="px-4 py-3 text-center">Accepted</th>
                  <th className="px-4 py-3 text-right">Min Package</th>
                  <th className="px-4 py-3 text-right">Max Package</th>
                  <th className="px-4 py-3 text-right">Avg Package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report2Data.map((row) => (
                  <tr key={row.company_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {row.company_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {row.industry} • {row.location}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{row.total_jobs}</td>
                    <td className="px-4 py-3 text-center font-mono">{row.total_applications}</td>
                    <td className="px-4 py-3 text-center font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {row.offers_made}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {row.offers_accepted}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{row.min_pkg} LPA</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                      {row.max_pkg} LPA
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {row.avg_package_lpa} LPA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3 Table */}
      {activeReport === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Report 3: Unplaced Candidates Application Pipeline & Backlog Audit
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identifies currently unplaced students with their application attempts, shortlists, and technical skills
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">CGPA</th>
                  <th className="px-4 py-3">Backlogs</th>
                  <th className="px-4 py-3 text-center">Applied Count</th>
                  <th className="px-4 py-3 text-center">Shortlisted</th>
                  <th className="px-4 py-3 text-center">Rejected</th>
                  <th className="px-4 py-3">Skills Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report3Data.map((row) => (
                  <tr key={row.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-500">#{row.student_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {row.name}
                      <span className="block text-[11px] font-normal text-slate-400">{row.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.dept_name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {row.cgpa.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.backlogs > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          {row.backlogs}
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {row.applications_count}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {row.shortlisted_count}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-rose-600 dark:text-rose-400">
                      {row.rejected_count}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="truncate text-slate-600 dark:text-slate-400" title={row.skills}>
                        {row.skills}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
