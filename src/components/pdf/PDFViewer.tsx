import React, { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { usePDFViewer, PDFHighlight } from './PDFViewerContext';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Maximize2
} from 'lucide-react';

// Configure PDFJS Worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Import default styles for Text and Annotation layers to ensure alignment
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

interface PDFViewerProps {
  initialPdfUrl?: string;
  initialHighlights?: PDFHighlight[];
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  initialPdfUrl, 
  initialHighlights 
}) => {
  const {
    pdfUrl,
    setPdfUrl,
    currentPage,
    setCurrentPage,
    numPages,
    setNumPages,
    scale,
    setScale,
    highlights,
    setHighlights,
    activeHighlightId,
    setActiveHighlightId,
    pageRefs,
    viewerContainerRef
  } = usePDFViewer();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize values if passed as props
  useEffect(() => {
    if (initialPdfUrl) {
      setPdfUrl(initialPdfUrl);
      setLoading(true);
      setError(null);
    }
  }, [initialPdfUrl, setPdfUrl]);

  useEffect(() => {
    if (initialHighlights) {
      setHighlights(initialHighlights);
    }
  }, [initialHighlights, setHighlights]);

  // Handle Zoom controls
  const handleZoomIn = () => setScale(Math.min(scale + 0.15, 2.0));
  const handleZoomOut = () => setScale(Math.max(scale - 0.15, 0.6));
  const handleZoomReset = () => setScale(1.0);

  // Handle document loading callbacks
  const onDocumentLoadSuccess = ({ numPages: loadedNumPages }: { numPages: number }) => {
    setNumPages(loadedNumPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('PDF Load Error:', err);
    setError('Failed to load PDF circular. Please verify file integrity.');
    setLoading(false);
  };

  // Continuous scroll detection to update current page number in navigation
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const pageElements = Object.entries(pageRefs.current);
      let closestPage = 1;
      let minDistance = Infinity;

      pageElements.forEach(([pageNumber, el]) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Distance from center of container to center of the page element
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.top + containerRect.height / 2;
        const pageCenter = rect.top + rect.height / 2;
        const distance = Math.abs(pageCenter - containerCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestPage = Number(pageNumber);
        }
      });

      setCurrentPage(closestPage);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [pageRefs, setCurrentPage, viewerContainerRef]);

  // Highlight Overlay Layer Component
  const HighlightOverlay = ({ pageNumber }: { pageNumber: number }) => {
    const pageHighlights = highlights.filter(h => h.page === pageNumber);

    return (
      <div className="absolute inset-0 pointer-events-none z-10">
        {pageHighlights.map(hl => {
          const colorClasses = {
            green: 'bg-green-500/20 border-green-500 hover:bg-green-500/30',
            yellow: 'bg-yellow-500/20 border-yellow-500 hover:bg-yellow-500/30',
            red: 'bg-red-500/20 border-red-500 hover:bg-red-500/30',
            blue: 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30',
          };

          const activeClasses = activeHighlightId === hl.id
            ? 'ring-2 ring-primary/80 ring-offset-1 bg-opacity-40 border-l-4 border-solid'
            : 'border-l-2 border-dashed';

          return hl.rects.map((rect, idx) => (
            <div
              key={`${hl.id}_rect_${idx}`}
              id={`pdf-highlight-${hl.id}`}
              className={`absolute cursor-pointer pointer-events-auto transition-all duration-200 ${colorClasses[hl.color]} ${activeClasses} rounded-sm`}
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveHighlightId(hl.id);
              }}
              title={`${hl.title}: ${hl.reason}`}
            />
          ));
        })}
      </div>
    );
  };

  // Render Zoom/Nav Controls
  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 z-20 text-slate-200">
        {/* Left Side: File Metadata */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
            PDF
          </span>
          <span className="text-xs font-medium truncate max-w-[200px]" title={pdfUrl || ''}>
            {pdfUrl ? pdfUrl.split('/').pop() : 'No PDF Loaded'}
          </span>
        </div>

        {/* Center: Pagination */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-sm">
          <button 
            disabled={currentPage <= 1 || loading}
            onClick={() => {
              const prevPage = currentPage - 1;
              const el = pageRefs.current[prevPage];
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-xs">
            {currentPage} / {numPages || '--'}
          </span>
          <button 
            disabled={currentPage >= numPages || loading}
            onClick={() => {
              const nextPage = currentPage + 1;
              const el = pageRefs.current[nextPage];
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right Side: Zoom controls */}
        <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
          <button 
            onClick={handleZoomOut}
            disabled={loading}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-mono w-12 text-center text-slate-300 select-none">
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={handleZoomIn}
            disabled={loading}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button 
            onClick={handleZoomReset}
            disabled={loading}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white border-l border-slate-800 transition-colors"
            title="Reset Zoom (100%)"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main PDF Scroll Container */}
      <div 
        ref={viewerContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col items-center bg-slate-950/60 custom-scrollbar relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 gap-3 z-30">
            <Loader2 className="animate-spin text-primary" size={36} />
            <p className="text-slate-400 text-sm font-medium animate-pulse">Rendering Document Framework...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30">
            <AlertCircle className="text-red-500 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-slate-200">Load Error</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md">{error}</p>
          </div>
        )}

        {pdfUrl && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            className="flex flex-col items-center"
          >
            {Array.from(new Array(numPages), (_, index) => {
              const pageNumber = index + 1;
              return (
                <div
                  key={`page-container-${pageNumber}`}
                  ref={(el) => {
                    pageRefs.current[pageNumber] = el;
                  }}
                  className="relative mb-6 select-text transition-all duration-300 react-pdf-page-wrapper"
                  style={{
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex items-center justify-center bg-slate-900 rounded-lg" style={{ width: 595 * scale, height: 842 * scale }}>
                        <Loader2 className="animate-spin text-slate-600" size={24} />
                      </div>
                    }
                  />
                  {/* Highlights layer rendered as absolute overlays relative to the page div wrapper */}
                  <HighlightOverlay pageNumber={pageNumber} />
                </div>
              );
            })}
          </Document>
        )}

        {!pdfUrl && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Maximize2 size={40} className="mb-2 text-slate-600 opacity-60" />
            <p className="text-sm">No active regulatory document selected.</p>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span className="font-semibold text-slate-300">Highlight Legend:</span>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-green-500/30 border border-green-500" />
            <span>Compliant / Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-yellow-500/30 border border-yellow-500" />
            <span>Modified Rule</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-red-500/30 border border-red-500" />
            <span>New Obligation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-blue-500/30 border border-blue-500" />
            <span>Compliance Evidence</span>
          </div>
        </div>
      </div>
    </div>
  );
};
