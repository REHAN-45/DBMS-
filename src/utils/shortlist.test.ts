import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStudentEligibility, buildAutoShortlistSql, buildConfirmShortlistSql } from './shortlist';
import { Student, Job } from '../db/types';

const mockJob: Job = {
  job_id: 101,
  company_id: 1,
  job_title: 'Software Development Engineer',
  package_lpa: 14.5,
  min_cgpa: 8.0,
  max_backlogs_allowed: 0,
  eligible_dept_id: 1, // CSE only
  eligible_dept_name: 'Computer Science',
  required_skill: 'Java',
  vacancies: 5,
  last_date: '2026-12-31',
};

const eligibleStudent: Student = {
  student_id: 1,
  name: 'Aarav Sharma',
  email: 'aarav@college.edu',
  phone: '9876543210',
  dept_id: 1,
  dept_name: 'Computer Science',
  cgpa: 8.7,
  backlogs: 0,
  graduation_year: 2026,
  skills: 'Java, Spring Boot, MySQL, Git',
  resume_link: 'https://example.com/aarav.pdf',
  placement_status: 'Unplaced',
};

test('evaluateStudentEligibility marks eligible candidate correctly', () => {
  const result = evaluateStudentEligibility(eligibleStudent, mockJob, []);
  assert.equal(result.isEligible, true);
  assert.equal(result.reasons.length, 0);
});

test('evaluateStudentEligibility catches low CGPA', () => {
  const lowCgpaStudent: Student = { ...eligibleStudent, cgpa: 7.2 };
  const result = evaluateStudentEligibility(lowCgpaStudent, mockJob, []);
  assert.equal(result.isEligible, false);
  assert.match(result.reasons[0], /CGPA 7.20 is below required minimum 8.00/);
});

test('evaluateStudentEligibility catches backlogs', () => {
  const backlogStudent: Student = { ...eligibleStudent, backlogs: 2 };
  const result = evaluateStudentEligibility(backlogStudent, mockJob, []);
  assert.equal(result.isEligible, false);
  assert.match(result.reasons[0], /Active backlogs \(2\) exceed allowed maximum \(0\)/);
});

test('evaluateStudentEligibility catches department mismatch', () => {
  const mechStudent: Student = { ...eligibleStudent, dept_id: 5, dept_name: 'Mechanical Engineering' };
  const result = evaluateStudentEligibility(mechStudent, mockJob, []);
  assert.equal(result.isEligible, false);
  assert.match(result.reasons[0], /Department mismatch/);
});

test('evaluateStudentEligibility catches missing required skill', () => {
  const noJavaStudent: Student = { ...eligibleStudent, skills: 'Python, Django, PostgreSQL' };
  const result = evaluateStudentEligibility(noJavaStudent, mockJob, []);
  assert.equal(result.isEligible, false);
  assert.match(result.reasons[0], /Missing required skill/);
});

test('evaluateStudentEligibility rejects already placed students', () => {
  const placedStudent: Student = { ...eligibleStudent, placement_status: 'Placed' };
  const result = evaluateStudentEligibility(placedStudent, mockJob, []);
  assert.equal(result.isEligible, false);
  assert.match(result.reasons[0], /Already Placed/);
});

test('buildAutoShortlistSql produces valid SQL string', () => {
  const sql = buildAutoShortlistSql(mockJob);
  assert.match(sql, /SELECT/);
  assert.match(sql, /s\.cgpa >= 8/);
  assert.match(sql, /s\.backlogs <= 0/);
  assert.match(sql, /s\.dept_id = 1/);
  assert.match(sql, /LOWER\(s\.skills\) LIKE '%java%'/);
});

test('buildConfirmShortlistSql generates UPSERT query for applicants', () => {
  const sql = buildConfirmShortlistSql(101, [1, 2, 3]);
  assert.match(sql, /INSERT INTO Applications/);
  assert.match(sql, /ON CONFLICT\(student_id, job_id\)/);
  assert.match(sql, /DO UPDATE SET status = 'Shortlisted'/);
});
