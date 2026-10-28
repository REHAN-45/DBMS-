import { sqliteService } from './sqlite';
import { Department, Student, Company, Job, Application, Offer } from './types';

// ============================================================================
// DATA ACCESS FUNCTIONS
// ============================================================================

export async function fetchDepartments(): Promise<Department[]> {
  const sql = `SELECT dept_id, dept_name FROM Departments ORDER BY dept_name ASC;`;
  return sqliteService.query<Department>(sql);
}

export async function fetchStudents(): Promise<Student[]> {
  const sql = `
    SELECT 
      s.student_id,
      s.name,
      s.email,
      s.phone,
      s.dept_id,
      d.dept_name,
      s.cgpa,
      s.backlogs,
      s.graduation_year,
      s.skills,
      s.resume_link,
      s.placement_status
    FROM Students s
    INNER JOIN Departments d ON s.dept_id = d.dept_id
    ORDER BY s.student_id ASC;
  `;
  return sqliteService.query<Student>(sql);
}

export async function fetchCompanies(): Promise<Company[]> {
  const sql = `
    SELECT 
      company_id,
      company_name,
      industry,
      location,
      contact_email,
      visit_date
    FROM Companies
    ORDER BY company_name ASC;
  `;
  return sqliteService.query<Company>(sql);
}

export async function fetchJobs(): Promise<Job[]> {
  const sql = `
    SELECT 
      j.job_id,
      j.company_id,
      c.company_name,
      j.job_title,
      j.package_lpa,
      j.min_cgpa,
      j.max_backlogs_allowed,
      j.eligible_dept_id,
      d.dept_name AS eligible_dept_name,
      j.required_skill,
      j.vacancies,
      j.last_date
    FROM Jobs j
    INNER JOIN Companies c ON j.company_id = c.company_id
    LEFT JOIN Departments d ON j.eligible_dept_id = d.dept_id
    ORDER BY j.package_lpa DESC;
  `;
  return sqliteService.query<Job>(sql);
}

export async function fetchApplications(): Promise<Application[]> {
  const sql = `
    SELECT 
      a.application_id,
      a.student_id,
      s.name AS student_name,
      s.email AS student_email,
      s.cgpa AS student_cgpa,
      d.dept_name,
      a.job_id,
      j.job_title,
      c.company_name,
      a.applied_date,
      a.status,
      o.offer_id,
      o.offered_package_lpa,
      o.offer_status
    FROM Applications a
    INNER JOIN Students s ON a.student_id = s.student_id
    INNER JOIN Departments d ON s.dept_id = d.dept_id
    INNER JOIN Jobs j ON a.job_id = j.job_id
    INNER JOIN Companies c ON j.company_id = c.company_id
    LEFT JOIN Offers o ON a.application_id = o.application_id
    ORDER BY a.application_id DESC;
  `;
  return sqliteService.query<Application>(sql);
}

export async function fetchOffers(): Promise<Offer[]> {
  const sql = `
    SELECT 
      o.offer_id,
      o.application_id,
      o.offered_package_lpa,
      o.offer_date,
      o.offer_status,
      s.name AS student_name,
      c.company_name,
      j.job_title
    FROM Offers o
    INNER JOIN Applications a ON o.application_id = a.application_id
    INNER JOIN Students s ON a.student_id = s.student_id
    INNER JOIN Jobs j ON a.job_id = j.job_id
    INNER JOIN Companies c ON j.company_id = c.company_id
    ORDER BY o.offered_package_lpa DESC;
  `;
  return sqliteService.query<Offer>(sql);
}

// ============================================================================
// DASHBOARD METRICS & CHARTS
// ============================================================================

export interface DashboardMetrics {
  totalStudents: number;
  placedStudents: number;
  unplacedStudents: number;
  placementPercentage: number;
  totalCompanies: number;
  openJobs: number;
  totalApplications: number;
  totalOffers: number;
  highestPackageLpa: number;
  averagePackageLpa: number;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const statsSql = `
    SELECT 
      (SELECT COUNT(*) FROM Students) AS total_students,
      (SELECT COUNT(*) FROM Students WHERE placement_status = 'Placed') AS placed_students,
      (SELECT COUNT(*) FROM Companies) AS total_companies,
      (SELECT COUNT(*) FROM Jobs) AS open_jobs,
      (SELECT COUNT(*) FROM Applications) AS total_applications,
      (SELECT COUNT(*) FROM Offers) AS total_offers,
      (SELECT IFNULL(MAX(offered_package_lpa), 0) FROM Offers) AS max_pkg,
      (SELECT IFNULL(ROUND(AVG(offered_package_lpa), 2), 0) FROM Offers) AS avg_pkg;
  `;
  const res = await sqliteService.query<any>(statsSql);
  const r = res[0] || {};
  const totalStudents = Number(r.total_students || 0);
  const placedStudents = Number(r.placed_students || 0);
  const unplacedStudents = totalStudents - placedStudents;
  const placementPercentage = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 1000) / 10 : 0;

  return {
    totalStudents,
    placedStudents,
    unplacedStudents,
    placementPercentage,
    totalCompanies: Number(r.total_companies || 0),
    openJobs: Number(r.open_jobs || 0),
    totalApplications: Number(r.total_applications || 0),
    totalOffers: Number(r.total_offers || 0),
    highestPackageLpa: Number(r.max_pkg || 0),
    averagePackageLpa: Number(r.avg_pkg || 0),
  };
}

