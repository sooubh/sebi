import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, Download, Printer, Info, CheckCircle2, AlertTriangle, AlertCircle, FileSpreadsheet } from 'lucide-react';

export interface PDFHighlight {
  id: string;
  type: 'compliant' | 'modified' | 'obligation' | 'evidence';
  text: string;
  comment: string;
  page: number;
}

export const mockHighlights: PDFHighlight[] = [
  {
    id: 'hl-mfa',
    type: 'compliant',
    page: 1,
    text: 'Stock Brokers shall implement Multi-Factor Authentication (MFA) for all user access to the trading systems, including clients, dealers, operational staff, and administrators.',
    comment: 'SOUBH Securities has already implemented MFA across all client portals and administrator accounts. Status: Compliant.',
  },
  {
    id: 'hl-backup',
    type: 'modified',
    page: 2,
    text: 'Brokers must maintain daily offline backups of all critical data, encrypted at rest, and stored in a separate geographical location at least 100km away from the primary data center.',
    comment: 'Modified Requirement: SOUBH currently performs daily cloud backups, but they are not offline, and the secondary site is only 40km away. Action needed: Establish offline workflow and move backup site.',
  },
  {
    id: 'hl-audit',
    type: 'obligation',
    page: 2,
    text: 'A comprehensive cyber audit shall be conducted on a quarterly basis by a SEBI-empanelled auditor, and the reports must be submitted to the Exchange within 30 days of the quarter ending.',
    comment: 'New Requirement: SOUBH baseline policy only mandates an annual cyber audit. Transitioning to a quarterly schedule is a major gap. Action: Appoint auditor and adjust schedule.',
  },
  {
    id: 'hl-ciso',
    type: 'evidence',
    page: 3,
    text: 'Every stock broker shall designate a qualified Chief Information Security Officer (CISO) who shall be responsible for implementing this cyber resilience framework and submitting monthly compliance certificates.',
    comment: 'Evidence Required: SOUBH has a CISO (Mr. Vikram Aditya), but we must upload the official appointment letter and Board Resolution to verify active designation.',
  },
];

interface PdfViewerProps {
  activeHighlightId?: string | null;
  onHighlightClick?: (highlight: PDFHighlight) => void;
}

