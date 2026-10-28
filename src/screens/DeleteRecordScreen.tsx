import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2, Info } from 'lucide-react';
import { sqliteService } from '../db/sqlite';
import {
  fetchStudents,
  fetchCompanies,
  fetchJobs,
  fetchApplications,
  fetchDepartments,
} from '../db/queries';
import { Student, Company, Job, Application, Department } from '../db/types';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

interface DeleteRecordScreenProps {
  initialEntity?: 'student' | 'company' | 'job' | 'application';
  initialId?: number;
}

export const DeleteRecordScreen: React.FC<DeleteRecordScreenProps> = ({
  initialEntity,
  initialId,
}) => {
  const toast = useToast();
  const [entityType, setEntityType] = useState<'student' | 'company' | 'job' | 'application'>(
    initialEntity || 'company'
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);

  // Error demonstration banner
  const [fkErrorExplanation, setFkErrorExplanation] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [sList, cList, jList, aList] = await Promise.all([
        fetchStudents(),
        fetchCompanies(),
        fetchJobs(),
        fetchApplications(),
      ]);
      setStudents(sList);
      setCompanies(cList);
      setJobs(jList);
      setApplications(aList);
    } catch (e) {
      console.error('Error loading data for delete screen:', e);
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

  const handleRequestDelete = (id: number, name: string) => {
    setFkErrorExplanation(null);
    setPendingDelete({ id, name });
    setConfirmModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!pendingDelete) return;
    setConfirmModalOpen(false);

    let sql = '';
    if (entityType === 'student') {
      sql = `DELETE FROM Students WHERE student_id = ${pendingDelete.id};`;
    } else if (entityType === 'company') {
      sql = `DELETE FROM Companies WHERE company_id = ${pendingDelete.id};`;
    } else if (entityType === 'job') {
      sql = `DELETE FROM Jobs WHERE job_id = ${pendingDelete.id};`;
    } else if (entityType === 'application') {
      sql = `DELETE FROM Applications WHERE application_id = ${pendingDelete.id};`;
    }

    try {
      await sqliteService.execute(sql);
      toast.success(
        'Record Deleted Successfully',
        `Record #${pendingDelete.id} (${pendingDelete.name}) removed from database.`
      );
      setPendingDelete(null);
      await loadData();
    } catch (err: any) {
      const explanation = sqliteService.formatDbError(err);
      setFkErrorExplanation(explanation);
      toast.error('Deletion Blocked by DBMS', 'Relational integrity constraint violated.');
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-500" />
          Delete Record & Referential Integrity (FOREIGN KEY)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Demonstrates DBMS foreign key constraint enforcement: <code>ON DELETE RESTRICT</code> vs <code>ON DELETE CASCADE</code>
        </p>
      </div>

      {/* Educational Callout */}
      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
        <div className="font-bold mb-1 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Examiner Demo Tip: Try Deleting a Company with Active Jobs</span>
        </div>
        <p className="leading-relaxed opacity-90">
          In our schema, <code>Jobs.company_id</code> references <code>Companies(company_id) ON DELETE RESTRICT</code>.
          Attempting to delete a company like <strong>Microsoft IDC</strong> or <strong>Google India</strong> will be intercepted
          by SQLite's foreign key engine to prevent orphan job listings. Conversely, deleting an Application cascades to its Offer!
        </p>
      </div>

      {/* FK Error Alert Banner (if triggered) */}
      {fkErrorExplanation && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 text-xs shadow-md animate-in fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm mb-1">
                FOREIGN KEY Constraint Blocked Deletion:
              </div>
              <p className="leading-relaxed font-sans">{fkErrorExplanation}</p>
              <div className="mt-2 text-[11px] font-mono text-rose-700 dark:text-rose-300">
                SQL Engine state: PRAGMA foreign_keys = ON; (Referential Integrity Maintained)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entity Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'company', label: 'Companies (RESTRICT)' },
          { id: 'student', label: 'Students (RESTRICT / CASCADE)' },
          { id: 'job', label: 'Jobs (RESTRICT)' },
          { id: 'application', label: 'Applications (CASCADE)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setEntityType(tab.id as any);
              setFkErrorExplanation(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              entityType === tab.id
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Records Table for Selected Entity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Record Details</th>
                <th className="px-4 py-3">Associated Information</th>
                <th className="px-4 py-3 text-right">Delete Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {entityType === 'company' &&
                companies.map((c) => (
                  <tr key={c.company_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-500">#{c.company_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {c.company_name}
                      <span className="block text-[11px] font-normal text-slate-400">{c.industry}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      Location: {c.location} • {c.contact_email}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRequestDelete(c.company_id, c.company_name)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors"
                      >
                        Delete Company
                      </button>
                    </td>
                  </tr>
                ))}

              {entityType === 'student' &&
                students.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-500">#{s.student_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {s.name}
                      <span className="block text-[11px] font-normal text-slate-400 font-mono">{s.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {s.dept_name} • CGPA {s.cgpa.toFixed(2)} • {s.placement_status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRequestDelete(s.student_id, s.name)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors"
                      >
                        Delete Student
                      </button>
                    </td>
                  </tr>
                ))}

              {entityType === 'job' &&
                jobs.map((j) => (
                  <tr key={j.job_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-500">#{j.job_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {j.job_title}
                      <span className="block text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                        {j.company_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {j.package_lpa} LPA • Min CGPA: {j.min_cgpa.toFixed(2)} • Skill: {j.required_skill}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRequestDelete(j.job_id, j.job_title)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors"
                      >
                        Delete Job
                      </button>
                    </td>
                  </tr>
                ))}

              {entityType === 'application' &&
                applications.map((a) => (
                  <tr key={a.application_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-500">#{a.application_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {a.student_name}
                      <span className="block text-[11px] font-normal text-slate-400">{a.job_title}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      Company: {a.company_name} • Status: {a.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRequestDelete(a.application_id, `${a.student_name}'s application`)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors"
                      >
                        Delete App
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${pendingDelete?.name} (#${pendingDelete?.id}) from table ${entityType.toUpperCase()}?`}
        confirmLabel="Yes, Delete Record"
        cancelLabel="Cancel"
        variant="danger"
        details={`SQL to execute: DELETE FROM ${entityType.toUpperCase()} WHERE ${entityType}_id = ${pendingDelete?.id};`}
        onConfirm={handleExecuteDelete}
        onCancel={() => setConfirmModalOpen(false)}
      />
    </div>
  );
};
