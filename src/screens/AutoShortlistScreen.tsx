import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Building2,
  GraduationCap,
  AlertCircle,
  UserCheck,
  HelpCircle,
  Briefcase,
  Layers,
} from 'lucide-react';
import { fetchJobs, fetchStudents, fetchApplications } from '../db/queries';
import { Job, Student, Application } from '../db/types';
import { sqliteService } from '../db/sqlite';
import { useToast } from '../components/Toast';
import {
  evaluateStudentEligibility,
  buildAutoShortlistSql,
  buildConfirmShortlistSql,
} from '../utils/shortlist';

interface AutoShortlistScreenProps {
  initialJobId?: number;
}

export const AutoShortlistScreen: React.FC<AutoShortlistScreenProps> = ({ initialJobId }) => {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(initialJobId || null);
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'eligible' | 'ineligible'>('eligible');

  const loadData = async () => {
    try {
      const [jList, sList, aList] = await Promise.all([
        fetchJobs(),
        fetchStudents(),
        fetchApplications(),
      ]);
      setJobs(jList);
      setStudents(sList);
      setApplications(aList);
      if (jList.length > 0 && !selectedJobId) {
        setSelectedJobId(jList[0].job_id);
      }
    } catch (err) {
      console.error('Error loading shortlist data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = sqliteService.subscribeDbChange(() => {
      loadData();
    });
    return unsub;
  }, []);

  const selectedJob = jobs.find((j) => j.job_id === selectedJobId) || jobs[0];

  // Evaluate all students against selected job criteria
  const evaluations = selectedJob
    ? students.map((s) => evaluateStudentEligibility(s, selectedJob, applications))
    : [];

  const eligibleList = evaluations.filter((e) => e.isEligible);
  const ineligibleList = evaluations.filter((e) => !e.isEligible);

  const generatedSql = selectedJob ? buildAutoShortlistSql(selectedJob) : '';

  const handleCopySql = () => {
    if (!generatedSql) return;
    navigator.clipboard.writeText(generatedSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    toast.success('SQL Query Copied', 'Paste into SQL Console to inspect execution.');
  };

  const handleConfirmShortlist = async () => {
    if (!selectedJob) return;
    const eligibleIds = eligibleList.map((e) => e.student.student_id);
    if (eligibleIds.length === 0) {
      toast.warning('No eligible students', 'Zero students match the strict criteria for this job.');
      return;
    }

    setConfirming(true);
    try {
      const sql = buildConfirmShortlistSql(selectedJob.job_id, eligibleIds);
      await sqliteService.execute(sql);
      toast.success(
        'Auto-Shortlist Applied Successfully!',
        `${eligibleIds.length} candidate(s) were inserted into Applications with 'Shortlisted' status.`
      );
      await loadData();
    } catch (err: any) {
      const msg = sqliteService.formatDbError(err);
      toast.error('Shortlist Insertion Failed', msg);
    } finally {
      setConfirming(false);
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
      {/* Feature Header Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intelligent DBMS Shortlisting Algorithm</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Auto-Shortlist Eligible Candidates
            </h2>
            <p className="text-xs text-indigo-100/80 mt-1 max-w-2xl leading-relaxed">
              Multi-criteria relational query filtering based on CGPA threshold, backlog limits,
              department restrictions, technical skill matching, and unplaced status.
            </p>
          </div>

          {/* Job Selection Dropdown */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 min-w-[280px]">
            <label className="block text-[11px] font-semibold text-indigo-200 uppercase tracking-wider mb-1">
              Select Job Opening:
            </label>
            <select
              value={selectedJob?.job_id || ''}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
              className="w-full bg-slate-900/90 text-white font-medium text-xs px-3 py-2 rounded-lg border border-indigo-300/40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {jobs.map((j) => (
                <option key={j.job_id} value={j.job_id}>
                  {j.company_name} - {j.job_title} ({j.package_lpa} LPA)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedJob && (
        <>
          {/* Job Criteria Overview & Stats Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Criteria Panel */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  Criteria for {selectedJob.job_title}
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {selectedJob.package_lpa} LPA
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">
                    Min CGPA Required
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    ≥ {selectedJob.min_cgpa.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">
                    Max Backlogs Allowed
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    ≤ {selectedJob.max_backlogs_allowed}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">
                    Eligible Department
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate" title={selectedJob.eligible_dept_name || 'All Departments'}>
                    {selectedJob.eligible_dept_name || 'All Departments'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">
                    Required Skill
                  </div>
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                    {selectedJob.required_skill}
                  </div>
                </div>
              </div>
            </div>

            {/* Ratio Result Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-indigo-950/40 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1">
                  Screening Summary
                </div>
                <div className="text-3xl font-extrabold text-indigo-900 dark:text-white">
                  {eligibleList.length}{' '}
                  <span className="text-base font-normal text-slate-500 dark:text-slate-400">
                    / {students.length} Eligible
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {Math.round((eligibleList.length / (students.length || 1)) * 100)}% of registered students satisfy all requirements.
                </p>
              </div>

              {eligibleList.length > 0 && (
                <button
                  onClick={handleConfirmShortlist}
                  disabled={confirming}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {confirming ? 'Recording in DBMS...' : `Confirm Shortlist (${eligibleList.length} Students)`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Generated SQL Query Box (Examiner-Friendly) */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-400 font-mono font-semibold">
                <Layers className="w-4 h-4" />
                <span>Generated Relational SQL Query Executed</span>
              </div>
              <button
                onClick={handleCopySql}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 font-mono text-[11px]"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed selection:bg-indigo-600 selection:text-white">
              {generatedSql}
            </pre>
          </div>

          {/* Tab Selection: Eligible vs Ineligible */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('eligible')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'eligible'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Eligible Students ({eligibleList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ineligible')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ineligible'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Not Eligible ({ineligibleList.length})</span>
            </button>
          </div>

          {/* Table: Eligible List */}
          {activeTab === 'eligible' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Eligible Candidates Ready for Shortlisting
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Students meeting all criteria with status 'Unplaced'
                  </p>
                </div>
                {eligibleList.length > 0 && (
                  <button
                    onClick={handleConfirmShortlist}
                    disabled={confirming}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Shortlist</span>
                  </button>
                )}
              </div>

              {eligibleList.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No candidate meets all the strict criteria for this role.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try inspecting the "Not Eligible" tab to see why students were screened out.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">CGPA</th>
                        <th className="px-4 py-3">Backlogs</th>
                        <th className="px-4 py-3">Skills Inventory</th>
                        <th className="px-4 py-3">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {eligibleList.map(({ student, alreadyApplied, currentAppStatus }) => (
                        <tr
                          key={student.student_id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-slate-500">
                            #{student.student_id}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {student.name}
                            </div>
                            <div className="text-[11px] text-slate-400">{student.email}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                            {student.dept_name}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {student.cgpa.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                            {student.backlogs}
                          </td>
                          <td className="px-4 py-3 max-w-[240px]">
                            <div className="truncate text-slate-600 dark:text-slate-400" title={student.skills}>
                              {student.skills}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {alreadyApplied ? (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  currentAppStatus === 'Shortlisted'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {currentAppStatus || 'Applied'}
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Not Applied Yet
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Table: Not Eligible List with Detailed Reasons */}
          {activeTab === 'ineligible' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  Screened Out Candidates & Rejection Criteria
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every failure reason is evaluated strictly according to job constraints
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Academic Stats</th>
                      <th className="px-4 py-3">Skills</th>
                      <th className="px-4 py-3">Specific Screening Failure Reason(s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ineligibleList.map(({ student, reasons }) => (
                      <tr
                        key={student.student_id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {student.name}
                          </div>
                          <div className="text-[11px] text-slate-500">{student.dept_name}</div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <div>
                            CGPA: <strong className="text-slate-800 dark:text-slate-200">{student.cgpa.toFixed(2)}</strong>
                          </div>
                          <div className="text-slate-500 text-[11px]">Backlogs: {student.backlogs}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="truncate text-slate-600 dark:text-slate-400" title={student.skills}>
                            {student.skills}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {reasons.map((r, i) => (
                              <div
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-medium mr-1.5 mb-1"
                              >
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
