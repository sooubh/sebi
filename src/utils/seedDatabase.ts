import { db } from '../config/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Company, CompanyBaseline, Task, Evidence } from '../types';

export const seedDatabase = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const batch = writeBatch(db);

    // 1. Company Profile
    const companyId = 'soubh-securities';
    const companyRef = doc(db, 'companies', companyId);
    const companyData: Company = {
      companyId,
      name: 'SOUBH Securities Pvt. Ltd.',
      industry: 'Stock Broker',
      type: 'Demo Broker',
      demoMode: true,
      baselineVersion: 'v1.0.0',
      departments: ['Compliance', 'Operations', 'IT', 'Support'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: 'SOUBH Securities Pvt. Ltd. is a fictional mid-sized retail stock broker that provides digital trading, demat, and investment services to Indian retail investors while operating under a structured compliance and control environment.'
    };
    batch.set(companyRef, companyData);

    // 2. Company Baseline details & active policies
    const baselineRef = doc(db, 'companies', companyId, 'baseline', 'current');
    const baselineData: CompanyBaseline = {
      baselineId: 'baseline_v1',
      version: 'v1.0.0',
      referenceCorpus: 'SEBI Stock Broker Regulations 1992, PMLA 2002, and subsequent cyber/operational directives.',
      policySummary: 'Primary operational policies include KYC Compliance, Cybersecurity, Client Asset Safeguards, and Investor Grievance Handling.',
      existingObligationsCount: 14,
      compliantCount: 12,
      pendingCount: 2,
      missingEvidenceCount: 1,
      baselineNotes: 'Initial baseline compiled for FY 2026-27. Last reviewed June 2026.',
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
    batch.set(baselineRef, baselineData);

    // 3. Sample Baseline Tasks (Compliance History)
    const task1Ref = doc(db, 'tasks', 'task_baseline_1');
    const task1Data: Task = {
      taskId: 'task_baseline_1',
      companyId,
      circularId: 'circular_baseline_0',
      gapId: 'gap_baseline_0',
      title: 'Conduct annual cybersecurity audit and submit reports to SEBI',
      description: 'Engage CERT-in empanelled auditor to conduct cybersecurity audit. File audit report and vulnerability disclosure sheet with SEBI.',
      department: 'IT',
      ownerRole: 'IT Security Head',
      priority: 'high',
      status: 'completed',
      dueDate: '2026-05-30',
      linkedReferenceId: 'b_ref_cyber',
      evidenceRequired: ['Cybersecurity Audit Report', 'SEBI Submission Confirmation Screen'],
      checklist: ['Select empanelled auditor', 'Conduct vulnerability scanning', 'Draft remediation plan', 'File audit report with SEBI'],
      createdAt: '2026-04-01',
      completedAt: '2026-05-28',
      completionNotes: 'Audit completed by CyberSec Labs. Vulnerabilities patched. Filed reports successfully.'
    };
    batch.set(task1Ref, task1Data);

    const task2Ref = doc(db, 'tasks', 'task_baseline_2');
    const task2Data: Task = {
      taskId: 'task_baseline_2',
      companyId,
      circularId: 'circular_baseline_0',
      gapId: 'gap_baseline_0',
      title: 'Verify and log PAN-Aadhaar linking status of active clients',
      description: 'Perform batch verification of PAN-Aadhaar linking for active trading accounts to prevent regulatory deactivation.',
      department: 'Operations',
      ownerRole: 'KYC Operations Manager',
      priority: 'medium',
      status: 'completed',
      dueDate: '2026-06-15',
      linkedReferenceId: 'b_ref_kyc',
      evidenceRequired: ['PAN-Aadhaar Status Log CSV', 'Deactivation screenshots'],
      checklist: ['Extract active user list', 'Verify via Income Tax API', 'Flag mismatches', 'Deactivate unlinked accounts'],
      createdAt: '2026-05-10',
      completedAt: '2026-06-12',
      completionNotes: 'Batch run finished. 98.4% accounts linked. 42 inactive/unlinked accounts suspended.'
    };
    batch.set(task2Ref, task2Data);

    const task3Ref = doc(db, 'tasks', 'task_baseline_3');
    const task3Data: Task = {
      taskId: 'task_baseline_3',
      companyId,
      circularId: 'circular_baseline_0',
      gapId: 'gap_baseline_0',
      title: 'Quarterly internal audit of Compliance Register and approvals',
      description: 'Review compliance checklist for Q1 FY 2026-27. Confirm key approvals, board resolutions, and customer communications.',
      department: 'Compliance',
      ownerRole: 'Compliance Head',
      priority: 'medium',
      status: 'in_progress',
      dueDate: '2026-07-15',
      linkedReferenceId: 'b_ref_audit',
      evidenceRequired: ['Quarterly Compliance Certificate'],
      checklist: ['Gather department certifications', 'Sample KYC files', 'Verify grievance logs', 'Sign certificate'],
      createdAt: '2026-06-01'
    };
    batch.set(task3Ref, task3Data);

    // 4. Sample Evidence Logs
    const ev1Ref = doc(db, 'evidence', 'ev_baseline_1');
    const ev1Data: Evidence = {
      evidenceId: 'ev_baseline_1',
      taskId: 'task_baseline_1',
      companyId,
      circularId: 'circular_baseline_0',
      fileName: 'cybersecurity_audit_report_2026.pdf',
      storagePath: 'companies/soubh-securities/evidence/ev_baseline_1/cybersecurity_audit_report_2026.pdf',
      fileType: 'application/pdf',
      fileSize: 2048500,
      uploadedBy: 'IT Security Head',
      uploadedAt: '2026-05-28',
      verificationStatus: 'accepted',
      notes: 'Audit report meets all SEBI guidelines. Verified by Compliance team.'
    };
    batch.set(ev1Ref, ev1Data);

    const ev2Ref = doc(db, 'evidence', 'ev_baseline_2');
    const ev2Data: Evidence = {
      evidenceId: 'ev_baseline_2',
      taskId: 'task_baseline_2',
      companyId,
      circularId: 'circular_baseline_0',
      fileName: 'pan_aadhaar_match_log_june2026.csv',
      storagePath: 'companies/soubh-securities/evidence/ev_baseline_2/pan_aadhaar_match_log_june2026.csv',
      fileType: 'text/csv',
      fileSize: 34520,
      uploadedBy: 'KYC Operations Manager',
      uploadedAt: '2026-06-12',
      verificationStatus: 'accepted',
      notes: 'Batch log verified. Suspension emails sent to 42 clients.'
    };
    batch.set(ev2Ref, ev2Data);

    // 5. Seed a baseline circular just to make the initial circular list non-empty
    const circRef = doc(db, 'circulars', 'circular_baseline_0');
    batch.set(circRef, {
      circularId: 'circular_baseline_0',
      companyId,
      sourceType: 'manual_upload',
      title: 'Baseline Security and KYC Directives',
      issuer: 'SEBI',
      circularNumber: 'SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2025/110',
      issueDate: '2025-10-15',
      effectiveDate: '2025-11-01',
      status: 'processed',
      storagePath: 'companies/soubh-securities/circulars/circular_baseline_0/original.pdf',
      originalFileName: 'SEBI_Baseline_Directives.pdf',
      pageCount: 3,
      createdAt: '2026-01-01T00:00:00Z',
      processedAt: '2026-01-01T01:00:00Z',
      riskLevel: 'high',
      departmentsAffected: ['Compliance', 'Operations', 'IT'],
      summaryPreview: 'Consolidated guidelines for client KYC updates, annual security audits, and risk controls for online trading access.'
    });

    await batch.commit();
    return { success: true, message: 'Database seeded successfully for SOUBH Securities Pvt. Ltd.' };
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return { success: false, message: error.message || 'Unknown error occurred during seeding.' };
  }
};