export interface DeptChartData {
  dept_name: string;
  total_students: number;
  placed_students: number;
  placement_pct: number;
}

export async function fetchDeptPlacementChart(): Promise<DeptChartData[]> {
  const sql = `
    SELECT 
      d.dept_name,
      COUNT(s.student_id) AS total_students,
      SUM(CASE WHEN s.placement_status = 'Placed' THEN 1 ELSE 0 END) AS placed_students,
      ROUND((SUM(CASE WHEN s.placement_status = 'Placed' THEN 1.0 ELSE 0.0 END) / COUNT(s.student_id)) * 100, 1) AS placement_pct
    FROM Departments d
    LEFT JOIN Students s ON d.dept_id = s.dept_id
    GROUP BY d.dept_id, d.dept_name
    ORDER BY placement_pct DESC;
  `;
  return sqliteService.query<DeptChartData>(sql);
}

export interface PackageTierData {
  tier_name: string;
  offer_count: number;
  color: string;
}

export async function fetchPackageDistribution(): Promise<PackageTierData[]> {
  const sql = `
    SELECT 
      CASE 
        WHEN offered_package_lpa < 8.0 THEN 'Standard (< 8 LPA)'
        WHEN offered_package_lpa BETWEEN 8.0 AND 15.0 THEN 'Dream (8-15 LPA)'
        WHEN offered_package_lpa BETWEEN 15.01 AND 30.0 THEN 'Super Dream (15-30 LPA)'
        ELSE 'Marquee (30+ LPA)'
      END AS tier_name,
      COUNT(*) AS offer_count,
      CASE 
        WHEN offered_package_lpa < 8.0 THEN '#3b82f6'
        WHEN offered_package_lpa BETWEEN 8.0 AND 15.0 THEN '#10b981'
        WHEN offered_package_lpa BETWEEN 15.01 AND 30.0 THEN '#f59e0b'
        ELSE '#8b5cf6'
      END AS color
    FROM Offers
    GROUP BY tier_name
    ORDER BY MIN(offered_package_lpa) ASC;
  `;
  return sqliteService.query<PackageTierData>(sql);
}

// ============================================================================
// CURATED QUERY SHOWCASE (EXAMINER DEMO)
// ============================================================================

export interface ShowcaseQuery {
  id: string;
  title: string;
  category: string;
  concept: string;
  explanation: string;
  sql: string;
}

