import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MessageSquare,
  ArrowRight,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { useCircularStore } from '../../context/useCircularStore';
import { usePDFViewer, PDFHighlight } from '../../components/pdf/PDFViewerContext';
import { PDFViewer } from '../../components/pdf/PDFViewer';
import { db } from '../../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { GapAnalysis, Obligation, SummaryData, ChatMessage } from '../../types';
import { askRiceChatbot } from '../../services/chatbot';

interface Message {
  sender: 'user' | 'rice';
  text: string;
  time: string;
  references?: {
    type: 'obligation' | 'paragraph' | 'task' | 'baseline';
    id: string;
    title?: string;
  }[];
}

export default function Workspace() {
  const navigate = useNavigate();
  const { circulars, activeCircularId } = useCircularStore();
  const { setPdfUrl, setHighlights, activeHighlightId, scrollToHighlight } = usePDFViewer();
  const [activeTab, setActiveTab] = useState<'summary' | 'obligations' | 'chat'>('summary');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: 'rice', text: 'Hello! I am RICE, your regulatory intelligence agent. I have analyzed the active circular and its implications for SOUBH Securities. Select any highlight in the PDF to inspect details, or ask me questions about backups, MFA, or audits.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Firestore context states
  const [gapData, setGapData] = useState<GapAnalysis | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const currentCircularId = activeCircularId || 'circ-sebi-cyber';
  const circular = (circulars.find((c) => c.id === currentCircularId) || circulars[0]) as any;

  // Subscribe to real-time analysis details
  useEffect(() => {
    if (!currentCircularId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubGap = onSnapshot(doc(db, 'gapAnalysis', currentCircularId), (snap) => {
      if (snap.exists()) {
        setGapData(snap.data() as GapAnalysis);
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
        setSummaryData(snap.data() as SummaryData);
      } else {
        setSummaryData(null);
      }
    });

    return () => {
      unsubGap();
      unsubSummary();
    };
  }, [currentCircularId]);

  // Map gap analysis items to PDF highlights and sync with PDF Context
  useEffect(() => {
    // Set PDF storage URL or fallback to the sample static circular PDF
    const targetPdfUrl = circular?.pdfUrl || '/sample_circular.pdf';
    setPdfUrl(targetPdfUrl);

    if (!gapData) {
      setHighlights([]);
      return;
    }

    const computedHighlights: PDFHighlight[] = [];
    const obligationsList = summaryData?.obligations || [];

    const getPageForRef = (refId: string) => {
      const ob = obligationsList.find(o => o.obligationId === refId);
      return ob ? ob.sourcePage : 1;
    };

    // 1. New Gaps -> Red Highlights
    gapData.newRequirements?.forEach((item, idx) => {
      computedHighlights.push({
        id: item.referenceId,
        page: item.sourcePage || getPageForRef(item.referenceId),
        rects: [{ x: 5, y: 12 + (idx * 15) % 70, width: 90, height: 8 }],
        color: 'red',
        title: item.title,
        reason: item.reason,
        obligationId: item.referenceId
      });
    });

    // 2. Modified -> Yellow Highlights
    gapData.modifiedRequirements?.forEach((item, idx) => {
      computedHighlights.push({
        id: item.referenceId,
        page: item.sourcePage || getPageForRef(item.referenceId),
        rects: [{ x: 5, y: 15 + (idx * 15) % 70, width: 90, height: 8 }],
        color: 'yellow',
        title: item.title,
        reason: item.difference,
        obligationId: item.referenceId
      });
    });

    // 3. Evidence Deficiencies -> Blue Highlights
    gapData.missingEvidence?.forEach((item, idx) => {
      computedHighlights.push({
        id: item.referenceId,
        page: getPageForRef(item.referenceId),
        rects: [{ x: 5, y: 18 + (idx * 15) % 70, width: 90, height: 8 }],
        color: 'blue',
        title: item.title,
        reason: item.reason,
        obligationId: item.referenceId
      });
    });

    // 4. Already Compliant -> Green Highlights
    gapData.alreadyCompliant?.forEach((item, idx) => {
      computedHighlights.push({
        id: item.referenceId,
        page: item.sourcePage || getPageForRef(item.referenceId),
        rects: [{ x: 5, y: 21 + (idx * 15) % 70, width: 90, height: 8 }],
        color: 'green',
        title: item.title,
        reason: item.reason,
        obligationId: item.referenceId
      });
    });

    setHighlights(computedHighlights);
  }, [gapData, summaryData, circular, setPdfUrl, setHighlights]);

  // Sync active highlight from the PDF selection back to active tab & selected card
  useEffect(() => {
    if (activeHighlightId) {
      setActiveTab('obligations');
    }
  }, [activeHighlightId]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgText = chatInput;
    const userMsg: Message = {
      sender: 'user',
      text: userMsgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Map chat messages to ChatMessage interface format for API
      const historyList: ChatMessage[] = chatMessages.map(m => ({
        messageId: '',
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
        createdAt: ''
      }));

      // Call the askRiceChatbot API
      const res = await askRiceChatbot({
        circularId: currentCircularId,
        question: userMsgText,
        history: historyList
      });

      const replyMessage: Message = {
        sender: 'rice',
        text: res.data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        references: res.data.references
      };

      setChatMessages(prev => [...prev, replyMessage]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        sender: 'rice',
        text: `Sorry, I encountered an issue: ${err.message}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReferenceClick = (refItem: { type: string; id: string }) => {
    if (refItem.type === 'task') {
      navigate('/tasks');
    } else if (refItem.type === 'obligation') {
      scrollToHighlight(refItem.id);
    } else {
      alert(`Referenced document ID: ${refItem.id}`);
    }
  };

  // Get active highlights array from UI state mapping
  const highlightsList: PDFHighlight[] = [];
  const obligationsList = summaryData?.obligations || [];

  const getPageForRef = (refId: string) => {
    const ob = obligationsList.find(o => o.obligationId === refId);
    return ob ? ob.sourcePage : 1;
  };

  gapData?.newRequirements?.forEach((item, idx) => {
    highlightsList.push({
      id: item.referenceId,
      page: item.sourcePage || getPageForRef(item.referenceId),
      rects: [{ x: 5, y: 12 + (idx * 15) % 70, width: 90, height: 8 }],
      color: 'red',
      title: item.title,
      reason: item.reason,
      obligationId: item.referenceId
    });
  });

  gapData?.modifiedRequirements?.forEach((item, idx) => {
    highlightsList.push({
      id: item.referenceId,
      page: item.sourcePage || getPageForRef(item.referenceId),
      rects: [{ x: 5, y: 15 + (idx * 15) % 70, width: 90, height: 8 }],
      color: 'yellow',
      title: item.title,
      reason: item.difference,
      obligationId: item.referenceId
    });
  });

  gapData?.missingEvidence?.forEach((item, idx) => {
    highlightsList.push({
      id: item.referenceId,
      page: getPageForRef(item.referenceId),
      rects: [{ x: 5, y: 18 + (idx * 15) % 70, width: 90, height: 8 }],
      color: 'blue',
      title: item.title,
      reason: item.reason,
      obligationId: item.referenceId
    });
  });

  gapData?.alreadyCompliant?.forEach((item, idx) => {
    highlightsList.push({
      id: item.referenceId,
      page: item.sourcePage || getPageForRef(item.referenceId),
      rects: [{ x: 5, y: 21 + (idx * 15) % 70, width: 90, height: 8 }],
      color: 'green',
      title: item.title,
      reason: item.reason,
      obligationId: item.referenceId
    });
  });

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
            <Cpu className="h-3 w-3 animate-pulse" /> Agentic AI Run
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 p-1 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-155 ${
              activeTab === 'summary' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('obligations')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-155 ${
              activeTab === 'obligations' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Obligations ({highlightsList.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-155 ${
              activeTab === 'chat' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ask RICE
          </button>
        </div>

        {/* Tab Content Canvas */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 flex flex-col">
          
          {/* TAB 1: Summary */}
          {activeTab === 'summary' && (
            <div className="p-5 space-y-6 flex-1">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Executive AI Summary
                </h4>
                <p className="text-xs text-slate-650 leading-relaxed font-sans font-medium whitespace-pre-line">
                  {summaryData?.executiveSummary || circular?.summary || 'No analysis available. Please return to SEBI Circulars and trigger the AI run.'}
                </p>
              </div>

              <div className="bg-white border border-slate-205 rounded-2xl p-4 space-y-3 shadow-sm">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Document Details</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Circular No.</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block truncate">{circular?.circularNumber || circular?.number || 'SEBI/MIRSD/CIR/2026'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Issuer</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">{circular?.issuer || 'SEBI'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Effective Date</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">{circular?.effectiveDate || circular?.date || 'Immediate'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Status</span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-200">
                      AI Grounded
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Obligations list */}
          {activeTab === 'obligations' && (
            <div className="p-5 space-y-3 bg-slate-50 flex-1">
              {highlightsList.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-xs text-slate-400 font-medium">
                  No compliance obligations extracted for this circular yet.
                </div>
              ) : (
                highlightsList.map((hl) => {
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
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : hl.color === 'yellow'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : hl.color === 'red'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {hl.color === 'green' ? 'Compliant' : hl.color === 'yellow' ? 'Modified' : hl.color === 'red' ? 'New Gap' : 'Evidence Deficit'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">Page {hl.page}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-750 mt-2 leading-relaxed">
                        {hl.title}
                      </p>
                      
                      {isActive ? (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-650 leading-normal animate-fadeIn space-y-1.5">
                          <div className="flex items-start gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                            <CornerDownRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <p className="font-sans font-semibold">{hl.reason}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-450 mt-1 line-clamp-1 truncate">{hl.reason}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: Grounded Gemini Chatbot (Ask RICE) */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full bg-slate-50 flex-1 min-h-0">
              
              {/* Message scroll viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-650 text-white rounded-tr-none shadow-sm shadow-indigo-600/10' 
                        : 'bg-white text-slate-750 border border-slate-200 shadow-sm rounded-tl-none font-medium'
                    }`}>
                      <p className="whitespace-pre-line font-sans">{msg.text}</p>
                      
                      {/* Render citation references */}
                      {msg.references && msg.references.length > 0 && (
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {msg.references.map((refItem, refIdx) => (
                            <button
                              key={refIdx}
                              onClick={() => handleReferenceClick(refItem)}
                              className="text-[9px] font-bold px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 flex items-center gap-1 transition-colors uppercase"
                            >
                              <Bookmark className="h-2.5 w-2.5" />
                              <span>{refItem.type}: {refItem.title || refItem.id}</span>
                              <ExternalLink className="h-2 w-2" />
                            </button>
                          ))}
                        </div>
                      )}

                      <span className={`block text-[9px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-slate-400 shadow-sm flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-spin" />
                      <span className="inline-block animate-pulse font-bold">Ask RICE is reasoning...</span>
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
                  placeholder="Ask about offline backups, audits, MFA gaps..."
                  className="flex-1 bg-slate-100 hover:bg-slate-200/50 focus:bg-white text-xs border-0 focus:ring-2 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 transition-all outline-none"
                />
                <button 
                  type="submit"
                  disabled={isTyping}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 shrink-0 disabled:opacity-50"
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
