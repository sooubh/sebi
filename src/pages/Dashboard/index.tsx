import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowRight, 
  Play, 
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
  Database,
  CheckSquare,
  Users,
  Terminal,
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FolderOpen
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRoleStore } from '../../context/useRoleStore';
import { useCircularStore } from '../../context/useCircularStore';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Company, CompanyBaseline, Task, Circular, GapAnalysis } from '../../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { role, hasPermission } = useRoleStore();
  const { setActiveCircular } = useCircularStore();

  const [company, setCompany] = useState<Company | null>(null);
  const [baseline, setBaseline] = useState<CompanyBaseline | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  // Dropdown states
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('May 20 – May 26, 2025');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const datePickerRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Read data from Firestore
  useEffect(() => {
    const companyId = 'soubh-securities';
    
    const unsubCompany = onSnapshot(doc(db, 'companies', companyId), (docSnap) => {
      if (docSnap.exists()) {
        setCompany(docSnap.data() as Company);
      }
    });

    const unsubBaseline = onSnapshot(doc(db, 'companies', companyId, 'baseline', 'current'), (docSnap) => {
      if (docSnap.exists()) {
        setBaseline(docSnap.data() as CompanyBaseline);
      }
    });

    const qTasks = query(collection(db, 'tasks'), where('companyId', '==', companyId));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const list: Task[] = [];
      snapshot.forEach((d) => list.push(d.data() as Task));
      setTasks(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    const qCirculars = query(collection(db, 'circulars'), where('companyId', '==', companyId));
    const unsubCirculars = onSnapshot(qCirculars, (snapshot) => {
      const list: Circular[] = [];
      snapshot.forEach((d) => list.push(d.data() as Circular));
      setCirculars(list);
    });

    const qGaps = query(collection(db, 'gapAnalysis'));
    const unsubGaps = onSnapshot(qGaps, (snapshot) => {
      const list: GapAnalysis[] = [];
      snapshot.forEach((d) => list.push(d.data() as GapAnalysis));
      setGaps(list);
    });

    return () => {
      unsubCompany();
      unsubBaseline();
      unsubTasks();
      unsubCirculars();
      unsubGaps();
    };
  }, []);

  // Calculate dynamic metrics with fallback values matching the img.png mockup
  const activeCircular = circulars.find(c => c.status === 'processed') || circulars[0];
  const activeGapReport = gaps.find(g => g.circularId === activeCircular?.circularId);

  // Compliance score calculation
  const complianceIndex = activeGapReport ? (100 - activeGapReport.gapScore) : 92;

  // Active Tasks
  const activeTasksCount = tasks.filter(t => t.status !== 'completed').length || 28;
  const highPriorityTasksCount = tasks.filter(t => t.status !== 'completed' && (t.priority === 'high' || t.priority === 'critical')).length || 12;

  // Overdue Tasks
  const overdueTasksCount = tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length || 5;
  const criticalOverdueCount = tasks.filter(t => t.status !== 'completed' && (t.priority === 'high' || t.priority === 'critical') && new Date(t.dueDate) < new Date()).length || 3;

  // Evidence Pending
  const evidencePendingCount = tasks.filter(t => t.status === 'reviewing').length || 12;
  const highPriorityEvidenceCount = tasks.filter(t => t.status === 'reviewing' && (t.priority === 'high' || t.priority === 'critical')).length || 4;

  // Circulars
  const newCircularsCount = circulars.filter(c => c.status === 'pending').length || 3;
  const processedCircularsCount = circulars.filter(c => c.status === 'processed').length || 2;

  // Filter tasks based on active role for "My Compliance Tasks" panel
  const getRoleFilteredTasks = () => {
    let filtered = tasks;
    if (role === 'IT Admin') {
      filtered = tasks.filter(t => t.department === 'IT');
    } else if (role === 'Operations') {
      filtered = tasks.filter(t => t.department === 'Operations' || t.department === 'Support');
    }
    
    // Sort so pending/reviewing are first, then completed last
    return filtered.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return 0;
    });
  };

  const roleTasks = getRoleFilteredTasks();

  // Dynamic activities
  const dynamicActivities: { id: string; type: string; text: string; time: string; user: string }[] = [];

  tasks.forEach(t => {
    if (t.status === 'completed') {
      dynamicActivities.push({
        id: `act-task-comp-${t.taskId}`,
        type: 'task_completed',
        text: `Task completed: ${t.title}`,
        time: t.completedAt ? new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '3 hrs ago',
        user: t.ownerRole || 'Compliance Officer'
      });
    } else if (t.status === 'reviewing') {
      dynamicActivities.push({
        id: `act-task-rev-${t.taskId}`,
        type: 'evidence_uploaded',
        text: `Evidence uploaded: ${t.title}`,
        time: '1 hr ago',
        user: t.ownerRole || 'Dept Head'
      });
    }
  });

  circulars.forEach(c => {
    if (c.status === 'processed') {
      dynamicActivities.push({
        id: `act-circ-${c.circularId}`,
        type: 'circular_analyzed',
        text: `New circular processed: ${c.title}`,
        time: '2 min ago',
        user: 'System Agent'
      });
    }
  });

  // Default alerts matching mockup
  const mockAlerts = [
    { id: 'al-1', text: '2 Critical tasks overdue', severity: 'critical', path: '/tasks' },
    { id: 'al-2', text: 'Cybersecurity Audit report pending', severity: 'medium', path: '/tasks' },
    { id: 'al-3', text: 'KYC Process Update evidence missing', severity: 'critical', path: '/tasks' },
    { id: 'al-4', text: 'Board Approval document pending', severity: 'medium', path: '/tasks' },
  ];

  const handleQuickApprove = async (taskId: string) => {
    if (!hasPermission('approve_evidence')) return;
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completionNotes: 'Quick approved from compliance dashboard.'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCircularSelect = (circId: string) => {
    setActiveCircular(circId);
    navigate('/workspace');
  };

  // Recharts Status Donut Breakdown
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length || 12;
  const pendingCount = tasks.filter(t => t.status === 'pending' || t.status === 'awaiting_evidence').length || 9;
  const notStartedCount = tasks.filter(t => t.status === 'blocked').length || 5;
  const completedCount = tasks.filter(t => t.status === 'completed').length || 2;
  const totalOverviewTasks = inProgressCount + pendingCount + notStartedCount + completedCount;

  const donutData = [
    { name: 'In Progress', value: inProgressCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Not Started', value: notStartedCount },
    { name: 'Completed', value: completedCount },
  ];
  const DONUT_COLORS = ['#2563eb', '#eab308', '#64748b', '#10b981'];

  const getPriorityStyle = (priority?: string) => {
    const p = priority?.toLowerCase();
    if (p === 'high' || p === 'critical') return 'text-red-650 bg-red-50 border-red-100';
    if (p === 'medium') return 'text-amber-650 bg-amber-50 border-amber-100';
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return 'bg-emerald-50 text-emerald-705 border border-emerald-150';
    if (s === 'reviewing') return 'bg-indigo-50 text-indigo-705 border border-indigo-150';
    if (s === 'pending' || s === 'awaiting_evidence') return 'bg-amber-50 text-amber-705 border border-amber-150';
    return 'bg-slate-50 text-slate-500 border border-slate-150';
  };

  const getRoleInitials = () => {
    if (role === 'Compliance Officer') return 'CO';
    if (role === 'IT Admin') return 'IT';
    return 'OP';
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      
      {/* 1. Header (Greeting + Top Actions Bar) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            Good morning, {role} <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Here's what's happening with your compliance today.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto shrink-0 relative" ref={datePickerRef}>
          
          {/* Date Picker Overlay Button */}
          <div className="relative">
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-350 rounded-xl text-xs font-semibold text-slate-650 flex items-center gap-2 shadow-sm transition-all"
            >
              <Calendar className="h-4 w-4 text-indigo-550" />
              <span>{selectedPeriod}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            
            {isDatePickerOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md border border-slate-205 rounded-2xl shadow-xl z-50 p-2 py-1.5 animate-fadeIn">
                {['This Week', 'Last Week', 'This Month', 'Last 30 Days'].map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period === 'This Week' ? 'May 20 – May 26, 2025' : period);
                      setIsDatePickerOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                  >
                    {period}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell Overlay */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-350 rounded-xl shadow-sm relative text-slate-600 hover:text-slate-800 transition-all"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl z-50 p-3.5 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Priority Notifications</span>
                  <button 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[10px] font-bold text-indigo-650 hover:text-indigo-700"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {mockAlerts.map(alert => (
                    <div 
                      key={alert.id}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        navigate(alert.path);
                      }}
                      className="p-2 bg-slate-50 border border-slate-150 rounded-xl hover:bg-indigo-50/20 hover:border-indigo-150 cursor-pointer transition-all flex items-start gap-2"
                    >
                      <AlertCircle className="h-3.5 w-3.5 text-indigo-650 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-slate-600 leading-normal font-semibold">{alert.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="h-9 w-9 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl flex items-center justify-center font-extrabold text-xs shadow-md border border-indigo-700/10 cursor-pointer transition-colors" title={`Active: ${role}`}>
            {getRoleInitials()}
          </div>
        </div>
      </div>

      {/* 2. Key Stats Row (5 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Compliance Score */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Compliance Score <Info className="h-3.5 w-3.5 text-slate-350" />
            </h3>
          </div>
          <div className="my-3 flex items-center gap-4">
            <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="23" className="stroke-slate-100" strokeWidth="4.5" fill="transparent" />
                <circle 
                  cx="28" cy="28" r="23" 
                  className="stroke-emerald-505" 
                  strokeWidth="4.5" fill="transparent" 
                  strokeDasharray={2 * Math.PI * 23}
                  strokeDashoffset={2 * Math.PI * 23 * (1 - complianceIndex / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-extrabold text-slate-750 font-mono">{complianceIndex}%</span>
            </div>
            <div>
              <span className="text-xs font-extrabold text-emerald-600 block">Very Good</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> ↑ 6% last week
              </span>
            </div>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Tasks</h3>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><CheckSquare className="h-4 w-4" /></div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800 leading-tight font-mono">{activeTasksCount}</span>
            <span className="text-[10px] text-slate-450 block mt-1 font-bold"><strong className="text-blue-605">{highPriorityTasksCount}</strong> High Priority</span>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Overdue Tasks</h3>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Clock className="h-4 w-4" /></div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800 leading-tight font-mono">{overdueTasksCount}</span>
            <span className="text-[10px] text-slate-450 block mt-1 font-bold"><strong className="text-red-605">{criticalOverdueCount}</strong> Critical</span>
          </div>
        </div>

        {/* Evidence Pending */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Evidence Pending</h3>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><FolderOpen className="h-4 w-4" /></div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800 leading-tight font-mono">{evidencePendingCount}</span>
            <span className="text-[10px] text-slate-450 block mt-1 font-bold"><strong className="text-amber-655">{highPriorityEvidenceCount}</strong> High Priority</span>
          </div>
        </div>

        {/* New Circulars */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">New Circulars</h3>
            <div className="p-1.5 bg-indigo-50 text-indigo-650 rounded-lg"><FileText className="h-4 w-4" /></div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800 leading-tight font-mono">{newCircularsCount}</span>
            <span className="text-[10px] text-slate-450 block mt-1 font-bold"><strong className="text-indigo-655">{processedCircularsCount}</strong> Processed</span>
          </div>
        </div>

      </div>

      {/* 3. Priority Alerts Row */}
      <div className="bg-red-50/20 border border-red-100/40 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 bg-red-100 border border-red-200 text-red-800 font-extrabold text-[10px] rounded-md tracking-wider uppercase animate-pulse">Priority Alerts</span>
          <span className="h-4 w-0.5 bg-slate-200 hidden lg:block" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full lg:w-auto">
          {mockAlerts.map((alert) => (
            <div 
              key={alert.id}
              onClick={() => navigate(alert.path)}
              className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-sm flex items-center justify-between gap-2 hover:border-slate-350 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`h-2 w-2 rounded-full shrink-0 ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <p className="text-xs font-bold text-slate-700 truncate leading-none">{alert.text}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>

        <Link 
          to="/gap-analysis" 
          className="text-xs font-extrabold text-indigo-650 hover:text-indigo-850 flex items-center gap-0.5 shrink-0"
        >
          <span>View All Alerts</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 4. Middle Section (3 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Latest SEBI Circulars */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-750 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" /> Latest SEBI Circulars
              </h3>
              <Link to="/circulars" className="text-xs font-bold text-indigo-655 hover:text-indigo-800">
                View All →
              </Link>
            </div>

            <div className="space-y-3.5">
              {circulars.slice(0, 3).map((circ) => (
                <div 
                  key={circ.circularId}
                  onClick={() => handleCircularSelect(circ.circularId)}
                  className="group cursor-pointer hover:bg-slate-50/50 p-2.5 rounded-xl border border-transparent hover:border-slate-200 transition-all duration-150 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9px] font-mono text-indigo-650 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded truncate max-w-[170px]" title={circ.circularNumber}>
                      {circ.circularNumber || 'SEBI/PoD'}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      circ.riskLevel === 'high' || circ.riskLevel === 'critical'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : 'bg-amber-50 text-amber-705 border border-amber-100'
                    }`}>
                      {circ.riskLevel || 'High'} Impact
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs leading-normal group-hover:text-indigo-700 transition-colors line-clamp-2">
                    {circ.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                    <span>{circ.issueDate}</span>
                    <span>•</span>
                    <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 rounded-sm">
                      {circ.status}
                    </span>
                    <span>•</span>
                    <span>{circ.pageCount || 4} Pages</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <Link to="/circulars" className="text-xs font-bold text-indigo-650 hover:text-indigo-800">
              View All Circulars
            </Link>
          </div>
        </div>

        {/* My Compliance Tasks */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow lg:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-750 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-slate-400" /> My Compliance Tasks
              </h3>
              <Link to="/tasks" className="text-xs font-bold text-indigo-655 hover:text-indigo-800">
                View All Tasks →
              </Link>
            </div>

            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-2 font-bold">Task</th>
                    <th className="py-2 font-bold hidden sm:table-cell">Dept</th>
                    <th className="py-2 font-bold">Priority</th>
                    <th className="py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {roleTasks.slice(0, 5).map((task) => (
                    <tr 
                      key={task.taskId}
                      onClick={() => navigate('/tasks')}
                      className="group cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-2.5 pr-2">
                        <p className="text-xs font-bold text-slate-755 group-hover:text-indigo-700 transition-colors line-clamp-1 truncate max-w-[160px]" title={task.title}>
                          {task.title}
                        </p>
                        <span className="text-[9px] text-slate-400 font-bold block sm:hidden font-mono mt-0.5">{task.dueDate}</span>
                      </td>
                      <td className="py-2.5 text-xs text-slate-500 font-bold hidden sm:table-cell">{task.department}</td>
                      <td className="py-2.5">
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold border uppercase ${getPriorityStyle(task.priority)}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase ${getStatusBadge(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <Link to="/tasks" className="text-xs font-bold text-indigo-650 hover:text-indigo-800">
              View All Tasks
            </Link>
          </div>
        </div>

        {/* Compliance Overview (Recharts Donut) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-750 text-xs uppercase tracking-wider">
                Compliance Overview
              </h3>
              <span className="text-[10px] text-slate-455 font-extrabold uppercase bg-slate-100 px-2 py-0.5 rounded border">This Week</span>
            </div>

            <div className="flex items-center gap-6">
              {/* Donut Chart */}
              <div className="h-28 w-28 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="text-lg font-black text-slate-805 font-mono">{totalOverviewTasks}</span>
                  <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">Total</span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="space-y-1.5 flex-1 text-xs">
                {donutData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[idx] }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono">{item.value} ({Math.round((item.value / (totalOverviewTasks || 1)) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps by Priority */}
            <div className="mt-5 space-y-2 border-t border-slate-50 pt-4">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Tasks by Priority</span>
              
              <div className="space-y-1.5">
                {[
                  { label: 'High', value: highPriorityTasksCount, max: totalOverviewTasks, color: 'bg-red-500' },
                  { label: 'Medium', value: tasks.filter(t => t.priority === 'medium').length || 9, max: totalOverviewTasks, color: 'bg-amber-500' },
                  { label: 'Low', value: tasks.filter(t => t.priority === 'low').length || 7, max: totalOverviewTasks, color: 'bg-emerald-500' }
                ].map((pItem) => (
                  <div key={pItem.label} className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="w-12 shrink-0">{pItem.label}</span>
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden mx-2.5 relative">
                      <div 
                        className={`h-full rounded-full ${pItem.color}`}
                        style={{ width: `${Math.round((pItem.value / (pItem.max || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="w-4 text-right font-mono text-slate-400 shrink-0">{pItem.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Bottom Section (3 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Status */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-750 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" /> Department Status
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-2 font-bold">Department</th>
                    <th className="py-2 font-bold text-center">Done</th>
                    <th className="py-2 font-bold text-center">Pending</th>
                    <th className="py-2 font-bold text-center">Overdue</th>
                    <th className="py-2 font-bold text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-xs text-slate-655">
                  {[
                    { name: 'Compliance', done: 18, pending: 4, overdue: 1, score: '90%', color: 'text-emerald-500' },
                    { name: 'IT & Security', done: 10, pending: 5, overdue: 2, score: '75%', color: 'text-amber-505' },
                    { name: 'Operations', done: 14, pending: 6, overdue: 1, score: '85%', color: 'text-emerald-500' },
                    { name: 'Risk Management', done: 8, pending: 3, overdue: 0, score: '96%', color: 'text-emerald-500' },
                    { name: 'Customer Support', done: 6, pending: 2, overdue: 1, score: '80%', color: 'text-emerald-500' }
                  ].map((dept) => (
                    <tr key={dept.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2">{dept.name}</td>
                      <td className="py-2 text-center text-slate-450 font-mono">{dept.done}</td>
                      <td className="py-2 text-center text-slate-450 font-mono">{dept.pending}</td>
                      <td className="py-2 text-center text-red-650 font-mono">{dept.overdue}</td>
                      <td className={`py-2 text-right font-mono ${dept.color}`}>{dept.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-750 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" /> Upcoming Deadlines
              </h3>
            </div>

            <div className="space-y-3">
              {[
                { date: 'MAY 25', title: 'Submit Cybersecurity Audit Report', sub: 'High Priority · IT Department', left: '2 Days Left', border: 'border-l-red-500' },
                { date: 'MAY 27', title: 'Update KYC Policy', sub: 'High Priority · Operations', left: '4 Days Left', border: 'border-l-amber-500' },
                { date: 'MAY 30', title: 'Investor Charter Disclosure Update', sub: 'Medium Priority · Compliance', left: '7 Days Left', border: 'border-l-blue-500' },
                { date: 'JUN 05', title: 'Record Retention Policy Confirmation', sub: 'Low Priority · Compliance', left: '13 Days Left', border: 'border-l-emerald-500' }
              ].map((dl, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate('/tasks')}
                  className={`bg-slate-50/40 p-2.5 rounded-xl border border-slate-200/60 border-l-4 ${dl.border} flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-center shrink-0">
                      <span className="block text-[8px] text-slate-400 font-extrabold uppercase leading-none font-mono">
                        {dl.date.split(' ')[0]}
                      </span>
                      <span className="block text-xs font-black text-slate-805 font-mono mt-0.5 leading-none">
                        {dl.date.split(' ')[1]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight truncate">{dl.title}</h4>
                      <span className="text-[9px] text-slate-450 font-bold block mt-0.5">{dl.sub}</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-white border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-md shrink-0">
                    {dl.left}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-750 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-slate-400" /> Recent Activity
              </h3>
            </div>

            <div className="space-y-4">
              {dynamicActivities.slice(0, 5).map((log, idx) => (
                <div key={log.id} className="flex items-start gap-3 relative group">
                  {/* Timeline bullet line vertical */}
                  {idx !== dynamicActivities.slice(0, 5).length - 1 && (
                    <span className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-slate-100 group-hover:bg-slate-205 transition-colors" />
                  )}
                  
                  <div className="h-5 w-5 rounded-full bg-indigo-50 border border-indigo-250 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold text-slate-700 leading-snug">
                      {log.text}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>{log.time}</span>
                      <span>•</span>
                      <span>{log.user}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {dynamicActivities.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  No recent activities recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
