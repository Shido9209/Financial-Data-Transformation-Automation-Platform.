import React from 'react';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore, selectDashboardMetrics, type TransformationJob } from '../store/useAppStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date into a human-readable relative string */
const formatRelativeTime = (date: Date): string => {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;

  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

/** Compact number formatter: 1 234 567 → "1.2M" */
const compactNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  name: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  index: number;
  key?: string;
}

function StatCard({ name, value, icon: Icon, color, bg, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{name}</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyHistory() {
  return (
    <tr>
      <td colSpan={6} className="px-6 py-12 text-center">
        <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-400">No transformations yet</p>
        <p className="text-xs text-slate-300 mt-1">
          Upload a file and run a transformation to see results here.
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Get started <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Dashboard() {
  // ── Store subscriptions ─────────────────────────────────────────────────
  const transformationHistory = useAppStore((s) => s.transformationHistory);

  // Derived metrics — recomputed any time history changes
  const { filesProcessed, rowsCleaned, errorsFixed, hoursSaved } =
    selectDashboardMetrics(transformationHistory);

  // ── Stat cards config ───────────────────────────────────────────────────
  const stats = [
    {
      name: 'Files Processed',
      value: compactNumber(filesProcessed),
      icon: FileSpreadsheet,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      name: 'Rows Cleaned',
      value: compactNumber(rowsCleaned),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      name: 'Hours Saved',
      value: compactNumber(hoursSaved),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      name: 'Errors Fixed',
      value: compactNumber(errorsFixed),
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back. Here's what's happening with your data.</p>
        </div>
        <Link
          to="/upload"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          New Transformation
        </Link>
      </div>

      {/* ── Stat Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={stat.name} {...stat} index={i} />
        ))}
      </div>

      {/* ── Recent Transformations ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Transformations</h2>
          {transformationHistory.length > 0 && (
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {transformationHistory.length} job{transformationHistory.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Job ID</th>
                <th className="px-6 py-3 whitespace-nowrap">File Name</th>
                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                <th className="px-6 py-3 whitespace-nowrap">Rows Processed</th>
                <th className="px-6 py-3 whitespace-nowrap">Errors Fixed</th>
                <th className="px-6 py-3 whitespace-nowrap">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transformationHistory.length === 0 ? (
                <EmptyHistory />
              ) : (
                transformationHistory.slice(0, 10).map((job: TransformationJob) => (
                  <motion.tr
                    key={job.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">
                      {job.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-[240px] truncate">
                      {job.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                          }`}
                      >
                        {job.status === 'Completed' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 tabular-nums whitespace-nowrap">
                      {job.rows.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500 tabular-nums whitespace-nowrap">
                      {job.errorsFixed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {formatRelativeTime(job.timestamp)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
