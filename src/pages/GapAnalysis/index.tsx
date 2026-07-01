import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  Cpu
} from 'lucide-react';
import { useCircularStore } from '../../context/useCircularStore';
import { useRoleStore } from '../../context/useRoleStore';
import { db } from '../../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { GapAnalysis as GapAnalysisType, Obligation } from '../../types';

export default function GapAnalysis() {
  const navigate = useNavigate();
  const { role, hasPermission } = useRoleStore();
  const { circulars, activeCircularId } = useCircularStore();
  
  const currentCircularId = activeCircularId || 'circ-sebi-cyber';
  const circular = circulars.find((c) => c.id === currentCircularId) || circulars[0];

  const [gapData, setGapData] = useState<GapAnalysisType | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentCircularId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubGap = onSnapshot(doc(db, 'gapAnalysis', currentCircularId), (snap) => {
      if (snap.exists()) {
        setGapData(snap.data() as GapAnalysisType);
      } else {
        setGapData(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    const unsubSummary = onSnapshot(doc(db, 'summaries', currentCircularId), (snap) => {
      if (snap.exists()) {
        const sumData = snap.data();
        setObligations(sumData.obligations || []);
      } else {
        setObligations([]);
      }
    });

    return () => {
      unsubGap();
      unsubSummary();
    };
  }, [currentCircularId]);

  useEffect(() => {
    if (gapData) {
      const defaults: Record<string, boolean> = {};
      gapData.newRequirements?.forEach(item => {
        defaults[item.referenceId] = true;
      });
      gapData.modifiedRequirements?.forEach(item => {
        defaults[item.referenceId] = true;
      });
      setExpandedItems(defaults);
    }
  }, [gapData]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePromoteTasks = () => {
    if (!hasPermission('create_task')) {
      alert(`As an ${role}, you do not have permission to generate compliance tasks. Switch role to Compliance Officer.`);
      return;
    }
    alert('Task Planning Agent has already structured tasks for these gaps during workflow execution! Redirecting to Tasks panel.');
    navigate('/tasks');
  };

  const getSeverityBadge = (severity?: string) => {
    const s = severity?.toLowerCase();
    if (s === 'critical' || s === 'high') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (s === 'medium') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const findObligationText = (title: string) => {
    const ob = obligations.find(o => o.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(o.title.toLowerCase()));
    return ob ? ob.description : 'Ensure compliance with the stated SEBI circular requirement.';
  };

  const findObligationDept = (title: string) => {
    const ob = obligations.find(o => o.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(o.title.toLowerCase()));
    return ob ? ob.department : 'Compliance';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-slate-50">
        <Cpu className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700 mt-3 animate-pulse">Running Gap analysis engine...</p>
      </div>
    );
  }

  if (!gapData) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 text-center shadow-sm space-y-6">
          <div className="p-4 bg-indigo-50 border border-indigo-150 text-indigo-650 rounded-2xl w-fit mx-auto animate-bounce">
            <GitCompare className="h-10 w-10 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">No Gap Analysis Available</h2>
            <p className="text-sm text-slate-550 max-w-md mx-auto leading-relaxed">
              Circular <strong className="text-slate-800 font-mono">"{circular?.number || 'Unknown'}"</strong> has not been analyzed against the baseline yet. Please run the RICE AI analysis.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/circulars')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Cpu className="h-4 w-4" />
              <span>Go to Circulars intake</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <GitCompare className="h-3 w-3" /> Policy Baseline Comparison
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">SOUBH Baseline Policy vs SEBI Obligations</h2>
          <p className="text-xs text-slate-500 mt-1">
            Comparing circular <span className="font-mono text-slate-700 font-bold">{circular?.number}</span> with active company baseline policies.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Circular Risk Score</span>
            <span className="text-lg font-extrabold text-indigo-700 font-mono">{gapData.gapScore}%</span>
          </div>
          <button
            onClick={() => navigate('/workspace')}
            className="text-xs font-bold px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Inspect Document PDF
          </button>
          <button
            onClick={handlePromoteTasks}
            className="text-xs font-bold px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all"
          >
            <Zap className="h-4 w-4" />
            <span>Generate Tasks from Gaps</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {gapData.newRequirements?.map((item) => {
          const isExpanded = !!expandedItems[item.referenceId];
          const dept = findObligationDept(item.title);
          const reqText = findObligationText(item.title);
          return (
            <div key={item.referenceId} className="bg-white rounded-3xl border border-red-150 shadow-sm overflow-hidden transition-all duration-200">
              <div onClick={() => toggleExpand(item.referenceId)} className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-red-50/5 transition-colors select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl shrink-0 bg-red-50 text-red-700 border border-red-100">
                    <AlertCircle className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{item.title}</h3>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold border inline-block mt-0.5 bg-red-50 text-red-800 border-red-200 uppercase">New Regulatory Gap</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                    <span className="text-xs text-slate-600 font-bold">{dept}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/10 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative">
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"><FileText className="h-3.5 w-3.5 text-red-500" /><span>SEBI Requirement</span></div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">SEBI Circular Obligation</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-serif mt-3 pr-20">"{reqText}"</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative">
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"><CheckCircle2 className="h-3.5 w-3.5 text-slate-350" /><span>Internal Policy</span></div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">SOUBH Securities Baseline Policy</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans mt-3 pr-20 italic">No active policy found. This is a newly introduced mandate.</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-250 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">AI Gap Assessment</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getSeverityBadge(item.severity)}`}>{item.severity} Severity Impact</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-150 font-medium">{item.reason}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                      <button onClick={() => navigate('/workspace')} className="text-xs font-bold text-indigo-650 hover:text-indigo-700 flex items-center gap-0.5">Inspect in PDF <ArrowRight className="h-3.5 w-3.5" /></button>
                      <button onClick={() => navigate('/tasks')} className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-705 hover:text-indigo-700 transition-colors">Configure Task Draft</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {gapData.modifiedRequirements?.map((item) => {
          const isExpanded = !!expandedItems[item.referenceId];
          const dept = findObligationDept(item.title);
          const reqText = findObligationText(item.title);
          return (
            <div key={item.referenceId} className="bg-white rounded-3xl border border-amber-150 shadow-sm overflow-hidden transition-all duration-200">
              <div onClick={() => toggleExpand(item.referenceId)} className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-amber-50/5 transition-colors select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl shrink-0 bg-amber-50 text-amber-700 border border-amber-100"><AlertTriangle className="h-4.5 w-4.5" /></div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{item.title}</h3>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold border inline-block mt-0.5 bg-amber-50 text-amber-800 border-amber-200 uppercase">Modified Policies Required</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                    <span className="text-xs text-slate-600 font-bold">{dept}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/10 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative">
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"><FileText className="h-3.5 w-3.5 text-red-500" /><span>SEBI Requirement</span></div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">SEBI Circular Obligation</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-serif mt-3 pr-20">"{reqText}"</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative">
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span>Internal Policy</span></div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">SOUBH Securities Baseline Policy</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans mt-3 pr-20">{item.baselineMatch}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-250 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">AI Gap Assessment</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getSeverityBadge(item.severity)}`}>{item.severity} Severity Impact</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-150 font-medium">{item.difference}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                      <button onClick={() => navigate('/workspace')} className="text-xs font-bold text-indigo-650 hover:text-indigo-700 flex items-center gap-0.5">Inspect in PDF <ArrowRight className="h-3.5 w-3.5" /></button>
                      <button onClick={() => navigate('/tasks')} className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-705 hover:text-indigo-700 transition-colors">Configure Task Draft</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {gapData.missingEvidence?.map((item) => {
          const isExpanded = !!expandedItems[item.referenceId];
          const dept = findObligationDept(item.title);
          return (
            <div key={item.referenceId} className="bg-white rounded-3xl border border-blue-150 shadow-sm overflow-hidden transition-all duration-200">
              <div onClick={() => toggleExpand(item.referenceId)} className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-blue-50/5 transition-colors select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl shrink-0 bg-blue-50 text-blue-700 border border-blue-100"><Clock className="h-4.5 w-4.5" /></div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{item.title}</h3>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold border inline-block mt-0.5 bg-blue-50 text-blue-805 border-blue-200 uppercase">Evidence / Proof Deficiencies</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                    <span className="text-xs text-slate-600 font-bold">{dept}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/10 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative">
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"><FileText className="h-3.5 w-3.5 text-blue-500" /><span>Expected Proof</span></div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Required Audit Evidence</h4>
                      <ul className="list-disc pl-5 text-xs text-slate-700 leading-relaxed mt-3 space-y-1.5 font-sans font-semibold">
                        {item.expectedEvidence?.map((ev, evIdx) => (<li key={evIdx}>{ev}</li>))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-250 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">AI Gap Assessment</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getSeverityBadge(item.severity)}`}>{item.severity} Severity Impact</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-150 font-medium">{item.reason}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                      <button onClick={() => navigate('/workspace')} className="text-xs font-bold text-indigo-650 hover:text-indigo-700 flex items-center gap-0.5">Inspect in PDF <ArrowRight className="h-3.5 w-3.5" /></button>
                      <button onClick={() => navigate('/tasks')} className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-705 hover:text-indigo-700 transition-colors">Configure Task Draft</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {gapData.alreadyCompliant?.map((item) => {
          const isExpanded = !!expandedItems[item.referenceId];
          const dept = findObligationDept(item.title);
          const reqText = findObligationText(item.title);
          return (
            <div key={item.referenceId} className="bg-white rounded-3xl border border-emerald-150 shadow-sm overflow-hidden transition-all duration-200">
              <div onClick={() => toggleExpand(item.referenceId)} className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-emerald-50/5 transition-colors select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 className="h-4.5 w-4.5" /></div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{item.title}</h3>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold border inline-block mt-0.5 bg-emerald-50 text-emerald-800 border-emerald-200 uppercase">Compliant / Fully Covered</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                    <span className="text-xs text-slate-600 font-bold">{dept}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/10 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative">
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"><FileText className="h-3.5 w-3.5 text-emerald-500" /><span>SEBI Requirement</span></div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">SEBI Circular Obligation</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-serif mt-3 pr-20">"{reqText}"</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-250 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">AI Gap Assessment</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase bg-emerald-50 text-emerald-700 border-emerald-200">Low Risk</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-150 font-medium">{item.reason}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                      <button onClick={() => navigate('/workspace')} className="text-xs font-bold text-indigo-650 hover:text-indigo-700 flex items-center gap-0.5">Inspect in PDF <ArrowRight className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
