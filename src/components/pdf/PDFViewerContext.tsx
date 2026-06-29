import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

export interface PDFHighlight {
  id: string;
  page: number;
  rects: Array<{
    x: number; // percentage from left (0 - 100)
    y: number; // percentage from top (0 - 100)
    width: number; // percentage width (0 - 100)
    height: number; // percentage height (0 - 100)
  }>;
  color: 'green' | 'yellow' | 'red' | 'blue';
  reason: string;
  title: string;
  obligationId?: string;
  paragraphId?: string;
}

interface PDFViewerContextType {
  pdfUrl: string | null;
  setPdfUrl: (url: string | null) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  numPages: number;
  setNumPages: (num: number) => void;
  scale: number;
  setScale: (scale: number) => void;
  highlights: PDFHighlight[];
  setHighlights: (highlights: PDFHighlight[]) => void;
  activeHighlightId: string | null;
  setActiveHighlightId: (id: string | null) => void;
  scrollToPage: (pageNumber: number) => void;
  scrollToHighlight: (highlightId: string) => void;
  pageRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  viewerContainerRef: React.RefObject<HTMLDivElement>;
}

const PDFViewerContext = createContext<PDFViewerContextType | undefined>(undefined);

export const PDFViewerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [highlights, setHighlights] = useState<PDFHighlight[]>([]);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const scrollToPage = useCallback((pageNumber: number) => {
    if (pageNumber < 1) return;
    setCurrentPage(pageNumber);
    const targetPageEl = pageRefs.current[pageNumber];
    if (targetPageEl) {
      targetPageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const scrollToHighlight = useCallback((highlightId: string) => {
    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    setActiveHighlightId(highlightId);
    setCurrentPage(highlight.page);

    // First scroll the page into view
    const targetPageEl = pageRefs.current[highlight.page];
    if (targetPageEl) {
      targetPageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Then, after a slight delay for page scroll/rendering, scroll to highlight element
    setTimeout(() => {
      const highlightEl = document.getElementById(`pdf-highlight-${highlightId}`);
      if (highlightEl) {
        highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }, [highlights]);

  return (
    <PDFViewerContext.Provider
      value={{
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
        scrollToPage,
        scrollToHighlight,
        pageRefs,
        viewerContainerRef,
      }}
    >
      {children}
    </PDFViewerContext.Provider>
  );
};

export const usePDFViewer = () => {
  const context = useContext(PDFViewerContext);
  if (!context) {
    throw new Error('usePDFViewer must be used within a PDFViewerProvider');
  }
  return context;
};
