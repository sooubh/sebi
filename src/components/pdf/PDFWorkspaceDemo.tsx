import React, { useState, useEffect } from 'react';
import { usePDFViewer, PDFHighlight } from './PDFViewerContext';
import { PDFViewer } from './PDFViewer';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Briefcase,
  Layers,
  Send,
  MessageSquare,
  Sparkles,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';

// Static Mock Data for the Circular Workspace
const MOCK_HIGHLIGHTS: PDFHighlight[] = [
  {
    id: 'hl-compliant-1',
    page: 1,
    rects: [{ x: 5, y: 55, width: 90, height: 12 }],
    color: 'green',
    title: 'ISO 27001 Baseline Alignment',
    reason: 'SOUBH Securities already maintains an active ISO 27001 standard certification. Under Section 2, the company is automatically deemed compliant with Chapter II requirements. No baseline logic changes needed, but annual audit filing must be tracked.',
    obligationId: 'ob-1',
    paragraphId: 'p-sec2'
  },
  {
    id: 'hl-modified-1',
    page: 2,
    rects: [{ x: 5, y: 15, width: 90, height: 10 }],
    color: 'yellow',
    title: 'Cyber Incident Reporting Window',
    reason: 'The reporting timeframe for cyber incidents has been dramatically reduced from 24 hours to 6 hours. This requires immediate updates to the SOUBH internal Incident Response Plan (IRP) and setting up integrations with MIRSD and CERT-In.',
    obligationId: 'ob-2',
    paragraphId: 'p-sec3'
  },
  {
    id: 'hl-new-1',
    page: 2,
    rects: [{ x: 5, y: 48, width: 90, height: 11 }],
    color: 'red',
    title: 'Establish Security Committee & CISO',
    reason: 'NEW MANDATORY REQUIREMENT. SOUBH Securities must establish a Cyber Security Committee and formally designate a Chief Information Security Officer (CISO). The committee is required to meet quarterly and submit meeting minutes directly to the Board of Directors.',
    obligationId: 'ob-3',
    paragraphId: 'p-sec4'
  },
  {
    id: 'hl-evidence-1',
    page: 3,
    rects: [{ x: 5, y: 12, width: 90, height: 11 }],
    color: 'blue',
    title: 'Mandatory Verification Filings',
    reason: 'Compliance proof must be maintained. SOUBH is required to upload the quarterly committee minutes, CISO appointment letters, and CERT-In registration proofs, signed off by the chief compliance officer.',
    obligationId: 'ob-4',
    paragraphId: 'p-sec5'
  }
];

interface Obligation {
  id: string;
  highlightId: string;
  title: string;
  description: string;
  type: 'compliant' | 'modified' | 'new' | 'evidence';
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  page: number;
}

const MOCK_OBLIGATIONS: Obligation[] = [
  {
    id: 'ob-1',
    highlightId: 'hl-compliant-1',
    title: 'ISO 27001 Exemption Filing',
    description: 'Provide annual ISO 27001 audit report to claim chapter exemption.',
    type: 'compliant',
    priority: 'low',
    department: 'Compliance',
    page: 1
  },
  {
    id: 'ob-2',
    highlightId: 'hl-modified-1',
    title: '6-Hour Cyber Incident Response Update',
    description: 'Update the company Incident Response Plan to match the new 6-hour window.',
    type: 'modified',
    priority: 'high',
    department: 'IT & Security',
    page: 2
  },
  {
    id: 'ob-3',
    highlightId: 'hl-new-1',
    title: 'Appoint CISO & Cyber Committee',
    description: 'Establish quarterly cybersecurity committee meetings and appoint a CISO.',
    type: 'new',
    priority: 'critical',
    department: 'Operations & HR',
    page: 2
  },
  {
    id: 'ob-4',
    highlightId: 'hl-evidence-1',
    title: 'CERT-In Proof & Minute Uploads',
    description: 'Upload quarterly meeting minutes and CISO appointment letter to SEBI portal.',
    type: 'evidence',
    priority: 'medium',
    department: 'Compliance',
    page: 3
  }
];

