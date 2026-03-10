import { motion } from 'motion/react';
import { FileSpreadsheet, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
  { name: 'Files Processed', value: '1,248', icon: FileSpreadsheet, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { name: 'Rows Cleaned', value: '45.2M', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'Hours Saved', value: '342', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  { name: 'Errors Fixed', value: '8,432', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
];

const recentJobs = [
  { id: 'JOB-1024', name: 'Maybank_Statement_Q3.csv', status: 'Completed', rows: '12,400', time: '2 mins ago' },
  { id: 'JOB-1023', name: 'Stripe_Payouts_Oct.xlsx', status: 'Completed', rows: '4,120', time: '1 hour ago' },
  { id: 'JOB-1022', name: 'Shopify_Sales_Q3.csv', status: 'Failed', rows: '8,900', time: '3 hours ago' },
  { id: 'JOB-1021', name: 'Xero_Reconciliation_Prep.xlsx', status: 'Completed', rows: '1,200', time: 'Yesterday' },
];

export function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Transformations</h2>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Job ID</th>
                <th className="px-6 py-3">File Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Rows Processed</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500">{job.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{job.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{job.rows}</td>
                  <td className="px-6 py-4 text-slate-500">{job.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
