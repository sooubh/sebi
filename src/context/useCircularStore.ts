import { create } from 'zustand';

export interface Circular {
  id: string;
  title: string;
  number: string;
  date: string;
  status: 'discovered' | 'analyzing' | 'analyzed';
  risk: 'High' | 'Medium' | 'Low';
  source: 'RSS Feed' | 'Manual Upload';
  obligationsCount: number;
  departmentsCount: number;
  pdfUrl?: string;
  summary?: string;
}

interface CircularStore {
  circulars: Circular[];
  activeCircularId: string | null;
  analysisProgress: number; // 0 to 100
  analysisStep: string; // 'idle' | 'parsing' | 'summarizing' | 'comparing' | 'planning' | 'done'
  addCircular: (circular: Omit<Circular, 'id' | 'status' | 'obligationsCount' | 'departmentsCount'>) => void;
  setActiveCircular: (id: string | null) => void;
  startAnalysis: (id: string, callback?: () => void) => void;
  resetAnalysis: (id: string) => void;
}

export const useCircularStore = create<CircularStore>((set, get) => ({
  circulars: [
    {
      id: 'circ-sebi-cyber',
      title: 'Cyber Security and Cyber Resilience Framework for Stock Brokers',
      number: 'SEBI/HO/MIRSD/TPD/P/CIR/2026/048',
      date: '2026-06-15',
      status: 'discovered',
      risk: 'High',
      source: 'RSS Feed',
      obligationsCount: 4,
      departmentsCount: 3,
      summary: 'Establishes tighter guidelines for stock brokers, enforcing Multi-Factor Authentication (MFA), offline data backups, quarterly external cyber audits, and appointment of a Chief Information Security Officer (CISO).',
    },
    {
      id: 'circ-sebi-kyc',
      title: 'Simplification of Client Onboarding / KYC Process for Stock Brokers',
      number: 'SEBI/HO/MIRSD/SE/P/CIR/2026/012',
      date: '2026-04-10',
      status: 'analyzed',
      risk: 'Medium',
      source: 'RSS Feed',
      obligationsCount: 2,
      departmentsCount: 2,
      summary: 'Simplifies digital verification procedures, allowing stock brokers to onboard customers using video-in-person verification and verified e-signatures. Gaps already addressed in SOUBH baseline.',
    },
    {
      id: 'circ-sebi-nomination',
      title: 'Nomination for Eligible Trading and Demat Accounts - Extension',
      number: 'SEBI/HO/MIRSD/RTAMB/P/CIR/2026/033',
      date: '2026-05-02',
      status: 'discovered',
      risk: 'Low',
      source: 'RSS Feed',
      obligationsCount: 1,
      departmentsCount: 1,
      summary: 'Extends the deadline for submitting nomination declarations for demat accounts. SOUBH has already automated customer nomination reminders.',
    }
  ],
  activeCircularId: null,
  analysisProgress: 0,
  analysisStep: 'idle',
  
  addCircular: (circ) => {
    const newCirc: Circular = {
      ...circ,
      id: `circ-${Date.now()}`,
      status: 'discovered',
      obligationsCount: 4, // Default mock counts
      departmentsCount: 2,
    };
    set((state) => ({ circulars: [newCirc, ...state.circulars] }));
  },
  
  setActiveCircular: (id) => set({ activeCircularId: id }),
  
  startAnalysis: (id, callback) => {
    set({ activeCircularId: id, analysisStep: 'parsing', analysisProgress: 10 });
    
    // Simulate step-by-step agent analysis workflow
    const steps = [
      { step: 'parsing', progress: 20 },
      { step: 'summarizing', progress: 45 },
      { step: 'comparing', progress: 70 },
      { step: 'planning', progress: 90 },
      { step: 'done', progress: 100 },
    ];

    let currentStepIndex = 0;

    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        const next = steps[currentStepIndex];
        set({ 
          analysisStep: next.step, 
          analysisProgress: next.progress 
        });
        currentStepIndex++;
      } else {
        clearInterval(interval);
        
        // Update the circular status to analyzed
        set((state) => ({
          circulars: state.circulars.map((c) => 
            c.id === id ? { ...c, status: 'analyzed' } : c
          ),
          analysisStep: 'done',
        }));
        
        if (callback) {
          callback();
        }
      }
    }, 800); // 800ms per agent step to make the demo observable and satisfying
  },

  resetAnalysis: (id) => {
    set((state) => ({
      circulars: state.circulars.map((c) =>
        c.id === id ? { ...c, status: 'discovered' } : c
      ),
      analysisStep: 'idle',
      analysisProgress: 0,
    }));
  }
}));