export const PDFWorkspaceDemo: React.FC = () => {
  const { 
    scrollToHighlight, 
    activeHighlightId, 
    setActiveHighlightId, 
    highlights, 
    setHighlights, 
    setPdfUrl 
  } = usePDFViewer();

  const [activeTab, setActiveTab] = useState<'summary' | 'obligations' | 'tasks'>('obligations');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'rice'; text: string }>>([
    { sender: 'rice', text: 'Hello! I am RICE, your regulatory intelligence assistant. Ask me anything about this Cybersecurity Resilience Framework circular, SOUBH’s gaps, or tasks.' }
  ]);
  const [createdTasks, setCreatedTasks] = useState<string[]>([]);

  // Preload PDF and highlights
  useEffect(() => {
    setPdfUrl('/sample_circular.pdf');
    setHighlights(MOCK_HIGHLIGHTS);
  }, [setPdfUrl, setHighlights]);

  // Find active highlight details
  const activeHighlight = highlights.find(h => h.id === activeHighlightId);

  // Handle chat question answering
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userQuery = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setChatInput('');

    // Process responses based on keywords
    setTimeout(() => {
      let replyText = "I parsed the circular, but couldn't locate specific details on that. Could you clarify your question? You can ask about the incident reporting window, CISO requirements, or SOUBH compliance.";
      
      const queryLower = userQuery.toLowerCase();
      if (queryLower.includes('incident') || queryLower.includes('6 hour') || queryLower.includes('reporting')) {
        replyText = "The circular (Page 2, Section 3) slashes the cyber incident reporting window from 24 hours to 6 hours. Stock brokers must notify MIRSD and CERT-In within 6 hours of incident detection. SOUBH is currently on the old 24-hour cycle, which is flagged as a Yellow 'Modified Requirement' gap.";
      } else if (queryLower.includes('ciso') || queryLower.includes('committee') || queryLower.includes('board')) {
        replyText = "Page 2, Section 4 introduces a Red 'New Obligation': Stock brokers must establish a dedicated Cyber Security Committee headed by a CISO. The committee must meet quarterly, and the minutes must be submitted to the Board. SOUBH does not have this committee, representing a critical compliance gap.";
      } else if (queryLower.includes('iso') || queryLower.includes('compliant') || queryLower.includes('27001')) {
        replyText = "Under Page 1, Section 2, brokers with active ISO 27001 standard certification are exempted from Chapter II. SOUBH holds an active ISO 27001 certificate (valid until 2027), so SOUBH is marked Green (Compliant Baseline) here, needing only annual filings.";
      } else if (queryLower.includes('evidence') || queryLower.includes('proof') || queryLower.includes('upload')) {
        replyText = "Page 3 requires uploading three items: CISO Appointment Letter, Quarterly Committee Minutes, and CERT-In registration proof. These must be uploaded in PDF, signed by the Compliance Officer, and logged in SOUBH's evidence tracker.";
      }

      setChatMessages(prev => [...prev, { sender: 'rice', text: replyText }]);
    }, 400);
  };

  const handleCreateTask = (obligationId: string) => {
    if (!createdTasks.includes(obligationId)) {
      setCreatedTasks(prev => [...prev, obligationId]);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* 1. Left Panel - Interactive AI Output */}
      <div className="w-[32rem] border-r border-slate-800 flex flex-col h-full bg-slate-900 shadow-xl z-10 shrink-0">
        
        {/* Workspace Page Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles size={14} className="animate-pulse" />
            AI Compliance Agent Active
          </div>
          <h2 className="text-xl font-bold text-slate-100 truncate">
            SEBI Cyber Security Framework
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-900">
              High Risk Change
            </span>
            <span className="text-[10px] text-slate-400">
              SEBI/HO/MIRSD/CIR/P/2026/123
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 px-3 bg-slate-900/60">
          {(['obligations', 'summary', 'tasks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-semibold capitalize tracking-wide transition-all border-b-2 -mb-[2px] ${
                activeTab === tab 
                  ? 'border-indigo-500 text-slate-100 bg-slate-800/40' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'obligations' ? 'Obligations & Gaps' : tab === 'summary' ? 'AI Summary' : 'Generated Tasks'}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-900/40">
          
          {/* TAB 1: OBLIGATIONS & GAPS */}
          {activeTab === 'obligations' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-200 block mb-1">AI Recommendation:</span>
                We matched 4 obligations against SOUBH Securities baseline. 1 is already compliant, 1 requires manual workflow adjustments, 1 requires new operational setup, and 1 requires evidence logging. Click an obligation below to jump to its exact PDF coordinate.
              </div>

              <div className="space-y-3">
                {MOCK_OBLIGATIONS.map((ob) => {
                  const typeStyles = {
                    compliant: { bg: 'bg-green-950/40', border: 'border-green-900 hover:border-green-700', text: 'text-green-400', badge: 'Compliant Baseline' },
                    modified: { bg: 'bg-yellow-950/40', border: 'border-yellow-900 hover:border-yellow-700', text: 'text-yellow-400', badge: 'Modified Rule' },
                    new: { bg: 'bg-red-950/40', border: 'border-red-900 hover:border-red-700', text: 'text-red-400', badge: 'New Obligation' },
                    evidence: { bg: 'bg-blue-950/40', border: 'border-blue-900 hover:border-blue-700', text: 'text-blue-400', badge: 'Evidence Upload' },
                  }[ob.type];

                  const prioColors = {
                    low: 'text-slate-400 bg-slate-800',
                    medium: 'text-blue-300 bg-blue-950/50 border border-blue-900',
                    high: 'text-yellow-300 bg-yellow-950/50 border border-yellow-900',
                    critical: 'text-red-300 bg-red-950/50 border border-red-900',
                  }[ob.priority];

                  const isActive = activeHighlightId === ob.highlightId;

                  return (
                    <div
                      key={ob.id}
                      onClick={() => scrollToHighlight(ob.highlightId)}
                      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${typeStyles.bg} ${typeStyles.border} ${
                        isActive ? 'ring-2 ring-indigo-500 shadow-lg scale-[1.01]' : 'opacity-85 hover:opacity-100 hover:translate-x-0.5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/60 uppercase tracking-wider ${typeStyles.text}`}>
                          {typeStyles.badge}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-medium ${prioColors}`}>
                            {ob.priority}
                          </span>
                          <span className="text-slate-400 font-mono">P. {ob.page}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100">{ob.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{ob.description}</p>
                      
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/40 text-[10px] text-slate-400 font-medium">
                        <span>Dept: <strong className="text-slate-300">{ob.department}</strong></span>
                        <span className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                          Inspect in PDF <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AI SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl leading-relaxed">
                <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                  <FileText size={16} className="text-indigo-400" /> Executive Digest
                </h3>
                <p className="text-xs text-slate-300">
                  SEBI has released the Cybersecurity Resilience Framework (CRF) for stock brokers to mitigate growing risk vectors. This revised policy sets strict time gates on incident notifications and introduces organizational roles designed to mandate board accountability.
                </p>
                <h4 className="text-xs font-semibold text-slate-200 mt-4 mb-2">Key Policy Shifts:</h4>
                <ul className="space-y-2 text-xs text-slate-300 pl-4 list-disc">
                  <li><strong>Window Reduction:</strong> Incidence alerting drops from 24h to 6h.</li>
                  <li><strong>New Board Role:</strong> Setup of CISO & Cyber Security Committee.</li>
                  <li><strong>Standard Exceptions:</strong> Exemption for organizations holding active ISO 27001 standard certification.</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-emerald-400" /> SOUBH Baseline Impact
                </h3>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Baseline Match</span>
                    <span className="text-emerald-400 font-bold text-lg">75%</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Action Tasks</span>
                    <span className="text-red-400 font-bold text-lg">3 Gaps</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GENERATED TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {MOCK_OBLIGATIONS.map(ob => {
                const isCreated = createdTasks.includes(ob.id);
                return (
                  <div key={`task-${ob.id}`} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-3">
                    <div className={`mt-0.5 p-1 rounded-full ${isCreated ? 'bg-indigo-950 text-indigo-400' : 'bg-slate-850 text-slate-500'}`}>
                      <ClipboardList size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{ob.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Owner: {ob.department} CISO</p>
                      
                      {isCreated ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-2.5 bg-emerald-950/40 py-1 px-2.5 rounded border border-emerald-900/60 w-fit">
                          <CheckCircle2 size={12} /> Task Registered in Firebase
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCreateTask(ob.id)}
                          className="mt-2.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/40 hover:bg-indigo-900/40 py-1 px-2.5 rounded border border-indigo-900/60 transition-colors"
                        >
                          Generate Operational Task
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Selected Highlight Details Rationale Panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col gap-2.5 min-h-[160px] justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Selected Highlight Details
              </span>
              {activeHighlight && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                  activeHighlight.color === 'green' ? 'bg-green-950 text-green-400 border border-green-900' :
                  activeHighlight.color === 'yellow' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900' :
                  activeHighlight.color === 'red' ? 'bg-red-950 text-red-400 border border-red-900' :
                  'bg-blue-950 text-blue-400 border border-blue-900'
                }`}>
                  {activeHighlight.color}
                </span>
              )}
            </div>

            {activeHighlight ? (
              <div className="mt-2">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  {activeHighlight.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed max-h-[90px] overflow-y-auto custom-scrollbar pr-1">
                  {activeHighlight.reason}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center text-center text-slate-500 py-4">
                <HelpCircle size={20} className="mb-1 text-slate-600" />
                <p className="text-[11px]">Click an obligation card above or a colored highlight overlay inside the PDF viewer to inspect compliance rationale.</p>
              </div>
            )}
          </div>

          {activeHighlight && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400">
                Linked Ref: <strong className="font-mono text-slate-300">{activeHighlight.obligationId || 'N/A'}</strong>
              </span>
              <button
                onClick={() => {
                  if (activeHighlight.obligationId) {
                    handleCreateTask(activeHighlight.obligationId);
                    setActiveTab('tasks');
                  }
                }}
                className="text-[10px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 py-1 px-3 rounded shadow transition-all duration-200"
              >
                Create Task from Gap
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Middle Panel - PDF Viewer */}
      <div className="flex-1 h-full flex flex-col min-w-0 bg-slate-950 relative">
        <PDFViewer />
      </div>

      {/* 3. Right Panel - Ask RICE Chatbot */}
      <div className="w-[18rem] border-l border-slate-800 flex flex-col h-full bg-slate-900 shadow-xl shrink-0">
        
        {/* Chatbot Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-100 font-bold text-sm">
            <MessageSquare size={16} className="text-indigo-400" />
            <span>Ask RICE</span>
          </div>
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900">
            SECURE
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-slate-950/30">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col max-w-[85%] rounded-xl p-2.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none ml-auto'
                  : 'bg-slate-800 text-slate-200 rounded-bl-none mr-auto border border-slate-700/50'
              }`}
            >
              <p>{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 border-t border-slate-800 bg-slate-900/60 flex flex-wrap gap-1.5">
          <button 
            onClick={() => {
              setChatInput('Why is the incident window marked as yellow?');
            }}
            className="text-[9px] bg-slate-800 hover:bg-slate-750 text-slate-300 py-1 px-2 rounded-md border border-slate-700 transition-colors truncate max-w-full"
          >
            "Why incident window yellow?"
          </button>
          <button 
            onClick={() => {
              setChatInput('Tell me about the Cyber Security Committee obligations.');
            }}
            className="text-[9px] bg-slate-850 hover:bg-slate-800 text-slate-300 py-1 px-2 rounded-md border border-slate-750 transition-colors truncate max-w-full"
          >
            "Tell me about the Committee."
          </button>
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900">
          <div className="relative flex items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask RICE a question..."
              className="w-full bg-slate-950 text-slate-200 rounded-lg pl-3 pr-9 py-2 border border-slate-850 focus:border-indigo-500 focus:outline-none text-xs transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1 text-slate-400 hover:text-indigo-400 p-1.5 transition-colors"
              title="Send Message"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
