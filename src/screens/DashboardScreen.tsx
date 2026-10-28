import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  FileCheck,
  Award,
  TrendingUp,
  Percent,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  IndianRupee,
} from 'lucide-react';
import {
  fetchDashboardMetrics,
  fetchDeptPlacementChart,
  fetchPackageDistribution,
  fetchOffers,
  DashboardMetrics,
  DeptChartData,
  PackageTierData,
} from '../db/queries';
import { Offer } from '../db/types';
import { sqliteService } from '../db/sqlite';
import { ScreenId } from '../components/Sidebar';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [deptData, setDeptData] = useState<DeptChartData[]>([]);
  const [packageTiers, setPackageTiers] = useState<PackageTierData[]>([]);
  const [recentOffers, setRecentOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [m, d, p, o] = await Promise.all([
        fetchDashboardMetrics(),
        fetchDeptPlacementChart(),
        fetchPackageDistribution(),
        fetchOffers(),
      ]);
      setMetrics(m);
      setDeptData(d);
      setPackageTiers(p);
      setRecentOffers(o.slice(0, 5));
    } catch (e) {
      console.error('Error loading dashboard data:', e);
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

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Calculate highest count for bar chart scaling
  const maxOfferTier = Math.max(...packageTiers.map((t) => t.offer_count), 1);

  return (
    <div className="space-y-6">
      {/* Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Placement Season 2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Placement & Recruitment Management
          </h2>
          <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed">
            Course Project DBMS Prototype powered by in-browser SQLite WASM with relational 3NF
            normalization, foreign keys, and intelligent auto-shortlisting.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('auto_shortlist')}
              className="px-4 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Launch Auto-Shortlist Engine</span>
            </button>
            <button
              onClick={() => onNavigate('sql_console')}
              className="px-4 py-2 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-2"
            >
              <span>Open SQL Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.totalStudents}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {metrics.placedStudents} Placed
            </span>
            <span>•</span>
            <span>{metrics.unplacedStudents} Unplaced</span>
          </div>
        </div>

        {/* Placement Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Placement Rate</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.placementPercentage}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.placementPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Companies & Jobs */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Visiting Companies</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.totalCompanies}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {metrics.openJobs} active job roles
            </span>
          </div>
        </div>

        {/* Total Offers */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Offers Issued</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.totalOffers}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            From {metrics.totalApplications} applications
          </div>
        </div>

        {/* Highest Package */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Highest Package</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.highestPackageLpa.toFixed(1)} <span className="text-sm font-normal">LPA</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Google / Microsoft marquee offer
          </div>
        </div>

        {/* Average Package */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average Package</span>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.averagePackageLpa.toFixed(1)} <span className="text-sm font-normal">LPA</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across all accepted job offers
          </div>
        </div>

        {/* Total Applications */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Applications</span>
            <FileCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.totalApplications}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Processed through pipeline
          </div>
        </div>

        {/* DBMS Engine Status */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Relational Model</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">3rd Normal Form</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            6 Tables • FKs Active
          </div>
        </div>
      </div>

      {/* 2 Interactive Native SVG Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Department-Wise Placement Rate */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Department-Wise Placement Rate (%)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculated dynamically via SQL GROUP BY and JOIN
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              GROUP BY dept_id
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {deptData.map((d) => (
              <div key={d.dept_name} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                    {d.dept_name}
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {d.placement_pct}%
                    </strong>{' '}
                    ({d.placed_students}/{d.total_students})
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(d.placement_pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Package Distribution Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Salary Package Distribution (LPA)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorization using SQL CASE WHEN statements on Offers
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              CASE WHEN
            </span>
          </div>

          {/* SVG Vertical Histogram Chart */}
          <div className="pt-4">
            <div className="grid grid-cols-4 gap-3 items-end h-44 pb-2 border-b border-slate-200 dark:border-slate-800">
              {packageTiers.map((tier) => {
                const heightPct = Math.round((tier.offer_count / maxOfferTier) * 100);
                return (
                  <div key={tier.tier_name} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:scale-110 transition-transform">
                      {tier.offer_count} offers
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-90"
                      style={{
                        height: `${Math.max(heightPct, 15)}%`,
                        backgroundColor: tier.color,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels under columns */}
            <div className="grid grid-cols-4 gap-3 pt-2 text-center">
              {packageTiers.map((tier) => (
                <div key={tier.tier_name}>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                    {tier.tier_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Offers Activity Feed */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Recent Campus Offers Audit Trail
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live records from the Offers table linked via foreign keys to Applications, Jobs, and Students
            </p>
          </div>
          <button
            onClick={() => onNavigate('applications')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-mono">
              <tr>
                <th className="px-4 py-2.5 rounded-l-lg">Student</th>
                <th className="px-4 py-2.5">Company & Role</th>
                <th className="px-4 py-2.5">Package</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOffers.map((offer) => (
                <tr key={offer.offer_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {offer.student_name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {offer.company_name}
                    </div>
                    <div className="text-[11px] text-slate-500">{offer.job_title}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {offer.offered_package_lpa} LPA
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {offer.offer_date}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        offer.offer_status === 'Accepted'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : offer.offer_status === 'Offered'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {offer.offer_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
