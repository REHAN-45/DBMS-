/**
 * Placement & Recruitment Management System - DBMS Schema (3rd Normal Form)
 * Course Project Specification:
 * - 6 Entities satisfying 1NF, 2NF, and 3NF.
 * - Explicit PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, CHECK, and DEFAULT constraints.
 * - Realistic Indian College placement drive dataset.
 */

export const SCHEMA_SQL = `-- =====================================================================
-- CAMPUS PLACEMENT & RECRUITMENT MANAGEMENT SYSTEM
-- Relational Database Schema (3rd Normal Form compliant)
-- Target DBMS: SQLite 3 with Foreign Key Enforcement
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Table 1: Departments (Lookup Table)
-- Eliminates transitive dependencies from Students and Jobs (3NF)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Departments (
    dept_id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_name TEXT NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- Table 2: Students
-- Stores registered students with academic performance & placement status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    dept_id INTEGER NOT NULL,
    cgpa REAL NOT NULL CHECK(cgpa >= 0.0 AND cgpa <= 10.0),
    backlogs INTEGER NOT NULL CHECK(backlogs >= 0),
    graduation_year INTEGER NOT NULL,
    skills TEXT NOT NULL,
    resume_link TEXT,
    placement_status TEXT NOT NULL DEFAULT 'Unplaced' CHECK(placement_status IN ('Unplaced', 'Placed')),
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- Table 3: Companies
-- Registered recruitment partners visiting the campus
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Companies (
    company_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL UNIQUE,
    industry TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    visit_date TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- Table 4: Jobs
-- Job vacancies offered by visiting recruitment partners
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Jobs (
    job_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    job_title TEXT NOT NULL,
    package_lpa REAL NOT NULL CHECK(package_lpa > 0.0),
    min_cgpa REAL NOT NULL CHECK(min_cgpa >= 0.0 AND min_cgpa <= 10.0),
    max_backlogs_allowed INTEGER NOT NULL CHECK(max_backlogs_allowed >= 0),
    eligible_dept_id INTEGER,
    required_skill TEXT NOT NULL,
    vacancies INTEGER NOT NULL CHECK(vacancies > 0),
    last_date TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES Companies(company_id) ON DELETE RESTRICT,
    FOREIGN KEY (eligible_dept_id) REFERENCES Departments(dept_id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- Table 5: Applications
-- Represents student job applications (Composite candidate key constraint)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Applications (
    application_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    applied_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Applied' CHECK(status IN ('Applied', 'Shortlisted', 'Rejected', 'Selected')),
    UNIQUE(student_id, job_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES Jobs(job_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Table 6: Offers
-- Final job offers issued to selected applicants
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Offers (
    offer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL UNIQUE,
    offered_package_lpa REAL NOT NULL CHECK(offered_package_lpa > 0.0),
    offer_date TEXT NOT NULL,
    offer_status TEXT NOT NULL DEFAULT 'Offered' CHECK(offer_status IN ('Offered', 'Accepted', 'Declined')),
    FOREIGN KEY (application_id) REFERENCES Applications(application_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Useful Indexes for Fast Joining and Query Performance
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_dept ON Students(dept_id);
CREATE INDEX IF NOT EXISTS idx_students_cgpa ON Students(cgpa);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON Jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON Applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON Applications(job_id);
`;