export default function PdfViewer({ activeHighlightId, onHighlightClick }: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null);

  const mfaRef = useRef<HTMLDivElement>(null);
  const backupRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);
  const cisoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeHighlightId) {
      setSelectedHighlight(activeHighlightId);
      const hl = mockHighlights.find((h) => h.id === activeHighlightId);
      if (hl) {
        setPage(hl.page);
        
        // Scroll element into view
        setTimeout(() => {
          let ref: React.RefObject<HTMLDivElement> | null = null;
          if (hl.id === 'hl-mfa') ref = mfaRef;
          else if (hl.id === 'hl-backup') ref = backupRef;
          else if (hl.id === 'hl-audit') ref = auditRef;
          else if (hl.id === 'hl-ciso') ref = cisoRef;

          if (ref?.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [activeHighlightId]);

  const handleHighlightClick = (hl: PDFHighlight) => {
    setSelectedHighlight(hl.id);
    if (onHighlightClick) {
      onHighlightClick(hl);
    }
  };

  const getHighlightClass = (type: PDFHighlight['type'], isSelected: boolean) => {
    const base = 'px-1 py-0.5 rounded cursor-pointer transition-all duration-200 ';
    let color = '';
    if (type === 'compliant') color = isSelected ? 'bg-green-300 text-green-950 font-medium ring-2 ring-green-600' : 'bg-green-100 hover:bg-green-200 text-green-800';
    else if (type === 'modified') color = isSelected ? 'bg-yellow-300 text-yellow-950 font-medium ring-2 ring-yellow-600' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800';
    else if (type === 'obligation') color = isSelected ? 'bg-red-300 text-red-950 font-medium ring-2 ring-red-600' : 'bg-red-100 hover:bg-red-200 text-red-800';
    else if (type === 'evidence') color = isSelected ? 'bg-blue-300 text-blue-950 font-medium ring-2 ring-blue-600' : 'bg-blue-100 hover:bg-blue-200 text-blue-800';
    return base + color;
  };

  const zoomStyle = {
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
    transition: 'transform 0.2s ease',
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
      {/* PDF Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 text-slate-300 gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-400" />
          <span className="text-sm font-semibold truncate max-w-[200px] md:max-w-xs">
            SEBI_CIRCULAR_CYBER_2026.pdf
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setZoom(Math.max(60, zoom - 10))}
              className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs px-2 min-w-[3.5rem] text-center font-mono">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs px-2 text-center min-w-[4rem]">
              Page {page} / 3
            </span>
            <button
              onClick={() => setPage(Math.min(3, page + 1))}
              disabled={page === 3}
              className="p-1.5 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-slate-800 rounded-md transition-colors border border-slate-700 text-slate-400 hover:text-slate-200">
            <Download className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-slate-800 rounded-md transition-colors border border-slate-700 text-slate-400 hover:text-slate-200">
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Pages Container */}
      <div className="flex-1 overflow-auto p-6 md:p-8 flex justify-center items-start">
        <div style={zoomStyle} className="w-full max-w-[720px] shrink-0">
          
          {/* Page 1 */}
          {page === 1 && (
            <div className="bg-white text-slate-900 p-10 md:p-12 rounded-lg shadow-2xl relative border border-slate-200 min-h-[900px] leading-relaxed select-text font-serif">
              {/* SEBI Header */}
              <div className="text-center border-b-2 border-double border-slate-800 pb-6 mb-8">
                <h1 className="text-xl font-bold tracking-wider uppercase text-slate-800">Securities and Exchange Board of India</h1>
                <p className="text-xs font-sans text-slate-500 mt-1">SEBI Bhavan, Plot No. C4-A, "G" Block, Bandra Kurla Complex, Bandra (East), Mumbai 400051</p>
              </div>

              {/* Circular Metadata */}
              <div className="font-sans text-xs flex justify-between mb-8 text-slate-600">
                <div><strong>CIRCULAR NO:</strong> SEBI/HO/MIRSD/TPD/P/CIR/2026/048</div>
                <div><strong>DATE:</strong> June 15, 2026</div>
              </div>

              <div className="font-sans text-xs mb-6 text-slate-800">
                <strong>TO:</strong><br />
                1. All Registered Stock Brokers (through Stock Exchanges)<br />
                2. Recognized Stock Exchanges
              </div>

              <h2 className="text-base font-bold text-center uppercase tracking-normal mb-8 font-sans text-slate-800">
                Subject: Cyber Security and Cyber Resilience Framework for Stock Brokers
              </h2>

              <p className="mb-4">
                1. Attention of the Stock Brokers is drawn to the SEBI Circular No. SEBI/ITD/CISO/CIR/2018/147 dated December 03, 2018 on Cyber Security & Cyber Resilience Framework. With the evolution of technology and increased reliance on electronic systems, cybersecurity threats have become more sophisticated.
              </p>

              <p className="mb-4">
                2. In order to mitigate growing cyber risks and safeguard client funds, transaction integrity, and market reliability, SEBI has reviewed the existing framework. Accordingly, stock brokers are directed to adopt the comprehensive cyber resilience guidelines detailed herein.
              </p>

              <div ref={mfaRef} className="mb-6 p-2 rounded hover:bg-slate-50 transition-colors">
                <p className="mb-2">
                  3. <strong>Identity Access & Security Auditing:</strong>
                </p>
                <p className="pl-4">
                  3.1.{' '}
                  <span
                    className={getHighlightClass('compliant', selectedHighlight === 'hl-mfa')}
                    onClick={() => handleHighlightClick(mockHighlights[0])}
                  >
                    Stock Brokers shall implement Multi-Factor Authentication (MFA) for all user access to the trading systems, including clients, dealers, operational staff, and administrators.
                  </span>{' '}
                  MFA must include at least two independent factors: knowledge (password), possession (OTP/token), or inherence (biometrics). Single-factor passwords shall be strictly prohibited for administrative terminals.
                </p>
              </div>

              <p className="mb-4">
                4. Stock Brokers must conduct continuous vulnerability scans and patch critical vulnerabilities in trading software within 24 hours of release by vendors. All internet-facing components must be scanned daily.
              </p>

              {/* Footer */}
              <div className="absolute bottom-6 left-0 right-0 text-center font-sans text-xs text-slate-400 border-t border-slate-100 pt-4 px-12 flex justify-between">
                <span>Page 1 of 3</span>
                <span>SEBI / Mumbai Office</span>
              </div>
            </div>
          )}

          {/* Page 2 */}
          {page === 2 && (
            <div className="bg-white text-slate-900 p-10 md:p-12 rounded-lg shadow-2xl relative border border-slate-200 min-h-[900px] leading-relaxed select-text font-serif">
              <div className="font-sans text-xs flex justify-between mb-8 text-slate-400 border-b border-slate-100 pb-2">
                <span>Ref: SEBI/HO/MIRSD/TPD/P/CIR/2026/048</span>
                <span>June 15, 2026</span>
              </div>

              <div ref={backupRef} className="mb-6 p-2 rounded hover:bg-slate-50 transition-colors">
                <p className="mb-2">
                  5. <strong>Data Backup & Storage Policies:</strong>
                </p>
                <p className="pl-4">
                  5.1.{' '}
                  <span
                    className={getHighlightClass('modified', selectedHighlight === 'hl-backup')}
                    onClick={() => handleHighlightClick(mockHighlights[1])}
                  >
                    Brokers must maintain daily offline backups of all critical data, encrypted at rest, and stored in a separate geographical location at least 100km away from the primary data center.
                  </span>{' '}
                  The encryption protocol used must be AES-256 or higher. The integrity of the backup media must be tested weekly, and restoration simulation reports must be retained for audit inspections.
                </p>
              </div>

              <div ref={auditRef} className="mb-6 p-2 rounded hover:bg-slate-50 transition-colors">
                <p className="mb-2">
                  6. <strong>Cyber Audit and Periodic Review Schedules:</strong>
                </p>
                <p className="pl-4">
                  6.1.{' '}
                  <span
                    className={getHighlightClass('obligation', selectedHighlight === 'hl-audit')}
                    onClick={() => handleHighlightClick(mockHighlights[2])}
                  >
                    A comprehensive cyber audit shall be conducted on a quarterly basis by a SEBI-empanelled auditor, and the reports must be submitted to the Exchange within 30 days of the quarter ending.
                  </span>{' '}
                  Any deviation, critical vulnerability, or non-compliance identified during the audit must be reported immediately to the stock exchanges, along with a detailed Corrective and Preventive Action (CAPA) plan.
                </p>
              </div>

              <p className="mb-4">
                7. <strong>Incident Response and Incident Reporting:</strong> All cyber incidents, unauthorized access attempts, and system outages must be logged. Incidents of critical severity must be reported to the Exchange and CERT-In within 6 hours of detection.
              </p>

              {/* Footer */}
              <div className="absolute bottom-6 left-0 right-0 text-center font-sans text-xs text-slate-400 border-t border-slate-100 pt-4 px-12 flex justify-between">
                <span>Page 2 of 3</span>
                <span>SEBI / Mumbai Office</span>
              </div>
            </div>
          )}

          {/* Page 3 */}
          {page === 3 && (
            <div className="bg-white text-slate-900 p-10 md:p-12 rounded-lg shadow-2xl relative border border-slate-200 min-h-[900px] leading-relaxed select-text font-serif">
              <div className="font-sans text-xs flex justify-between mb-8 text-slate-400 border-b border-slate-100 pb-2">
                <span>Ref: SEBI/HO/MIRSD/TPD/P/CIR/2026/048</span>
                <span>June 15, 2026</span>
              </div>

              <div ref={cisoRef} className="mb-6 p-2 rounded hover:bg-slate-50 transition-colors">
                <p className="mb-2">
                  8. <strong>Designated Governance and Certifications:</strong>
                </p>
                <p className="pl-4">
                  8.1.{' '}
                  <span
                    className={getHighlightClass('evidence', selectedHighlight === 'hl-ciso')}
                    onClick={() => handleHighlightClick(mockHighlights[3])}
                  >
                    Every stock broker shall designate a qualified Chief Information Security Officer (CISO) who shall be responsible for implementing this cyber resilience framework and submitting monthly compliance certificates.
                  </span>{' '}
                  The CISO shall report directly to the Board of Directors or the Managing Director of the stock broker, ensuring independence of compliance reviews from day-to-day operations.
                </p>
              </div>

              <p className="mb-6">
                9. <strong>Compliance Timelines:</strong> The provisions of this circular shall come into force with immediate effect. Stock brokers are required to submit their first quarterly cyber audit report for the quarter ending September 30, 2026 by October 30, 2026.
              </p>

              <p className="mb-12">
                10. This circular is issued in exercise of powers conferred under Section 11 (1) of the Securities and Exchange Board of India Act, 1992, to protect the interests of investors in securities and to promote the development of, and to regulate the securities market.
              </p>

              {/* Signatory */}
              <div className="mt-8 font-sans text-right mr-10">
                <p className="font-bold">Yours faithfully,</p>
                <div className="h-12"></div> {/* Mock Signature */}
                <p className="font-bold text-slate-800">Kamlesh C. Varshney</p>
                <p className="text-xs text-slate-500">Executive Director</p>
                <p className="text-xs text-slate-500">Market Intermediaries Regulation and Supervision Department</p>
              </div>

              {/* Footer */}
              <div className="absolute bottom-6 left-0 right-0 text-center font-sans text-xs text-slate-400 border-t border-slate-100 pt-4 px-12 flex justify-between">
                <span>Page 3 of 3</span>
                <span>SEBI / Mumbai Office</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* PDF Legend Panel */}
      <div className="bg-slate-900 border-t border-slate-700 px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-1">
          <Info className="h-4 w-4 text-indigo-400 mr-1" />
          <span>Interactive Legend: Click highlighted segments to inspect compliance analysis.</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-green-500 inline-block"></span>
            <span className="text-slate-300">Compliant</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-yellow-500 inline-block"></span>
            <span className="text-slate-300">Modified</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-red-500 inline-block"></span>
            <span className="text-slate-300">New Obligation</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-blue-500 inline-block"></span>
            <span className="text-slate-300">Evidence Required</span>
          </span>
        </div>
      </div>
    </div>
  );
}
