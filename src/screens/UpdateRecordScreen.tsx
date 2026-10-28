import React, { useState, useEffect } from 'react';
import { Pencil, Check, RefreshCw, Award, AlertCircle } from 'lucide-react';
import { sqliteService } from '../db/sqlite';
import {
  fetchStudents,
  fetchJobs,
  fetchApplications,
  fetchOffers,
  fetchDepartments,
} from '../db/queries';
import { Student, Job, Application, Offer, Department } from '../db/types';
import { useToast } from '../components/Toast';

interface UpdateRecordScreenProps {
  initialEntity?: 'student' | 'job' | 'application';
  initialId?: number;
}

export const UpdateRecordScreen: React.FC<UpdateRecordScreenProps> = ({
  initialEntity,
  initialId,
}) => {
  const toast = useToast();
  const [entityType, setEntityType] = useState<'student' | 'job' | 'application'>(
    initialEntity || 'student'
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

  // Form states
  const [studentEdit, setStudentEdit] = useState<Partial<Student>>({});
  const [jobEdit, setJobEdit] = useState<Partial<Job>>({});
  const [appEdit, setAppEdit] = useState<Partial<Application>>({});
  const [offerPackage, setOfferPackage] = useState<string>('12.0');
  const [offerStatus, setOfferStatus] = useState<string>('Offered');

  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [sList, jList, aList, dList] = await Promise.all([
        fetchStudents(),
        fetchJobs(),
        fetchApplications(),
        fetchDepartments(),
      ]);
      setStudents(sList);
      setJobs(jList);
      setApplications(aList);
      setDepartments(dList);

      if (initialEntity === 'student' && initialId) {
        setSelectedStudentId(initialId);
      } else if (sList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(sList[0].student_id);
      }

      if (initialEntity === 'job' && initialId) {
        setSelectedJobId(initialId);
      } else if (jList.length > 0 && !selectedJobId) {
        setSelectedJobId(jList[0].job_id);
      }

      if (initialEntity === 'application' && initialId) {
        setSelectedAppId(initialId);
      } else if (aList.length > 0 && !selectedAppId) {
        setSelectedAppId(aList[0].application_id);
      }
    } catch (e) {
      console.error('Error loading data for update:', e);
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

  // Sync selected student data into studentEdit form
  useEffect(() => {
    if (selectedStudentId) {
      const s = students.find((st) => st.student_id === selectedStudentId);
      if (s) {
        setStudentEdit({ ...s });
      }
    }
  }, [selectedStudentId, students]);

  // Sync selected job data into jobEdit form
  useEffect(() => {
    if (selectedJobId) {
      const j = jobs.find((jb) => jb.job_id === selectedJobId);
      if (j) {
        setJobEdit({ ...j });
      }
    }
  }, [selectedJobId, jobs]);

  // Sync selected app data into appEdit form
  useEffect(() => {
    if (selectedAppId) {
      const a = applications.find((ap) => ap.application_id === selectedAppId);
      if (a) {
        setAppEdit({ ...a });
        if (a.offered_package_lpa) {
          setOfferPackage(String(a.offered_package_lpa));
        }
        if (a.offer_status) {
          setOfferStatus(a.offer_status);
        }
      }
    }
  }, [selectedAppId, applications]);

  // Save Student Update
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEdit || !selectedStudentId) return;

    const cgpa = Number(studentEdit.cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      toast.error('Domain Constraint Violated', 'CGPA must be between 0.0 and 10.0');
      return;
    }

    const sql = `
      UPDATE Students 
      SET name = ?, email = ?, phone = ?, dept_id = ?, cgpa = ?, backlogs = ?, graduation_year = ?, skills = ?, placement_status = ?
      WHERE student_id = ?;
    `;

    try {
      await sqliteService.execute(sql, [
        studentEdit.name,
        studentEdit.email,
        studentEdit.phone,
        studentEdit.dept_id,
        cgpa,
        studentEdit.backlogs,
        studentEdit.graduation_year,
        studentEdit.skills,
        studentEdit.placement_status,
        selectedStudentId,
      ]);
      toast.success('Record Updated!', `Student #${selectedStudentId} modified successfully.`);
      await loadData();
    } catch (err: any) {
      toast.error('Update Failed', sqliteService.formatDbError(err));
    }
  };

  // Save Job Update
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobEdit || !selectedJobId) return;

    const pkg = Number(jobEdit.package_lpa);
    if (isNaN(pkg) || pkg <= 0) {
      toast.error('Domain Constraint Violated', 'Package LPA must be greater than 0.');
      return;
    }

    const sql = `
      UPDATE Jobs
      SET job_title = ?, package_lpa = ?, min_cgpa = ?, max_backlogs_allowed = ?, eligible_dept_id = ?, required_skill = ?, vacancies = ?, last_date = ?
      WHERE job_id = ?;
    `;

    try {
      await sqliteService.execute(sql, [
        jobEdit.job_title,
        pkg,
        jobEdit.min_cgpa,
        jobEdit.max_backlogs_allowed,
        jobEdit.eligible_dept_id || null,
        jobEdit.required_skill,
        jobEdit.vacancies,
        jobEdit.last_date,
        selectedJobId,
      ]);
      toast.success('Record Updated!', `Job #${selectedJobId} updated successfully.`);
      await loadData();
    } catch (err: any) {
      toast.error('Update Failed', sqliteService.formatDbError(err));
    }
  };

  // Save Application & Offer Update
  const handleSaveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appEdit || !selectedAppId) return;

    try {
      // 1. Update Application Status
      await sqliteService.execute(
        `UPDATE Applications SET status = ? WHERE application_id = ?;`,
        [appEdit.status, selectedAppId]
      );

      // 2. Handle Offers table
      if (appEdit.status === 'Selected') {
        const pkg = parseFloat(offerPackage);
        if (isNaN(pkg) || pkg <= 0) {
          toast.error('Domain Violation', 'Offered package must be > 0');
          return;
        }

        const existingOffer = await sqliteService.query(
          `SELECT offer_id FROM Offers WHERE application_id = ?;`,
          [selectedAppId]
        );

        const today = new Date().toISOString().split('T')[0];

        if (existingOffer.length > 0) {
          await sqliteService.execute(
            `UPDATE Offers SET offered_package_lpa = ?, offer_status = ? WHERE application_id = ?;`,
            [pkg, offerStatus, selectedAppId]
          );
        } else {
          await sqliteService.execute(
            `INSERT INTO Offers (application_id, offered_package_lpa, offer_date, offer_status)
             VALUES (?, ?, ?, ?);`,
            [selectedAppId, pkg, today, offerStatus]
          );
        }

        // Also update student to Placed
        if (appEdit.student_id) {
          await sqliteService.execute(
            `UPDATE Students SET placement_status = 'Placed' WHERE student_id = ?;`,
            [appEdit.student_id]
          );
        }
      }

      toast.success('Application & Offer Saved!', `Changes recorded in database.`);
      await loadData();
    } catch (err: any) {
      toast.error('Update Failed', sqliteService.formatDbError(err));
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
          <Pencil className="w-5 h-5 text-indigo-500" />
          Update Record (DML UPDATE Operation)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Modify existing relational records, transition candidate statuses, and manage offer packages
        </p>
      </div>

      {/* Select Entity Type */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'student', label: 'Student Details' },
          { id: 'job', label: 'Job Opening Criteria' },
          { id: 'application', label: 'Application Status & Offer' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setEntityType(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              entityType === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Update Student */}
      {entityType === 'student' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Student to Modify:
            </label>
            <select
              value={selectedStudentId || ''}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  #{s.student_id} - {s.name} ({s.dept_name}, CGPA: {s.cgpa.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {studentEdit.student_id && (
            <form onSubmit={handleSaveStudent} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentEdit.name || ''}
                    onChange={(e) => setStudentEdit({ ...studentEdit, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (UNIQUE)
                  </label>
                  <input
                    type="email"
                    required
                    value={studentEdit.email || ''}
                    onChange={(e) => setStudentEdit({ ...studentEdit, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={studentEdit.phone || ''}
                    onChange={(e) => setStudentEdit({ ...studentEdit, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department (FK)
                  </label>
                  <select
                    value={studentEdit.dept_id || ''}
                    onChange={(e) => setStudentEdit({ ...studentEdit, dept_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.dept_id} value={d.dept_id}>
                        {d.dept_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CGPA (CHECK 0.0 - 10.0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={studentEdit.cgpa ?? ''}
                    onChange={(e) => setStudentEdit({ ...studentEdit, cgpa: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Backlogs (CHECK &gt;= 0)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={studentEdit.backlogs ?? 0}
                    onChange={(e) => setStudentEdit({ ...studentEdit, backlogs: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Placement Status
                  </label>
                  <select
                    value={studentEdit.placement_status || 'Unplaced'}
                    onChange={(e) => setStudentEdit({ ...studentEdit, placement_status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Unplaced">Unplaced</option>
                    <option value="Placed">Placed</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Skills Inventory
                  </label>
                  <input
                    type="text"
                    required
                    value={studentEdit.skills || ''}
                    onChange={(e) => setStudentEdit({ ...studentEdit, skills: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Execute UPDATE Students</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 2. Update Job */}
      {entityType === 'job' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Job Opening:
            </label>
            <select
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {jobs.map((j) => (
                <option key={j.job_id} value={j.job_id}>
                  #{j.job_id} - {j.company_name}: {j.job_title} ({j.package_lpa} LPA)
                </option>
              ))}
            </select>
          </div>

          {jobEdit.job_id && (
            <form onSubmit={handleSaveJob} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={jobEdit.job_title || ''}
                    onChange={(e) => setJobEdit({ ...jobEdit, job_title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Package (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={jobEdit.package_lpa ?? ''}
                    onChange={(e) => setJobEdit({ ...jobEdit, package_lpa: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min CGPA Required
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={jobEdit.min_cgpa ?? ''}
                    onChange={(e) => setJobEdit({ ...jobEdit, min_cgpa: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Backlogs Allowed
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={jobEdit.max_backlogs_allowed ?? 0}
                    onChange={(e) => setJobEdit({ ...jobEdit, max_backlogs_allowed: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Required Skill
                  </label>
                  <input
                    type="text"
                    required
                    value={jobEdit.required_skill || ''}
                    onChange={(e) => setJobEdit({ ...jobEdit, required_skill: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Eligible Department
                  </label>
                  <select
                    value={jobEdit.eligible_dept_id || ''}
                    onChange={(e) => setJobEdit({ ...jobEdit, eligible_dept_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">All Departments Allowed</option>
                    {departments.map((d) => (
                      <option key={d.dept_id} value={d.dept_id}>
                        {d.dept_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Execute UPDATE Jobs</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. Update Application & Record Offer */}
      {entityType === 'application' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Application:
            </label>
            <select
              value={selectedAppId || ''}
              onChange={(e) => setSelectedAppId(Number(e.target.value))}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {applications.map((a) => (
                <option key={a.application_id} value={a.application_id}>
                  #{a.application_id} - {a.student_name} for {a.job_title} ({a.status})
                </option>
              ))}
            </select>
          </div>

          {appEdit.application_id && (
            <form onSubmit={handleSaveApplication} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Application Status
                  </label>
                  <select
                    value={appEdit.status || 'Applied'}
                    onChange={(e) => setAppEdit({ ...appEdit, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {appEdit.status === 'Selected' && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Offered Package (LPA)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        value={offerPackage}
                        onChange={(e) => setOfferPackage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Offer Acceptance Status
                      </label>
                      <select
                        value={offerStatus}
                        onChange={(e) => setOfferStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="Offered">Offered (Pending Decision)</option>
                        <option value="Accepted">Accepted by Student</option>
                        <option value="Declined">Declined by Student</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Execute UPDATE / Record Offer</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