export const SHOWCASE_QUERIES: ShowcaseQuery[] = [
  {
    id: 'select-where-order',
    title: 'Basic Projection, Filtering & Ordering',
    category: 'DQL Basics',
    concept: 'SELECT, WHERE, ORDER BY',
    explanation:
      'Retrieves high-performing students who have maintained zero backlogs and a CGPA above 8.0, sorted in descending order of CGPA.',
    sql: `SELECT 
    student_id, 
    name, 
    email, 
    cgpa, 
    backlogs, 
    placement_status 
FROM Students 
WHERE cgpa >= 8.0 AND backlogs = 0
ORDER BY cgpa DESC;`,
  },
  {
    id: 'aggregates-sum-avg',
    title: 'Statistical Aggregates on Offers',
    category: 'Aggregates',
    concept: 'COUNT, AVG, MAX, MIN, SUM',
    explanation:
      'Calculates total offers issued, maximum LPA package, minimum LPA package, overall average package, and total cumulative salary commitment.',
    sql: `SELECT 
    COUNT(offer_id) AS total_offers_issued,
    MIN(offered_package_lpa) AS min_package_lpa,
    MAX(offered_package_lpa) AS max_package_lpa,
    ROUND(AVG(offered_package_lpa), 2) AS average_package_lpa,
    ROUND(SUM(offered_package_lpa), 2) AS total_payroll_lpa
FROM Offers;`,
  },
  {
    id: 'group-by-having',
    title: 'Department Analytics with HAVING Filtering',
    category: 'Grouping & Filtering',
    concept: 'GROUP BY, HAVING, COUNT, AVG',
    explanation:
      'Groups students by department, calculates average CGPA and student count, and filters only departments with an average CGPA of 8.0 or higher.',
    sql: `SELECT 
    d.dept_name,
    COUNT(s.student_id) AS total_students,
    ROUND(AVG(s.cgpa), 2) AS avg_cgpa,
    SUM(CASE WHEN s.placement_status = 'Placed' THEN 1 ELSE 0 END) AS placed_count
FROM Departments d
INNER JOIN Students s ON d.dept_id = s.dept_id
GROUP BY d.dept_id, d.dept_name
HAVING AVG(s.cgpa) >= 8.0
ORDER BY avg_cgpa DESC;`,
  },
  {
    id: 'multi-table-join',
    title: '5-Table Relational INNER JOIN',
    category: 'Joins',
    concept: 'Multi-table INNER JOIN across 5 entities',
    explanation:
      'Connects Students, Departments, Applications, Jobs, Companies, and Offers to reveal the complete placement audit trail for accepted offers.',
    sql: `SELECT 
    s.name AS student_name,
    d.dept_name,
    s.cgpa,
    c.company_name,
    j.job_title,
    o.offered_package_lpa AS package_lpa,
    o.offer_date,
    o.offer_status
FROM Students s
INNER JOIN Departments d ON s.dept_id = d.dept_id
INNER JOIN Applications a ON s.student_id = a.student_id
INNER JOIN Jobs j ON a.job_id = j.job_id
INNER JOIN Companies c ON j.company_id = c.company_id
INNER JOIN Offers o ON a.application_id = o.application_id
WHERE o.offer_status = 'Accepted'
ORDER BY o.offered_package_lpa DESC;`,
  },
  {
    id: 'left-outer-join',
    title: 'LEFT OUTER JOIN: Students with Zero Applications',
    category: 'Joins',
    concept: 'LEFT OUTER JOIN with IS NULL check',
    explanation:
      'Finds all registered students who have never submitted any job application yet by joining Students with Applications and checking for NULL keys.',
    sql: `SELECT 
    s.student_id,
    s.name,
    s.email,
    d.dept_name,
    s.cgpa,
    s.placement_status
FROM Students s
INNER JOIN Departments d ON s.dept_id = d.dept_id
LEFT JOIN Applications a ON s.student_id = a.student_id
WHERE a.application_id IS NULL;`,
  },
  {
    id: 'nested-subquery',
    title: 'Scalar Nested Subquery: Above Average Students',
    category: 'Subqueries',
    concept: 'Scalar subquery in WHERE clause',
    explanation:
      'Identifies students whose CGPA strictly exceeds the campus-wide average CGPA computed dynamically in a nested SELECT subquery.',
    sql: `SELECT 
    student_id,
    name,
    cgpa,
    placement_status
FROM Students
WHERE cgpa > (
    SELECT AVG(cgpa) 
    FROM Students
)
ORDER BY cgpa DESC;`,
  },
  {
    id: 'correlated-not-exists',
    title: 'Set Operators & NOT EXISTS / NOT IN',
    category: 'Subqueries',
    concept: 'NOT IN subquery to find applied but offer-less candidates',
    explanation:
      'Selects all students who actively applied for campus placements, but have NOT received any job offer yet (unfulfilled applicants).',
    sql: `SELECT 
    s.student_id,
    s.name,
    d.dept_name,
    s.cgpa,
    COUNT(a.application_id) AS applications_sent
FROM Students s
INNER JOIN Departments d ON s.dept_id = d.dept_id
INNER JOIN Applications a ON s.student_id = a.student_id
WHERE s.student_id NOT IN (
    SELECT a2.student_id 
    FROM Offers o
    INNER JOIN Applications a2 ON o.application_id = a2.application_id
)
GROUP BY s.student_id, s.name, d.dept_name, s.cgpa;`,
  },
  {
    id: 'company-job-vacancies',
    title: 'Company Recruitment Pipeline Aggregation',
    category: 'Analytics',
    concept: 'JOIN + SUM + COUNT + COALESCE',
    explanation:
      'Aggregates total roles listed, total open vacancies, highest compensation offered, and applicants per company.',
    sql: `SELECT 
    c.company_name,
    c.industry,
    c.location,
    COUNT(DISTINCT j.job_id) AS jobs_posted,
    SUM(j.vacancies) AS total_vacancies,
    MAX(j.package_lpa) AS max_package_lpa,
    COUNT(a.application_id) AS total_applicants_received
FROM Companies c
LEFT JOIN Jobs j ON c.company_id = j.company_id
LEFT JOIN Applications a ON j.job_id = a.job_id
GROUP BY c.company_id, c.company_name, c.industry, c.location
ORDER BY total_vacancies DESC;`,
  },
];

// ============================================================================
// 3 FORMAL DBMS REPORTS
// ============================================================================

