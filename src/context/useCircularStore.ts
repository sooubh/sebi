import { create } from 'zustand';
import { db, storage } from '../config/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { executeWorkflow } from '../services/workflowManager';

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

const INITIAL_MOCK_CIRCULARS: Circular[] = [
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
];

interface CircularStore {
  circulars: Circular[];
  activeCircularId: string | null;
  analysisProgress: number; // 0 to 100
  analysisStep: 'idle' | 'parsing' | 'summarizing' | 'comparing' | 'planning' | 'done';
  fetchCirculars: () => () => void;
  addCircular: (circular: Omit<Circular, 'status' | 'obligationsCount' | 'departmentsCount'> & { id?: string }, file?: File) => Promise<string>;
  setActiveCircular: (id: string | null) => void;
  startAnalysis: (id: string, pdfText: string, file?: File, callback?: () => void) => Promise<void>;
  resetAnalysis: (id: string) => Promise<void>;
}

export const useCircularStore = create<CircularStore>((set, get) => ({
  circulars: INITIAL_MOCK_CIRCULARS,
  activeCircularId: null,
  analysisProgress: 0,
  analysisStep: 'idle',
  
  // Sets up a real-time Firestore collection listener to load and sync circulars
  fetchCirculars: () => {
    const q = query(collection(db, 'circulars'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Circular[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          title: data.title || '',
          number: data.circularNumber || '',
          date: data.issueDate || data.date || '',
          status: data.status === 'processed' ? 'analyzed' : data.status === 'processing' ? 'analyzing' : 'discovered',
          risk: data.riskLevel === 'high' || data.riskLevel === 'critical' ? 'High' : data.riskLevel === 'medium' ? 'Medium' : 'Low',
          source: data.sourceType === 'manual_upload' ? 'Manual Upload' : 'RSS Feed',
          obligationsCount: data.obligationsCount || 0,
          departmentsCount: data.departmentsAffected?.length || 0,
          pdfUrl: data.storagePath || '',
          summary: data.summaryPreview || data.summary || '',
        });
      });

      // Merge local mock assets with custom uploaded assets for stable intake representation
      const mergedList = [...INITIAL_MOCK_CIRCULARS];
      list.forEach((dbCirc) => {
        const idx = mergedList.findIndex((c) => c.id === dbCirc.id);
        if (idx >= 0) {
          mergedList[idx] = dbCirc;
        } else {
          mergedList.push(dbCirc);
        }
      });

      set({ circulars: mergedList });
    });
    return unsubscribe;
  },
  
  addCircular: async (circ, file) => {
    const id = circ.id || `circ-${Date.now()}`;
    const companyId = 'soubh-securities';
    
    let storagePath = circ.pdfUrl || '';
    if (file) {
      try {
        const storageRef = ref(storage, `companies/${companyId}/circulars/${id}/${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        storagePath = await getDownloadURL(uploadResult.ref);
      } catch (err) {
        console.warn('Firebase Storage upload failed, falling back to empty path:', err);
      }
    }

    const docRef = doc(db, 'circulars', id);
    await setDoc(docRef, {
      circularId: id,
      companyId,
      sourceType: circ.source === 'Manual Upload' ? 'manual_upload' : 'rss_discovered',
      title: circ.title,
      circularNumber: circ.number,
      issueDate: circ.date,
      effectiveDate: circ.date,
      status: 'pending',
      storagePath,
      originalFileName: file ? file.name : 'circular.pdf',
      pageCount: 1,
      createdAt: new Date().toISOString(),
      riskLevel: circ.risk.toLowerCase(),
      departmentsAffected: [],
      summaryPreview: circ.summary
    });

    return id;
  },
  
  setActiveCircular: (id) => set({ activeCircularId: id }),
  
  startAnalysis: async (id, pdfText, file, callback) => {
    set({ activeCircularId: id, analysisStep: 'parsing', analysisProgress: 10 });
    
    try {
      const companyId = 'soubh-securities';
      let storagePath = '';
      if (file) {
        try {
          const storageRef = ref(storage, `companies/${companyId}/circulars/${id}/${file.name}`);
          const uploadResult = await uploadBytes(storageRef, file);
          storagePath = await getDownloadURL(uploadResult.ref);
        } catch (err) {
          console.warn('Firebase Storage upload failed, skipping storage path update:', err);
        }
      }

      // Update document to processing status
      await updateDoc(doc(db, 'circulars', id), {
        status: 'processing',
        ...(storagePath ? { storagePath } : {})
      });

      // Trigger the actual 4-agent workflow on top of our database
      const result = await executeWorkflow({
        circularId: id,
        pdfText,
        companyId
      });

      if (!result.success) {
        throw new Error(result.error || 'Agent run failed');
      }

      // Set up a real-time Firestore listener on the workflow run to animate the progress bar
      const runRef = doc(db, 'workflowRuns', result.runId);
      const unsubscribe = onSnapshot(runRef, (snap) => {
        if (snap.exists()) {
          const run = snap.data();
          const stepMap: Record<string, any> = {
            'parsing': 'parsing',
            'summarizing': 'summarizing',
            'gap_analyzing': 'comparing',
            'planning_tasks': 'planning',
            'completed': 'done',
            'error': 'idle'
          };
          
          set({
            analysisProgress: run.progressPercent || 10,
            analysisStep: stepMap[run.status] || 'parsing'
          });

          if (run.status === 'completed') {
            unsubscribe();
            set({ analysisStep: 'done', analysisProgress: 100 });
            if (callback) {
              callback();
            }
          } else if (run.status === 'error') {
            unsubscribe();
            set({ analysisStep: 'idle', analysisProgress: 0 });
            alert(`Analysis workflow failed: ${run.error}`);
          }
        }
      });
    } catch (error: any) {
      console.error('Error starting circular analysis workflow:', error);
      set({ analysisStep: 'idle', analysisProgress: 0 });
      alert(`AI Execution Error: ${error.message || 'Unknown error occurred.'}`);
    }
  },

  resetAnalysis: async (id) => {
    try {
      const docRef = doc(db, 'circulars', id);
      await updateDoc(docRef, {
        status: 'pending',
        riskLevel: 'medium',
        departmentsAffected: [],
        summaryPreview: 'Analysis reset. Ready for AI evaluation.'
      });
      set({ analysisStep: 'idle', analysisProgress: 0 });
    } catch (err: any) {
      console.error('Failed to reset circular analysis state:', err);
    }
  }
}));
