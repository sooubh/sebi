import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  Rss, 
  FileText, 
  ChevronRight, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Binary
} from 'lucide-react';
import { useCircularStore, Circular } from '../../context/useCircularStore';
import { useRoleStore } from '../../context/useRoleStore';

export default function Circulars() {
  const navigate = useNavigate();
  const { role, hasPermission } = useRoleStore();
  const { 
    circulars, 
    activeCircularId, 
    setActiveCircular, 
    startAnalysis, 
    analysisStep, 
    analysisProgress,
    addCircular,
    resetAnalysis
  } = useCircularStore();

  const [filter, setFilter] = useState<'all' | 'discovered' | 'analyzed'>('all');
  const [dragActive, setDragActive] = useState(false);
  const [uploadingName, setUploadingName] = useState<string | null>(null);

  const selectedCircular = circulars.find((c) => c.id === activeCircularId) || null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      simulateUpload(file.name);
    }
  };

  const simulateUpload = (fileName: string) => {
    if (!hasPermission('upload_circular')) {
      alert(`As an ${role}, you do not have permission to upload new circulars. Switch role to Compliance Officer.`);
      return;
    }
    setUploadingName(fileName);
    setTimeout(() => {
      addCircular({
        title: fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        number: `SEBI/HO/MIRSD/MANUAL/CIR/2026/0${Math.floor(Math.random() * 90) + 10}`,
        date: new Date().toISOString().split('T')[0],
        risk: 'Medium',
        source: 'Manual Upload',
        summary: 'Manually uploaded compliance document. Ready for Document Intelligence parsing and rule extraction.',
      });
      setUploadingName(null);
    }, 1000);
  };

  const filteredCirculars = circulars.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const getStatusBadge = (status: Circular['status']) => {
    switch (status) {
      case 'analyzed':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Analyzed
          </span>
        );
      case 'analyzing':
        return (
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold flex items-center gap-1 border border-indigo-200 animate-pulse">
            <Cpu className="h-3 w-3" /> Analyzing...
          </span>
        );
      case 'discovered':
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold flex items-center gap-1 border border-slate-200">
            <Clock className="h-3 w-3" /> Unanalyzed
          </span>
        );
    }
  };

  const getRiskBadge = (risk: Circular['risk']) => {
    switch (risk) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleStartAnalysis = (id: string) => {
    if (!hasPermission('run_analysis')) {
      alert(`As an ${role}, you do not have permission to trigger AI analysis. Switch role to Compliance Officer.`);
      return;
    }
    startAnalysis(id, () => {
      // Done callback: auto redirect or let user click
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Search & Tabs Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-150 p-1 rounded-xl bg-slate-200/60 max-w-sm border border-slate-200">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            All Intake
          </button>
          <button 
            onClick={() => setFilter('discovered')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${filter === 'discovered' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Unanalyzed
          </button>
          <button 
            onClick={() => setFilter('analyzed')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${filter === 'analyzed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Analyzed
          </button>
        </div>

        <button 
          onClick={() => simulateUpload('SEBI_INVESTOR_GRIEVANCE_2026.pdf')}
          className="text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-700 flex items-center gap-1.5 transition-all shadow-sm shrink-0"
        >
          <Rss className="h-4 w-4 text-orange-500" />
          <span>Simulate Feed Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Upload & List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mock Drag & Drop Upload Area */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => simulateUpload('SEBI_CIRCULAR_CYBER_2026.pdf')}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/20' 
                : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/40'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-3">
                <UploadCloud className="h-8 w-8" />
              </div>
              {uploadingName ? (
                <div>
                  <p className="text-sm font-bold text-slate-700">Uploading {uploadingName}...</p>
                  <p className="text-xs text-slate-400 mt-1">Mock uploading and indexing PDF...</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-800">Drag & Drop Circular PDF here</p>
                  <p className="text-xs text-slate-400 mt-1">Or click to select a mock file for testing</p>
                </div>
              )}
            </div>
          </div>

          {/* Circulars List */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">Intake Queue</h3>
            
            {filteredCirculars.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
                No circulars match this filter. Try refreshing the feed or uploading a mock PDF.
              </div>
            ) : (
              filteredCirculars.map((circ) => {
                const isSelected = circ.id === activeCircularId;
                return (
                  <div
                    key={circ.id}
                    onClick={() => setActiveCircular(circ.id)}
                    className={`bg-white rounded-2xl p-4 md:p-5 border cursor-pointer transition-all duration-150 flex items-center justify-between gap-4 ${
                      isSelected 
                        ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-500/20 bg-indigo-50/5' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/20 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`p-3 rounded-xl shrink-0 ${circ.status === 'analyzed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadge(circ.risk)}`}>
                            {circ.risk} Risk
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">{circ.number}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm md:text-base mt-1.5 truncate leading-snug">
                          {circ.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>Issued: <strong className="text-slate-600 font-mono">{circ.date}</strong></span>
                          <span>•</span>
                          <span>Source: <strong>{circ.source}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(circ.status)}
                      <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-slate-600' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Column: Detail/Analysis Action Panel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-fit">
          {selectedCircular ? (
            <div className="space-y-6">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadge(selectedCircular.risk)}`}>
                  {selectedCircular.risk} Severity Regulatory Action
                </span>
                <h3 className="font-bold text-slate-800 text-lg mt-3 leading-snug">
                  {selectedCircular.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-1.5 font-semibold">
                  {selectedCircular.number}
                </p>
              </div>

              <div className="border-t border-b border-slate-100 py-4 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Source Feed:</span>
                  <span className="font-bold text-slate-800">{selectedCircular.source}</span>
                </div>
                <div className="flex justify-between">
                  <span>Issue Date:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedCircular.date}</span>
                </div>
                {selectedCircular.status === 'analyzed' && (
                  <>
                    <div className="flex justify-between">
                      <span>Obligations Extracted:</span>
                      <span className="font-bold text-slate-800">{selectedCircular.obligationsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impacted Departments:</span>
                      <span className="font-bold text-slate-800">{selectedCircular.departmentsCount}</span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Circular Context</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedCircular.summary}
                </p>
              </div>

              {/* Analysis Workflow Control */}
              <div className="pt-2">
                {selectedCircular.status === 'discovered' && analysisStep === 'idle' && (
                  <button
                    onClick={() => handleStartAnalysis(selectedCircular.id)}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all duration-150"
                  >
                    <Cpu className="h-4 w-4 animate-spin-slow" />
                    <span>Run RICE AI Compliance Agent</span>
                  </button>
                )}

                {/* Analysis Loading State Tracker */}
                {selectedCircular.id === activeCircularId && analysisStep !== 'idle' && analysisStep !== 'done' && (
                  <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-4 border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                        Orchestrating Agents...
                      </span>
                      <span className="font-mono">{analysisProgress}%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                        style={{ width: `${analysisProgress}%` }}
                      ></div>
                    </div>

                    {/* Step log */}
                    <div className="text-[10px] text-slate-400 space-y-2 font-mono">
                      <div className="flex items-center gap-2">
                        <span className={analysisProgress >= 20 ? 'text-emerald-400' : 'text-slate-600'}>✔</span>
                        <span className={analysisStep === 'parsing' ? 'text-white font-bold' : ''}>1. Doc Intelligence (Parsing)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={analysisProgress >= 45 ? 'text-emerald-400' : 'text-slate-600'}>
                          {analysisProgress >= 45 ? '✔' : '○'}
                        </span>
                        <span className={analysisStep === 'summarizing' ? 'text-white font-bold' : ''}>2. Compliance Analysis (Rules)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={analysisProgress >= 70 ? 'text-emerald-400' : 'text-slate-600'}>
                          {analysisProgress >= 70 ? '✔' : '○'}
                        </span>
                        <span className={analysisStep === 'comparing' ? 'text-white font-bold' : ''}>3. Gap Analysis (Baseline)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={analysisProgress >= 90 ? 'text-emerald-400' : 'text-slate-600'}>
                          {analysisProgress >= 90 ? '✔' : '○'}
                        </span>
                        <span className={analysisStep === 'planning' ? 'text-white font-bold' : ''}>4. Task Planner (Work items)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Completed State */}
                {selectedCircular.status === 'analyzed' && (
                  <div className="space-y-2.5">
                    <button
                      onClick={() => navigate('/workspace')}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {hasPermission('run_analysis') && (
                      <button
                        onClick={() => resetAnalysis(selectedCircular.id)}
                        className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset Analysis State</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold">No Circular Selected</p>
              <p className="text-xs mt-1">Select a circular from the intake queue to inspect details and run the AI analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
