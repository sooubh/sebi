// RICE TypeScript Types & Interfaces

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Department = 'Compliance' | 'Operations' | 'IT' | 'Support' | 'Other';
export type TaskStatus = 'pending' | 'in_progress' | 'awaiting_evidence' | 'reviewing' | 'completed' | 'blocked';
export type WorkflowStatus = 'idle' | 'uploaded' | 'parsing' | 'summarizing' | 'gap_analyzing' | 'planning_tasks' | 'completed' | 'error';
export type HighlightColor = 'green' | 'yellow' | 'red' | 'blue';

// Company Details
export interface Company {
  companyId: string;
  name: string;
  industry: string;
  type: string;
  demoMode: boolean;
  baselineVersion: string;
  departments: Department[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  description?: string;
}

// Company Baseline Snapshot
export interface CompanyBaseline {
  baselineId: string;
  version: string;
  referenceCorpus: string;
  policySummary: string;
  existingObligationsCount: number;
  compliantCount: number;
  pendingCount: number;
  missingEvidenceCount: number;
  baselineNotes: string;
  sourceDocuments: string[];
  activePolicies: {
    policyId: string;
    title: string;
    description: string;
    department: Department;
    lastUpdated: string;
  }[];
}

// SEBI Circular Metadata
export interface Circular {
  circularId: string;
  companyId: string;
  sourceType: 'manual_upload' | 'rss_discovered';
  title: string;
  issuer: string;
  circularNumber: string;
  issueDate: string;
  effectiveDate: string;
  status: 'pending' | 'processing' | 'processed' | 'error';
  storagePath: string;
  originalFileName: string;
  pageCount: number;
  createdAt: string;
  processedAt?: string;
  runId?: string;
  riskLevel?: RiskLevel;
  departmentsAffected?: Department[];
  summaryPreview?: string;
}

// Agent 1: Document Intelligence Output
export interface Section {
  sectionId: string;
  heading: string;
  page: number;
  text: string;
}

export interface ParagraphChunk {
  paragraphId: string;
  page: number;
  text: string;
}

export interface DocumentData {
  documentId: string;
  circularId: string;
  companyId: string;
  title: string;
  circularNumber: string;
  issuer: string;
  issueDate: string;
  effectiveDate: string;
  pageCount: number;
  sections: Section[];
  cleanText: string;
  paragraphMap: ParagraphChunk[];
  extractionQuality: number;
  createdAt: string;
}

// Agent 2: Compliance Analysis Output
export interface KeyChange {
  changeId: string;
  type: 'new' | 'modified' | 'removed';
  description: string;
  riskLevel: RiskLevel;
  sourcePage: number;
  sourceParagraph: string;
}

export interface Obligation {
  obligationId: string;
  circularId: string;
  companyId: string;
  title: string;
  description: string;
  department: Department;
  priority: RiskLevel;
  riskLevel: RiskLevel;
  sourcePage: number;
  sourceParagraph: string;
  status: 'pending' | 'compliant' | 'modified' | 'new' | 'evidence_required' | 'manual_review';
  createdAt: string;
}

export interface HighlightMapItem {
  sourcePage: number;
  sourceParagraph: string; // references paragraphId
  highlightColor: HighlightColor;
  reason: string;
}

export interface SummaryData {
  summaryId: string;
  circularId: string;
  companyId: string;
  executiveSummary: string[];
  keyChanges: KeyChange[];
  obligations: Obligation[];
  highlightMap: HighlightMapItem[];
  riskLevel: RiskLevel;
  impactedDepartments: Department[];
  createdAt: string;
}

// Agent 3: Gap Analysis Output
export interface AlreadyCompliantItem {
  referenceId: string;
  title: string;
  reason: string;
  sourcePage: number;
}

export interface ModifiedRequirementItem {
  referenceId: string;
  title: string;
  baselineMatch: string;
  difference: string;
  severity: 'medium' | 'high' | 'critical';
  sourcePage: number;
}

export interface NewRequirementItem {
  referenceId: string;
  title: string;
  reason: string;
  severity: 'medium' | 'high' | 'critical';
  sourcePage: number;
}

export interface MissingEvidenceItem {
  referenceId: string;
  title: string;
  expectedEvidence: string[];
  reason: string;
  severity: 'medium' | 'high' | 'critical';
}

export interface ManualReviewItem {
  referenceId: string;
  title: string;
  reason: string;
}

export interface RiskSummary {
  overallRiskLevel: RiskLevel;
  gapScore: number;
  impactNotes: string[];
}

export interface GapAnalysis {
  gapId: string;
  circularId: string;
  companyId: string;
  alreadyCompliant: AlreadyCompliantItem[];
  modifiedRequirements: ModifiedRequirementItem[];
  newRequirements: NewRequirementItem[];
  missingEvidence: MissingEvidenceItem[];
  manualReviewItems: ManualReviewItem[];
  riskSummary: RiskSummary;
  gapScore: number;
  createdAt: string;
}

// Agent 4: Task Planning Output
export interface Task {
  taskId: string;
  companyId: string;
  circularId: string;
  gapId: string;
  title: string;
  description: string;
  department: Department;
  ownerRole: string;
  priority: RiskLevel;
  status: TaskStatus;
  dueDate: string; // ISO date string
  linkedReferenceId: string; // referenceId of the gap item (e.g. n1, m1, e1)
  evidenceRequired: string[];
  checklist: string[];
  createdAt: string;
  completedAt?: string;
  completionNotes?: string;
}

export interface TaskSummary {
  totalTasks: number;
  highPriorityTasks: number;
  criticalTasks: number;
}

// Evidence logs
export interface Evidence {
  evidenceId: string;
  taskId: string;
  companyId: string;
  circularId: string;
  fileName: string;
  storagePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  verificationStatus: 'pending' | 'accepted' | 'rejected' | 'needs_review';
  notes?: string;
  linkedObligationId?: string;
}

// Workflow runs
export interface WorkflowRun {
  runId: string;
  companyId: string;
  circularId: string;
  status: WorkflowStatus;
  progressPercent: number; // 0 to 100
  currentStep: string; // e.g. parsing, summarizing, comparing, drafting
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  agentResults?: {
    documentIntelligence?: any;
    complianceAnalysis?: any;
    gapAnalysis?: any;
    taskPlanning?: any;
  };
}

// Chat thread and messages
export interface ChatMessage {
  messageId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  sourceRefs?: {
    type: 'obligation' | 'paragraph' | 'task' | 'baseline';
    id: string;
    title?: string;
  }[];
}

export interface ChatThread {
  threadId: string;
  companyId: string;
  circularId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
