export type PlacementStatus = 'Unplaced' | 'Placed';
export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';
export type OfferStatus = 'Offered' | 'Accepted' | 'Declined';

export interface Department {
  dept_id: number;
  dept_name: string;
}

export interface Student {
  student_id: number;
  name: string;
  email: string;
  phone: string;
  dept_id: number;
  dept_name?: string;
  cgpa: number;
  backlogs: number;
  graduation_year: number;
  skills: string;
  resume_link: string | null;
  placement_status: PlacementStatus;
}

export interface Company {
  company_id: number;
  company_name: string;
  industry: string;
  location: string;
  contact_email: string;
  visit_date: string;
}

export interface Job {
  job_id: number;
  company_id: number;
  company_name?: string;
  job_title: string;
  package_lpa: number;
  min_cgpa: number;
  max_backlogs_allowed: number;
  eligible_dept_id: number | null;
  eligible_dept_name?: string | null;
  required_skill: string;
  vacancies: number;
  last_date: string;
}

export interface Application {
  application_id: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  student_cgpa?: number;
  dept_name?: string;
  job_id: number;
  job_title?: string;
  company_name?: string;
  applied_date: string;
  status: ApplicationStatus;
  offer_id?: number | null;
  offered_package_lpa?: number | null;
  offer_status?: OfferStatus | null;
}

export interface Offer {
  offer_id: number;
  application_id: number;
  offered_package_lpa: number;
  offer_date: string;
  offer_status: OfferStatus;
  student_name?: string;
  company_name?: string;
  job_title?: string;
}

export interface SqlLogEntry {
  id: string;
  sql: string;
  timestamp: string;
  durationMs: number;
  rowsAffected?: number;
  error?: string;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL' | 'PRAGMA' | 'OTHER';
}

export interface EligibilityResult {
  student: Student;
  isEligible: boolean;
  reasons: string[]; // reasons for failure if not eligible
  alreadyApplied: boolean;
  currentAppStatus?: ApplicationStatus;
}
