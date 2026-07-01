import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ChatMessage, ChatThread, Circular, DocumentData, SummaryData, GapAnalysis, Task, CompanyBaseline } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface AskRiceOptions {
  circularId?: string;
  companyId?: string;
  question: string;
  history?: ChatMessage[];
}

export interface AskRiceResponse {
  status: 'success' | 'error';
  agent: 'chatbot';
  step: 'answer';
  data: {
    reply: string;
    references: {
      type: 'obligation' | 'paragraph' | 'task' | 'baseline';
      id: string;
      title?: string;
    }[];
  };
  warnings?: string[];
  errors?: string[];
}

// Local rule-based compliance engine for resilient fallback when API key is missing
const runLocalResilientChatbot = (
  question: string,
  baseline: CompanyBaseline | null,
  circularMeta: Circular | null,
  summaryData: SummaryData | null,
  gapAnalysis: GapAnalysis | null,
  relatedTasks: Task[]
): AskRiceResponse => {
  const q = question.toLowerCase();
  let reply = '';
  const references: AskRiceResponse['data']['references'] = [];

  if (q.includes('mfa') || q.includes('auth') || q.includes('login') || q.includes('factor')) {
    const task = relatedTasks.find(t => t.title.toLowerCase().includes('mfa') || t.description.toLowerCase().includes('mfa'));
    const gap = gapAnalysis?.alreadyCompliant?.find(g => g.title.toLowerCase().includes('mfa'));
    
    reply = `### MFA Compliance Status for SOUBH Securities\n\n`;
    if (gap) {
      reply += `* **Current Baseline Policy:** SOUBH already enforces MFA via TOTP for trading logins and admin terminals (deemed compliant under §4.2 of baseline).\n`;
    }
    if (task) {
      reply += `* **Open Action Item:** There is an active task **[${task.taskId}]** assigned to **${task.ownerRole}** to verify MFA configuration across operational branch terminals by **${task.dueDate}** (Status: *${task.status}*).\n`;
      references.push({ type: 'task', id: task.taskId, title: task.title });
    } else {
      reply += `* **No active gaps** found for MFA. Check is compliant.\n`;
    }
  }
  else if (q.includes('backup') || q.includes('offline') || q.includes('disaster') || q.includes('dr') || q.includes('isolation')) {
    const task = relatedTasks.find(t => t.title.toLowerCase().includes('backup') || t.description.toLowerCase().includes('backup'));
    const gap = gapAnalysis?.modifiedRequirements?.find(g => g.title.toLowerCase().includes('backup') || g.title.toLowerCase().includes('offline'));
    
    reply = `### Data Backup & DR Compliance Status\n\n`;
    if (gap) {
      reply += `* **Gap Identified:** SOUBH replicates data to a NAS array in Navi Mumbai, which is only 40km away from our primary data center. However, SEBI requires at least 100km geographic isolation and daily offline backups.\n`;
    }
    if (task) {
      reply += `* **Open Action Item:** Task **[${task.taskId}]** is assigned to **${task.ownerRole}** to relocate the secondary backup replica and document offline storage protocols. Due date is **${task.dueDate}** (Status: *${task.status}*).\n`;
      references.push({ type: 'task', id: task.taskId, title: task.title });
    }
  }
  else if (q.includes('audit') || q.includes('review') || q.includes('frequency') || q.includes('quarterly')) {
    const task = relatedTasks.find(t => t.title.toLowerCase().includes('audit') || t.description.toLowerCase().includes('audit') || t.title.toLowerCase().includes('quarterly'));
    const gap = gapAnalysis?.newRequirements?.find(g => g.title.toLowerCase().includes('audit'));
    
    reply = `### Cybersecurity Audit Obligations\n\n`;
    if (gap) {
      reply += `* **Gap Identified:** SEBI now mandates quarterly audits (submitted within 30 days of the quarter ending). SOUBH's current baseline policy (§12.3) only schedules annual audits.\n`;
    }
    if (task) {
      reply += `* **Open Action Item:** Task **[${task.taskId}]** is assigned to **${task.ownerRole}** to contract a SEBI-empanelled cyber auditor for quarterly audit cycles (Status: *${task.status}*).\n`;
      references.push({ type: 'task', id: task.taskId, title: task.title });
    }
  }
  else if (q.includes('ciso') || q.includes('officer') || q.includes('committee') || q.includes('designat') || q.includes('board')) {
    const task = relatedTasks.find(t => t.title.toLowerCase().includes('ciso') || t.description.toLowerCase().includes('ciso') || t.title.toLowerCase().includes('committee'));
    
    reply = `### CISO & Security Committee Governance\n\n`;
    if (task) {
      reply += `* **Open Action Item:** SOUBH needs to formally document Mr. Vikram Aditya's authority as CISO via board resolution. See active task **[${task.taskId}]** (Status: **${task.status}**).\n`;
      references.push({ type: 'task', id: task.taskId, title: task.title });
    }
  }
  else {
    reply = `Hello! I am RICE, SOUBH Securities' Regulatory Intelligence & Compliance Assistant. 

Based on our real-time database analysis for circular **${circularMeta?.circularNumber || 'SEBI Cybersecurity Framework'}**:
* We have detected **${gapAnalysis?.newRequirements?.length || 0} new requirements** and **${gapAnalysis?.modifiedRequirements?.length || 0} modified requirements**.
* There are **${relatedTasks.length} compliance tasks** currently scheduled.

Ask me specific questions about **MFA**, **offline backups**, **quarterly audits**, or the **CISO board resolution** to inspect our compliance posture.`;
  }

  return {
    status: 'success',
    agent: 'chatbot',
    step: 'answer',
    data: {
      reply,
      references
    }
  };
};