export const SEED_DATA_SQL = `-- =====================================================================
-- SEED DATA: Realistic Indian College Placement Drive
-- =====================================================================

-- 1. Departments (6 departments)
INSERT INTO Departments (dept_id, dept_name) VALUES
(1, 'Computer Science & Engineering'),
(2, 'Information Technology'),
(3, 'Electronics & Communication Engineering'),
(4, 'Electrical & Electronics Engineering'),
(5, 'Mechanical Engineering'),
(6, 'Artificial Intelligence & Data Science');

-- 2. Students (14 students with varied profiles, CGPAs, and backlogs)
INSERT INTO Students (student_id, name, email, phone, dept_id, cgpa, backlogs, graduation_year, skills, resume_link, placement_status) VALUES
(1, 'Aarav Sharma', 'aarav.sharma@college.edu', '9876543210', 1, 9.45, 0, 2026, 'Java, Spring Boot, Microservices, SQL, Docker', 'https://drive.college.edu/resumes/aarav.pdf', 'Placed'),
(2, 'Priya Patel', 'priya.patel@college.edu', '9876543211', 1, 8.82, 0, 2026, 'Python, Django, React, PostgreSQL, AWS', 'https://drive.college.edu/resumes/priya.pdf', 'Placed'),
(3, 'Rohan Iyer', 'rohan.iyer@college.edu', '9876543212', 2, 8.15, 0, 2026, 'C++, Python, Machine Learning, TensorFlow, Git', 'https://drive.college.edu/resumes/rohan.pdf', 'Placed'),
(4, 'Ananya Gupta', 'ananya.gupta@college.edu', '9876543213', 6, 9.10, 0, 2026, 'Python, PyTorch, Natural Language Processing, SQL', 'https://drive.college.edu/resumes/ananya.pdf', 'Placed'),
(5, 'Siddharth Nair', 'siddharth.nair@college.edu', '9876543214', 3, 7.80, 0, 2026, 'Embedded C, Verilog, IoT, Python, Circuit Design', 'https://drive.college.edu/resumes/siddharth.pdf', 'Placed'),
(6, 'Sneha Verma', 'sneha.verma@college.edu', '9876543215', 1, 8.40, 0, 2026, 'Java, React, TypeScript, Node.js, MongoDB', 'https://drive.college.edu/resumes/sneha.pdf', 'Unplaced'),
(7, 'Vikram Malhotra', 'vikram.malhotra@college.edu', '9876543216', 5, 7.35, 1, 2026, 'AutoCAD, SolidWorks, MATLAB, ANSYS, Python', 'https://drive.college.edu/resumes/vikram.pdf', 'Unplaced'),
(8, 'Ishita Sen', 'ishita.sen@college.edu', '9876543217', 2, 7.95, 0, 2026, 'Java, SQL, Selenium, QA Testing, Jira', 'https://drive.college.edu/resumes/ishita.pdf', 'Placed'),
(9, 'Rahul Deshmukh', 'rahul.deshmukh@college.edu', '9876543218', 4, 6.90, 2, 2026, 'Power Systems, MATLAB, C++, PLC Programming', 'https://drive.college.edu/resumes/rahul.pdf', 'Unplaced'),
(10, 'Pooja Reddy', 'pooja.reddy@college.edu', '9876543219', 6, 8.60, 0, 2026, 'Python, Data Analytics, Tableau, SQL, Power BI', 'https://drive.college.edu/resumes/pooja.pdf', 'Unplaced'),
(11, 'Tanmay Joshi', 'tanmay.joshi@college.edu', '9876543220', 1, 7.20, 0, 2026, 'C++, Java, HTML, CSS, JavaScript, MySQL', 'https://drive.college.edu/resumes/tanmay.pdf', 'Unplaced'),
(12, 'Meera Krishnan', 'meera.krishnan@college.edu', '9876543221', 3, 8.55, 0, 2026, 'Python, VLSI, Embedded Systems, C, MATLAB', 'https://drive.college.edu/resumes/meera.pdf', 'Placed'),
(13, 'Aditya Saxena', 'aditya.saxena@college.edu', '9876543222', 2, 6.45, 1, 2026, 'HTML, CSS, JavaScript, PHP, MySQL', 'https://drive.college.edu/resumes/aditya.pdf', 'Unplaced'),
(14, 'Divya Pillai', 'divya.pillai@college.edu', '9876543223', 5, 8.20, 0, 2026, 'Robotics, SolidWorks, Python, Mechatronics, ROS', 'https://drive.college.edu/resumes/divya.pdf', 'Placed');

-- 3. Companies (8 top tech & core recruiters)
INSERT INTO Companies (company_id, company_name, industry, location, contact_email, visit_date) VALUES
(1, 'Microsoft IDC', 'Information Technology', 'Hyderabad', 'campus@microsoft.com', '2026-09-10'),
(2, 'Google India', 'Software & Cloud', 'Bengaluru', 'university-recruiting@google.com', '2026-09-15'),
(3, 'TCS Digital', 'IT Consulting & Services', 'Mumbai', 'tcs.digital.campus@tcs.com', '2026-09-22'),
(4, 'Infosys Springboard', 'Software Services', 'Bengaluru', 'earlycareers@infosys.com', '2026-09-28'),
(5, 'Wipro Turbo', 'IT & Digital Solutions', 'Chennai', 'turbo.hiring@wipro.com', '2026-10-05'),
(6, 'Larsen & Toubro (L&T)', 'Heavy Engineering & Infra', 'Pune', 'campus.relations@larsentoubro.com', '2026-10-12'),
(7, 'Deloitte USI', 'Consulting & Advisory', 'Hyderabad', 'usirecruiting@deloitte.com', '2026-10-18'),
(8, 'Zoho Corporation', 'SaaS & Enterprise Software', 'Chennai', 'talent@zohocorp.com', '2026-10-25');

-- 4. Jobs (10 job postings with diverse requirements)
INSERT INTO Jobs (job_id, company_id, job_title, package_lpa, min_cgpa, max_backlogs_allowed, eligible_dept_id, required_skill, vacancies, last_date) VALUES
(1, 1, 'Software Engineer - Azure Cloud', 44.50, 8.50, 0, 1, 'Java', 3, '2026-09-08'),
(2, 2, 'Software Engineer - ML & Search', 52.00, 8.75, 0, NULL, 'Python', 2, '2026-09-12'),
(3, 3, 'System Engineer (Digital Track)', 7.50, 7.00, 0, NULL, 'SQL', 15, '2026-09-20'),
(4, 4, 'Specialist Programmer', 9.50, 7.50, 0, 2, 'Python', 8, '2026-09-25'),
(5, 5, 'Turbo Developer', 6.50, 6.50, 1, NULL, 'Java', 20, '2026-10-02'),
(6, 6, 'Graduate Engineer Trainee - Core', 6.00, 7.00, 0, 5, 'SolidWorks', 6, '2026-10-10'),
(7, 7, 'Business Technology Analyst', 11.20, 7.50, 0, NULL, 'Tableau', 5, '2026-10-15'),
(8, 8, 'Backend Product Engineer', 12.00, 7.00, 0, NULL, 'Java', 10, '2026-10-22'),
(9, 1, 'Cloud Support Associate', 16.00, 7.80, 0, 2, 'AWS', 4, '2026-09-08'),
(10, 6, 'Robotics & Automation Engineer', 8.50, 7.50, 0, 5, 'Robotics', 3, '2026-10-10');

-- 5. Applications (16 applications with distinct statuses)
INSERT INTO Applications (application_id, student_id, job_id, applied_date, status) VALUES
(1, 1, 1, '2026-09-02', 'Selected'),
(2, 2, 2, '2026-09-03', 'Selected'),
(3, 3, 2, '2026-09-04', 'Selected'),
(4, 4, 2, '2026-09-04', 'Selected'),
(5, 5, 3, '2026-09-05', 'Selected'),
(6, 8, 3, '2026-09-06', 'Selected'),
(7, 12, 3, '2026-09-06', 'Selected'),
(8, 14, 6, '2026-09-10', 'Selected'),
(9, 14, 10, '2026-09-12', 'Selected'),
(10, 6, 1, '2026-09-05', 'Shortlisted'),
(11, 6, 8, '2026-09-15', 'Applied'),
(12, 10, 7, '2026-09-16', 'Shortlisted'),
(13, 11, 5, '2026-09-20', 'Applied'),
(14, 7, 6, '2026-09-18', 'Rejected'),
(15, 9, 5, '2026-09-22', 'Rejected'),
(16, 2, 1, '2026-09-02', 'Selected');

-- 6. Offers (11 offers covering Offered, Accepted, and Declined states)
INSERT INTO Offers (offer_id, application_id, offered_package_lpa, offer_date, offer_status) VALUES
(1, 1, 44.50, '2026-09-12', 'Accepted'),
(2, 2, 52.00, '2026-09-16', 'Accepted'),
(3, 16, 44.50, '2026-09-12', 'Declined'),
(4, 3, 52.00, '2026-09-16', 'Accepted'),
(5, 4, 52.00, '2026-09-16', 'Accepted'),
(6, 5, 7.50, '2026-09-24', 'Accepted'),
(7, 6, 7.50, '2026-09-24', 'Accepted'),
(8, 7, 7.50, '2026-09-24', 'Accepted'),
(9, 8, 6.00, '2026-10-14', 'Declined'),
(10, 9, 8.50, '2026-10-14', 'Accepted'),
(11, 10, 44.50, '2026-09-14', 'Offered');
`;

export const ALTER_TABLE_EXAMPLE_SQL = `-- DDL ALTER TABLE Demonstrations:
-- 1. Adding a new column with DEFAULT constraint to Students table:
ALTER TABLE Students ADD COLUMN linked_in_profile TEXT DEFAULT NULL;

-- 2. Adding column for Company tier:
ALTER TABLE Companies ADD COLUMN tier_category TEXT DEFAULT 'Tier 1';
`;
