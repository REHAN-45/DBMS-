import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Filter,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { fetchApplications, fetchOffers } from '../db/queries';
import { Application, Offer, ApplicationStatus } from '../db/types';
import { sqliteService } from '../db/sqlite';
import { useToast } from '../components/Toast';
import { ScreenId } from '../components/Sidebar';

interface ApplicationsScreenProps {
  onNavigate: (screen: ScreenId, extra?: any) => void;
}

export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({ onNavigate }) => {
  const toast = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [aList, oList] = await Promise.all([fetchApplications(), fetchOffers()]);
      setApplications(aList);
      setOffers(oList);
    } catch (e) {
      console.error('Error fetching applications & offers:', e);
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

  const handleQuickStatusChange = async (app: Application, newStatus: ApplicationStatus) => {
    try {
      await sqliteService.execute(
        `UPDATE Applications SET status = ? WHERE application_id = ?;`,
        [newStatus, app.application_id]
      );

      // If Selected, check if offer exists; if not, prompt or create an offer automatically
      if (newStatus === 'Selected' && !app.offer_id) {
        // Fetch job package
        const jobRow = await sqliteService.query<{ package_lpa: number }>(
          `SELECT package_lpa FROM Jobs WHERE job_id = ?;`,
          [app.job_id]
        );
        const pkg = jobRow.length > 0 ? jobRow[0].package_lpa : 10.0;
        const today = new Date().toISOString().split('T')[0];

        await sqliteService.execute(
          `INSERT INTO Offers (application_id, offered_package_lpa, offer_date, offer_status)
           VALUES (?, ?, ?, 'Offered');`,
          [app.application_id, pkg, today]
        );

        // Update student placement status to Placed
        await sqliteService.execute(
          `UPDATE Students SET placement_status = 'Placed' WHERE student_id = ?;`,
          [app.student_id]
        );

        toast.success(
          `Candidate Selected!`,
          `Offer of ${pkg} LPA automatically recorded in Offers table and Student marked as 'Placed'.`
        );
      } else {
        toast.success(`Application Updated`, `Status changed to ${newStatus}`);
      }

      await loadData();
    } catch (err: any) {
      toast.error('Update Failed', sqliteService.formatDbError(err));
    }
  };

  const filteredApps = applications.filter((app) => {
    if (filterStatus === 'ALL') return true;
    return app.status === filterStatus;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-500" />
            Applications & Offers Pipeline ({applications.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enforces composite candidate key <code>UNIQUE(student_id, job_id)</code> with cascaded offers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'Applied', 'Shortlisted', 'Selected', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === status
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate('add_record')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New App</span>
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono">
              <tr>
                <th className="px-4 py-3">App ID</th>
                <th className="px-4 py-3">Student Candidate</th>
                <th className="px-4 py-3">Applied Job & Company</th>
                <th className="px-4 py-3">Applied Date</th>
                <th className="px-4 py-3">Pipeline Status</th>
                <th className="px-4 py-3">Offer Details</th>
                <th className="px-4 py-3 text-right">Actions / Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No applications found with status "{filterStatus}".
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr
                    key={app.application_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500">
                      #{app.application_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {app.student_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {app.dept_name} • CGPA {app.student_cgpa?.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {app.job_title}
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        {app.company_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {app.applied_date}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'Selected'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : app.status === 'Shortlisted'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                            : app.status === 'Applied'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {app.offer_id ? (
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {app.offered_package_lpa} LPA
                            </span>
                            <span className="text-[10px] ml-1 text-slate-400">
                              ({app.offer_status})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No offer issued</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {app.status !== 'Selected' && (
                          <button
                            onClick={() => handleQuickStatusChange(app, 'Selected')}
                            className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 transition-colors"
                            title="Advance candidate to Selected and generate an Offer"
                          >
                            Select & Offer
                          </button>
                        )}
                        {app.status === 'Applied' && (
                          <button
                            onClick={() => handleQuickStatusChange(app, 'Shortlisted')}
                            className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[10px] font-bold border border-blue-200 dark:border-blue-800 transition-colors"
                          >
                            Shortlist
                          </button>
                        )}
                        {app.status !== 'Rejected' && (
                          <button
                            onClick={() => handleQuickStatusChange(app, 'Rejected')}
                            className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-[10px] font-bold border border-rose-200 dark:border-rose-800 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('delete_record', { entity: 'application', id: app.application_id })}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors ml-1"
                          title="Delete application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
