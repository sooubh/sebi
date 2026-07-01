import React, { useState, useEffect, useRef } from 'react';
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
  FileDown,
  Loader2,
  Check
} from 'lucide-react';
import { useRoleStore } from '../../context/useRoleStore';
import { db, storage } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Task as TaskType, Evidence } from '../../types';

interface DisplayTask {
  id: string;
  title: string;
  department: string;
  ownerRole: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Awaiting Evidence' | 'Reviewing' | 'Completed';
  dueDate: string;
  evidenceRequired: string;
  evidenceFile?: string;
  evidenceUrl?: string;
  checklist: { text: string; done: boolean }[];
  rawTask: TaskType;
}

export default function Tasks() {
  const { role, hasPermission } = useRoleStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dbTasks, setDbTasks] = useState<TaskType[]>([]);
  const [dbEvidence, setDbEvidence] = useState<Evidence[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to tasks and evidence in real-time
  useEffect(() => {
    const companyId = 'soubh-securities';
    setLoading(true);

    const qTasks = query(collection(db, 'tasks'), where('companyId', '==', companyId));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const list: TaskType[] = [];
      snapshot.forEach((d) => list.push(d.data() as TaskType));
      setDbTasks(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    const qEvidence = query(collection(db, 'evidence'), where('companyId', '==', companyId));
    const unsubEvidence = onSnapshot(qEvidence, (snapshot) => {
      const list: Evidence[] = [];
      snapshot.forEach((d) => list.push(d.data() as Evidence));
      setDbEvidence(list);
    });

    return () => {
      unsubTasks();
      unsubEvidence();
    };
  }, []);

  // Map database tasks to display tasks
  const tasks: DisplayTask[] = dbTasks.map(t => {
    const linkedEvidence = dbEvidence.find(e => e.taskId === t.taskId);
    
    // Map database status ('pending' | 'in_progress' | 'awaiting_evidence' | 'reviewing' | 'completed') 
    // to Kanban columns ('Awaiting Evidence' | 'Reviewing' | 'Completed')
    let displayStatus: DisplayTask['status'] = 'Awaiting Evidence';
    if (t.status === 'completed' || t.status === 'Completed' as any) {
      displayStatus = 'Completed';
    } else if (t.status === 'reviewing' || t.status === 'Reviewing' as any) {
      displayStatus = 'Reviewing';
    }

    // Map priority
    const priorityMap: Record<string, DisplayTask['priority']> = {
      critical: 'High',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    };

    return {
      id: t.taskId,
      title: t.title,
      department: t.department,
      ownerRole: t.ownerRole,
      priority: priorityMap[t.priority] || 'Medium',
      status: displayStatus,
      dueDate: t.dueDate,
      evidenceRequired: t.evidenceRequired?.join(', ') || 'Provide signed compliance check/audit documents',
      evidenceFile: linkedEvidence?.fileName,
      evidenceUrl: linkedEvidence?.storagePath,
      checklist: (t.checklist || []).map((text, idx) => ({
        text,
        done: (t as any).checkedItems?.includes(idx) || false
      })),
      rawTask: t
    };
  });

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Set default selection if none selected yet and tasks exist
  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      const firstAwaiting = tasks.find(t => t.status === 'Awaiting Evidence');
      if (firstAwaiting) {
        setSelectedTaskId(firstAwaiting.id);
      } else {
        setSelectedTaskId(tasks[0].id);
      }
    }
  }, [tasks, selectedTaskId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uploadingTaskId) {
      const file = e.target.files[0];
      await uploadEvidence(uploadingTaskId, file);
    }
  };

  const uploadEvidence = async (taskId: string, file: File) => {
    if (!hasPermission('upload_evidence')) {
      alert(`As an ${role}, you do not have permission to upload evidence. Switch roles.`);
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setUploadingTaskId(taskId);
    try {
      const companyId = 'soubh-securities';
      const storageRef = ref(storage, `companies/${companyId}/evidence/${taskId}/${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // Create evidence document
      const evidenceId = doc(collection(db, 'evidence')).id;
      await setDoc(doc(db, 'evidence', evidenceId), {
        evidenceId,
        taskId,
        companyId,
        circularId: task.rawTask.circularId,
        fileName: file.name,
        storagePath: downloadUrl,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: role,
        uploadedAt: new Date().toISOString(),
        verificationStatus: 'pending'
      });

      // Update task status to reviewing
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'reviewing'
      });

    } catch (err: any) {
      alert('Failed to upload evidence: ' + err.message);
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleApproveEvidence = async (taskId: string) => {
    if (!hasPermission('approve_evidence')) {
      alert(`Approval requires 'approve_evidence' permission. Only Compliance Officer has this right. Switch roles in the Topbar.`);
      return;
    }

    try {
      // Update task status to completed
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completionNotes: `Compliance proof verified and signed off by ${role}.`
      });

      // Update related evidence status to accepted
      const linkedEvidence = dbEvidence.find(e => e.taskId === taskId);
      if (linkedEvidence) {
        await updateDoc(doc(db, 'evidence', linkedEvidence.evidenceId), {
          verificationStatus: 'accepted'
        });
      }
    } catch (err: any) {
      alert('Failed to approve evidence: ' + err.message);
    }
  };

  const handleToggleChecklist = async (taskId: string, index: number) => {
    if (!hasPermission('edit_task')) {
      alert(`As an ${role}, you cannot edit checklists.`);
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const currentChecked: number[] = (task.rawTask as any).checkedItems || [];
      const newChecked = currentChecked.includes(index)
        ? currentChecked.filter(i => i !== index)
        : [...currentChecked, index];

      await updateDoc(doc(db, 'tasks', taskId), {
        checkedItems: newChecked
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const getPriorityStyle = (priority: DisplayTask['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 text-red-750 border-red-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-705 border-amber-200';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-slate-50">
        <Loader2 className="h-10 w-10 text-indigo-650 animate-spin" />
        <p className="text-sm font-bold text-slate-700 mt-3 animate-pulse">Loading compliance tasks board...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Hidden file input for uploads */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Awaiting Evidence */}
        <div className="bg-slate-150/40 backdrop-blur rounded-3xl p-5 border border-slate-200/50 min-h-[500px] space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-slate-400" /> Awaiting Evidence ({tasks.filter(t => t.status === 'Awaiting Evidence').length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {tasks.filter(t => t.status === 'Awaiting Evidence').map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`bg-white rounded-2xl p-4 border cursor-pointer shadow-sm transition-all duration-150 relative hover:shadow-md ${
                  selectedTaskId === task.id ? 'border-indigo-500 ring-1 ring-indigo-550/20' : 'border-slate-200 hover:border-slate-350'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityStyle(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">{task.dueDate}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mt-2.5 leading-snug">{task.title}</h4>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600">{task.department}</span>
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
        <div className="bg-slate-150/40 backdrop-blur rounded-3xl p-5 border border-slate-200/50 min-h-[500px] space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-4.5 w-4.5 text-amber-500" /> Under Audit Review ({tasks.filter(t => t.status === 'Reviewing').length})
            </h3>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.status === 'Reviewing').map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`bg-white rounded-2xl p-4 border cursor-pointer shadow-sm transition-all duration-150 relative hover:shadow-md ${
                  selectedTaskId === task.id ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-350'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityStyle(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">{task.dueDate}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mt-2.5 leading-snug">{task.title}</h4>
                
                {task.evidenceFile && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-650 bg-indigo-50/50 border border-indigo-100/30 px-2.5 py-1.5 rounded-lg font-bold">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate">{task.evidenceFile}</span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-650">{task.department}</span>
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
        <div className="bg-slate-150/40 backdrop-blur rounded-3xl p-5 border border-slate-200/50 min-h-[500px] space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> Resolved Gaps ({tasks.filter(t => t.status === 'Completed').length})
            </h3>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.status === 'Completed').map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`bg-white/80 rounded-2xl p-4 border border-emerald-100/50 cursor-pointer shadow-sm transition-all duration-150 relative hover:shadow-md ${
                  selectedTaskId === task.id ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/5' : 'hover:border-slate-350'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                    Compliant
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">{task.dueDate}</span>
                </div>
                <h4 className="font-bold text-slate-500 text-sm mt-2.5 leading-snug line-through">{task.title}</h4>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-450">
                  <span className="font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px]">Verified compliant</span>
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

      {/* Task Details Panel */}
      {selectedTask ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md grid grid-cols-1 md:grid-cols-2 gap-6 relative animate-fadeIn">
          
          <button 
            onClick={() => setSelectedTaskId(null)}
            className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-650"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left Panel: Checklist & Metadata */}
          <div className="space-y-6">
            <div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityStyle(selectedTask.priority)}`}>
                {selectedTask.priority} Priority Task
              </span>
              <h3 className="font-bold text-slate-850 text-lg mt-2.5 leading-snug">{selectedTask.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Assignee: <strong className="text-slate-700">{selectedTask.ownerRole}</strong> | Department: <strong className="text-slate-700">{selectedTask.department}</strong>
              </p>
              <div className="text-xs text-slate-600 leading-relaxed mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-sans">
                {selectedTask.rawTask.description}
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Operational Checklist</h4>
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                {selectedTask.checklist.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No checklist items generated.</p>
                ) : (
                  selectedTask.checklist.map((item, idx) => (
                    <label 
                      key={idx} 
                      className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 font-semibold py-1 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleChecklist(selectedTask.id, idx)}
                        className="rounded text-indigo-650 focus:ring-indigo-500 border-slate-350 mt-0.5"
                      />
                      <span className={item.done ? 'line-through text-slate-400' : 'text-slate-700'}>
                        {item.text}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Evidence Management */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileCheck className="h-4.5 w-4.5 text-indigo-500" /> Evidence Requirement
              </h4>
              <p className="text-xs text-slate-700 leading-normal font-medium bg-white p-3.5 rounded-xl border border-slate-205">
                {selectedTask.evidenceRequired}
              </p>

              {/* Uploaded Evidence Link */}
              {selectedTask.evidenceFile ? (
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-750 truncate">{selectedTask.evidenceFile}</p>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mt-0.5">Uploaded & Awaiting Verification</span>
                    </div>
                  </div>
                  {selectedTask.evidenceUrl && (
                    <a 
                      href={selectedTask.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 text-slate-400 hover:text-indigo-600"
                    >
                      <FileDown className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 bg-white/40 border border-dashed border-slate-300 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">No audit evidence uploaded yet.</p>
                </div>
              )}
            </div>

            {/* Evidence Actions (Upload and Approve) */}
            <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row gap-2">
              {selectedTask.status !== 'Completed' && (
                <>
                  <button
                    onClick={() => {
                      if (!hasPermission('upload_evidence')) {
                        alert(`Only members with 'upload_evidence' permissions can fulfill this task.`);
                        return;
                      }
                      setUploadingTaskId(selectedTask.id);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadingTaskId === selectedTask.id}
                    className="flex-1 py-2 px-3 border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/20 text-slate-750 hover:text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    {uploadingTaskId === selectedTask.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4 text-indigo-500" />
                        <span>Upload Audit Evidence</span>
                      </>
                    )}
                  </button>

                  {selectedTask.status === 'Reviewing' && hasPermission('approve_evidence') && (
                    <button
                      onClick={() => handleApproveEvidence(selectedTask.id)}
                      className="flex-1 py-2 px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all animate-pulse"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      <span>Approve & Close Gap</span>
                    </button>
                  )}
                </>
              )}

              {selectedTask.status === 'Completed' && (
                <div className="w-full flex items-center justify-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-850 text-xs font-bold shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Verified Compliant (Baseline Policy updated)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-205 p-8 text-center text-slate-400 text-xs font-semibold">
          Select a task card from the columns above to inspect checklist and manage evidence.
        </div>
      )}

    </div>
  );
}

