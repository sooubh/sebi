import React, { useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  UploadCloud, 
  FileCheck, 
  AlertCircle, 
  Search, 
  User,
  Plus,
  Paperclip,
  CheckCircle2,
  X,
  FileText,
  Info,
  Calendar,
  AlertTriangle,
  FileDown
} from 'lucide-react';
import { useRoleStore } from '../../context/useRoleStore';

interface Task {
  id: string;
  title: string;
  department: string;
  ownerRole: 'Compliance Officer' | 'IT Admin' | 'Operations';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Awaiting Evidence' | 'Reviewing' | 'Completed';
  dueDate: string;
  evidenceRequired: string;
  evidenceFile?: string;
  checklist: { text: string; done: boolean }[];
}

export default function Tasks() {
  const { role, hasPermission } = useRoleStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>('task-audit');
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-backup',
      title: 'Relocate Secondary Backup Center & Establish Offline Pipeline',
      department: 'IT Infrastructure',
      ownerRole: 'IT Admin',
      priority: 'Medium',
      status: 'Awaiting Evidence',
      dueDate: '2026-07-15',
      evidenceRequired: 'IT network path log & DR location GPS baseline coordinates document',
      checklist: [
        { text: 'Confirm AWS secondary replica is relocated 100km+ from Mumbai', done: true },
        { text: 'Verify encryption at rest with AES-256 standard', done: true },
        { text: 'Document daily offline storage and physical extraction protocol', done: false },
      ]
    },
    {
      id: 'task-audit',
      title: 'Engage Auditor for Quarterly Cyber Review',
      department: 'Compliance',
      ownerRole: 'Compliance Officer',
      priority: 'High',
      status: 'Awaiting Evidence',
      dueDate: '2026-07-30',
      evidenceRequired: 'Signed Engagement Agreement with SEBI-empanelled Auditor',
      checklist: [
        { text: 'Identify SEBI-empanelled cyber auditor agencies', done: true },
        { text: 'Draft contract shifting from Annual to Quarterly schedules', done: false },
        { text: 'Submit proposed quarterly reporting framework to MD for signoff', done: false },
      ]
    },
    {
      id: 'task-ciso',
      title: 'Formally Document designated CISO Authority',
      department: 'Governance / HR',
      ownerRole: 'Compliance Officer',
      priority: 'High',
      status: 'Reviewing',
      dueDate: '2026-07-10',
      evidenceRequired: 'Signed Board Resolution & CISO formal letter of appointment',
      evidenceFile: 'CISO_Appointment_Letter_SOUBH.pdf',
      checklist: [
        { text: 'Draft official board resolution confirming Vikram Aditya as CISO', done: true },
        { text: 'Obtain CEO signature on formal appointment document', done: true },
        { text: 'Format monthly compliance certificate template', done: true },
      ]
    },
    {
      id: 'task-mfa',
      title: 'Verify MFA implementation across operational terminals',
      department: 'IT Security',
      ownerRole: 'IT Admin',
      priority: 'Low',
      status: 'Completed',
      dueDate: '2026-06-25',
      evidenceRequired: 'Screenshot of client & operational login logs verifying MFA challenge',
      evidenceFile: 'MFA_Access_Logs_Verification.pdf',
      checklist: [
        { text: 'Extract client-facing portals MFA status report', done: true },
        { text: 'Audit dealer and operational static logins', done: true },
      ]
    }
  ]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  const handleUploadEvidence = (taskId: string, fileName: string) => {
    // Check permission to upload evidence (Operations, IT Admin, Compliance can all upload)
    if (!hasPermission('upload_evidence')) {
      alert(`As an ${role}, you do not have permission to upload evidence. Switch roles.`);
      return;
    }

    setUploadingTaskId(taskId);
    setTimeout(() => {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            evidenceFile: fileName,
            // Move from "Awaiting Evidence" to "Reviewing" for compliance review
            status: t.status === 'Awaiting Evidence' ? 'Reviewing' : t.status
          };
        }
        return t;
      }));
      setUploadingTaskId(null);
    }, 1200);
  };

  const handleApproveEvidence = (taskId: string) => {
    if (!hasPermission('approve_evidence')) {
      alert(`Approval requires 'approve_evidence' permission. Only Compliance Officer has this right. Switch roles in the Topbar.`);
      return;
    }

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'Completed'
        };
      }
      return t;
    }));
  };

  const handleToggleChecklist = (taskId: string, index: number) => {
    // Check permission to edit task / check items
    if (!hasPermission('edit_task')) {
      alert(`As an ${role}, you cannot edit checklists.`);
      return;
    }

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const list = [...t.checklist];
        list[index] = { ...list[index], done: !list[index].done };
        return { ...t, checklist: list };
      }
      return t;
    }));
  };

  const getPriorityStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Awaiting Evidence */}
        <div className="bg-slate-100/50 rounded-3xl p-5 border border-slate-200/60 min-h-[500px] space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" /> Awaiting Evidence ({tasks.filter(t => t.status === 'Awaiting Evidence').length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {tasks.filter(t => t.status === 'Awaiting Evidence').map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`bg-white rounded-2xl p-4 border cursor-pointer shadow-sm transition-all duration-150 relative ${
                  selectedTaskId === task.id ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityStyle(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{task.dueDate}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mt-2.5 leading-snug">{task.title}</h4>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-[10px]">{task.department}</span>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-bold">{task.ownerRole}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Reviewing */}
        <div className="bg-slate-100/50 rounded-3xl p-5 border border-slate-200/60 min-h-[500px] space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Under Audit Review ({tasks.filter(t => t.status === 'Reviewing').length})
            </h3>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.status === 'Reviewing').map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`bg-white rounded-2xl p-4 border cursor-pointer shadow-sm transition-all duration-150 relative ${
                  selectedTaskId === task.id ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityStyle(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{task.dueDate}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mt-2.5 leading-snug">{task.title}</h4>
                
                {task.evidenceFile && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50/50 border border-indigo-100/30 px-2.5 py-1.5 rounded-lg font-bold">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate">{task.evidenceFile}</span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-[10px]">{task.department}</span>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-bold">{task.ownerRole}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="bg-slate-100/50 rounded-3xl p-5 border border-slate-200/60 min-h-[500px] space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completed Gaps ({tasks.filter(t => t.status === 'Completed').length})
            </h3>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.status === 'Completed').map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`bg-white/80 rounded-2xl p-4 border border-emerald-100/50 cursor-pointer shadow-sm transition-all duration-150 relative ${
                  selectedTaskId === task.id ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'hover:border-slate-350'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                    Compliant
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{task.dueDate}</span>
                </div>
                <h4 className="font-bold text-slate-600 text-sm mt-2.5 leading-snug line-through">{task.title}</h4>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px]">Verified compliant</span>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-300" />
                    <span>{task.ownerRole}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Task Details Panel / Drawer */}
      {selectedTask ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          
          {/* Close Details Button */}
          <button 
            onClick={() => setSelectedTaskId(null)}
            className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left Panel: Checklist & Metadata */}
          <div className="space-y-6">
            <div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityStyle(selectedTask.priority)}`}>
                {selectedTask.priority} Priority Task
              </span>
              <h3 className="font-bold text-slate-800 text-lg mt-2 leading-snug">{selectedTask.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Owner Assignment: <strong className="text-slate-700">{selectedTask.ownerRole}</strong> | Department: <strong className="text-slate-700">{selectedTask.department}</strong>
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Operational Checklist</h4>
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                {selectedTask.checklist.map((item, idx) => (
                  <label 
                    key={idx} 
                    className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 font-medium py-1"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleChecklist(selectedTask.id, idx)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5"
                    />
                    <span className={item.done ? 'line-through text-slate-400' : ''}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Evidence Management */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileCheck className="h-4.5 w-4.5 text-indigo-500" /> Evidence Requirement
              </h4>
              <p className="text-xs text-slate-700 leading-normal font-sans bg-white p-3.5 rounded-xl border border-slate-200/80">
                {selectedTask.evidenceRequired}
              </p>

              {/* Uploaded Evidence Link */}
              {selectedTask.evidenceFile ? (
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{selectedTask.evidenceFile}</p>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Uploaded & Ready</span>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 text-slate-400 hover:text-indigo-600">
                    <FileDown className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 bg-white/40 border border-dashed border-slate-350 rounded-xl">
                  <p className="text-xs text-slate-400">No evidence uploaded yet</p>
                </div>
              )}
            </div>

            {/* Evidence Actions (Upload and Approve) */}
            <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row gap-2">
              {/* If uploader task matches role or compliance officer */}
              {selectedTask.status !== 'Completed' && (
                <>
                  <button
                    onClick={() => {
                      const file = selectedTask.id === 'task-backup' ? 'Offline_Backup_Network_Logs.pdf' : 'Empanelled_Auditor_Contract.pdf';
                      handleUploadEvidence(selectedTask.id, file);
                    }}
                    disabled={uploadingTaskId === selectedTask.id}
                    className="flex-1 py-2 px-3 border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/20 text-slate-700 hover:text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>{uploadingTaskId === selectedTask.id ? 'Uploading...' : 'Upload Mock Evidence'}</span>
                  </button>

                  {selectedTask.status === 'Reviewing' && (
                    <button
                      onClick={() => handleApproveEvidence(selectedTask.id)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve Compliance Evidence</span>
                    </button>
                  )}
                </>
              )}

              {selectedTask.status === 'Completed' && (
                <div className="w-full flex items-center justify-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Task Approved & Gap Closed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
          Select a task card from the columns above to inspect checklist and manage evidence.
        </div>
      )}

    </div>
  );
}
