import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, writeBatch } from 'firebase/firestore';
import { 
  runDocumentIntelligenceAgent, 
  runComplianceAnalysisAgent, 
  runGapAnalysisAgent, 
  runTaskPlanningAgent 
} from './agents';
import { 
  WorkflowRun, 
  DocumentData, 
  SummaryData, 
  GapAnalysis, 
  Task, 
  Company, 
  CompanyBaseline, 
  Obligation,
  Department,
  RiskLevel
} from '../types';

// Helper mapping functions
function mapToDepartment(dept: string): Department {
  const d = dept?.trim().toLowerCase();
  if (d === 'compliance') return 'Compliance';
  if (d === 'operations') return 'Operations';
  if (d === 'it' || d === 'it & security' || d === 'tech') return 'IT';
  if (d === 'support' || d === 'customer support' || d === 'customer experience') return 'Support';
  return 'Other';
}

function mapToRiskLevel(risk: string): RiskLevel {
  const r = risk?.trim().toLowerCase();
  if (r === 'low') return 'low';
  if (r === 'medium') return 'medium';
  if (r === 'high') return 'high';
  if (r === 'critical') return 'critical';
  return 'medium';
}

export interface WorkflowOptions {
  circularId: string;
  pdfText: string;
  companyId?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper functions for mock data generation
const getCyberDocIntelData = (circularId: string, companyId: string, pdfText: string): DocumentData => ({
  documentId: `doc_cyber_${circularId}`,
  circularId,
  companyId,
  title: "SEBI Cyber Security and Cyber Resilience Framework for Stock Brokers",
  circularNumber: "SEBI/HO/MIRSD/TPD/P/CIR/2026/78",
  issuer: "SEBI",
  issueDate: "2026-06-15",
  effectiveDate: "2026-07-01",
  pageCount: 4,
  sections: [
    { sectionId: "s1", heading: "1. Objective and Scope", page: 1, text: "To strengthen cybersecurity posture..." },
    { sectionId: "s2", heading: "2. Half-Yearly Audit Requirements", page: 2, text: "Stock Brokers must undergo half-yearly cyber security audits..." },
    { sectionId: "s3", heading: "3. Quarterly VAPT", page: 3, text: "VAPT must be conducted quarterly..." },
    { sectionId: "s4", heading: "4. Incident Reporting", page: 4, text: "Incidents must be reported within 6 hours..." }
  ],
  cleanText: "SEBI has revised the Cybersecurity and Cyber Resilience Framework. Major updates include: 1) Transitioning from annual cybersecurity audits to half-yearly audits conducted by CERT-In empanelled auditors. 2) Vulnerability Assessment and Penetration Testing (VAPT) must be conducted quarterly. 3) Incident reporting to SEBI within 6 hours of detection.",
  paragraphMap: [
    { paragraphId: "p1", page: 1, text: "All stockbrokers and depository participants must implement the revised cybersecurity framework." },
    { paragraphId: "p2", page: 2, text: "It is mandatory for brokers to undergo cybersecurity audit twice a year (every 6 months) by a CERT-In empanelled auditor." },
    { paragraphId: "p3", page: 3, text: "Quarterly vulnerability assessment and penetration testing (VAPT) must be conducted and filed." },
    { paragraphId: "p4", page: 4, text: "Any cybersecurity incident must be reported to SEBI within 6 hours of discovery." }
  ],
  extractionQuality: 0.95,
  createdAt: new Date().toISOString()
});

const getKycDocIntelData = (circularId: string, companyId: string, pdfText: string): DocumentData => ({
  documentId: `doc_kyc_${circularId}`,
  circularId,
  companyId,
  title: "SEBI Digital KYC and Video-In-Person Verification (VIPV) Guidelines",
  circularNumber: "SEBI/HO/MIRSD/SEC/P/CIR/2026/42",
  issuer: "SEBI",
  issueDate: "2026-06-20",
  effectiveDate: "2026-07-15",
  pageCount: 3,
  sections: [
    { sectionId: "s1", heading: "1. Digital Onboarding Standards", page: 1, text: "Allows paperless KYC onboarding..." },
    { sectionId: "s2", heading: "2. VIPV Geotagging and Liveness", page: 2, text: "VIPV must include location data and liveness detection..." },
    { sectionId: "s3", heading: "3. PAN-Aadhaar Linking Check", page: 3, text: "Brokers must verify PAN-Aadhaar link status in real-time..." }
  ],
  cleanText: "SEBI allows stock brokers to perform digital onboarding. Requirements: 1) Video In-Person Verification (VIPV) must capture live video, latitude/longitude geotags, and face liveness test. 2) Document verification must use digital e-signatures or Aadhaar OTP-based signing. 3) Real-time PAN-Aadhaar linking checks are mandatory before account activation.",
  paragraphMap: [
    { paragraphId: "p1", page: 1, text: "Paperless digital onboarding is permitted subject to verified credentials." },
    { paragraphId: "p2", page: 2, text: "Video In-Person Verification (VIPV) must capture live coordinates (latitude/longitude) and perform liveness verification." },
    { paragraphId: "p3", page: 3, text: "Brokers must integrate APIs to check PAN-Aadhaar linking status before activating the trading account." }
  ],
  extractionQuality: 0.95,
  createdAt: new Date().toISOString()
});

const getCyberObligations = (circularId: string, companyId: string): Obligation[] => [
  {
    obligationId: `${circularId}_o_1`,
    circularId,
    companyId,
    title: "Conduct Half-Yearly Cybersecurity Audit",
    description: "Stock brokers must undergo half-yearly cybersecurity audits instead of annual audits, conducted by a CERT-In empanelled auditor.",
    department: "IT",
    priority: "high",
    riskLevel: "high",
    sourcePage: 2,
    sourceParagraph: "p2",
    status: "pending",
    createdAt: new Date().toISOString()
  },
  {
    obligationId: `${circularId}_o_2`,
    circularId,
    companyId,
    title: "Submit Quarterly VAPT Reports",
    description: "Brokers must perform quarterly vulnerability scanning and penetration testing and submit reports to SEBI.",
    department: "IT",
    priority: "medium",
    riskLevel: "medium",
    sourcePage: 3,
    sourceParagraph: "p3",
    status: "pending",
    createdAt: new Date().toISOString()
  },
  {
    obligationId: `${circularId}_o_3`,
    circularId,
    companyId,
    title: "Report Cyber Incidents within 6 Hours",
    description: "Cybersecurity incidents must be reported to SEBI and CERT-In within 6 hours of detection.",
    department: "IT",
    priority: "critical",
    riskLevel: "critical",
    sourcePage: 4,
    sourceParagraph: "p4",
    status: "pending",
    createdAt: new Date().toISOString()
  }
];

const getKycObligations = (circularId: string, companyId: string): Obligation[] => [
  {
    obligationId: `${circularId}_o_1`,
    circularId,
    companyId,
    title: "Implement VIPV Geotagging and Liveness Checks",
    description: "The digital onboarding flow must capture customer GPS coordinates and perform an automated liveness test during video KYC.",
    department: "Operations",
    priority: "high",
    riskLevel: "high",
    sourcePage: 2,
    sourceParagraph: "p2",
    status: "pending",
    createdAt: new Date().toISOString()
  },
  {
    obligationId: `${circularId}_o_2`,
    circularId,
    companyId,
    title: "Real-Time PAN-Aadhaar Linking Verification",
    description: "Integrate validation APIs to verify PAN-Aadhaar linking status before account creation.",
    department: "Operations",
    priority: "medium",
    riskLevel: "medium",
    sourcePage: 3,
    sourceParagraph: "p3",
    status: "pending",
    createdAt: new Date().toISOString()
  }
];

const getCyberSummaryData = (circularId: string, companyId: string, obligations: Obligation[]): SummaryData => ({
  summaryId: `sum_cyber_${circularId}`,
  circularId,
  companyId,
  executiveSummary: [
    "SEBI has issued a revised Cybersecurity and Cyber Resilience Framework to mitigate rising threats.",
    "Audits are now mandatory on a half-yearly basis (every 6 months) by CERT-In empanelled auditors.",
    "Quarterly VAPT reports and 6-hour incident reporting timelines are now strictly enforced."
  ],
  keyChanges: [
    {
      changeId: "kc_cyber_1",
      type: "modified",
      description: "Cybersecurity audit frequency changed from annual to half-yearly.",
      riskLevel: "high",
      sourcePage: 2,
      sourceParagraph: "p2"
    },
    {
      changeId: "kc_cyber_2",
      type: "new",
      description: "Quarterly VAPT scanning and 6-hour incident reporting requirement introduced.",
      riskLevel: "critical",
      sourcePage: 4,
      sourceParagraph: "p4"
    }
  ],
  obligations,
  highlightMap: [
    {
      sourcePage: 2,
      sourceParagraph: "p2",
      highlightColor: "red",
      reason: "Critical frequency change in cyber security audit"
    },
    {
      sourcePage: 3,
      sourceParagraph: "p3",
      highlightColor: "yellow",
      reason: "New quarterly scanning requirement"
    },
    {
      sourcePage: 4,
      sourceParagraph: "p4",
      highlightColor: "red",
      reason: "Strict 6-hour incident reporting window"
    }
  ],
  riskLevel: "high",
  impactedDepartments: ["IT", "Compliance"],
  createdAt: new Date().toISOString()
});

const getKycSummaryData = (circularId: string, companyId: string, obligations: Obligation[]): SummaryData => ({
  summaryId: `sum_kyc_${circularId}`,
  circularId,
  companyId,
  executiveSummary: [
    "SEBI has updated the guidelines for Digital KYC and Video-In-Person Verification (VIPV) for stock intermediaries.",
    "Mandatory location geotagging (lat/long) and automated face liveness checks are required for video verification.",
    "Real-time PAN-Aadhaar linking verification must be integrated directly into the onboarding API."
  ],
  keyChanges: [
    {
      changeId: "kc_kyc_1",
      type: "new",
      description: "VIPV must now capture geotags and execute a face-liveness check.",
      riskLevel: "high",
      sourcePage: 2,
      sourceParagraph: "p2"
    },
    {
      changeId: "kc_kyc_2",
      type: "new",
      description: "Real-time PAN-Aadhaar status checks must prevent activation of unlinked accounts.",
      riskLevel: "medium",
      sourcePage: 3,
      sourceParagraph: "p3"
    }
  ],
  obligations,
  highlightMap: [
    {
      sourcePage: 2,
      sourceParagraph: "p2",
      highlightColor: "red",
      reason: "Geotagging and liveness verification are brand new requirements"
    },
    {
      sourcePage: 3,
      sourceParagraph: "p3",
      highlightColor: "yellow",
      reason: "Mandatory pre-activation PAN check"
    }
  ],
  riskLevel: "medium",
  impactedDepartments: ["Operations", "IT"],
  createdAt: new Date().toISOString()
});

const getCyberGapAnalysis = (circularId: string, companyId: string): GapAnalysis => ({
  gapId: `gap_cyber_${circularId}`,
  circularId,
  companyId,
  alreadyCompliant: [
    { referenceId: "a1", title: "Incident Reporting Portal Registration", reason: "SOUBH Securities is already registered on the SEBI cyber portal and logs incidents internally.", sourcePage: 4 }
  ],
  modifiedRequirements: [
    { referenceId: "m1", title: "Half-Yearly Cybersecurity Audit Frequency", baselineMatch: "IT Policy §4.2: Conduct annual cyber audit", difference: "Baseline policy only mandates annual audits. Must update to half-yearly (6-month period).", severity: "high", sourcePage: 2 }
  ],
  newRequirements: [
    { referenceId: "n1", title: "Quarterly VAPT Reports Submission", reason: "New regulation requires quarterly submission of VAPT scans. SOUBH only performs scans twice a year.", severity: "medium", sourcePage: 3 },
    { referenceId: "n2", title: "6-Hour Incident Reporting SLA", reason: "Current baseline allows up to 24 hours to report. SLA must be shortened to 6 hours.", severity: "critical", sourcePage: 4 }
  ],
  missingEvidence: [
    { referenceId: "e1", title: "CERT-In Auditor Empanelment Certificate and Engagement Letter", expectedEvidence: ["Auditor Engagement Contract", "SEBI submission confirmation receipt"], reason: "To prove the audit was conducted by a qualified empanelled auditor.", severity: "high" }
  ],
  manualReviewItems: [
    { referenceId: "r1", title: "Compliance of 3rd Party cloud infrastructure", reason: "Agent is unable to verify if the cloud hosting provider satisfies the local residency criteria mentioned in Section 1.5." }
  ],
  riskSummary: { overallRiskLevel: "high", gapScore: 45, impactNotes: ["IT audit budget will increase.", "Operations must adapt to tighter incident reporting SLA."] },
  gapScore: 45,
  createdAt: new Date().toISOString()
});

const getKycGapAnalysis = (circularId: string, companyId: string): GapAnalysis => ({
  gapId: `gap_kyc_${circularId}`,
  circularId,
  companyId,
  alreadyCompliant: [
    { referenceId: "a1", title: "Aadhaar OTP E-Sign Integration", reason: "SOUBH Securities already integrates Aadhaar-based OTP e-signatures for client agreements.", sourcePage: 1 }
  ],
  modifiedRequirements: [
    { referenceId: "m1", title: "VIPV Web and Mobile Flow Upgrade", baselineMatch: "KYC Policy §1.2: Video KYC verification via web cam", difference: "Current implementation does not capture latitude/longitude geotags or execute automated liveness test.", severity: "high", sourcePage: 2 }
  ],
  newRequirements: [
    { referenceId: "n1", title: "Real-time PAN-Aadhaar Status API Integration", reason: "Baseline policy only performs batch updates on weekends. Real-time verification is missing.", severity: "medium", sourcePage: 3 }
  ],
  missingEvidence: [
    { referenceId: "e1", title: "VIPV Geotagging and Liveness test UI screenshots", expectedEvidence: ["Upgraded onboarding flow screenshots", "API call request logs for coordinates and liveness score"], reason: "To prove active compliance with location and liveness rules.", severity: "medium" }
  ],
  manualReviewItems: [
    { referenceId: "r1", title: "Exceptions handling for NRIs", reason: "Circular is unclear on location tagging for non-resident Indians onboarding from overseas IPs." }
  ],
  riskSummary: { overallRiskLevel: "medium", gapScore: 30, impactNotes: ["Developer work required to integrate location APIs.", "Verification flow may have slightly higher drop-off rates."] },
  gapScore: 30,
  createdAt: new Date().toISOString()
});

const getCyberTasks = (circularId: string, companyId: string, gapId: string): Task[] => [
  {
    taskId: `${circularId}_task_1`,
    companyId,
    circularId,
    gapId,
    title: "Update Cybersecurity Audit Policy to 6-month frequency",
    description: "Update SOUBH's internal Information Security Policy to transition from annual to half-yearly audits. Obtain board sign-off.",
    department: "IT",
    ownerRole: "IT Security Head",
    priority: "high",
    status: "pending",
    dueDate: "2026-07-15",
    linkedReferenceId: "m1",
    evidenceRequired: ["Updated Cyber Audit Policy PDF with Board approval signature"],
    checklist: ["Draft revised policy", "Get approval from IT Committee", "Submit to Board for formal sign-off"],
    createdAt: new Date().toISOString()
  },
  {
    taskId: `${circularId}_task_2`,
    companyId,
    circularId,
    gapId,
    title: "Engage CERT-In Empanelled Auditor for half-yearly audit",
    description: "Request proposals from CERT-In empanelled auditors, evaluate, and award contract for the half-yearly cyber audit.",
    department: "IT",
    ownerRole: "IT Security Head",
    priority: "high",
    status: "pending",
    dueDate: "2026-08-30",
    linkedReferenceId: "e1",
    evidenceRequired: ["Auditor Engagement Agreement PDF"],
    checklist: ["Shortlist CERT-In auditors", "Request quotes and evaluate bids", "Issue work order & sign agreement"],
    createdAt: new Date().toISOString()
  },
  {
    taskId: `${circularId}_task_3`,
    companyId,
    circularId,
    gapId,
    title: "Shorten incident reporting SLA to 6 hours",
    description: "Update the IT incident response playbook. Train the operations and IT staff on the new 6-hour SEBI reporting timeline.",
    department: "IT",
    ownerRole: "Incident Response Manager",
    priority: "critical",
    status: "pending",
    dueDate: "2026-07-10",
    linkedReferenceId: "n2",
    evidenceRequired: ["Updated Incident Response Playbook Document"],
    checklist: ["Revise incident severity triggers", "Configure automated notification alarms", "Conduct walkthrough with incident response team"],
    createdAt: new Date().toISOString()
  }
];

const getKycTasks = (circularId: string, companyId: string, gapId: string): Task[] => [
  {
    taskId: `${circularId}_task_1`,
    companyId,
    circularId,
    gapId,
    title: "Upgrade Video KYC flow with location geotagging",
    description: "Modify the customer onboarding web app to request browser location permissions and log latitude/longitude during VIPV.",
    department: "Operations",
    ownerRole: "Onboarding Product Manager",
    priority: "high",
    status: "pending",
    dueDate: "2026-07-25",
    linkedReferenceId: "m1",
    evidenceRequired: ["UI walk-through PDF", "Database schema update logs"],
    checklist: ["Write functional specifications", "Implement browser geolocation API", "Verify coordinates are stored securely in customer profile"],
    createdAt: new Date().toISOString()
  },
  {
    taskId: `${circularId}_task_2`,
    companyId,
    circularId,
    gapId,
    title: "Integrate real-time PAN-Aadhaar verification API",
    description: "Connect the onboarding backend to NSDL or Income Tax API to verify PAN-Aadhaar linking status before client code generation.",
    department: "IT",
    ownerRole: "Lead Developer",
    priority: "medium",
    status: "pending",
    dueDate: "2026-07-30",
    linkedReferenceId: "n1",
    evidenceRequired: ["API Integration Test Report", "Backend code repository diff link"],
    checklist: ["Obtain API credentials from service provider", "Write integration logic and test cases", "Deploy validation check to production sandbox"],
    createdAt: new Date().toISOString()
  }
];

const executeSimulatedWorkflow = async (
  options: WorkflowOptions
): Promise<{ success: boolean; runId: string; error?: string }> => {
  const companyId = options.companyId || 'soubh-securities';
  const circularId = options.circularId;
  const pdfText = options.pdfText;

  const runId = doc(collection(db, 'workflowRuns')).id;
  const runRef = doc(db, 'workflowRuns', runId);
  const circularDocRef = doc(db, 'circulars', circularId);

  try {
    // 0. Fetch Company details and baseline policies
    const companyDocRef = doc(db, 'companies', companyId);
    const companyDocSnap = await getDoc(companyDocRef);
    if (!companyDocSnap.exists()) {
      throw new Error(`Company profile '${companyId}' not found. Please seed the database first.`);
    }

    const baselineRef = doc(db, 'companies', companyId, 'baseline', 'current');
    const baselineSnap = await getDoc(baselineRef);
    if (!baselineSnap.exists()) {
      throw new Error(`Compliance baseline for '${companyId}' not found. Please seed the database first.`);
    }

    // Create Initial Run State (10%)
    const initialRun: WorkflowRun = {
      runId,
      companyId,
      circularId,
      status: 'uploaded',
      progressPercent: 10,
      currentStep: 'file_received',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agentResults: {}
    };
    await setDoc(runRef, initialRun);
    await delay(500);

    // Get circular title to detect content
    let circularTitle = '';
    const circularDocSnap = await getDoc(circularDocRef);
    if (circularDocSnap.exists()) {
      circularTitle = circularDocSnap.data().title || '';
    }
    const combinedText = (circularTitle + ' ' + circularId + ' ' + pdfText).toLowerCase();
    const isKyc = combinedText.includes('kyc');

    // =========================================================================
    // STEP 1: Document Intelligence Agent (25%)
    // =========================================================================
    await updateDoc(runRef, {
      status: 'parsing',
      progressPercent: 25,
      currentStep: 'parsing',
      updatedAt: new Date().toISOString()
    });

    const docIntelData = isKyc ? getKycDocIntelData(circularId, companyId, pdfText) : getCyberDocIntelData(circularId, companyId, pdfText);
    await setDoc(doc(db, 'documents', circularId), docIntelData);

    // Save intermediate result to run
    await updateDoc(runRef, {
      'agentResults.documentIntelligence': docIntelData,
      updatedAt: new Date().toISOString()
    });

    // Write metadata to circular record
    await updateDoc(circularDocRef, {
      title: docIntelData.title,
      circularNumber: docIntelData.circularNumber,
      issuer: docIntelData.issuer,
      issueDate: docIntelData.issueDate,
      effectiveDate: docIntelData.effectiveDate,
      pageCount: docIntelData.pageCount,
      runId,
      status: 'processing'
    }).catch(async () => {
      // If circular doc doesn't exist yet, create it
      await setDoc(circularDocRef, {
        circularId,
        companyId,
        sourceType: 'manual_upload',
        title: docIntelData.title,
        issuer: docIntelData.issuer,
        circularNumber: docIntelData.circularNumber,
        issueDate: docIntelData.issueDate,
        effectiveDate: docIntelData.effectiveDate,
        status: 'processing',
        storagePath: `companies/${companyId}/circulars/${circularId}/original.pdf`,
        originalFileName: 'uploaded_circular.pdf',
        pageCount: docIntelData.pageCount,
        createdAt: new Date().toISOString(),
        runId
      });
    });

    await delay(500);

    // =========================================================================
    // STEP 2: Compliance Analysis Agent (50%)
    // =========================================================================
    await updateDoc(runRef, {
      status: 'summarizing',
      progressPercent: 50,
      currentStep: 'summarizing',
      updatedAt: new Date().toISOString()
    });

    const parsedObligations = isKyc 
      ? getKycObligations(circularId, companyId) 
      : getCyberObligations(circularId, companyId);

    for (const ob of parsedObligations) {
      await setDoc(doc(db, 'obligations', ob.obligationId), ob);
    }

    const summaryData = isKyc 
      ? getKycSummaryData(circularId, companyId, parsedObligations)
      : getCyberSummaryData(circularId, companyId, parsedObligations);

    await setDoc(doc(db, 'summaries', circularId), summaryData);

    await updateDoc(runRef, {
      'agentResults.complianceAnalysis': summaryData,
      updatedAt: new Date().toISOString()
    });

    await delay(500);

    // =========================================================================
    // STEP 3: Gap Analysis Agent (75%)
    // =========================================================================
    await updateDoc(runRef, {
      status: 'gap_analyzing',
      progressPercent: 75,
      currentStep: 'comparing',
      updatedAt: new Date().toISOString()
    });

    const gapAnalysis = isKyc
      ? getKycGapAnalysis(circularId, companyId)
      : getCyberGapAnalysis(circularId, companyId);

    await setDoc(doc(db, 'gapAnalysis', circularId), gapAnalysis);

    await updateDoc(runRef, {
      'agentResults.gapAnalysis': gapAnalysis,
      updatedAt: new Date().toISOString()
    });

    await delay(500);

    // =========================================================================
    // STEP 4: Task Planning Agent (90%)
    // =========================================================================
    await updateDoc(runRef, {
      status: 'planning_tasks',
      progressPercent: 90,
      currentStep: 'drafting',
      updatedAt: new Date().toISOString()
    });

    const generatedTasks = isKyc
      ? getKycTasks(circularId, companyId, gapAnalysis.gapId)
      : getCyberTasks(circularId, companyId, gapAnalysis.gapId);

    for (const task of generatedTasks) {
      await setDoc(doc(db, 'tasks', task.taskId), task);
    }

    // Update circular metadata with results
    await updateDoc(circularDocRef, {
      status: 'processed',
      processedAt: new Date().toISOString(),
      riskLevel: summaryData.riskLevel,
      departmentsAffected: summaryData.impactedDepartments,
      summaryPreview: summaryData.executiveSummary[0] || ''
    });

    await delay(500);

    // =========================================================================
    // STEP 5: Completed (100%)
    // =========================================================================
    await updateDoc(runRef, {
      status: 'completed',
      progressPercent: 100,
      currentStep: 'completed',
      'agentResults.taskPlanning': { tasks: generatedTasks },
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return { success: true, runId };
  } catch (err: any) {
    console.error('Simulated workflow execution failure:', err);

    await updateDoc(doc(db, 'workflowRuns', runId), {
      status: 'error',
      error: err.message || 'Unknown simulated workflow execution error.',
      updatedAt: new Date().toISOString()
    }).catch(updateErr => {
      console.error('Could not update error state in Firestore:', updateErr);
    });

    return { success: false, runId, error: err.message || 'Unknown simulated workflow error.' };
  }
};

export const executeWorkflow = async (
  options: WorkflowOptions
): Promise<{ success: boolean; runId: string; error?: string }> => {
  const companyId = options.companyId || 'soubh-securities';
  const circularId = options.circularId;
  const pdfText = options.pdfText;

  // Check if Gemini API key is missing
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
  const isGeminiKeyMissing = !API_KEY;

  if (isGeminiKeyMissing) {
    return executeSimulatedWorkflow(options);
  }

  // Generate a unique run ID
  const runId = doc(collection(db, 'workflowRuns')).id;

  try {
    // 0. Fetch Company details and baseline policies
    const companyDocRef = doc(db, 'companies', companyId);
    const companyDocSnap = await getDoc(companyDocRef);
    if (!companyDocSnap.exists()) {
      throw new Error(`Company profile '${companyId}' not found. Please seed the database first.`);
    }
    const companyProfile = companyDocSnap.data() as Company;

    const baselineRef = doc(db, 'companies', companyId, 'baseline', 'current');
    const baselineSnap = await getDoc(baselineRef);
    if (!baselineSnap.exists()) {
      throw new Error(`Compliance baseline for '${companyId}' not found. Please seed the database first.`);
    }
    const baseline = baselineSnap.data() as CompanyBaseline;

    // Create Initial Run State (10%)
    const runRef = doc(db, 'workflowRuns', runId);
    const initialRun: WorkflowRun = {
      runId,
      companyId,
      circularId,
      status: 'uploaded',
      progressPercent: 10,
      currentStep: 'file_received',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agentResults: {}
    };
    await setDoc(runRef, initialRun);

    // =========================================================================
    // STEP 1: Document Intelligence Agent (25%)
    // =========================================================================
    await updateDoc(runRef, {
      status: 'parsing',
      progressPercent: 25,
      currentStep: 'parsing',
      updatedAt: new Date().toISOString()
    });

    const docIntelligenceResponse = await runDocumentIntelligenceAgent(pdfText, circularId, companyId);
    if (docIntelligenceResponse.status === 'error') {
      throw new Error(docIntelligenceResponse.errors?.join(', ') || 'Document Intelligence Agent failed.');
    }

    const documentData: DocumentData = {
      documentId: doc(collection(db, 'documents')).id,
      circularId,
      companyId,
      title: docIntelligenceResponse.data.title || 'Extracted SEBI Circular',
      circularNumber: docIntelligenceResponse.data.circularNumber || 'Unknown',
      issuer: docIntelligenceResponse.data.issuer || 'SEBI',
      issueDate: docIntelligenceResponse.data.issueDate || '',
      effectiveDate: docIntelligenceResponse.data.effectiveDate || '',
      pageCount: docIntelligenceResponse.data.pageCount || 1,
      sections: docIntelligenceResponse.data.sections || [],
      cleanText: docIntelligenceResponse.data.cleanText || pdfText,
      paragraphMap: docIntelligenceResponse.data.paragraphMap || [],
      extractionQuality: docIntelligenceResponse.data.extractionQuality || 0.9,
      createdAt: new Date().toISOString()
    };

    // Save document data
    await setDoc(doc(db, 'documents', circularId), documentData);

    // Save intermediate result to run
    await updateDoc(runRef, {
      'agentResults.documentIntelligence': docIntelligenceResponse.data,
      updatedAt: new Date().toISOString()
    });

    // Write metadata skeleton to circular record
    const circularDocRef = doc(db, 'circulars', circularId);
    await updateDoc(circularDocRef, {
      title: documentData.title,
      circularNumber: documentData.circularNumber,
      issuer: documentData.issuer,
      issueDate: documentData.issueDate,
      effectiveDate: documentData.effectiveDate,
      pageCount: documentData.pageCount,
      runId,
      status: 'processing'
    }).catch(async () => {
      // If circular doc doesn't exist yet (e.g. manual upload), create it
      await setDoc(circularDocRef, {
        circularId,
        companyId,
        sourceType: 'manual_upload',
        title: documentData.title,
        issuer: documentData.issuer,
        circularNumber: documentData.circularNumber,
        issueDate: documentData.issueDate,
        effectiveDate: documentData.effectiveDate,
        status: 'processing',
        storagePath: `companies/${companyId}/circulars/${circularId}/original.pdf`,
        originalFileName: 'uploaded_circular.pdf',
        pageCount: documentData.pageCount,
        createdAt: new Date().toISOString(),
        runId
      });
    });

    // =========================================================================
    // STEP 2: Compliance Analysis Agent (50%)
    // =========================================================================
    await updateDoc(runRef, {
      status: 'summarizing',
      progressPercent: 50,
      currentStep: 'summarizing',
      updatedAt: new Date().toISOString()
    });

    const complianceResponse = await runComplianceAnalysisAgent(documentData, companyProfile);
    if (complianceResponse.status === 'error') {
      throw new Error(complianceResponse.errors?.join(', ') || 'Compliance Analysis Agent failed.');
    }

    // Save Obligations to subcollection/collection
    const parsedObligations: Obligation[] = (complianceResponse.data.obligations || []).map((o: any, idx: number) => {
      const obligationId = `${circularId}_o_${idx + 1}`;
      return {
        obligationId,
        circularId,
        companyId,
        title: o.title || 'Obligation',
        description: o.description || '',
        department: mapToDepartment(o.department),
        priority: mapToRiskLevel(o.priority),
        riskLevel: mapToRiskLevel(o.riskLevel),
        sourcePage: o.sourcePage || 1,
        sourceParagraph: o.sourceParagraph || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
    });

    for (const ob of parsedObligations) {
      await setDoc(doc(db, 'obligations', ob.obligationId), ob);
    }

    const summaryData: SummaryData = {
      summaryId: doc(collection(db, 'summaries')).id,
      circularId,
      companyId,
      executiveSummary: complianceResponse.data.executiveSummary || [],
      keyChanges: (complianceResponse.data.keyChanges || []).map((kc: any) => ({
        changeId: kc.changeId || doc(collection(db, 'summaries')).id,
        type: kc.type || 'new',
        description: kc.description || '',
        riskLevel: mapToRiskLevel(kc.riskLevel),
        sourcePage: kc.sourcePage || 1,
        sourceParagraph: kc.sourceParagraph || ''
      })),
      obligations: parsedObligations,
      highlightMap: (complianceResponse.data.highlightMap || []).map((hm: any) => ({
        sourcePage: hm.sourcePage || 1,
        sourceParagraph: hm.sourceParagraph || '',
        highlightColor: (hm.highlightColor || 'red') as any,
        reason: hm.reason || ''
      })),
      riskLevel: mapToRiskLevel(complianceResponse.data.riskLevel),
      impactedDepartments: (complianceResponse.data.impactedDepartments || []).map(mapToDepartment),
      createdAt: new Date().toISOString()
    };

    // Save summary data
    await setDoc(doc(db, 'summaries', circularId), summaryData);

    // Save intermediate result to run
    await updateDoc(runRef, {
      'agentResults.complianceAnalysis': complianceResponse.data,
      updatedAt: new Date().toISOString()
    });

    // =========================================================================
    // STEP 3: Gap Analysis Agent (75%)
    // =========================================================================
    await updateDoc(runRef, {
      status: 'gap_analyzing',
      progressPercent: 75,
      currentStep: 'comparing',
      updatedAt: new Date().toISOString()
    });

    const gapResponse = await runGapAnalysisAgent(parsedObligations, baseline);
    if (gapResponse.status === 'error') {
      throw new Error(gapResponse.errors?.join(', ') || 'Gap Analysis Agent failed.');
    }

    const gapAnalysis: GapAnalysis = {
      gapId: doc(collection(db, 'gapAnalysis')).id,
      circularId,
      companyId,
      alreadyCompliant: gapResponse.data.alreadyCompliant || [],
      modifiedRequirements: gapResponse.data.modifiedRequirements || [],
      newRequirements: gapResponse.data.newRequirements || [],
      missingEvidence: gapResponse.data.missingEvidence || [],
      manualReviewItems: gapResponse.data.manualReviewItems || [],
      riskSummary: {
        overallRiskLevel: mapToRiskLevel(gapResponse.data.riskSummary?.overallRiskLevel),
        gapScore: gapResponse.data.gapScore || gapResponse.data.riskSummary?.gapScore || 0,
        impactNotes: gapResponse.data.riskSummary?.impactNotes || []
      },
      gapScore: gapResponse.data.gapScore || gapResponse.data.riskSummary?.gapScore || 0,
      createdAt: new Date().toISOString()
    };

    // Save gap analysis
    await setDoc(doc(db, 'gapAnalysis', circularId), gapAnalysis);

    // Save intermediate result to run
    await updateDoc(runRef, {
      'agentResults.gapAnalysis': gapResponse.data,
      updatedAt: new Date().toISOString()
    });

    // =========================================================================
    // STEP 4: Task Planning Agent (90%)
    // =========================================================================
    await updateDoc(runRef, {
      status: 'planning_tasks',
      progressPercent: 90,
      currentStep: 'drafting',
      updatedAt: new Date().toISOString()
    });

    const taskPlanningResponse = await runTaskPlanningAgent(gapAnalysis, companyProfile.departments);
    if (taskPlanningResponse.status === 'error') {
      throw new Error(taskPlanningResponse.errors?.join(', ') || 'Task Planning Agent failed.');
    }

    // Save generated tasks
    const generatedTasks: Task[] = (taskPlanningResponse.data.tasks || []).map((t: any, idx: number) => {
      const taskId = `${circularId}_task_${idx + 1}`;
      return {
        taskId,
        companyId,
        circularId,
        gapId: gapAnalysis.gapId,
        title: t.title || 'Compliance Action Task',
        description: t.description || '',
        department: mapToDepartment(t.department),
        ownerRole: t.ownerRole || 'Department Head',
        priority: mapToRiskLevel(t.priority),
        status: 'pending',
        dueDate: t.dueDateSuggestion || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        linkedReferenceId: t.linkedReferenceId || '',
        evidenceRequired: t.evidenceRequired || [],
        checklist: t.checklist || [],
        createdAt: new Date().toISOString()
      };
    });

    for (const task of generatedTasks) {
      await setDoc(doc(db, 'tasks', task.taskId), task);
    }

    // Update circular metadata with results
    await updateDoc(circularDocRef, {
      status: 'processed',
      processedAt: new Date().toISOString(),
      riskLevel: summaryData.riskLevel,
      departmentsAffected: summaryData.impactedDepartments,
      summaryPreview: summaryData.executiveSummary[0] || ''
    });

    // Save intermediate result to run & complete (100%)
    await updateDoc(runRef, {
      status: 'completed',
      progressPercent: 100,
      currentStep: 'completed',
      'agentResults.taskPlanning': taskPlanningResponse.data,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return { success: true, runId };
  } catch (err: any) {
    console.error('Workflow Manager execution failure:', err);

    // Update run with error status
    await updateDoc(doc(db, 'workflowRuns', runId), {
      status: 'error',
      error: err.message || 'Unknown workflow execution error.',
      updatedAt: new Date().toISOString()
    }).catch(updateErr => {
      console.error('Could not update error state in Firestore:', updateErr);
    });

    return { success: false, runId, error: err.message || 'Unknown workflow error.' };
  }
};

export const seedCompanyBaselinePreset = async (
  presetType: 'stockbroker' | 'mutual_fund_amc' | 'investment_advisor'
): Promise<{ success: boolean; message: string }> => {
  try {
    const companyId = 'soubh-securities';
    const batch = writeBatch(db);

    const companyRef = doc(db, 'companies', companyId);
    const baselineRef = doc(db, 'companies', companyId, 'baseline', 'current');

    let companyData: Company;
    let baselineData: CompanyBaseline;

    if (presetType === 'stockbroker') {
      companyData = {
        companyId,
        name: 'SOUBH Securities Pvt. Ltd.',
        industry: 'Stock Broker',
        type: 'Stockbroker',
        demoMode: true,
        baselineVersion: 'v1.0.0',
        departments: ['Compliance', 'Operations', 'IT', 'Support'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: 'SOUBH Securities Pvt. Ltd. is a fictional mid-sized retail stock broker that provides digital trading, demat, and investment services to Indian retail investors while operating under a structured compliance and control environment.'
      };

      baselineData = {
        baselineId: 'baseline_stockbroker',
        version: 'v1.0.0',
        referenceCorpus: 'SEBI Stock Broker Regulations 1992, PMLA 2002, and subsequent cyber/operational directives.',
        policySummary: 'Primary operational policies include KYC Compliance, Cybersecurity, Client Asset Safeguards, and Investor Grievance Handling.',
        existingObligationsCount: 14,
        compliantCount: 12,
        pendingCount: 2,
        missingEvidenceCount: 1,
        baselineNotes: 'Stockbroker baseline compiled for FY 2026-27. Last reviewed June 2026.',
        sourceDocuments: ['SEBI_Broker_Regs_1992.pdf', 'PMLA_Guidelines_2002.pdf'],
        activePolicies: [
          {
            policyId: 'pol_cybersec',
            title: 'Cybersecurity and Information Security Policy',
            description: 'Guidelines for encryption, access controls, periodic audits, vulnerability assessments, and incident response for client and transactional databases.',
            department: 'IT',
            lastUpdated: '2026-01-15'
          },
          {
            policyId: 'pol_kyc',
            title: 'Client Onboarding and Prevention of Money Laundering (PMLA) Policy',
            description: 'Standard operating procedures for verification of client identity, PAN-Aadhaar verification, financial status, and demat account activation checks.',
            department: 'Operations',
            lastUpdated: '2025-11-20'
          },
          {
            policyId: 'pol_grievance',
            title: 'Investor Grievance Handling and Redressal Policy',
            description: 'Process for capturing, investigating, and resolving client complaints within SEBI-mandated timelines.',
            department: 'Support',
            lastUpdated: '2026-03-01'
          },
          {
            policyId: 'pol_ops_risk',
            title: 'Brokerage Operations and Risk Management Controls',
            description: 'Rules for order limits, margin validation, trading terminal access, and clearing house reconciliations.',
            department: 'Operations',
            lastUpdated: '2025-09-10'
          }
        ]
      };
    } else if (presetType === 'mutual_fund_amc') {
      companyData = {
        companyId,
        name: 'SOUBH Asset Management Co.',
        industry: 'Mutual Fund',
        type: 'Mutual Fund AMC',
        demoMode: true,
        baselineVersion: 'v1.0.0',
        departments: ['Compliance', 'Operations', 'IT', 'Support'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: 'SOUBH Mutual Fund AMC is a fictional asset management company managing domestic and international mutual fund schemes, operating under SEBI Mutual Fund Regulations 1996.'
      };

      baselineData = {
        baselineId: 'baseline_mf_amc',
        version: 'v1.0.0',
        referenceCorpus: 'SEBI (Mutual Funds) Regulations, 1996, and subsequent cyber/operational directives for AMCs.',
        policySummary: 'Primary operational policies include Fund Accounting, Portfolio Risk Limits, Distributor Due Diligence, and KYC compliance.',
        existingObligationsCount: 18,
        compliantCount: 15,
        pendingCount: 3,
        missingEvidenceCount: 2,
        baselineNotes: 'Mutual Fund AMC baseline compiled for FY 2026-27. Last reviewed June 2026.',
        sourceDocuments: ['SEBI_MF_Regs_1996.pdf', 'AMC_Cybersec_Guidelines.pdf'],
        activePolicies: [
          {
            policyId: 'pol_cybersec',
            title: 'AMC Cybersecurity and Information Security Policy',
            description: 'Guidelines for security of transaction portals, asset management systems, and valuation databases.',
            department: 'IT',
            lastUpdated: '2026-01-15'
          },
          {
            policyId: 'pol_kyc',
            title: 'PMLA and Investor KYC Policy',
            description: 'Verification of investor bank details, PEP status, KYC records, and FATCA compliance.',
            department: 'Operations',
            lastUpdated: '2025-11-20'
          },
          {
            policyId: 'pol_distributor',
            title: 'Mutual Fund Distributor Due Diligence Policy',
            description: 'Periodic review of empanelled distributors, compliance with commission caps, and distributor code of conduct.',
            department: 'Compliance',
            lastUpdated: '2026-03-01'
          },
          {
            policyId: 'pol_portfolio',
            title: 'Portfolio Risk and Liquidity Management Controls',
            description: 'Scheme allocation limits, stress testing, liquidity risk management, and valuation policies.',
            department: 'Operations',
            lastUpdated: '2025-09-10'
          }
        ]
      };
    } else {
      // investment_advisor
      companyData = {
        companyId,
        name: 'SOUBH Investment Advisory Services',
        industry: 'Investment Advisory',
        type: 'Investment Advisor',
        demoMode: true,
        baselineVersion: 'v1.0.0',
        departments: ['Compliance', 'Operations', 'IT', 'Support'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: 'SOUBH Investment Advisory Services is a fictional SEBI-registered Investment Advisor providing fee-only financial planning and investment advisory services.'
      };

      baselineData = {
        baselineId: 'baseline_ia',
        version: 'v1.0.0',
        referenceCorpus: 'SEBI (Investment Advisers) Regulations, 2013, and subsequent circulars regarding client risk profiling and suitability.',
        policySummary: 'Primary operational policies include Suitability Assessment, Client Agreement, Conflict of Interest, and Client Records Management.',
        existingObligationsCount: 10,
        compliantCount: 8,
        pendingCount: 2,
        missingEvidenceCount: 1,
        baselineNotes: 'Investment Advisor baseline compiled for FY 2026-27. Last reviewed June 2026.',
        sourceDocuments: ['SEBI_IA_Regs_2013.pdf'],
        activePolicies: [
          {
            policyId: 'pol_cybersec',
            title: 'Advisory Portal Security and Client Data Privacy Policy',
            description: 'Encryption of client risk profiles, financial planning databases, and confidentiality of advice.',
            department: 'IT',
            lastUpdated: '2026-01-15'
          },
          {
            policyId: 'pol_suitability',
            title: 'Client Suitability Assessment and Risk Profiling Policy',
            description: 'Questionnaires and scoring models to ensure advisory suitability before dispensing advice.',
            department: 'Compliance',
            lastUpdated: '2025-11-20'
          },
          {
            policyId: 'pol_disclosure',
            title: 'Conflict of Interest Disclosures and Advisory Fee Policy',
            description: 'Transparency in fee structures, disclosure of direct scheme options, and prevention of commission-based advice.',
            department: 'Compliance',
            lastUpdated: '2026-03-01'
          },
          {
            policyId: 'pol_records',
            title: 'Advisory Records Maintenance and Client Communication Policy',
            description: 'Archiving all advice and client communications for at least 5 years.',
            department: 'Operations',
            lastUpdated: '2025-09-10'
          }
        ]
      };
    }

    batch.set(companyRef, companyData);
    batch.set(baselineRef, baselineData);
    await batch.commit();

    return { success: true, message: `Baseline seeded successfully for ${companyData.name} (${companyData.type} Preset).` };
  } catch (error: any) {
    console.error('Error seeding company baseline preset:', error);
    return { success: false, message: error.message || 'Unknown error occurred during seeding.' };
  }
};
