import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Send, 
  Sparkles, 
  Info, 
  ChevronRight, 
  CornerDownRight, 
  BookOpen, 
  FileText,
  AlertCircle,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { useCircularStore } from '../../context/useCircularStore';
import { usePDFViewer, PDFHighlight } from '../../components/pdf/PDFViewerContext';
import { PDFViewer } from '../../components/pdf/PDFViewer';

interface Message {
  sender: 'user' | 'rice';
  text: string;
  time: string;
}

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

export default function Workspace() {
  const { circulars, activeCircularId } = useCircularStore();
  const { setPdfUrl, setHighlights, activeHighlightId, scrollToHighlight } = usePDFViewer();
  const [activeTab, setActiveTab] = useState<'summary' | 'obligations' | 'chat'>('summary');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: 'rice', text: 'Hello! I am RICE. I have completed analysis on the SEBI Cybersecurity Framework. You can click any highlight in the document to see detailed policy gaps, or ask me specific questions.', time: '11:30 AM' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // If no active circular, default to cyber circular for demo stability
  const currentCircularId = activeCircularId || 'circ-sebi-cyber';
  const circular = circulars.find((c) => c.id === currentCircularId) || circulars[0];

  useEffect(() => {
    // Preload the sample PDF and mock highlights in the PDF workspace
    setPdfUrl('/sample_circular.pdf');
    setHighlights(MOCK_HIGHLIGHTS);
  }, [setPdfUrl, setHighlights]);

  // Sync active highlight from the PDF selection back to active tab & selected card
  useEffect(() => {
    if (activeHighlightId) {
      setActiveTab('obligations');
    }
  }, [activeHighlightId]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Simulate RICE AI response based on questions
    setTimeout(() => {
      let replyText = "I have analyzed our current baseline for SOUBH Securities. Could you clarify which section you are referencing?";
      const lowerInput = chatInput.toLowerCase();
      
      if (lowerInput.includes('mfa') || lowerInput.includes('authentication')) {
        replyText = "Regarding MFA: SOUBH Securities is fully compliant for client portal logins (using TOTP) and administrator connections. The new circular mandates MFA for all dealers and operational staff as well. We need to check if branch dealers are using static passwords.";
      } else if (lowerInput.includes('backup') || lowerInput.includes('offline')) {
        replyText = "Regarding backups: The circular introduces a modified requirement. SOUBH has daily cloud backups, but they are not *offline* backups, and our secondary location is within 40km of Mumbai (the circular requires at least 100km). We have marked this as a MODIFIED gap.";
      } else if (lowerInput.includes('audit') || lowerInput.includes('auditor')) {
        replyText = "Regarding Cyber Audit: This is a major gap. SOUBH conducts cyber audits annually. SEBI now mandates quarterly reviews, meaning we must update our engagement terms with our empanelled auditor and submit reports within 30 days of the quarter ending.";
      } else if (lowerInput.includes('ciso') || lowerInput.includes('designated')) {
        replyText = "Regarding CISO: Mr. Vikram Aditya is our designated CISO. However, to complete this task, we must upload the Board Resolution designating him as evidence in our Tasks panel.";
      }

      const riceMsg: Message = {
        sender: 'rice',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, riceMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-slate-50">
      
      {/* Left Panel: Analysis and Chat */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col border-r border-slate-200 bg-white h-full overflow-hidden shrink-0">
        
        {/* Workspace Title */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans">Active Analysis Workspace</span>
            <h3 className="font-extrabold text-slate-800 text-sm truncate mt-0.5" title={circular ? circular.title : 'No circular loaded'}>
              {circular ? circular.title : 'No circular loaded'}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700 flex items-center gap-1 shrink-0">
            <Cpu className="h-3 w-3" /> Agentic AI Run
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 p-1 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
              activeTab === 'summary' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('obligations')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
              activeTab === 'obligations' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Obligations ({MOCK_HIGHLIGHTS.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
              activeTab === 'chat' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ask RICE
          </button>
        </div>

        {/* Tab Content Canvas */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50">
          
          {/* TAB 1: Summary */}
          {activeTab === 'summary' && (
            <div className="p-5 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Executive AI Summary
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {circular?.summary || 'No analysis available. Please return to SEBI Circulars and trigger the AI run.'}
                </p>
              </div>

              {/* General Circular Meta info card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Document Metadata</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Circular No.</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block truncate">{circular?.number || 'SEBI/MIRSD/CIR/2026'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Issuer</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">SEBI</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Effective Date</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">{circular?.date || 'Immediate'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Status</span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-200">
                      Processed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Obligations */}
          {activeTab === 'obligations' && (
            <div className="p-5 space-y-3 bg-slate-50">
              {MOCK_HIGHLIGHTS.map((hl) => {
                const isActive = activeHighlightId === hl.id;
                return (
                  <div
                    key={hl.id}
                    onClick={() => scrollToHighlight(hl.id)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-150 relative ${
                      isActive 
                        ? 'border-indigo-500 bg-white ring-1 ring-indigo-500/20 shadow-md' 
                        : 'border-slate-200 bg-white hover:border-slate-350 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        hl.color === 'green' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : hl.color === 'yellow'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : hl.color === 'red'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {hl.color === 'green' ? 'Compliant' : hl.color === 'yellow' ? 'Modified' : hl.color === 'red' ? 'New Gap' : 'Evidence'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">Page {hl.page}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-2 leading-relaxed">
                      {hl.title}
                    </p>
                    
                    {isActive ? (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 leading-normal animate-fadeIn space-y-1.5">
                        <div className="flex items-start gap-1">
                          <CornerDownRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p>{hl.reason}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 truncate">{hl.reason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Chatbot */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full bg-slate-50">
              {/* Message scroll viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/10' 
                        : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-tl-none whitespace-pre-line'
                    }`}>
                      <p>{msg.text}</p>
                      <span className={`block text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3 py-2 text-xs text-slate-400 shadow-sm">
                      <span className="inline-block animate-pulse">RICE is typing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message input */}
              <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask RICE about gaps, audit schedules..."
                  className="flex-1 bg-slate-100 hover:bg-slate-200/50 focus:bg-white text-xs border-0 focus:ring-2 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 transition-all outline-none"
                />
                <button 
                  type="submit"
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Right Panel: Scroll-linked Interactive PDF Viewer */}
      <div className="flex-1 bg-slate-100 h-full p-4 md:p-6 overflow-hidden">
        <PDFViewer />
      </div>
    </div>
  );
}
