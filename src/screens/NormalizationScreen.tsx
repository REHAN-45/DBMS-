import React, { useState } from 'react';
import { GitFork, CheckCircle2, ArrowRight, ShieldCheck, Database, Layers, BookOpen } from 'lucide-react';

export const NormalizationScreen: React.FC = () => {
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3>(0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GitFork className="w-5 h-5 text-indigo-500" />
          Database Normalization & 3NF Architecture
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Academic walkthrough illustrating conversion from Unnormalized Form (UNF) to 1NF, 2NF, and 3NF
        </p>
      </div>

      {/* Interactive Step Navigator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { step: 0, title: '0. Unnormalized Form (UNF)', subtitle: 'Raw Spreadsheet with Anomalies' },
          { step: 1, title: '1. First Normal Form (1NF)', subtitle: 'Atomic Values & Primary Keys' },
          { step: 2, title: '2. Second Normal Form (2NF)', subtitle: 'No Partial Dependencies' },
          { step: 3, title: '3. Third Normal Form (3NF)', subtitle: 'No Transitive Dependencies' },
        ].map((item) => {
          const isActive = activeStep === item.step;
          return (
            <button
              key={item.step}
              onClick={() => setActiveStep(item.step as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div
                className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isActive ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400 font-mono'
                }`}
              >
                Normal Form
              </div>
              <h4 className="text-xs font-bold">{item.title}</h4>
              <p
                className={`text-[11px] mt-0.5 line-clamp-1 ${
                  isActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Step 0: UNF */}
      {activeStep === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-bold">
            <Layers className="w-5 h-5" />
            <span>Unnormalized Placement Record (UNF - High Redundancy & Anomalies)</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            In colleges, placement data is often initially tracked in a single messy spreadsheet. Notice multi-valued
            skills attributes, repeating company information, and departmental data duplicated on every student row.
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-[11px] text-left font-mono">
              <thead className="bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 uppercase">
                <tr>
                  <th className="p-2.5">RollNo</th>
                  <th className="p-2.5">Student_Name</th>
                  <th className="p-2.5">Department</th>
                  <th className="p-2.5">Skills (Multi-valued)</th>
                  <th className="p-2.5">Applied_Company</th>
                  <th className="p-2.5">Company_HQ</th>
                  <th className="p-2.5">Job_Title</th>
                  <th className="p-2.5">Package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                <tr>
                  <td className="p-2.5 font-bold">101</td>
                  <td className="p-2.5">Aarav Sharma</td>
                  <td className="p-2.5">CSE (Building B)</td>
                  <td className="p-2.5 text-rose-600">Java, Spring, Docker</td>
                  <td className="p-2.5">Microsoft IDC</td>
                  <td className="p-2.5">Hyderabad</td>
                  <td className="p-2.5">Software Engineer</td>
                  <td className="p-2.5">44.5 LPA</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">101</td>
                  <td className="p-2.5">Aarav Sharma</td>
                  <td className="p-2.5">CSE (Building B)</td>
                  <td className="p-2.5 text-rose-600">Java, Spring, Docker</td>
                  <td className="p-2.5">Google India</td>
                  <td className="p-2.5">Bengaluru</td>
                  <td className="p-2.5">Software Engineer</td>
                  <td className="p-2.5">52.0 LPA</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">102</td>
                  <td className="p-2.5">Priya Patel</td>
                  <td className="p-2.5">CSE (Building B)</td>
                  <td className="p-2.5 text-rose-600">Python, React, AWS</td>
                  <td className="p-2.5">Google India</td>
                  <td className="p-2.5">Bengaluru</td>
                  <td className="p-2.5">Software Engineer</td>
                  <td className="p-2.5">52.0 LPA</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
              <strong className="block mb-1 font-bold">1. Insertion Anomaly:</strong>
              Cannot add a new Department or Company before a student applies for that company.
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
              <strong className="block mb-1 font-bold">2. Deletion Anomaly:</strong>
              Deleting a student's application accidentally wipes out the company HQ and job package details.
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
              <strong className="block mb-1 font-bold">3. Update Anomaly:</strong>
              If Microsoft changes its HQ from Hyderabad to Bengaluru, multiple rows must be edited inconsistently.
            </div>
          </div>
        </div>
      )}

      {/* Step 1: 1NF */}
      {activeStep === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span>First Normal Form (1NF) Rules & Transformation</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <p>
              <strong>1NF Definition:</strong> A relation $R$ is in 1NF if and only if all domain attributes are
              <strong> atomic (indivisible)</strong> and there are <strong>no repeating groups</strong>.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Every row must have a unique identifier (Primary Key candidate: <code>(RollNo, Job_Id)</code>).
            </p>
          </div>

          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
            Remaining Flaw in 1NF: Partial Dependency
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            While values are atomic, non-prime attributes like <code>Student_Name</code> and <code>Department</code>
            depend ONLY on <code>RollNo</code>, which is just a part of the composite key <code>(RollNo, Job_Id)</code>!
          </p>
        </div>
      )}

      {/* Step 2: 2NF */}
      {activeStep === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span>Second Normal Form (2NF) Rules & Entity Decomposition</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <p>
              <strong>2NF Definition:</strong> A relation $R$ is in 2NF if:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>It is already in 1NF.</li>
              <li>
                <strong>No partial dependency exists</strong>: Every non-prime attribute is fully functionally
                dependent on the primary key ($X \rightarrow Y$).
              </li>
            </ol>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            To satisfy 2NF, we split the composite structure into distinct entities:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200">
              <strong className="block mb-1 text-blue-700 dark:text-blue-300">Entity: Students</strong>
              PK: student_id<br />
              name, email, phone, dept_id, dept_name, cgpa
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200">
              <strong className="block mb-1 text-blue-700 dark:text-blue-300">Entity: Jobs</strong>
              PK: job_id<br />
              company_id, company_name, package_lpa
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200">
              <strong className="block mb-1 text-blue-700 dark:text-blue-300">Relation: Applications</strong>
              Composite PK: (student_id, job_id)<br />
              applied_date, status
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
            Remaining Flaw in 2NF: Transitive Dependency
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            In <code>Students</code>, <code>dept_id $\rightarrow$ dept_name</code>. Since <code>student_id $\rightarrow$ dept_id</code>,
            <code>dept_name</code> transitively depends on <code>student_id</code>!
          </p>
        </div>
      )}

      {/* Step 3: 3NF */}
      {activeStep === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span>Third Normal Form (3NF) - Production Architecture</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <p>
              <strong>3NF Definition:</strong> A relation $R$ is in 3NF if:
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>It is already in 2NF.</li>
              <li>
                <strong>No transitive dependency exists</strong>: Non-prime attributes must depend solely on candidate keys
                (for every non-trivial $X \rightarrow Y$, either $X$ is a superkey or $Y$ is a prime attribute).
              </li>
            </ol>
          </div>

          {/* 6 Final 3NF Tables Audit */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Verification of Our 6 Final Relational Tables in 3NF:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">1. Departments</span>
                <p className="text-slate-500 text-[11px] mt-0.5">dept_id (PK) $\rightarrow$ dept_name (UNIQUE)</p>
                <span className="text-[10px] text-emerald-600 font-bold">3NF Compliant Lookup Table</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">2. Students</span>
                <p className="text-slate-500 text-[11px] mt-0.5">student_id (PK) $\rightarrow$ name, email, phone, dept_id (FK), cgpa, backlogs, skills, placement_status</p>
                <span className="text-[10px] text-emerald-600 font-bold">3NF Compliant (Transitive dept_name removed)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">3. Companies</span>
                <p className="text-slate-500 text-[11px] mt-0.5">company_id (PK) $\rightarrow$ company_name, industry, location, contact_email, visit_date</p>
                <span className="text-[10px] text-emerald-600 font-bold">3NF Compliant (Company details isolated)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">4. Jobs</span>
                <p className="text-slate-500 text-[11px] mt-0.5">job_id (PK) $\rightarrow$ company_id (FK), job_title, package_lpa, min_cgpa, eligible_dept_id (FK), required_skill</p>
                <span className="text-[10px] text-emerald-600 font-bold">3NF Compliant (Zero redundant company metadata)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">5. Applications</span>
                <p className="text-slate-500 text-[11px] mt-0.5">application_id (PK), (student_id, job_id) UNIQUE $\rightarrow$ applied_date, status</p>
                <span className="text-[10px] text-emerald-600 font-bold">3NF Compliant Relational Mapping</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">6. Offers</span>
                <p className="text-slate-500 text-[11px] mt-0.5">offer_id (PK), application_id (FK UNIQUE) $\rightarrow$ offered_package_lpa, offer_date, offer_status</p>
                <span className="text-[10px] text-emerald-600 font-bold">3NF Compliant (1-to-1 candidate selection)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
