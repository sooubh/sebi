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
import PdfViewer, { mockHighlights, PDFHighlight } from '../../components/pdf/PdfViewerMock';

interface Message {
  sender: 'user' | 'rice';
  text: string;
  time: string;
}

export default function Workspace() {
  const { circulars, activeCircularId } = useCircularStore();
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: 'rice', text: 'Hello! I am RICE. I have completed analysis on the SEBI Cybersecurity Framework. You can click any highlight in the document to see detailed policy gaps, or ask me specific questions.', time: '11:30 AM' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // If no active circular, default to cyber circular for demo stability
  const currentCircularId = activeCircularId || 'circ-sebi-cyber';
  const circular = circulars.find((c) => c.id === currentCircularId) || circulars[0];

  const handleHighlightSelect = (hl: PDFHighlight) => {
    setSelectedHighlightId(hl.id);
    
    // Add context to chat automatically for demo assistance
    const contextMsg: Message = {
      sender: 'rice',
      text: `Selected highlight [${hl.id.replace('hl-', '').toUpperCase()}]: "${hl.text}"\n\nCompliance Analysis: ${hl.comment}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, contextMsg]);
  };

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
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden">
      
      {/* Left Panel: Analysis and Chat */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col border-r border-slate-200 bg-white h-full overflow-hidden shrink-0">
        
        {/* Workspace Title */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Active Analysis Workspace</span>
            <h3 className="font-extrabold text-slate-800 text-sm truncate max-w-[280px] md:max-w-xs mt-0.5">
              {circular ? circular.title : 'No circular loaded'}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700 flex items-center gap-1">
            <Cpu className="h-3 w-3" /> Agentic AI Run
          </span>
        </div>

        {/* Workspace Core Tabs (Details and Chat) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Executive Summary */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-indigo-500" /> Executive AI Summary
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {circular?.summary || 'No analysis available. Please return to SEBI Circulars and trigger the AI run.'}
            </p>
          </div>

          {/* Extracted Obligations */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">Extracted Obligations ({mockHighlights.length})</h4>
            <div className="space-y-2.5">
              {mockHighlights.map((hl) => {
                const isActive = selectedHighlightId === hl.id;
                return (
                  <div
                    key={hl.id}
                    onClick={() => setSelectedHighlightId(hl.id)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-150 relative ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500/20 shadow-sm' 
                        : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        hl.type === 'compliant' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : hl.type === 'modified'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : hl.type === 'obligation'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {hl.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">Page {hl.page}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-2 leading-relaxed line-clamp-2">
                      {hl.text}
                    </p>
                    
                    {isActive && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 leading-normal animate-fadeIn">
                        <div className="flex items-start gap-1">
                          <CornerDownRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p>{hl.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat / Ask RICE Panel */}
        <div className="border-t border-slate-200 bg-slate-50 flex flex-col h-64 shrink-0">
          <div className="px-4 py-2 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-indigo-500" /> Ask RICE Chatbot
            </span>
            <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-mono">
              Contextual Q&A
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
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
          <form onSubmit={handleSendChat} className="p-2.5 bg-white border-t border-slate-200 flex gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask RICE about gaps, audit schedules..."
              className="flex-1 bg-slate-100 hover:bg-slate-200/50 focus:bg-white text-xs border-0 focus:ring-2 focus:ring-indigo-500 rounded-xl px-3.5 py-2 transition-all outline-none"
            />
            <button 
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel: Scroll-linked Interactive PDF Viewer */}
      <div className="flex-1 bg-slate-900 h-full p-4 md:p-6 overflow-hidden">
        <PdfViewer 
          activeHighlightId={selectedHighlightId} 
          onHighlightClick={handleHighlightSelect} 
        />
      </div>
    </div>
  );
}
