import React, { useState, useEffect, useRef } from 'react';
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
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCircularStore, Circular } from '../../context/useCircularStore';
import { useRoleStore } from '../../context/useRoleStore';
import { extractTextFromPdf } from '../../utils/pdfExtractor';

const SAMPLE_CYBER_TEXT = `
Securities and Exchange Board of India (SEBI) Circular No: SEBI/HO/MIRSD/TPD/P/CIR/2026/048.
Date: June 15, 2026.
Subject: Cyber Security and Cyber Resilience Framework for Stock Brokers.

1. Attention of the Stock Brokers is drawn to the SEBI Circular on Cyber Security & Cyber Resilience Framework.

2. In order to mitigate growing cyber risks and safeguard client funds, transaction integrity, and market reliability, SEBI has reviewed the existing framework. Stock brokers are directed to adopt the comprehensive cyber resilience guidelines detailed herein.

3. Stock Brokers shall implement Multi-Factor Authentication (MFA) for all user access to the trading systems, including clients, dealers, operational staff, and administrators.

4. Brokers must maintain daily offline backups of all critical data, encrypted at rest, and stored in a separate geographical location at least 100km away from the primary data center.

5. A comprehensive cyber audit shall be conducted on a quarterly basis by a SEBI-empanelled auditor, and the reports must be submitted to the Exchange within 30 days of the quarter ending.

6. Every stock broker shall designate a qualified Chief Information Security Officer (CISO) who shall be responsible for implementing this cyber resilience framework and submitting monthly compliance certificates.
`;

const SAMPLE_GRIEVANCE_TEXT = `
Securities and Exchange Board of India (SEBI) Circular No: SEBI/HO/MIRSD/SE/P/CIR/2026/089.
Date: June 28, 2026.
Subject: Redressal of Investor Grievances through SEBI SCORES Portal.

1. This circular outlines the mandate for resolving retail investor complaints registered on the SCORES portal.
2. Stock brokers must resolve grievances and upload action taken reports (ATR) within 15 days of complaint receipt.
3. Failure to do so will attract a penalty of INR 10,000 per day until compliance is satisfied.
`;

