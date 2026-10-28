import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { fetchStudents, fetchDepartments } from '../db/queries';
import { Student, Department } from '../db/types';
import { sqliteService } from '../db/sqlite';
import { ScreenId } from '../components/Sidebar';

interface StudentsScreenProps {
  onNavigate: (screen: ScreenId, extra?: any) => void;
}

export const StudentsScreen: React.FC<StudentsScreenProps> = ({ onNavigate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'cgpa' | 'name' | 'student_id'>('cgpa');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [sList, dList] = await Promise.all([fetchStudents(), fetchDepartments()]);
      setStudents(sList);
      setDepartments(dList);
    } catch (e) {
      console.error('Error fetching students:', e);
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

  const filteredStudents = students
    .filter((s) => {
      if (selectedDept !== 'ALL' && s.dept_id !== Number(selectedDept)) return false;
      if (selectedStatus !== 'ALL' && s.placement_status !== selectedStatus) return false;
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesEmail = s.email.toLowerCase().includes(query);
        const matchesSkills = s.skills.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesSkills;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'cgpa') {
        return sortAsc ? a.cgpa - b.cgpa : b.cgpa - a.cgpa;
      }
      if (sortField === 'name') {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return sortAsc ? a.student_id - b.student_id : b.student_id - a.student_id;
    });

  const toggleSort = (field: 'cgpa' | 'name' | 'student_id') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
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
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Students Directory ({students.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Entity <code>Students</code> in 3NF (linked to <code>Departments</code> lookup table)
          </p>
        </div>
        <button
          onClick={() => onNavigate('add_record')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, or skill (e.g. Python, Java)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="flex-1 md:flex-none text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.dept_id} value={d.dept_id}>
                {d.dept_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 md:flex-none text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="Unplaced">Unplaced</option>
            <option value="Placed">Placed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono">
              <tr>
                <th
                  onClick={() => toggleSort('student_id')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Student Details</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Department</th>
                <th
                  onClick={() => toggleSort('cgpa')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>CGPA</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Backlogs</th>
                <th className="px-4 py-3">Skills Inventory</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No students match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.student_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500">
                      #{student.student_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.email} • {student.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {student.dept_name}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          student.cgpa >= 8.5
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : student.cgpa >= 7.0
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {student.cgpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {student.backlogs > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          {student.backlogs} backlog{student.backlogs > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {student.skills.split(',').slice(0, 3).map((sk, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {sk.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.placement_status === 'Placed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {student.placement_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onNavigate('update_record', { entity: 'student', id: student.student_id })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit student"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigate('delete_record', { entity: 'student', id: student.student_id })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete student"
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
