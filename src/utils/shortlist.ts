import { Student, Job, EligibilityResult, Application } from '../db/types';

/**
 * Checks a student's eligibility for a given job criteria.
 * Requirements:
 * 1. cgpa >= min_cgpa
 * 2. backlogs <= max_backlogs_allowed
 * 3. department matches eligible_dept_id (or eligible_dept_id is null / all departments)
 * 4. student's skills contain required_skill (case-insensitive substring)
 * 5. student's placement_status is 'Unplaced'
 */
export function evaluateStudentEligibility(
  student: Student,
  job: Job,
  existingApplications: Application[] = []
): EligibilityResult {
  const reasons: string[] = [];

  // Check 1: Placement status
  if (student.placement_status === 'Placed') {
    reasons.push('Already Placed (Campus policy allows unplaced students only)');
  }

  // Check 2: CGPA
  if (student.cgpa < job.min_cgpa) {
    reasons.push(`CGPA ${student.cgpa.toFixed(2)} is below required minimum ${job.min_cgpa.toFixed(2)}`);
  }

  // Check 3: Backlogs
  if (student.backlogs > job.max_backlogs_allowed) {
    reasons.push(`Active backlogs (${student.backlogs}) exceed allowed maximum (${job.max_backlogs_allowed})`);
  }

  // Check 4: Department eligibility
  if (job.eligible_dept_id !== null && job.eligible_dept_id !== undefined && job.eligible_dept_id > 0) {
    if (student.dept_id !== job.eligible_dept_id) {
      const targetDept = job.eligible_dept_name || `Dept #${job.eligible_dept_id}`;
      const studentDept = student.dept_name || `Dept #${student.dept_id}`;
      reasons.push(`Department mismatch: Job restricted to ${targetDept} (Student is in ${studentDept})`);
    }
  }

  // Check 5: Required skill
  if (job.required_skill && job.required_skill.trim().length > 0) {
    const studentSkills = (student.skills || '').toLowerCase();
    const required = job.required_skill.trim().toLowerCase();
    if (!studentSkills.includes(required)) {
      reasons.push(`Missing required skill: "${job.required_skill}" not listed in student skills`);
    }
  }

  // Check existing application
  const existingApp = existingApplications.find(
    (app) => app.student_id === student.student_id && app.job_id === job.job_id
  );

  return {
    student,
    isEligible: reasons.length === 0,
    reasons,
    alreadyApplied: Boolean(existingApp),
    currentAppStatus: existingApp?.status,
  };
}

/**
 * Builds the exact SQL query used by the DBMS engine to query eligible candidates for this job.
 */
export function buildAutoShortlistSql(job: Job): string {
  const whereClauses: string[] = [
    `s.placement_status = 'Unplaced'`,
    `s.cgpa >= ${job.min_cgpa}`,
    `s.backlogs <= ${job.max_backlogs_allowed}`
  ];

  if (job.eligible_dept_id) {
    whereClauses.push(`s.dept_id = ${job.eligible_dept_id}`);
  }

  if (job.required_skill && job.required_skill.trim().length > 0) {
    // Escaped SQL like
    const skillEscaped = job.required_skill.replace(/'/g, "''").toLowerCase();
    whereClauses.push(`LOWER(s.skills) LIKE '%${skillEscaped}%'`);
  }

  return `-- DBMS Query: Auto-Shortlisting Candidates for Job #${job.job_id} (${job.job_title})
SELECT 
    s.student_id,
    s.name AS student_name,
    s.email,
    d.dept_name,
    s.cgpa,
    s.backlogs,
    s.skills,
    s.placement_status
FROM Students s
INNER JOIN Departments d ON s.dept_id = d.dept_id
WHERE ${whereClauses.join('\n  AND ')}
ORDER BY s.cgpa DESC, s.backlogs ASC;`;
}

/**
 * Builds the batch INSERT/UPDATE query to shortlisted status in the Applications table
 */
export function buildConfirmShortlistSql(jobId: number, studentIds: number[]): string {
  if (studentIds.length === 0) return '-- No students to shortlist';
  const today = new Date().toISOString().split('T')[0];
  const values = studentIds
    .map((id) => `(${id}, ${jobId}, '${today}', 'Shortlisted')`)
    .join(',\n    ');

  return `-- Batch insert into Applications table using SQLite UPSERT (ON CONFLICT)
INSERT INTO Applications (student_id, job_id, applied_date, status)
VALUES 
    ${values}
ON CONFLICT(student_id, job_id) 
DO UPDATE SET status = 'Shortlisted', applied_date = excluded.applied_date;`;
}
