import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
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

export const executeWorkflow = async (
  options: WorkflowOptions
): Promise<{ success: boolean; runId: string; error?: string }> => {
  const companyId = options.companyId || 'soubh-securities';
  const circularId = options.circularId;
  const pdfText = options.pdfText;

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