export interface Report1Row {
  dept_id: number;
  dept_name: string;
  total_students: number;
  placed_students: number;
  unplaced_students: number;
  placement_percentage: number;
  avg_cgpa: number;
  highest_package_lpa: number;
  avg_package_lpa: number;
}

export const REPORT_1_SQL = `-- REPORT 1: Department-Wise Placement Performance Report
SELECT 
    d.dept_id,
    d.dept_name,
    COUNT(DISTINCT s.student_id) AS total_students,
    COUNT(DISTINCT CASE WHEN s.placement_status = 'Placed' THEN s.student_id END) AS placed_students,
    COUNT(DISTINCT CASE WHEN s.placement_status = 'Unplaced' THEN s.student_id END) AS unplaced_students,
    ROUND((COUNT(DISTINCT CASE WHEN s.placement_status = 'Placed' THEN s.student_id END) * 100.0) / 
          NULLIF(COUNT(DISTINCT s.student_id), 0), 1) AS placement_percentage,
    ROUND(AVG(s.cgpa), 2) AS avg_cgpa,
    IFNULL(MAX(o.offered_package_lpa), 0.0) AS highest_package_lpa,
    IFNULL(ROUND(AVG(o.offered_package_lpa), 2), 0.0) AS avg_package_lpa
FROM Departments d
LEFT JOIN Students s ON d.dept_id = s.dept_id
LEFT JOIN Applications a ON s.student_id = a.student_id
LEFT JOIN Offers o ON a.application_id = o.application_id AND o.offer_status = 'Accepted'
GROUP BY d.dept_id, d.dept_name
ORDER BY placement_percentage DESC;`;

export interface Report2Row {
  company_id: number;
  company_name: string;
  industry: string;
  location: string;
  total_jobs: number;
  total_applications: number;
  offers_made: number;
  offers_accepted: number;
  min_pkg: number;
  max_pkg: number;
  avg_package_lpa: number;
}

export const REPORT_2_SQL = `-- REPORT 2: Company-Wise Hiring & Salary Packages Report (JOIN + GROUP BY + HAVING)
SELECT 
    c.company_id,
    c.company_name,
    c.industry,
    c.location,
    COUNT(DISTINCT j.job_id) AS total_jobs,
    COUNT(DISTINCT a.application_id) AS total_applications,
    COUNT(DISTINCT o.offer_id) AS offers_made,
    COUNT(DISTINCT CASE WHEN o.offer_status = 'Accepted' THEN o.offer_id END) AS offers_accepted,
    IFNULL(MIN(o.offered_package_lpa), MIN(j.package_lpa)) AS min_pkg,
    IFNULL(MAX(o.offered_package_lpa), MAX(j.package_lpa)) AS max_pkg,
    IFNULL(ROUND(AVG(o.offered_package_lpa), 2), ROUND(AVG(j.package_lpa), 2)) AS avg_package_lpa
FROM Companies c
LEFT JOIN Jobs j ON c.company_id = j.company_id
LEFT JOIN Applications a ON j.job_id = a.job_id
LEFT JOIN Offers o ON a.application_id = o.application_id
GROUP BY c.company_id, c.company_name, c.industry, c.location
HAVING COUNT(DISTINCT j.job_id) > 0
ORDER BY max_pkg DESC;`;

export interface Report3Row {
  student_id: number;
  name: string;
  email: string;
  dept_name: string;
  cgpa: number;
  backlogs: number;
  skills: string;
  applications_count: number;
  shortlisted_count: number;
  rejected_count: number;
}

export const REPORT_3_SQL = `-- REPORT 3: Unplaced Students & Application Activity (LEFT JOIN + Subquery)
SELECT 
    s.student_id,
    s.name,
    s.email,
    d.dept_name,
    s.cgpa,
    s.backlogs,
    s.skills,
    COUNT(a.application_id) AS applications_count,
    SUM(CASE WHEN a.status = 'Shortlisted' THEN 1 ELSE 0 END) AS shortlisted_count,
    SUM(CASE WHEN a.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_count
FROM Students s
INNER JOIN Departments d ON s.dept_id = d.dept_id
LEFT JOIN Applications a ON s.student_id = a.student_id
WHERE s.placement_status = 'Unplaced'
GROUP BY s.student_id, s.name, s.email, d.dept_name, s.cgpa, s.backlogs, s.skills
ORDER BY s.cgpa DESC, applications_count ASC;`;

export async function fetchReport1(): Promise<Report1Row[]> {
  return sqliteService.query<Report1Row>(REPORT_1_SQL);
}

export async function fetchReport2(): Promise<Report2Row[]> {
  return sqliteService.query<Report2Row>(REPORT_2_SQL);
}

export async function fetchReport3(): Promise<Report3Row[]> {
  return sqliteService.query<Report3Row>(REPORT_3_SQL);
}
