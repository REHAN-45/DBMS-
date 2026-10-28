import React, { useState, useEffect } from 'react';
import { PlusCircle, Database, Check, AlertCircle, Code, Layers } from 'lucide-react';
import { sqliteService } from '../db/sqlite';
import { fetchDepartments, fetchCompanies, fetchStudents, fetchJobs } from '../db/queries';
import { Department, Company, Student, Job } from '../db/types';
import { useToast } from '../components/Toast';

export const AddRecordScreen: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'student' | 'company' | 'job' | 'application'>('student');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Student form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    phone: '',
    dept_id: '',
    cgpa: '8.5',
    backlogs: '0',
    graduation_year: '2026',
    skills: 'Java, Python, SQL',
    resume_link: 'https://college.edu/resumes/candidate.pdf',
    placement_status: 'Unplaced',
  });

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    industry: 'Software & Technology',
    location: 'Bengaluru',
    contact_email: '',
    visit_date: new Date().toISOString().split('T')[0],
  });

  // Job form state
  const [jobForm, setJobForm] = useState({
    company_id: '',
    job_title: '',
    package_lpa: '10.5',
    min_cgpa: '7.5',
    max_backlogs_allowed: '0',
    eligible_dept_id: '',
    required_skill: 'Python',
    vacancies: '5',
    last_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  // Application form state
  const [appForm, setAppForm] = useState({
    student_id: '',
    job_id: '',
    applied_date: new Date().toISOString().split('T')[0],
    status: 'Applied',
  });

  const loadData = async () => {
    try {
      const [dList, cList, sList, jList] = await Promise.all([
        fetchDepartments(),
        fetchCompanies(),
        fetchStudents(),
        fetchJobs(),
      ]);
      setDepartments(dList);
      setCompanies(cList);
      setStudents(sList);
      setJobs(jList);

      if (dList.length > 0 && !studentForm.dept_id) {
        setStudentForm((prev) => ({ ...prev, dept_id: String(dList[0].dept_id) }));
      }
      if (cList.length > 0 && !jobForm.company_id) {
        setJobForm((prev) => ({ ...prev, company_id: String(cList[0].company_id) }));
      }
      if (sList.length > 0 && !appForm.student_id) {
        setAppForm((prev) => ({ ...prev, student_id: String(sList[0].student_id) }));
      }
      if (jList.length > 0 && !appForm.job_id) {
        setAppForm((prev) => ({ ...prev, job_id: String(jList[0].job_id) }));
      }
    } catch (e) {
      console.error('Error loading dropdown data:', e);
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

  // Submit Student
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cgpaNum = parseFloat(studentForm.cgpa);
    const backlogsNum = parseInt(studentForm.backlogs, 10);
    const gradYear = parseInt(studentForm.graduation_year, 10);
    const deptId = parseInt(studentForm.dept_id, 10);

    if (!studentForm.name.trim() || !studentForm.email.trim() || !studentForm.phone.trim()) {
      toast.error('Validation Error', 'Name, Email, and Phone are mandatory NOT NULL fields.');
      return;
    }

    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      toast.error('Domain Constraint Violated', 'CGPA must be between 0.0 and 10.0');
      return;
    }

    const sql = `
      INSERT INTO Students (name, email, phone, dept_id, cgpa, backlogs, graduation_year, skills, resume_link, placement_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    try {
      await sqliteService.execute(sql, [
        studentForm.name.trim(),
        studentForm.email.trim().toLowerCase(),
        studentForm.phone.trim(),
        deptId,
        cgpaNum,
        backlogsNum,
        gradYear,
        studentForm.skills.trim(),
        studentForm.resume_link.trim() || null,
        studentForm.placement_status,
      ]);
      toast.success('Student Registered!', `${studentForm.name} inserted into database.`);
      setStudentForm((prev) => ({
        ...prev,
        name: '',
        email: '',
        phone: '',
      }));
    } catch (err: any) {
      toast.error('Insert Failed', sqliteService.formatDbError(err));
    }
  };

  // Submit Company
  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.company_name.trim() || !companyForm.contact_email.trim()) {
      toast.error('Validation Error', 'Company Name and Contact Email are required.');
      return;
    }

    const sql = `
      INSERT INTO Companies (company_name, industry, location, contact_email, visit_date)
      VALUES (?, ?, ?, ?, ?);
    `;

    try {
      await sqliteService.execute(sql, [
        companyForm.company_name.trim(),
        companyForm.industry.trim(),
        companyForm.location.trim(),
        companyForm.contact_email.trim().toLowerCase(),
        companyForm.visit_date,
      ]);
      toast.success('Company Registered!', `${companyForm.company_name} added to recruiting partners.`);
      setCompanyForm((prev) => ({ ...prev, company_name: '', contact_email: '' }));
    } catch (err: any) {
      toast.error('Insert Failed', sqliteService.formatDbError(err));
    }
  };

  // Submit Job
  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = parseFloat(jobForm.package_lpa);
    const minCgpa = parseFloat(jobForm.min_cgpa);
    const maxBacklogs = parseInt(jobForm.max_backlogs_allowed, 10);
    const vacancies = parseInt(jobForm.vacancies, 10);
    const compId = parseInt(jobForm.company_id, 10);
    const eligibleDeptId = jobForm.eligible_dept_id ? parseInt(jobForm.eligible_dept_id, 10) : null;

    if (!jobForm.job_title.trim() || !jobForm.required_skill.trim()) {
      toast.error('Validation Error', 'Job Title and Required Skill cannot be blank.');
      return;
    }

    if (isNaN(pkg) || pkg <= 0) {
      toast.error('Domain Constraint Violated', 'Package LPA must be greater than 0.');
      return;
    }

    const sql = `
      INSERT INTO Jobs (company_id, job_title, package_lpa, min_cgpa, max_backlogs_allowed, eligible_dept_id, required_skill, vacancies, last_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    try {
      await sqliteService.execute(sql, [
        compId,
        jobForm.job_title.trim(),
        pkg,
        minCgpa,
        maxBacklogs,
        eligibleDeptId,
        jobForm.required_skill.trim(),
        vacancies,
        jobForm.last_date,
      ]);
      toast.success('Job Opportunity Posted!', `${jobForm.job_title} posted with ${pkg} LPA.`);
      setJobForm((prev) => ({ ...prev, job_title: '' }));
    } catch (err: any) {
      toast.error('Insert Failed', sqliteService.formatDbError(err));
    }
  };

  // Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    const sId = parseInt(appForm.student_id, 10);
    const jId = parseInt(appForm.job_id, 10);

    const sql = `
      INSERT INTO Applications (student_id, job_id, applied_date, status)
      VALUES (?, ?, ?, ?);
    `;

    try {
      await sqliteService.execute(sql, [sId, jId, appForm.applied_date, appForm.status]);
      toast.success('Application Submitted!', 'Candidate linked to job opportunity.');
    } catch (err: any) {
      toast.error('Insert Failed', sqliteService.formatDbError(err));
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
          <PlusCircle className="w-5 h-5 text-indigo-500" />
          Insert Record (DML INSERT Operation)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Form validated according to table definitions with foreign key dropdown resolution
        </p>
      </div>

      {/* Entity Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'student', label: 'Student Record' },
          { id: 'company', label: 'Company Record' },
          { id: 'job', label: 'Job Opening' },
          { id: 'application', label: 'Student Application' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Student Form */}
      {activeTab === 'student' && (
        <form
          onSubmit={handleSubmitStudent}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
            Table: Students (3NF Entity)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                College Email (UNIQUE) *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. rahul.sharma@college.edu"
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={studentForm.phone}
                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department (Foreign Key: Departments.dept_id) *
              </label>
              <select
                value={studentForm.dept_id}
                onChange={(e) => setStudentForm({ ...studentForm, dept_id: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d.dept_id} value={d.dept_id}>
                    #{d.dept_id} - {d.dept_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cumulative CGPA (CHECK: 0.0 to 10.0) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.0"
                max="10.0"
                required
                value={studentForm.cgpa}
                onChange={(e) => setStudentForm({ ...studentForm, cgpa: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Active Backlogs (CHECK: &gt;= 0) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={studentForm.backlogs}
                onChange={(e) => setStudentForm({ ...studentForm, backlogs: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Graduation Year *
              </label>
              <input
                type="number"
                required
                value={studentForm.graduation_year}
                onChange={(e) => setStudentForm({ ...studentForm, graduation_year: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Placement Status (DEFAULT 'Unplaced')
              </label>
              <select
                value={studentForm.placement_status}
                onChange={(e) => setStudentForm({ ...studentForm, placement_status: e.target.value as any })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Unplaced">Unplaced</option>
                <option value="Placed">Placed</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Technical Skills (Comma separated) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Python, Machine Learning, Docker, SQL"
                value={studentForm.skills}
                onChange={(e) => setStudentForm({ ...studentForm, skills: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Execute INSERT INTO Students</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Company Form */}
      {activeTab === 'company' && (
        <form
          onSubmit={handleSubmitCompany}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
            Table: Companies (Parent Entity)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name (UNIQUE) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Amazon India"
                value={companyForm.company_name}
                onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry Domain *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. E-Commerce & Cloud"
                value={companyForm.industry}
                onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Location / HQ *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hyderabad"
                value={companyForm.location}
                onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                HR Contact Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. campus@amazon.com"
                value={companyForm.contact_email}
                onChange={(e) => setCompanyForm({ ...companyForm, contact_email: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campus Visit Date *
              </label>
              <input
                type="date"
                required
                value={companyForm.visit_date}
                onChange={(e) => setCompanyForm({ ...companyForm, visit_date: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Execute INSERT INTO Companies</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Job Form */}
      {activeTab === 'job' && (
        <form
          onSubmit={handleSubmitJob}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
            Table: Jobs (Foreign Key: Companies.company_id)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company (Foreign Key) *
              </label>
              <select
                value={jobForm.company_id}
                onChange={(e) => setJobForm({ ...jobForm, company_id: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {companies.map((c) => (
                  <option key={c.company_id} value={c.company_id}>
                    #{c.company_id} - {c.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Software Development Engineer"
                value={jobForm.job_title}
                onChange={(e) => setJobForm({ ...jobForm, job_title: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Package in LPA (CHECK &gt; 0) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={jobForm.package_lpa}
                onChange={(e) => setJobForm({ ...jobForm, package_lpa: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum CGPA (0.0 to 10.0) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={jobForm.min_cgpa}
                onChange={(e) => setJobForm({ ...jobForm, min_cgpa: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Backlogs Allowed *
              </label>
              <input
                type="number"
                min="0"
                required
                value={jobForm.max_backlogs_allowed}
                onChange={(e) => setJobForm({ ...jobForm, max_backlogs_allowed: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Eligible Department (NULL = All)
              </label>
              <select
                value={jobForm.eligible_dept_id}
                onChange={(e) => setJobForm({ ...jobForm, eligible_dept_id: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Departments Eligible</option>
                {departments.map((d) => (
                  <option key={d.dept_id} value={d.dept_id}>
                    {d.dept_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Required Skill *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Java or Python or SQL"
                value={jobForm.required_skill}
                onChange={(e) => setJobForm({ ...jobForm, required_skill: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vacancies *
              </label>
              <input
                type="number"
                min="1"
                required
                value={jobForm.vacancies}
                onChange={(e) => setJobForm({ ...jobForm, vacancies: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Execute INSERT INTO Jobs</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Application Form */}
      {activeTab === 'application' && (
        <form
          onSubmit={handleSubmitApplication}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
            Table: Applications (Candidate Key: UNIQUE(student_id, job_id))
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Applicant (Foreign Key) *
              </label>
              <select
                value={appForm.student_id}
                onChange={(e) => setAppForm({ ...appForm, student_id: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    #{s.student_id} - {s.name} ({s.dept_name}, CGPA: {s.cgpa.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Posting (Foreign Key) *
              </label>
              <select
                value={appForm.job_id}
                onChange={(e) => setAppForm({ ...appForm, job_id: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {jobs.map((j) => (
                  <option key={j.job_id} value={j.job_id}>
                    #{j.job_id} - {j.job_title} ({j.company_name}, {j.package_lpa} LPA)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Applied Date *
              </label>
              <input
                type="date"
                required
                value={appForm.applied_date}
                onChange={(e) => setAppForm({ ...appForm, applied_date: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Pipeline Status (DEFAULT 'Applied')
              </label>
              <select
                value={appForm.status}
                onChange={(e) => setAppForm({ ...appForm, status: e.target.value as any })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Execute INSERT INTO Applications</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