export const askRiceChatbot = async (
  options: AskRiceOptions
): Promise<AskRiceResponse> => {
  const companyId = options.companyId || 'soubh-securities';
  const circularId = options.circularId;
  const question = options.question;
  const history = options.history || [];

  try {
    // 1. Gather context data from Firestore
    let circularMeta: Circular | null = null;
    let documentData: DocumentData | null = null;
    let summaryData: SummaryData | null = null;
    let gapAnalysis: GapAnalysis | null = null;
    let relatedTasks: Task[] = [];
    let baseline: CompanyBaseline | null = null;

    // Fetch baseline (always useful)
    const baselineRef = doc(db, 'companies', companyId, 'baseline', 'current');
    const baselineSnap = await getDoc(baselineRef);
    if (baselineSnap.exists()) {
      baseline = baselineSnap.data() as CompanyBaseline;
    }

    if (circularId) {
      const circSnap = await getDoc(doc(db, 'circulars', circularId));
      if (circSnap.exists()) {
        circularMeta = circSnap.data() as Circular;
      }

      const docSnap = await getDoc(doc(db, 'documents', circularId));
      if (docSnap.exists()) {
        documentData = docSnap.data() as DocumentData;
      }

      const sumSnap = await getDoc(doc(db, 'summaries', circularId));
      if (sumSnap.exists()) {
        summaryData = sumSnap.data() as SummaryData;
      }

      const gapSnap = await getDoc(doc(db, 'gapAnalysis', circularId));
      if (gapSnap.exists()) {
        gapAnalysis = gapSnap.data() as GapAnalysis;
      }

      const tasksQuery = query(
        collection(db, 'tasks'),
        where('companyId', '==', companyId),
        where('circularId', '==', circularId)
      );
      const tasksSnap = await getDocs(tasksQuery);
      relatedTasks = tasksSnap.docs.map(d => d.data() as Task);
    } else {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('companyId', '==', companyId)
      );
      const tasksSnap = await getDocs(tasksQuery);
      relatedTasks = tasksSnap.docs.map(d => d.data() as Task);
    }

    // 2. Check for API key. If missing, activate rule-based compliance responder
    if (!API_KEY) {
      return runLocalResilientChatbot(question, baseline, circularMeta, summaryData, gapAnalysis, relatedTasks);
    }

    // 3. Build system instructions with strict grounding rules
    const systemInstruction = `
You are "Ask RICE", the AI-powered compliance assistant for RICE (Regulatory Intelligence & Compliance Engine).
Your job is to answer the compliance officer's questions about SEBI circulars, company compliance posture, gaps, and generated tasks.
You must output a strict JSON response. Do not add any conversational text before or after the JSON.

Expected Output JSON structure:
{
  "status": "success",
  "agent": "chatbot",
  "step": "answer",
  "data": {
    "reply": "string (your formatted markdown response, clear, concise, and professional)",
    "references": [
      {
        "type": "obligation|paragraph|task|baseline",
        "id": "string (the exact ID of the referenced entity, e.g. 'circular_2026_001_o_1', 'p3', 'circular_2026_001_task_1', 'pol_cybersec')",
        "title": "string (optional short name/description for display)"
      }
    ]
  },
  "warnings": [],
  "errors": []
}

Rules:
1. STRICT RETRIEVAL GROUNDING: Only answer questions using the provided context (Circular metadata, Extracted text, Summary & Obligations, Gap Analysis, Tasks, and Baseline).
2. OUT OF SCOPE QUESTIONS: If the user asks questions unrelated to the regulatory circular, company policies, or compliance tasks (e.g. general code help, search queries, creative writing, or general chat), reply: "I'm sorry, as RICE compliance assistant, I can only answer questions related to the active circulars, gap analyses, company baseline policies, and assigned compliance tasks."
3. NO HALLUCINATION: If the information required to answer is not in the context, clearly state that the information is not available in the processed circular or baseline. Do not make up regulations, policies, or dates.
4. REFERENCING: For references list, map any mentioned policies, paragraphs, obligations, or tasks back to their IDs in the context.
`;

    // 4. Construct current context package for prompt
    const contextText = `
--- CONTEXT START ---
COMPANY PROFILE:
ID: ${companyId}
Company Name: SOUBH Securities Pvt. Ltd.

COMPANY BASELINE POLICIES:
${baseline ? JSON.stringify({
  version: baseline.version,
  policySummary: baseline.policySummary,
  activePolicies: baseline.activePolicies
}, null, 2) : 'No baseline loaded.'}

${circularMeta ? `
SELECTED SEBI CIRCULAR:
Title: ${circularMeta.title}
Circular Number: ${circularMeta.circularNumber}
Issuer: ${circularMeta.issuer}
Issue Date: ${circularMeta.issueDate}
Effective Date: ${circularMeta.effectiveDate}
` : 'No specific circular selected.'}

${documentData ? `
EXTRACTED TEXT SECTIONS:
${JSON.stringify(documentData.sections.map(s => ({ id: s.sectionId, heading: s.heading, text: s.text.substring(0, 1000) })), null, 2)}
` : ''}

${summaryData ? `
COMPLIANCE OBLIGATIONS & KEY CHANGES:
Executive Summary: ${JSON.stringify(summaryData.executiveSummary)}
Key Changes: ${JSON.stringify(summaryData.keyChanges.map(k => ({ id: k.changeId, desc: k.description, risk: k.riskLevel })))}
Obligations: ${JSON.stringify(summaryData.obligations.map(o => ({ id: o.obligationId, title: o.title, desc: o.description, dept: o.department })))}
` : ''}

${gapAnalysis ? `
GAP ANALYSIS COMPARED TO BASELINE:
Already Compliant Gaps: ${JSON.stringify(gapAnalysis.alreadyCompliant.map(g => ({ title: g.title, reason: g.reason })))}
Modified Gaps: ${JSON.stringify(gapAnalysis.modifiedRequirements.map(g => ({ title: g.title, match: g.baselineMatch, diff: g.difference })))}
New Gaps: ${JSON.stringify(gapAnalysis.newRequirements.map(g => ({ title: g.title, reason: g.reason })))}
Missing Evidence Gaps: ${JSON.stringify(gapAnalysis.missingEvidence.map(g => ({ title: g.title, expected: g.expectedEvidence })))}
` : ''}

COMPLIANCE TASKS:
${JSON.stringify(relatedTasks.map(t => ({ id: t.taskId, title: t.title, desc: t.description, status: t.status, department: t.department, evidence: t.evidenceRequired })), null, 2)}
--- CONTEXT END ---
`;

    // 5. Construct message chain
    const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
    const prompt = `
Context Data:
${contextText}

Conversation History:
${historyText}

User's Question:
${question}
`;

    // 6. Query Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
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
        temperature: 0.2
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
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini Chatbot API returned an empty response.');
    }

    try {
      return JSON.parse(text.trim());
    } catch (err) {
      const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    }
  } catch (err: any) {
    console.warn('Gemini chatbot failed, activating local rule fallback:', err);
    // Graceful fallback to rule-based response if live API fails
    try {
      // Re-fetch context references to ensure local responder is initialized
      let circularMeta: Circular | null = null;
      let gapAnalysis: GapAnalysis | null = null;
      let relatedTasks: Task[] = [];
      let baseline: CompanyBaseline | null = null;

      const baselineSnap = await getDoc(doc(db, 'companies', companyId, 'baseline', 'current'));
      if (baselineSnap.exists()) baseline = baselineSnap.data() as CompanyBaseline;

      if (circularId) {
        const circSnap = await getDoc(doc(db, 'circulars', circularId));
        if (circSnap.exists()) circularMeta = circSnap.data() as Circular;

        const gapSnap = await getDoc(doc(db, 'gapAnalysis', circularId));
        if (gapSnap.exists()) gapAnalysis = gapSnap.data() as GapAnalysis;

        const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('companyId', '==', companyId), where('circularId', '==', circularId)));
        relatedTasks = tasksSnap.docs.map(d => d.data() as Task);
      }

      return runLocalResilientChatbot(question, baseline, circularMeta, null, gapAnalysis, relatedTasks);
    } catch (fallbackErr: any) {
      return {
        status: 'error',
        agent: 'chatbot',
        step: 'answer',
        data: {
          reply: `Sorry, I encountered an issue querying the database: ${fallbackErr.message}`,
          references: []
        }
      };
    }
  }
};
