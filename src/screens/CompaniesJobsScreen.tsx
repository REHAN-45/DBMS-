import React, { useState, useEffect } from 'react';
import {
  Building2,
  Briefcase,
  Sparkles,
  MapPin,
  Mail,
  Calendar,
  IndianRupee,
  GraduationCap,
  Plus,
  ArrowRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { fetchCompanies, fetchJobs } from '../db/queries';
import { Company, Job } from '../db/types';
import { sqliteService } from '../db/sqlite';
import { ScreenId } from '../components/Sidebar';

interface CompaniesJobsScreenProps {
  onNavigate: (screen: ScreenId, extra?: any) => void;
  onSelectJobForShortlist: (jobId: number) => void;
}

export const CompaniesJobsScreen: React.FC<CompaniesJobsScreenProps> = ({
  onNavigate,
  onSelectJobForShortlist,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [viewTab, setViewTab] = useState<'jobs' | 'companies'>('jobs');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [cList, jList] = await Promise.all([fetchCompanies(), fetchJobs()]);
      setCompanies(cList);
      setJobs(jList);
    } catch (e) {
      console.error('Error fetching companies & jobs:', e);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            Recruitment Partners & Job Postings
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Relational tables <code>Companies</code> (Parent) and <code>Jobs</code> (Child with Foreign Key)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab selector */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewTab('jobs')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewTab === 'jobs'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setViewTab('companies')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewTab === 'companies'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Companies ({companies.length})
            </button>
          </div>

          <button
            onClick={() => onNavigate('add_record')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* View 1: Jobs List */}
      {viewTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {job.company_name}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {job.job_title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {job.package_lpa} LPA
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {job.vacancies} {job.vacancies === 1 ? 'vacancy' : 'vacancies'}
                    </div>
                  </div>
                </div>

                {/* Requirements Grid */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400">Min CGPA:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      ≥ {job.min_cgpa.toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Max Backlogs:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      ≤ {job.max_backlogs_allowed}
                    </strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Eligible Dept:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {job.eligible_dept_name || 'All Departments'}
                    </strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Required Skill:</span>{' '}
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold font-mono text-[10px]">
                      {job.required_skill}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3" /> Due: {job.last_date}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectJobForShortlist(job.job_id);
                      onNavigate('auto_shortlist');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Auto-Shortlist</span>
                  </button>
                  <button
                    onClick={() => onNavigate('update_record', { entity: 'job', id: job.job_id })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Job"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate('delete_record', { entity: 'job', id: job.job_id })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Companies List */}
      {viewTab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((comp) => {
            const companyJobs = jobs.filter((j) => j.company_id === comp.company_id);
            return (
              <div
                key={comp.company_id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {comp.company_name}
                      </h4>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {comp.industry}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
                      #{comp.company_id}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{comp.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{comp.contact_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Drive Date: {comp.visit_date}</span>
                    </div>
                  </div>

                  {/* Nested job badges */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Roles Posted ({companyJobs.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {companyJobs.map((cj) => (
                        <span
                          key={cj.job_id}
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                        >
                          {cj.job_title} ({cj.package_lpa} LPA)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onNavigate('update_record', { entity: 'company', id: comp.company_id })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Company"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate('delete_record', { entity: 'company', id: comp.company_id })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete Company"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
