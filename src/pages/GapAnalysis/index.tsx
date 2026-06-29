import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Play, 
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap
} from 'lucide-react';
import { useCircularStore } from '../../context/useCircularStore';
import { useRoleStore } from '../../context/useRoleStore';

interface GapItem {
  id: string;
  category: 'compliant' | 'modified' | 'new_gap' | 'evidence';
  title: string;
  obligation: string;
  baseline: string;
  gapText: string;
  severity: 'High' | 'Medium' | 'Low';
  department: string;
  highlightId: string;
}

const mockGaps: GapItem[] = [
  {
    id: 'gap-mfa',
    category: 'compliant',
    title: 'Multi-Factor Authentication (MFA) Mandate',
    obligation: 'Stock Brokers shall implement Multi-Factor Authentication (MFA) for all user access to the trading systems, including clients, dealers, operational staff, and administrators.',
    baseline: 'SOUBH Securities internal control policy §4.2 mandates MFA using time-based OTP (TOTP) via mobile app for all client trading logins and operational/admin systems.',
    gapText: 'No gap detected. Current implementation matches SEBI requirements. MFA is enforced across all client and employee accounts.',
    severity: 'Low',
    department: 'IT Security',
    highlightId: 'hl-mfa'
  },
  {
    id: 'gap-backup',
    category: 'modified',
    title: 'Daily Offline Backups & Geographic Isolation',
    obligation: 'Brokers must maintain daily offline backups of all critical data, encrypted at rest, and stored in a separate geographical location at least 100km away from the primary data center.',
    baseline: 'SOUBH Back-Office Manual §8.1 details daily automated database backups stored in AWS Mumbai cloud servers and replicated to a local NAS storage array in Navi Mumbai (40km away).',
    gapText: 'Critical Gaps: 1) Cloud and local NAS backups are online, exposing them to potential ransomware. 2) Navi Mumbai site is only 40km away, which is short of the mandated 100km minimum.',
    severity: 'Medium',
    department: 'IT Infrastructure',
    highlightId: 'hl-backup'
  },
  {
    id: 'gap-audit',
    category: 'new_gap',
    title: 'Quarterly Cyber Security Audit Frequency',
    obligation: 'A comprehensive cyber audit shall be conducted on a quarterly basis by a SEBI-empanelled auditor, and the reports must be submitted to the Exchange within 30 days of the quarter ending.',
    baseline: 'SOUBH Governance Policy §12.3 mandates an annual cyber audit from a qualified vendor, submitted in compliance with historical circular schedules (typically by December 31).',
    gapText: 'Complete Gap: SOUBH does not have a quarterly audit contract or reporting pipeline. Annual frequency is deficient under new regulations.',
    severity: 'High',
    department: 'Compliance',
    highlightId: 'hl-audit'
  },
  {
    id: 'gap-ciso',
    category: 'evidence',
    title: 'CISO Board-Level Designation & Certification',
    obligation: 'Every stock broker shall designate a qualified Chief Information Security Officer (CISO) responsible for implementing the resilience framework and submitting monthly compliance certificates.',
    baseline: 'SOUBH organizational chart designates Mr. Vikram Aditya as CISO. He manages cybersecurity operations but reports directly to the Chief Technology Officer, not the Board.',
    gapText: 'Evidence Gap: SOUBH has not formally documented the Board Resolution designating CISO authority and has no record of the monthly compliance certificate submission template.',
    severity: 'High',
    department: 'Governance / HR',
    highlightId: 'hl-ciso'
  }
];

export default function GapAnalysis() {
  const navigate = useNavigate();
  const { role, hasPermission } = useRoleStore();
  const { circulars, activeCircularId } = useCircularStore();
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'gap-audit': true, // Auto expand high priority gap
    'gap-backup': true
  });

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentCircularId = activeCircularId || 'circ-sebi-cyber';
  const circular = circulars.find((c) => c.id === currentCircularId) || circulars[0];

  const handlePromoteTasks = () => {
    if (!hasPermission('create_task')) {
      alert(`As an ${role}, you do not have permission to generate compliance tasks. Switch role to Compliance Officer.`);
      return;
    }
    alert('AI Task Planner is processing these gaps... Promoting all 3 active gaps to operational tasks and setting owners!');
    navigate('/tasks');
  };

  const getCategoryHeader = (cat: GapItem['category']) => {
    switch (cat) {
      case 'compliant':
        return { label: 'Compliant / Fully Covered', style: 'bg-emerald-50 text-emerald-800 border-emerald-100', icon: CheckCircle2 };
      case 'modified':
        return { label: 'Modified Policies Required', style: 'bg-yellow-50 text-yellow-850 border-yellow-200', icon: AlertTriangle };
      case 'new_gap':
        return { label: 'New Regulatory Gaps Detected', style: 'bg-red-50 text-red-850 border-red-200', icon: AlertCircle };
      case 'evidence':
        return { label: 'Evidence / Proof Deficiencies', style: 'bg-blue-50 text-blue-850 border-blue-200', icon: Clock };
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header Area */}
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

      {/* Accordion Comparison List */}
      <div className="space-y-4">
        {mockGaps.map((item) => {
          const isExpanded = !!expandedItems[item.id];
          const header = getCategoryHeader(item.category);
          const Icon = header.icon;

          return (
            <div 
              key={item.id} 
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
            >
              {/* Accordion Trigger Header */}
              <div 
                onClick={() => toggleExpand(item.id)}
                className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${header.style.split(' ')[0]} ${header.style.split(' ')[1]}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{item.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block mt-0.5 ${header.style}`}>
                      {header.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                    <span className="text-xs text-slate-600 font-bold">{item.department}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>

              {/* Accordion Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/20 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                  
                  {/* Left Column: Comparative View */}
                  <div className="space-y-4">
                    
                    {/* New SEBI Obligation */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm relative">
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                        <FileText className="h-3 w-3 text-red-500" />
                        <span>SEBI Requirement</span>
                      </div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">SEBI Circular Obligation</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-serif mt-3 pr-20">
                        "{item.obligation}"
                      </p>
                    </div>

                    {/* SOUBH Baseline policy */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm relative">
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span>Internal Policy</span>
                      </div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">SOUBH Securities Baseline Policy</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans mt-3 pr-20">
                        {item.baseline}
                      </p>
                    </div>

                  </div>

                  {/* Right Column: AI Gap Analysis & Recommendations */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">AI Gap Assessment</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          item.severity === 'High' 
                            ? 'bg-red-50 text-red-700 border-red-100' 
                            : item.severity === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {item.severity} Severity Impact
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-sans mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                        {item.gapText}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                      <button
                        onClick={() => {
                          navigate('/workspace');
                          // Normally we'd pass selected highlight state via store
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                      >
                        Inspect in PDF <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      {item.category !== 'compliant' && (
                        <button
                          onClick={() => navigate('/tasks')}
                          className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-colors"
                        >
                          Configure Task Draft
                        </button>
                      )}
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
