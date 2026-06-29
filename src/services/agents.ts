import { DocumentData, SummaryData, GapAnalysis, Task, Company, CompanyBaseline, Obligation } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Common Gemini caller
async function callGemini(
  model: 'gemini-2.5-flash',
  systemInstruction: string,
  prompt: string
): Promise<any> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
  
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        { text: systemInstruction }
      ]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API returned error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response candidate.');
  }

  try {
    return JSON.parse(text.trim());
  } catch (err) {
    // Attempt parsing by stripping markdown block wrappers
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleanText);
    } catch (secondErr) {
      console.error('Failed to parse JSON response from Gemini:', text);
      throw new Error(`Invalid JSON format in Gemini response: ${(secondErr as any).message}`);
    }
  }
}

// ==========================================
// 1. Document Intelligence Agent
// ==========================================
export async function runDocumentIntelligenceAgent(
  pdfText: string,
  circularId: string,
  companyId: string
): Promise<{
  status: 'success' | 'partial_success' | 'needs_review' | 'error';
  agent: string;
  step: string;
  data: Omit<DocumentData, 'documentId' | 'circularId' | 'companyId' | 'createdAt'>;
  warnings?: string[];
  errors?: string[];
}> {
  const systemInstruction = `
You are the Document Intelligence Agent for RICE (Regulatory Intelligence & Compliance Engine).
Your job is to read the raw text of a newly uploaded SEBI (Securities and Exchange Board of India) circular and convert it into structured document data.
You must output a strict JSON response. Do not add any conversational text before or after the JSON.

Expected Output JSON structure:
{
  "status": "success",
  "agent": "document_intelligence",
  "step": "pdf_extraction",
  "data": {
    "title": "string (the official title of the circular)",
    "circularNumber": "string (the official circular number, e.g., SEBI/HO/MRD/...) or 'Unknown' if not found",
    "issuer": "SEBI",
    "issueDate": "string (YYYY-MM-DD format if found, otherwise raw string)",
    "effectiveDate": "string (effective date of regulation, or YYYY-MM-DD or raw string)",
    "pageCount": 1,
    "sections": [
      {
        "sectionId": "s1",
        "heading": "string (heading or section title)",
        "page": 1,
        "text": "string (full text of this section)"
      }
    ],
    "cleanText": "string (fully cleaned, consolidated text of the circular)",
    "paragraphMap": [
      {
        "paragraphId": "p1",
        "page": 1,
        "text": "string (the exact text of this paragraph)"
      }
    ],
    "extractionQuality": 0.95
  },
  "warnings": [],
  "errors": []
}

Rules:
1. Parse the provided circular text and identify headings/sections. Assign sequential section IDs like 's1', 's2', etc.
2. Break the document into logical paragraphs, mapping each paragraph to a paragraphId (e.g. 'p1', 'p2', etc.) and identifying the page it belongs to.
3. If page boundaries are not clear in the raw text, estimate page numbers logically or assume page 1.
4. Set extractionQuality as a float between 0.0 and 1.0 (estimate how well the text is structured, e.g., 0.95).
`;

  const prompt = `
Please analyze the following raw text from a SEBI circular. Structure it, extract metadata, create the section list, and break it down paragraph by paragraph.

Circular Raw Text:
---
${pdfText}
---
`;

  return await callGemini('gemini-2.5-flash', systemInstruction, prompt);
}

