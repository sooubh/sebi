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
  Loader2,
  Search,
  Share,
  Download,
  ArrowLeft,
  CheckSquare,
  Check,
  Info,
  ExternalLink,
  ChevronDown,
  Users
} from 'lucide-react';
import { useCircularStore, Circular } from '../../context/useCircularStore';
import { useRoleStore } from '../../context/useRoleStore';
import { extractTextFromPdf } from '../../utils/pdfExtractor';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { Obligation, Task, Evidence } from '../../types';

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

  const [activeListTab, setActiveListTab] = useState<'all' | 'new' | 'processed' | 'review'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTab, setDetailTab] = useState<'overview' | 'obligations' | 'tasks' | 'evidence' | 'activity'>('overview');
  
  // Mobile views control
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);

  // PDF outline active section
  const [activeOutlineSection, setActiveOutlineSection] = useState('4.1');

  // Firestore context states for detail view
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  
  const [dragActive, setDragActive] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  
  const [extractedTexts, setExtractedTexts] = useState<Record<string, string>>({
    'circ-sebi-cyber': `Securities and Exchange Board of India (SEBI) Circular No: SEBI/HO/MIRSD/TPD/P/CIR/2026/048. Date: June 15, 2026. Subject: Cyber Security and Cyber Resilience Framework. Multi-Factor Authentication (MFA), offline data backups 100km, quarterly cyber audit, CISO appointment.`
  });

  const [loadedFiles, setLoadedFiles] = useState<Record<string, File>>({});

  const selectedCircular = circulars.find((c) => c.id === activeCircularId) || null;

  // Real-time listener for circulars list
  useEffect(() => {
    const unsubscribe = fetchCirculars();
    return () => unsubscribe();
  }, [fetchCirculars]);

  // Load details dynamically from Firestore when activeCircularId changes
  useEffect(() => {
    if (!activeCircularId) return;

    // Fetch obligations
    const unsubSummary = onSnapshot(doc(db, 'summaries', activeCircularId), (snap) => {
      if (snap.exists()) {
        setObligations(snap.data().obligations || []);
      } else {
        setObligations([]);
      }
    });

    // Fetch tasks
    const qTasks = query(collection(db, 'tasks'), where('circularId', '==', activeCircularId));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const list: Task[] = [];
      snap.forEach(d => list.push(d.data() as Task));
      setTasks(list);
    });

    // Fetch evidence
    const qEvidence = query(collection(db, 'evidence'), where('circularId', '==', activeCircularId));
    const unsubEvidence = onSnapshot(qEvidence, (snap) => {
      const list: Evidence[] = [];
      snap.forEach(d => list.push(d.data() as Evidence));
      setEvidence(list);
    });

    return () => {
      unsubSummary();
      unsubTasks();
      unsubEvidence();
    };
  }, [activeCircularId]);

  // Sync mobile state on selection
  const handleSelectCircular = (id: string) => {
    setActiveCircular(id);
    setShowDetailOnMobile(true);
  };

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
      const rawText = await extractTextFromPdf(file);
      const newCircId = `circ-${Date.now()}`;
      
      setLoadedFiles(prev => ({ ...prev, [newCircId]: file }));
      setExtractedTexts(prev => ({ ...prev, [newCircId]: rawText }));

      await addCircular({
        id: newCircId,
        title: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        number: `SEBI/HO/MIRSD/MANUAL/CIR/2026/0${Math.floor(Math.random() * 90) + 10}`,
        date: new Date().toISOString().split('T')[0],
        risk: 'Medium',
        source: 'Manual Upload',
        summary: 'Newly uploaded compliance circular. Parsing completed. Ready for agent comparison.'
      }, file);

      handleSelectCircular(newCircId);
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
    const mockText = `Securities and Exchange Board of India (SEBI) Circular No: SEBI/HO/MIRSD/SE/P/CIR/2026/089. Date: June 28, 2026. Subject: Redressal of Investor Grievances through SEBI SCORES Portal. Action taken report ATR 15 days resolve complaints.`;
    setExtractedTexts(prev => ({ ...prev, [feedCircId]: mockText }));

    await addCircular({
      id: feedCircId,
      title: 'Redressal of Investor Grievances through SEBI SCORES Portal',
      number: 'SEBI/HO/MIRSD/SE/P/CIR/2026/089',
      date: '2026-06-28',
      risk: 'High',
      source: 'RSS Feed',
      summary: 'Automated ingestion from SEBI RSS Feed. Relates to investor grievance resolution and ATR timelines.'
    });

    handleSelectCircular(feedCircId);
  };

  const handleStartAnalysis = async (id: string) => {
    if (!hasPermission('run_analysis')) {
      alert(`As an ${role}, you do not have permission to trigger AI analysis. Switch role to Compliance Officer.`);
      return;
    }
    
    let textToAnalyze = extractedTexts[id];
    if (!textToAnalyze) {
      textToAnalyze = `SEBI Circular Document: ${selectedCircular?.title || 'Unknown Title'}. Published on: ${selectedCircular?.date}. Mandatory rules compliance required.`;
    }

    const localFile = loadedFiles[id];
    await startAnalysis(id, textToAnalyze, localFile);
  };

  // Filter queue list based on search and status tabs
  const filteredCirculars = circulars.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.number.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeListTab === 'all') return true;
    if (activeListTab === 'new') return c.status === 'discovered';
    if (activeListTab === 'processed') return c.status === 'analyzed';
    if (activeListTab === 'review') return c.risk === 'High';
    return true;
  });

  const getRemainingDaysText = (dateStr: string, risk: Circular['risk']) => {
    const issueDate = new Date(dateStr);
    let limitDays = 180;
    if (risk === 'High') limitDays = 30;
    else if (risk === 'Medium') limitDays = 90;

    const deadline = new Date(issueDate.getTime() + limitDays * 24 * 60 * 60 * 1000);
    const today = new Date('2026-06-29');
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'text-red-700 bg-red-50 border-red-200' };
    return { text: `${diffDays}d left`, color: 'text-slate-500 bg-slate-100 border-slate-200' };
  };

  const getStatusBadge = (status: Circular['status']) => {
    switch (status) {
      case 'analyzed':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-200 shadow-sm shrink-0">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Processed
          </span>
        );
      case 'analyzing':
        return (
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-750 rounded-full text-[10px] font-bold flex items-center gap-1 border border-indigo-200 animate-pulse shrink-0">
            <Cpu className="h-3 w-3 text-indigo-500 animate-spin" /> Mapped
          </span>
        );
      case 'discovered':
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-50 text-slate-650 rounded-full text-[10px] font-bold flex items-center gap-1 border border-slate-200/85 shadow-sm shrink-0">
            <Clock className="h-3 w-3 text-slate-400" /> New
          </span>
        );
    }
  };

  const getRiskBadge = (risk: Circular['risk']) => {
    switch (risk) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-205';
      case 'Medium':
        return 'bg-amber-50 text-amber-705 border-amber-205';
      case 'Low':
      default:
        return 'bg-slate-55 text-slate-600 border-slate-205';
    }
  };

  const getPriorityStyle = (priority?: string) => {
    const p = priority?.toLowerCase();
    if (p === 'high' || p === 'critical') return 'text-red-700 bg-red-55 border-red-200';
    if (p === 'medium') return 'text-amber-700 bg-amber-55 border-amber-200';
    return 'text-slate-500 bg-slate-55 border-slate-100';
  };

  const getTaskStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (s === 'reviewing') return 'bg-indigo-55 text-indigo-700 border border-indigo-200';
    if (s === 'pending' || s === 'awaiting_evidence') return 'bg-amber-55 text-amber-700 border border-amber-200';
    return 'bg-slate-55 text-slate-500 border border-slate-200';
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50">
      
      {/* LEFT PANEL: Circulars Master List (hidden on mobile if detail view active) */}
      <div className={`w-full md:w-[35%] lg:w-[30%] flex flex-col border-r border-slate-200 bg-white h-full overflow-hidden shrink-0 ${
        showDetailOnMobile ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Title Block */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40 shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-slate-805">SEBI Circulars</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">View, analyze and act on SEBI circulars</p>
          </div>
          <button 
            onClick={simulateFeedRefresh}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-orange-500 border border-slate-200 shadow-sm shrink-0"
            title="Simulate RSS Feed Intake"
          >
            <Rss className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1.5 gap-1 shrink-0">
          {[
            { id: 'all', label: 'All', count: circulars.length },
            { id: 'new', label: 'New', count: circulars.filter(c => c.status === 'discovered').length },
            { id: 'processed', label: 'Processed', count: circulars.filter(c => c.status === 'analyzed').length },
            { id: 'review', label: 'Review', count: circulars.filter(c => c.risk === 'High').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveListTab(tab.id as any)}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeListTab === tab.id 
                  ? 'bg-white text-indigo-755 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label} <span className="text-[9px] opacity-60 ml-0.5 font-mono">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search Strip */}
        <div className="p-3 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search circulars by title, number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 hover:bg-slate-200/40 focus:bg-white text-xs border-none focus:ring-2 focus:ring-indigo-500 rounded-xl transition-all outline-none"
            />
          </div>
        </div>

        {/* Circulars List Queue */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
          {filteredCirculars.map(c => {
            const isSelected = c.id === activeCircularId;
            const remText = getRemainingDaysText(c.date, c.risk).text;

            return (
              <div
                key={c.id}
                onClick={() => handleSelectCircular(c.id)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex flex-col gap-2 relative ${
                  isSelected 
                    ? 'border-indigo-500 bg-white ring-1 ring-indigo-500/25 shadow-md' 
                    : 'border-slate-200 bg-white hover:border-slate-350 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-extrabold uppercase border ${getRiskBadge(c.risk)}`}>
                    {c.risk} Impact
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono font-bold">{c.number}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">
                  {c.title}
                </h4>
                <div className="flex items-center justify-between text-[9.5px] text-slate-450 mt-1 border-t border-slate-50 pt-2 font-semibold">
                  <span>Issued: {c.date}</span>
                  <span className="text-indigo-650 bg-indigo-50 px-1 rounded-sm">{remText}</span>
                </div>
              </div>
            );
          })}

          {filteredCirculars.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              No circulars found.
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="p-3 border-t border-slate-150 bg-white shrink-0">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 transition-colors"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload New Circular</span>
          </button>
        </div>

      </div>

      {/* RIGHT PANEL: Circular Details Split Dashboard (collapses/expands on mobile) */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-50 ${
        !showDetailOnMobile ? 'hidden md:flex' : 'flex'
      }`}>
        
        {selectedCircular ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Header Details Strip */}
            <div className="bg-white p-5 border-b border-slate-200 flex flex-col gap-3 shrink-0 relative">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowDetailOnMobile(false)}
                    className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getRiskBadge(selectedCircular.risk)}`}>
                        {selectedCircular.risk} Impact
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">{selectedCircular.number}</span>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-850 mt-1 leading-snug">{selectedCircular.title}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button className="px-3 py-1.5 border border-slate-205 rounded-xl hover:bg-slate-50 text-[11px] font-bold text-slate-700 shadow-sm flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" /> <span>Download PDF</span>
                  </button>
                  <button className="px-3 py-1.5 border border-slate-205 rounded-xl hover:bg-slate-50 text-[11px] font-bold text-slate-700 shadow-sm flex items-center gap-1">
                    <Share className="h-3.5 w-3.5" /> <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Meta information bar */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10.5px] text-slate-500 font-semibold border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Issued: <strong>{selectedCircular.date}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Effective: <strong>Immediate</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  <span>File Size: <strong>1.2 MB</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-550" />
                  <span>Gaps Extracted: <strong>{selectedCircular.obligationsCount || obligations.length}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-indigo-550" />
                  <span>Departments Impacted: <strong>{selectedCircular.departmentsCount || 3}</strong></span>
                </div>
              </div>
            </div>

            {/* If circular is processed, render tab selection */}
            {selectedCircular.status === 'analyzed' && (
              <div className="flex border-b border-slate-200 bg-white px-5 gap-6 shrink-0">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'obligations', label: `Obligations (${obligations.length})` },
                  { id: 'tasks', label: `Tasks (${tasks.length})` },
                  { id: 'evidence', label: `Evidence (${evidence.length})` },
                  { id: 'activity', label: 'Activity Log' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id as any)}
                    className={`py-3.5 text-xs font-bold border-b-2 transition-all ${
                      detailTab === t.id 
                        ? 'border-indigo-600 text-indigo-650' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* RIGHT PANEL MAIN SCROLL CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* STATE 1: Circular is Discovered / Unanalyzed -> Show Analysis trigger panel */}
              {selectedCircular.status === 'discovered' && (
                <div className="max-w-xl mx-auto py-12 text-center space-y-6">
                  <div className="p-4 bg-indigo-50 border border-indigo-150 text-indigo-650 rounded-2xl w-fit mx-auto animate-pulse">
                    <Cpu className="h-10 w-10 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Unanalyzed SEBI Regulation</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      This circular has been registered in the RICE intake queue but has not been compared against SOUBH's baseline policies yet.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs text-left text-slate-650 space-y-2">
                    <span className="font-extrabold text-slate-700 block uppercase tracking-wider">Document Preview Summary</span>
                    <p className="leading-relaxed font-sans">{selectedCircular.summary}</p>
                  </div>

                  <div className="pt-4">
                    {analysisStep === 'idle' ? (
                      <button
                        onClick={() => handleStartAnalysis(selectedCircular.id)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 mx-auto"
                      >
                        <Cpu className="h-4 w-4" />
                        <span>Run RICE AI Compliance Agent</span>
                      </button>
                    ) : (
                      <div className="bg-white border border-slate-250 p-5 rounded-2xl space-y-4 max-w-md mx-auto text-left shadow-sm">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5 animate-pulse text-indigo-650">
                            <Loader2 className="h-4 w-4 animate-spin" /> Orchestrating specialized agent squad...
                          </span>
                          <span className="font-mono">{analysisProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${analysisProgress}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-400 space-y-1.5 font-mono">
                          <div className="flex items-center gap-2">
                            <span className={analysisProgress >= 25 ? 'text-emerald-500 font-bold' : 'text-slate-300'}>✔</span>
                            <span className={analysisStep === 'parsing' ? 'text-indigo-600 font-bold' : 'text-slate-500'}>1. Document Intelligence Agent (Extracted metadata)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={analysisProgress >= 50 ? 'text-emerald-500 font-bold' : 'text-slate-300'}>✔</span>
                            <span className={analysisStep === 'summarizing' ? 'text-indigo-600 font-bold' : 'text-slate-500'}>2. Compliance Analyst Agent (Extracted obligations)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={analysisProgress >= 75 ? 'text-emerald-500 font-bold' : 'text-slate-300'}>✔</span>
                            <span className={analysisStep === 'comparing' ? 'text-indigo-600 font-bold' : 'text-slate-500'}>3. Gap Analysis Agent (Compared baseline policies)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={analysisProgress >= 90 ? 'text-emerald-500 font-bold' : 'text-slate-300'}>✔</span>
                            <span className={analysisStep === 'planning' ? 'text-indigo-600 font-bold' : 'text-slate-500'}>4. Task Planner Agent (Constructed checklist items)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STATE 2: Circular is Processed / Analyzed -> Show Tabbed board panels */}
              {selectedCircular.status === 'analyzed' && (
                <>
                  {/* TAB: Overview */}
                  {detailTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Sub-column 1: AI Summary & metrics (Span 5/12) */}
                        <div className="lg:col-span-5 space-y-5">
                          
                          {/* AI Summary */}
                          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">AI Summary</h4>
                            <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium whitespace-pre-line">
                              {selectedCircular.summary}
                            </p>
                            <button 
                              onClick={() => setDetailTab('obligations')}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-750 flex items-center gap-0.5 pt-1.5"
                            >
                              <span>View Full Summary</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Key Changes Count */}
                          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Key Changes Mapped</h4>
                            <div className="space-y-2">
                              <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-bold">
                                <span>5 New Requirements</span>
                                <CheckSquare className="h-4 w-4" />
                              </div>
                              <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-between text-xs text-amber-800 font-bold">
                                <span>3 Modified Requirements</span>
                                <Clock className="h-4 w-4" />
                              </div>
                              <div className="p-2.5 bg-red-50/30 border border-red-100/30 rounded-xl flex items-center justify-between text-xs text-red-650/80 font-bold">
                                <span>0 Removed Requirements</span>
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                            </div>
                          </div>

                          {/* Impact Overview */}
                          <div className="bg-white rounded-2xl p-4 border border-slate-205 shadow-sm space-y-3 text-xs">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Impact Assessment</h4>
                            <div className="space-y-2 border-b border-slate-50 pb-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-500">Compliance Risk:</span>
                                <span className="font-bold text-red-650 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-red-500" /> High
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-500">Operational Impact:</span>
                                <span className="font-bold text-emerald-650 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> High
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Affected Departments</span>
                              <div className="flex flex-wrap gap-1">
                                {['IT', 'Compliance', 'Operations'].map(d => (
                                  <span key={d} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-bold text-indigo-700">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Implementation Priority */}
                          <div className="bg-white rounded-2xl p-4 border border-slate-205 shadow-sm flex items-center justify-between gap-4">
                            <div>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Implementation Timeline</span>
                              <span className="text-xs font-bold text-slate-800 mt-1 block">Act within 30 days</span>
                            </div>
                            <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold uppercase">
                              High Priority
                            </span>
                          </div>

                        </div>

                        {/* Sub-column 2: Highlighted PDF Outline (Span 7/12) */}
                        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                            <span className="text-xs font-extrabold text-slate-700">Original Circular (Highlighted)</span>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                              <span className="h-2 w-2 bg-red-500 rounded-full" /> <span>High</span>
                              <span className="h-2 w-2 bg-amber-500 rounded-full ml-1" /> <span>Med</span>
                              <span className="h-2 w-2 bg-emerald-500 rounded-full ml-1" /> <span>Low</span>
                              <span className="h-2 w-2 bg-blue-500 rounded-full ml-1" /> <span>Info</span>
                            </div>
                          </div>

                          {/* PDF Layout content */}
                          <div className="flex-1 flex overflow-hidden text-xs">
                            
                            {/* Outline index */}
                            <div className="w-1/3 border-r border-slate-100 overflow-y-auto bg-slate-50/50 p-2 space-y-1 select-none font-semibold text-slate-650">
                              {[
                                { id: '1', text: '1. Introduction' },
                                { id: '2', text: '2. Governance' },
                                { id: '3', text: '3. Client KYC' },
                                { id: '4', text: '4. Cybersecurity', active: true },
                                { id: '4.1', text: '  4.1 Framework', indent: true, active: true },
                                { id: '4.2', text: '  4.2 Audit & Assurance', indent: true },
                                { id: '4.3', text: '  4.3 Incident Reporting', indent: true },
                                { id: '5', text: '5. Risk Management' },
                                { id: '6', text: '6. Operations' }
                              ].map(item => (
                                <div 
                                  key={item.id}
                                  onClick={() => setActiveOutlineSection(item.id)}
                                  className={`p-1.5 rounded-lg cursor-pointer truncate ${
                                    activeOutlineSection === item.id 
                                      ? 'bg-red-50/50 text-red-800' 
                                      : item.active 
                                      ? 'text-slate-800 font-bold' 
                                      : 'hover:bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {item.text}
                                </div>
                              ))}
                            </div>

                            {/* Circular Paragraph Highlight details */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-serif text-slate-700 bg-white">
                              <h4 className="font-extrabold text-sm border-b border-slate-100 pb-1.5 text-slate-850 font-sans">
                                4. CYBERSECURITY
                              </h4>
                              
                              <div className="space-y-3 leading-relaxed text-[11.5px]">
                                <p className="font-bold font-sans">4.1 Cybersecurity Framework</p>
                                <p>
                                  4.1.1 Stock brokers shall establish and maintain a robust cybersecurity framework commensurate with the nature, scale and complexity of their operations.
                                </p>
                                
                                <p 
                                  onClick={() => navigate('/gap-analysis')}
                                  className="bg-red-50 hover:bg-red-100 border border-red-200 p-2.5 rounded-xl cursor-pointer transition-colors relative"
                                >
                                  <strong>4.1.2</strong> Stock brokers shall conduct a comprehensive cybersecurity audit at least once in six months through CERT-In empanelled auditors.
                                  <span className="absolute top-1 right-2 text-[8px] bg-red-100 text-red-800 font-extrabold px-1 rounded uppercase">High Risk</span>
                                </p>

                                <p 
                                  onClick={() => navigate('/gap-analysis')}
                                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 p-2.5 rounded-xl cursor-pointer transition-colors relative"
                                >
                                  <strong>4.1.3</strong> Stock brokers shall report all cybersecurity incidents to SEBI within 6 hours of becoming aware of the incident.
                                  <span className="absolute top-1 right-2 text-[8px] bg-amber-100 text-amber-800 font-extrabold px-1 rounded uppercase">Medium Risk</span>
                                </p>

                                <p 
                                  onClick={() => navigate('/gap-analysis')}
                                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2.5 rounded-xl cursor-pointer transition-colors relative"
                                >
                                  <strong>4.1.4</strong> Business continuity and disaster recovery plan shall be tested at least once in a year.
                                  <span className="absolute top-1 right-2 text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-1 rounded uppercase">Low Risk</span>
                                </p>

                                <p 
                                  onClick={() => navigate('/gap-analysis')}
                                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 p-2.5 rounded-xl cursor-pointer transition-colors relative"
                                >
                                  <strong>4.1.5</strong> All critical systems shall have real-time monitoring and appropriate access controls.
                                  <span className="absolute top-1 right-2 text-[8px] bg-blue-100 text-blue-800 font-extrabold px-1 rounded uppercase">Info</span>
                                </p>

                                <p className="font-bold font-sans mt-4">4.2 Audit & Assurance</p>
                                <p>
                                  4.2.1 Stock brokers shall maintain audit trails for all critical activities for a minimum period of 5 years.
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB: Obligations */}
                  {detailTab === 'obligations' && (
                    <div className="space-y-4">
                      {obligations.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
                          No obligations loaded.
                        </div>
                      ) : (
                        obligations.map((ob) => (
                          <div key={ob.obligationId} className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded uppercase font-mono">
                                {ob.obligationId}
                              </span>
                              <span className="text-xs font-bold text-slate-500 font-mono">Page {ob.sourcePage}</span>
                            </div>
                            <h4 className="font-bold text-slate-805 text-sm">{ob.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-sans">{ob.description}</p>
                            <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-xs">
                              <span className="font-bold text-slate-450 bg-slate-100 px-2 py-0.5 rounded">Dept: {ob.department}</span>
                              <button 
                                onClick={() => navigate('/gap-analysis')}
                                className="text-[11px] font-bold text-indigo-650 hover:text-indigo-700 flex items-center gap-0.5"
                              >
                                View policy comparison <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB: Tasks */}
                  {detailTab === 'tasks' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { label: 'Total Tasks', val: tasks.length },
                          { label: 'High Priority', val: tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length, color: 'text-red-650' },
                          { label: 'Medium Priority', val: tasks.filter(t => t.priority === 'medium').length, color: 'text-amber-655' },
                          { label: 'Low Priority', val: tasks.filter(t => t.priority === 'low').length, color: 'text-slate-500' },
                          { label: 'Completed', val: tasks.filter(t => t.status === 'completed').length, color: 'text-emerald-600' }
                        ].map((mItem, idx) => (
                          <div key={idx} className="bg-white p-3 border border-slate-200 rounded-xl text-center shadow-sm">
                            <span className="text-lg font-black block font-mono leading-none mt-1 text-slate-800 className={mItem.color}">{mItem.val}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-2">{mItem.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-455 font-extrabold uppercase tracking-wider">
                              <th className="p-3">Task Title</th>
                              <th className="p-3">Owner</th>
                              <th className="p-3">Priority</th>
                              <th className="p-3">Due Date</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-655">
                            {tasks.map(t => (
                              <tr 
                                key={t.taskId}
                                onClick={() => navigate('/tasks')}
                                className="hover:bg-slate-55/40 cursor-pointer transition-colors"
                              >
                                <td className="p-3 text-slate-800">{t.title}</td>
                                <td className="p-3 text-slate-500">{t.ownerRole}</td>
                                <td className="p-3">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold border uppercase ${getPriorityStyle(t.priority)}`}>
                                    {t.priority}
                                  </span>
                                </td>
                                <td className="p-3 font-mono">{t.dueDate}</td>
                                <td className="p-3">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${getTaskStatusStyle(t.status)}`}>
                                    {t.status.replace('_', ' ')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB: Evidence */}
                  {detailTab === 'evidence' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { label: 'Pending Reviews', val: evidence.filter(e => e.verificationStatus === 'pending' || e.verificationStatus === 'needs_review').length },
                          { label: 'Approved Evidence', val: evidence.filter(e => e.verificationStatus === 'accepted').length, color: 'text-emerald-650' },
                          { label: 'Rejected / Missing', val: evidence.filter(e => e.verificationStatus === 'rejected').length, color: 'text-red-650' }
                        ].map((mItem, idx) => (
                          <div key={idx} className="bg-white p-4 border border-slate-200 rounded-xl text-center shadow-sm">
                            <span className="text-xl font-black block font-mono leading-none text-slate-800 className={mItem.color}">{mItem.val}</span>
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mt-2.5">{mItem.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-205 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-455 font-extrabold uppercase tracking-wider">
                              <th className="p-3">Document Name</th>
                              <th className="p-3">Uploaded By</th>
                              <th className="p-3">Uploaded Date</th>
                              <th className="p-3">Verification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-655">
                            {evidence.map(e => (
                              <tr key={e.evidenceId} className="hover:bg-slate-55/40 transition-colors">
                                <td className="p-3 text-slate-800 truncate max-w-[200px]" title={e.fileName}>
                                  {e.fileName}
                                </td>
                                <td className="p-3 text-slate-500">{e.uploadedBy}</td>
                                <td className="p-3 font-mono">{new Date(e.uploadedAt).toLocaleDateString()}</td>
                                <td className="p-3">
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold border uppercase ${
                                    e.verificationStatus === 'accepted'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                      : e.verificationStatus === 'rejected'
                                      ? 'bg-red-50 text-red-700 border-red-250'
                                      : 'bg-amber-50 text-amber-705 border-amber-250'
                                  }`}>
                                    {e.verificationStatus === 'accepted' ? 'Approved' : e.verificationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB: Activity Log */}
                  {detailTab === 'activity' && (
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Analysis Run History</h4>
                      
                      <div className="space-y-4">
                        {[
                          { title: 'Task Planner Agent completed structuring task checklists', date: 'June 29, 2026 11:35 AM', actor: 'Task Planner Agent' },
                          { title: 'Gap comparison executed successfully against company policy version 1.4', date: 'June 29, 2026 11:34 AM', actor: 'Gap Comparison Agent' },
                          { title: 'Key obligations and departments parsed from circular text', date: 'June 29, 2026 11:32 AM', actor: 'Compliance Agent' },
                          { title: 'Document text extracted and layout mapping completed', date: 'June 29, 2026 11:30 AM', actor: 'Document Intelligence Agent' }
                        ].map((log, idx) => (
                          <div key={idx} className="flex gap-3 items-start text-xs font-semibold text-slate-655 relative">
                            <div className="h-5 w-5 rounded-full bg-indigo-50 border border-indigo-250 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="h-2 w-2 rounded-full bg-indigo-600" />
                            </div>
                            <div>
                              <p className="text-slate-800 leading-snug font-bold">{log.title}</p>
                              <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                                <span>{log.date}</span>
                                <span>•</span>
                                <span>{log.actor}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Bottom Summary widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-200/80 pt-6 mt-6">
                    
                    {/* Related Circulars */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Related Circulars</span>
                          <button onClick={() => navigate('/circulars')} className="text-[10px] font-bold text-indigo-650 hover:text-indigo-800">View All</button>
                        </div>
                        <div className="space-y-2">
                          {circulars.filter(c => c.id !== activeCircularId).slice(0, 2).map(c => (
                            <div key={c.id} onClick={() => handleSelectCircular(c.id)} className="p-2 bg-slate-50 hover:bg-indigo-50/10 border border-slate-200 rounded-lg cursor-pointer transition-all">
                              <p className="text-[11px] font-bold text-slate-700 truncate">{c.title}</p>
                              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{c.number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Tasks metrics */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Tasks from Circular</span>
                          <button onClick={() => { setDetailTab('tasks'); }} className="text-[10px] font-bold text-indigo-650 hover:text-indigo-800">View All Tasks</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-150 shadow-sm">
                            <span className="text-base font-black text-slate-800 font-mono leading-none block">{tasks.length}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Total</span>
                          </div>
                          <div className="bg-red-50/50 p-2 rounded-xl border border-red-100 shadow-sm">
                            <span className="text-base font-black text-red-700 font-mono leading-none block">
                              {tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length}
                            </span>
                            <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider block mt-1 font-sans">High</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Evidence pending */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Evidence Required</span>
                          <button onClick={() => { setDetailTab('evidence'); }} className="text-[10px] font-bold text-indigo-650 hover:text-indigo-800">View Evidence</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-150 shadow-sm">
                            <span className="text-base font-black text-slate-800 font-mono leading-none block">
                              {evidence.filter(e => e.verificationStatus === 'pending' || e.verificationStatus === 'needs_review').length}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Pending</span>
                          </div>
                          <div className="bg-emerald-50/55 p-2 rounded-xl border border-emerald-100 shadow-sm">
                            <span className="text-base font-black text-emerald-705 font-mono leading-none block">
                              {evidence.filter(e => e.verificationStatus === 'accepted').length}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block mt-1">Approved</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              )}

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileText className="h-12 w-12 mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-bold">No Circular Selected</p>
            <p className="text-xs mt-1">Select a circular from the intake queue on the left to inspect details or run AI mapping.</p>
          </div>
        )}

      </div>

    </div>
  );
}
