import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowUpRight, 
  Play, 
  Sparkles,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRoleStore } from '../../context/useRoleStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const mockActivityLog = [
  { id: 1, type: 'circular_analyzed', text: 'SEBI Circular on Cybersecurity Framework analyzed by Document & Compliance agents.', time: '2 hours ago', user: 'System Agent' },
  { id: 2, type: 'evidence_uploaded', text: 'Proof of MFA compliance uploaded for SOUBH internal controls.', time: '4 hours ago', user: 'Operations Team' },
  { id: 3, type: 'task_completed', text: 'Task "Review client-facing MFA login logs" marked as COMPLETED.', time: '1 day ago', user: 'IT Admin' },
  { id: 4, type: 'baseline_updated', text: 'Baseline policies synchronized with newly discovered regulatory feed items.', time: '2 days ago', user: 'Compliance Officer' },
];

const mockAlerts = [
  { id: 'a1', severity: 'high', type: 'gap', message: 'New SEBI Circular: Quarterly cyber audit frequency requirement creates a critical gap (Baseline is annual).', date: 'June 15, 2026' },
  { id: 'a2', severity: 'medium', type: 'evidence', message: 'Missing Evidence: CISO official appointment letter and Board Resolution must be uploaded to satisfy designated governance rule.', date: 'June 20, 2026' },
  { id: 'a3', severity: 'low', type: 'policy', message: 'Policy Update Required: Encryption standards for daily offline backups need review.', date: 'June 25, 2026' },
];

const complianceHistory = [
  { name: 'Jan', score: 75 },
  { name: 'Feb', score: 78 },
  { name: 'Mar', score: 76 },
  { name: 'Apr', score: 80 },
  { name: 'May', score: 81 },
  { name: 'Jun', score: 82 },
];

export default function Dashboard() {
  const { role, hasPermission } = useRoleStore();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Alert if low-level permission role is active */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 text-white rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Demo Active: Switched to {role}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {role === 'Compliance Officer' && 'Full access to run AI analyses, update company policies, create tasks, and approve evidence.'}
              {role === 'IT Admin' && 'Read-only access to gap analyses, with permissions to fulfill technology tasks and upload backup evidence.'}
              {role === 'Operations' && 'Read-only access to compliance reports, with permissions to upload operational checklists and task updates.'}
            </p>
          </div>
        </div>
        <Link 
          to="/circulars" 
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 transition-all duration-150 shrink-0"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>Start AI Run</span>
        </Link>
      </div>

      {/* Grid: Compliance Meter & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance Meter Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Compliance Index</h3>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200">
                <ShieldCheck className="h-3 w-3" /> Healthy
              </span>
            </div>
            <div className="mt-6 flex flex-col items-center">
              {/* Circular Progress Meter */}
              <div className="relative h-40 w-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="stroke-slate-100"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="stroke-indigo-600"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 68}
                    strokeDashoffset={2 * Math.PI * 68 * (1 - 0.82)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-4xl font-extrabold text-slate-800 tracking-tight">82%</span>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mt-0.5">SOUBH Baseline</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Active circulars: <strong className="text-slate-800">12</strong> | Gaps detected: <strong className="text-red-600">3</strong> | Action items pending: <strong className="text-slate-800">4</strong>
            </p>
          </div>
        </div>

        {/* Recharts Compliance Trend Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Compliance Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">SOUBH Securities historical compliance index tracking</p>
              </div>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Last 6 Months
              </span>
            </div>
            
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={complianceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#a5b4fc' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <Info className="h-3.5 w-3.5 text-indigo-500" />
            <span>Updates are recorded automatically following each run of the Gap Analysis agent.</span>
          </div>
        </div>
      </div>

      {/* Grid: Task Summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Awaiting Run', count: 1, icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Gaps Active', count: 3, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          { label: 'Evidence Needed', count: 2, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Tasks Completed', count: 8, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-800 block leading-tight">{item.count}</span>
              <span className="text-xs text-slate-500 font-semibold">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lower Section: Urgent Alerts & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Urgent Alerts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" /> Urgent Alerts ({mockAlerts.length})
              </h3>
              <Link to="/gap-analysis" className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5">
                Inspect Gaps <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {mockAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                    alert.severity === 'high' 
                      ? 'bg-red-50/40 border-red-100 hover:bg-red-50/70' 
                      : alert.severity === 'medium'
                      ? 'bg-amber-50/40 border-amber-100 hover:bg-amber-50/70'
                      : 'bg-slate-50/40 border-slate-200 hover:bg-slate-50/70'
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${
                    alert.severity === 'high' ? 'bg-red-500' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 leading-normal">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 inline-block font-mono">{alert.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" /> Recent Activity Log
              </h3>
            </div>

            <div className="relative border-l border-slate-100 pl-4 ml-2.5 space-y-5">
              {mockActivityLog.map((log) => (
                <div key={log.id} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-slate-200 border-2 border-white ring-4 ring-slate-50/10"></span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 font-medium leading-normal">{log.text}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                      <span className="font-mono">{log.time}</span>
                      <span>•</span>
                      <span>By {log.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