// ==========================================
// 2. Compliance Analysis Agent
// ==========================================
export async function runComplianceAnalysisAgent(
  documentData: DocumentData,
  companyProfile?: Company
): Promise<{
  status: 'success' | 'partial_success' | 'needs_review' | 'error';
  agent: string;
  step: string;
  data: Omit<SummaryData, 'summaryId' | 'circularId' | 'companyId' | 'createdAt'>;
  warnings?: string[];
  errors?: string[];
}> {
  const systemInstruction = `
You are the Compliance Analysis Agent for RICE.
Your task is to review the structured document data of a SEBI circular and generate a human-readable compliance summary, list of key changes, and distinct compliance obligations.
You must output a strict JSON response. Do not add any conversational text.

Expected Output JSON structure:
{
  "status": "success",
  "agent": "compliance_analysis",
  "step": "summary_and_obligations",
  "data": {
    "executiveSummary": [
      "string (concise summary points explaining the circular purpose and main requirements)"
    ],
    "keyChanges": [
      {
        "changeId": "c1",
        "type": "new|modified|removed",
        "description": "string (explanation of the change)",
        "riskLevel": "low|medium|high|critical",
        "sourcePage": 1,
        "sourceParagraph": "string (the paragraphId from documentData, e.g., 'p3')"
      }
    ],
    "obligations": [
      {
        "obligationId": "o1",
        "title": "string (short, active title of the obligation)",
        "description": "string (detailed description of what is required)",
        "department": "Compliance|IT|Operations|Support|Other",
        "priority": "low|medium|high|critical",
        "riskLevel": "low|medium|high|critical",
        "sourcePage": 1,
        "sourceParagraph": "string (the paragraphId, e.g. 'p4')"
      }
    ],
    "highlightMap": [
      {
        "sourcePage": 1,
        "sourceParagraph": "string (paragraphId reference, e.g. 'p4')",
        "highlightColor": "green|yellow|red|blue",
        "reason": "string (why this paragraph is highlighted)"
      }
    ],
    "riskLevel": "low|medium|high|critical",
    "impactedDepartments": ["Compliance", "Operations", "IT", "Support"]
  },
  "warnings": [],
  "errors": []
}

Rules:
1. Executive Summary: Provide 2-4 bullet points summarizing the regulation.
2. Key Changes: Detail what has been introduced, changed, or deleted. Link to sourcePage and sourceParagraph (must match a paragraphId from the inputs).
3. Obligations: Extract actionable rules that the stock broker MUST follow. Assign each obligation to exactly one department (Compliance, Operations, IT, Support, or Other) based on which department owns the operation. Link to sourcePage and sourceParagraph.
4. Highlight Map: Choose which paragraphs should be highlighted in the UI viewer.
   - red: New obligation or critical risk.
   - yellow: Modified obligation or medium risk.
   - green: Existing/already compliant obligation or low risk.
   - blue: Clarifications or details about proof/evidence expected.
5. Risk Level: Set the overall severity of this circular (low, medium, high, critical).
`;

  const prompt = `
Please analyze the following structured document data for the SEBI circular titled "${documentData.title}".
Identify executive summaries, key changes, actionable obligations, and highlight map items.

Document Data:
${JSON.stringify({
  title: documentData.title,
  circularNumber: documentData.circularNumber,
  issuer: documentData.issuer,
  sections: documentData.sections,
  paragraphMap: documentData.paragraphMap
}, null, 2)}

Company Context (If available):
${companyProfile ? JSON.stringify(companyProfile, null, 2) : 'Mid-sized retail stock broker.'}
`;

  return await callGemini('gemini-2.5-flash', systemInstruction, prompt);
}

// ==========================================
// 3. Gap Analysis Agent
// ==========================================
export async function runGapAnalysisAgent(
  obligations: Obligation[],
  baseline: CompanyBaseline
): Promise<{
  status: 'success' | 'partial_success' | 'needs_review' | 'error';
  agent: string;
  step: string;
  data: Omit<GapAnalysis, 'gapId' | 'circularId' | 'companyId' | 'createdAt'>;
  warnings?: string[];
  errors?: string[];
}> {
  const systemInstruction = `
You are the Gap Analysis Agent for RICE.
Your task is to compare the new extracted obligations from a SEBI circular against the company's existing compliance baseline (its active policies).
You must output a strict JSON response. Do not add any conversational text.

Expected Output JSON structure:
{
  "status": "success",
  "agent": "gap_analysis",
  "step": "baseline_compare",
  "data": {
    "alreadyCompliant": [
      {
        "referenceId": "a1",
        "title": "string (the obligation title)",
        "reason": "string (why the company is already compliant based on their active policies)",
        "sourcePage": 1
      }
    ],
    "modifiedRequirements": [
      {
        "referenceId": "m1",
        "title": "string (the obligation title)",
        "baselineMatch": "string (the active policy that matches)",
        "difference": "string (what has changed or what additional action is required)",
        "severity": "medium|high|critical",
        "sourcePage": 1
      }
    ],
    "newRequirements": [
      {
        "referenceId": "n1",
        "title": "string (the obligation title)",
        "reason": "string (why this is a brand new requirement not covered by any active policy)",
        "severity": "medium|high|critical",
        "sourcePage": 1
      }
    ],
    "missingEvidence": [
      {
        "referenceId": "e1",
        "title": "string (the obligation or audit requirement title)",
        "expectedEvidence": [
          "string (specific documents, screenshots, logs, or approvals required as proof)"
        ],
        "reason": "string (why evidence is needed to prove compliance)",
        "severity": "medium|high|critical"
      }
    ],
    "manualReviewItems": [
      {
        "referenceId": "r1",
        "title": "string (the obligation title)",
        "reason": "string (why the agent is unsure and requires a compliance officer to review manually)"
      }
    ],
    "riskSummary": {
      "overallRiskLevel": "low|medium|high|critical",
      "gapScore": 45,
      "impactNotes": [
        "string (notable impacts on business processes, systems, or resources)"
      ]
    },
    "gapScore": 45
  },
  "warnings": [],
  "errors": []
}

Rules:
1. Compare each obligation in the input list with the company's active policies.
2. Group the obligations into:
   - alreadyCompliant: If the obligation is fully covered by an existing policy.
   - modifiedRequirements: If an existing policy covers it partially, but the regulation introduces an update or twist.
   - newRequirements: If there is no coverage in the current baseline.
   - missingEvidence: For obligations that mandate audits, reports, or records that the broker must maintain as evidence.
   - manualReviewItems: If you cannot reliably map or decide compliance status.
3. Compute a gapScore (number from 0 to 100):
   - 0: Fully compliant, no gaps.
   - 100: Absolute gap, everything is new/critical and no matching policies.
   - Calculate it based on weight: each new requirement adds 15-20 points, modified adds 8-10 points, missing evidence adds 5 points, up to a max of 100.
4. referenceId should be prefixed with 'a' for alreadyCompliant, 'm' for modified, 'n' for new, 'e' for missingEvidence, and 'r' for manual review. e.g., 'a1', 'a2', 'm1', etc. Make sure these are unique.
`;

  const prompt = `
Please compare the following compliance obligations against the company's compliance baseline policies.

Compliance Obligations:
${JSON.stringify(obligations, null, 2)}

Company Baseline Policies:
${JSON.stringify(baseline.activePolicies, null, 2)}
`;

  return await callGemini('gemini-2.5-flash', systemInstruction, prompt);
}