export default function Circulars() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { role, hasPermission } = useRoleStore();
  const { 
    circulars, 
    activeCircularId, 
    setActiveCircular, 
    startAnalysis, 
    analysisStep, 
    analysisProgress,
    addCircular,
    resetAnalysis,
    fetchCirculars
  } = useCircularStore();

  const [filter, setFilter] = useState<'all' | 'discovered' | 'analyzed'>('all');
  const [dragActive, setDragActive] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [extractedTexts, setExtractedTexts] = useState<Record<string, string>>({
    'circ-sebi-cyber': SAMPLE_CYBER_TEXT
  });

  // Keep track of files loaded locally
  const [loadedFiles, setLoadedFiles] = useState<Record<string, File>>({});

  const selectedCircular = circulars.find((c) => c.id === activeCircularId) || null;

  // Real-time listener for Firestore circulars collection
  useEffect(() => {
    const unsubscribe = fetchCirculars();
    return () => unsubscribe();
  }, [fetchCirculars]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processUploadedFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processUploadedFile(file);
    }
  };

  const processUploadedFile = async (file: File) => {
    if (!hasPermission('upload_circular')) {
      alert(`As an ${role}, you do not have permission to upload new circulars. Switch role to Compliance Officer.`);
      return;
    }
    
    setParsingPdf(true);
    try {
      // 1. Client side PDF parsing using PDF.js
      const rawText = await extractTextFromPdf(file);
      
      const newCircId = `circ-${Date.now()}`;
      
      // Save local reference to the file for uploading
      setLoadedFiles(prev => ({ ...prev, [newCircId]: file }));
      setExtractedTexts(prev => ({ ...prev, [newCircId]: rawText }));

      // 2. Add circular meta to Firestore
      await addCircular({
        id: newCircId,
        title: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        number: `SEBI/HO/MIRSD/MANUAL/CIR/2026/0${Math.floor(Math.random() * 90) + 10}`,
        date: new Date().toISOString().split('T')[0],
        risk: 'Medium',
        source: 'Manual Upload',
        summary: 'Newly uploaded compliance circular. Parsing completed. Ready for agent comparison.'
      }, file);

      setActiveCircular(newCircId);
    } catch (error: any) {
      alert(`PDF Upload Error: ${error.message || 'Could not parse text.'}`);
    } finally {
      setParsingPdf(false);
    }
  };

  const simulateFeedRefresh = async () => {
    if (!hasPermission('upload_circular')) {
      alert(`As an ${role}, you do not have permission to refresh feeds. Switch role to Compliance Officer.`);
      return;
    }

    const feedCircId = `circ-scores-${Date.now()}`;
    setExtractedTexts(prev => ({ ...prev, [feedCircId]: SAMPLE_GRIEVANCE_TEXT }));

    await addCircular({
      id: feedCircId,
      title: 'Redressal of Investor Grievances through SEBI SCORES Portal',
      number: 'SEBI/HO/MIRSD/SE/P/CIR/2026/089',
      date: '2026-06-28',
      risk: 'High',
      source: 'RSS Feed',
      summary: 'Automated ingestion from SEBI RSS Feed. Relates to investor grievance resolution and ATR timelines.'
    });

    setActiveCircular(feedCircId);
  };

  const getRemainingTime = (dateStr: string, risk: Circular['risk']) => {
    const issueDate = new Date(dateStr);
    let limitDays = 180; // Low
    if (risk === 'High') limitDays = 30;
    else if (risk === 'Medium') limitDays = 90;

    const deadline = new Date(issueDate.getTime() + limitDays * 24 * 60 * 60 * 1000);
    const today = new Date('2026-06-29'); // Mock system baseline date
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'text-red-700 bg-red-50 border-red-200' };
    } else if (diffDays <= 15) {
      return { text: `${diffDays}d remaining`, color: 'text-red-500 bg-red-50 border-red-200 font-bold' };
    } else if (diffDays <= 45) {
      return { text: `${diffDays}d left`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    } else {
      return { text: `${diffDays}d left`, color: 'text-slate-500 bg-slate-100 border-slate-200' };
    }
  };

  const filteredCirculars = circulars.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const getStatusBadge = (status: Circular['status']) => {
    switch (status) {
      case 'analyzed':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200 shadow-sm shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Analyzed
          </span>
        );
      case 'analyzing':
        return (
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-750 rounded-full text-xs font-bold flex items-center gap-1 border border-indigo-200 animate-pulse shrink-0">
            <Cpu className="h-3.5 w-3.5 text-indigo-500 animate-spin" /> Analyzing
          </span>
        );
      case 'discovered':
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-50 text-slate-650 rounded-full text-xs font-bold flex items-center gap-1 border border-slate-200/85 shadow-sm shrink-0">
            <Clock className="h-3.5 w-3.5 text-slate-400" /> Discovered
          </span>
        );
    }
  };

  const getRiskBadge = (risk: Circular['risk']) => {
    switch (risk) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleStartAnalysis = async (id: string) => {
    if (!hasPermission('run_analysis')) {
      alert(`As an ${role}, you do not have permission to trigger AI analysis. Switch role to Compliance Officer.`);
      return;
    }
    
    // Look up extracted text
    let textToAnalyze = extractedTexts[id];
    if (!textToAnalyze) {
      textToAnalyze = `SEBI Circular Document: ${selectedCircular?.title || 'Unknown Title'}. Published on: ${selectedCircular?.date}. Mandatory rules compliance required.`;
    }

    const localFile = loadedFiles[id];
    await startAnalysis(id, textToAnalyze, localFile);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
      
      {/* Search & Tabs Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-200/60 p-1 rounded-xl max-w-sm border border-slate-200 shadow-sm">
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
          onClick={simulateFeedRefresh}
          className="text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-700 flex items-center gap-1.5 transition-all shadow-sm shrink-0"
        >
          <Rss className="h-4 w-4 text-orange-500" />
          <span>Simulate Feed Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Upload & List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* File input click redirect */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="application/pdf" 
            className="hidden" 
          />

          {/* Proper Drag & Drop Upload Area */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/20' 
                : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/40 shadow-sm'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-650 mb-3">
                {parsingPdf ? (
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                ) : (
                  <UploadCloud className="h-8 w-8 text-indigo-600" />
                )}
              </div>
              {parsingPdf ? (
                <div>
                  <p className="text-sm font-bold text-slate-800">Extracting PDF text...</p>
                  <p className="text-xs text-slate-400 mt-1">Reading pages and mapping layout using PDF.js...</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-800">Drag & Drop Circular PDF here</p>
                  <p className="text-xs text-slate-400 mt-1">Or click to select a local PDF file from your computer</p>
                </div>
              )}
            </div>
          </div>

          {/* Circulars List */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">Intake Queue</h3>
            
            {filteredCirculars.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 shadow-sm">
                No circulars match this filter. Try refreshing the feed or uploading a mock PDF.
              </div>
            ) : (
              filteredCirculars.map((circ) => {
                const isSelected = circ.id === activeCircularId;
                const remaining = getRemainingTime(circ.date, circ.risk);
                return (
                  <div
                    key={circ.id}
                    onClick={() => setActiveCircular(circ.id)}
                    className={`bg-white rounded-2xl p-4 md:p-5 border cursor-pointer transition-all duration-150 flex items-center justify-between gap-4 ${
                      isSelected 
                        ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20 bg-indigo-50/5' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/20 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`p-3 rounded-xl shrink-0 ${circ.status === 'analyzed' ? 'bg-emerald-50 text-emerald-650' : 'bg-slate-100 text-slate-500'}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadge(circ.risk)}`}>
                            {circ.risk} Risk
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">{circ.number}</span>
                          {/* Compliance Deadline Badge */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${remaining.color}`}>
                            <Calendar className="h-3 w-3" />
                            {remaining.text}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-850 text-sm md:text-base mt-1.5 truncate leading-snug">
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
                      <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-slate-650' : ''}`} />
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
                <p className="text-xs text-slate-550 font-mono mt-1.5 font-semibold">
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
                <div className="flex justify-between">
                  <span>Compliance Period:</span>
                  <span className="font-bold text-slate-850">
                    {selectedCircular.risk === 'High' ? '30 Days' : selectedCircular.risk === 'Medium' ? '90 Days' : '180 Days'}
                  </span>
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
                        <span className={analysisProgress >= 25 ? 'text-emerald-400' : 'text-slate-600'}>✔</span>
                        <span className={analysisStep === 'parsing' ? 'text-white font-bold' : ''}>1. Doc Intelligence (Parsing)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={analysisProgress >= 50 ? 'text-emerald-400' : 'text-slate-600'}>
                          {analysisProgress >= 50 ? '✔' : '○'}
                        </span>
                        <span className={analysisStep === 'summarizing' ? 'text-white font-bold' : ''}>2. Compliance Analysis (Rules)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={analysisProgress >= 75 ? 'text-emerald-400' : 'text-slate-600'}>
                          {analysisProgress >= 75 ? '✔' : '○'}
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