// ==========================================
// 4. Task Planning Agent
// ==========================================
export async function runTaskPlanningAgent(
  gapAnalysis: GapAnalysis,
  departments: string[]
): Promise<{
  status: 'success' | 'partial_success' | 'needs_review' | 'error';
  agent: string;
  step: string;
  data: {
    tasks: Omit<Task, 'taskId' | 'companyId' | 'circularId' | 'gapId' | 'createdAt'>[];
    taskSummary: {
      totalTasks: number;
      highPriorityTasks: number;
      criticalTasks: number;
    };
  };
  warnings?: string[];
  errors?: string[];
}> {
  const systemInstruction = `
You are the Task Planning Agent for RICE.
Your task is to take the output of a Gap Analysis (new requirements, modified requirements, missing evidence) and convert them into clear, actionable operational tasks.
You must output a strict JSON response. Do not add any conversational text.

Expected Output JSON structure:
{
  "status": "success",
  "agent": "task_planning",
  "step": "task_generation",
  "data": {
    "tasks": [
      {
        "title": "string (clear, action-oriented title, starting with a verb like Update, Implement, Review...)",
        "description": "string (detailed instruction of what needs to be done)",
        "department": "IT|Compliance|Operations|Support|Other",
        "ownerRole": "string (suggested owner role, e.g. Compliance Officer, IT Security Admin, operations Head)",
        "priority": "low|medium|high|critical",
        "status": "pending",
        "dueDateSuggestion": "string (suggested ISO date format YYYY-MM-DD or days offset explanation, e.g., '2026-07-15')",
        "linkedReferenceId": "string (the referenceId from gapAnalysis, e.g. 'n1', 'm1', or 'e1')",
        "evidenceRequired": [
          "string (specific file, report, screenshot, or signoff expected as proof of completion)"
        ],
        "checklist": [
          "string (step-by-step actions to complete this task)"
        ]
      }
    ],
    "taskSummary": {
      "totalTasks": 0,
      "highPriorityTasks": 0,
      "criticalTasks": 0
    }
  },
  "warnings": [],
  "errors": []
}

Rules:
1. Generate tasks ONLY for requirements that are new, modified, or have missing evidence. Do not create tasks for alreadyCompliant items.
2. Ensure each task has a clear title starting with an action verb (e.g. 'Update Cybersecurity Audit Policy').
3. Map the task to one of the available departments: Compliance, Operations, IT, Support, or Other.
4. Set realistic priority (low, medium, high, critical) mirroring the severity in the gap analysis.
5. Provide a checklist of 2-5 concrete, actionable steps required to finish the task.
6. List the evidence files the department owner must upload to complete the task (e.g., 'Copy of updated policy with board approval signature').
7. Suggest a reasonable dueDateSuggestion (e.g., in YYYY-MM-DD format, set it 15 to 30 days in the future relative to 2026-06-29).
`;

  const prompt = `
Please generate operational tasks based on this Gap Analysis data.

Gap Analysis Data:
${JSON.stringify({
  modifiedRequirements: gapAnalysis.modifiedRequirements,
  newRequirements: gapAnalysis.newRequirements,
  missingEvidence: gapAnalysis.missingEvidence,
  manualReviewItems: gapAnalysis.manualReviewItems
}, null, 2)}

Company Departments:
${JSON.stringify(departments)}
`;

  return await callGemini('gemini-2.5-flash', systemInstruction, prompt);
}
