# Firebase Demo Plan for RICE

> **Project:** RICE — Regulatory Intelligence & Compliance Engine  
> **File purpose:** This document defines how Firebase is used in the MVP, how data is structured, what is stored where, how the frontend reads and writes data, and how the system can grow later without changing the core product idea.  
> **Scope:** This is written for the hackathon MVP first, but it also explains the future version so the data model does not have to be redesigned later.

---

## 1. Why Firebase is the right fit for RICE

RICE needs a lightweight but reliable way to store company data, circulars, AI outputs, tasks, evidence, and workflow status. The app should feel fast, mostly frontend-driven, and easy to demo. Firebase is a good fit because it gives you:

- a document database for structured app state
- file storage for uploaded PDFs and evidence
- realtime updates to keep the UI in sync
- offline-friendly caching for web apps
- security rules to control access
- a simple way to prototype without building a separate backend

For this MVP, Firebase acts as the **persistence layer** and the **sync layer**. The UI and AI workflow can run in the frontend, while Firebase stores the resulting structured data so the app can be reopened, refreshed, and demonstrated without losing state.

Firestore is especially useful here because it is a NoSQL document database organized around **collections** and **documents**, which matches the kind of data RICE produces: company profiles, circular runs, obligations, gap analyses, tasks, and evidence records. Firestore also supports realtime listeners, so the dashboard can update as soon as the analysis pipeline writes data back. Firebase Storage is the right place for PDFs and evidence files because it is designed for user-uploaded content and can be protected by Storage Security Rules.

---

## 2. Firebase services to use in the MVP

### 2.1 Cloud Firestore
Use Firestore as the main database for all structured app data.

Store:
- company baseline
- circular metadata
- extracted document text
- AI summary
- obligations
- gap analysis
- tasks
- evidence metadata
- workflow run state
- chatbot conversation history if needed

Why:
- easy to model as documents
- simple to query in the UI
- supports realtime updates
- works well for dashboard cards and detail pages

### 2.2 Cloud Storage for Firebase
Use Storage for:
- uploaded SEBI circular PDFs
- evidence PDFs
- screenshots
- supporting documents
- optional highlighted PDF copies

Why:
- file uploads are separated from structured metadata
- easier to store and retrieve large files
- useful for showing the original PDF in the analysis workspace

### 2.3 Firebase Authentication
For the MVP, authentication can be minimal.

Possible MVP options:
- demo-only login
- single shared demo account
- optional email/password login
- anonymous demo mode for judges

Why:
- Security Rules need a user context if you want per-user access
- future expansion becomes easier if auth is already in place

If the demo stays single-user and fictional, auth can remain simple. If you later turn RICE into a real product, Firebase Auth should become the identity layer.

### 2.4 Optional later services
Not required for the MVP:
- Firebase Hosting
- Cloud Functions
- Remote Config
- Analytics
- Crashlytics

These can be added later if the project grows into a production app.

---

## 3. What Firebase does in this project

Firebase should do the following jobs:

1. store the company baseline for SOUBH Securities
2. store each uploaded or discovered circular
3. store the AI outputs from each agent
4. keep track of workflow progress
5. store tasks and evidence references
6. let the UI read live updates from the database
7. support future multi-company expansion

Firebase should **not** be used as the AI engine itself. The AI reasoning still happens in the frontend workflow layer through Gemini calls and structured agent steps. Firebase simply stores the result of those steps.

---

## 4. Core data model philosophy

The RICE app should be designed around a few main entities:

- **Company**
- **Circular**
- **Workflow Run**
- **Obligation**
- **Gap**
- **Task**
- **Evidence**
- **Chat Message**

This keeps the schema clean and avoids making one giant document with everything inside it.

A good rule for the MVP is:

- store identity and small metadata in Firestore
- store files in Storage
- store agent outputs as structured JSON
- keep the data easy to display on pages

---

## 5. Recommended Firestore collections

Below is the recommended Firebase structure for the MVP.

### 5.1 `companies`
This stores the demo company profile and its baseline state.

#### Example document: `companies/soubh-securities`
Fields:
- `companyId`
- `name`
- `displayName`
- `legalName`
- `industry`
- `type`
- `headOffice`
- `website`
- `status`
- `createdAt`
- `updatedAt`
- `baselineVersion`
- `description`
- `demoMode`

Possible nested fields:
- `departments`
- `keyPeople`
- `riskProfile`
- `baselineSummary`

This document is the foundation for the comparison logic.

---

### 5.2 `companies/{companyId}/baseline`
This can either be a subcollection or a field inside the company document. For the MVP, a subcollection is cleaner if you want version history.

#### Example document: `companies/soubh-securities/baseline/current`
Fields:
- `baselineId`
- `version`
- `referenceCorpus`
- `policySummary`
- `existingObligationsCount`
- `compliantCount`
- `pendingCount`
- `missingEvidenceCount`
- `baselineNotes`
- `sourceDocuments`

This is what the gap analysis agent compares against.

---

### 5.3 `circulars`
Stores metadata for each SEBI circular.

#### Example document: `circulars/{circularId}`
Fields:
- `circularId`
- `companyId`
- `sourceType` (`manual_upload` or `rss_discovered`)
- `title`
- `issuer`
- `circularNumber`
- `issueDate`
- `effectiveDate`
- `status`
- `storagePath`
- `originalFileName`
- `pageCount`
- `createdAt`
- `processedAt`
- `runId`
- `riskLevel`

Useful nested structures:
- `tags`
- `departmentsAffected`
- `summaryPreview`

This collection powers the SEBI Circulars page.

---

### 5.4 `workflowRuns`
Stores the full analysis session from upload/discovery to task generation.

#### Example document: `workflowRuns/{runId}`
Fields:
- `runId`
- `companyId`
- `circularId`
- `status`
- `triggerSource`
- `currentStep`
- `stepsCompleted`
- `startedAt`
- `updatedAt`
- `completedAt`
- `error`
- `agentResults`

Suggested status values:
- `uploaded`
- `parsing`
- `summarizing`
- `gap_analyzing`
- `planning_tasks`
- `saved`
- `completed`
- `error`

This is useful for showing progress in the UI and debugging the agent pipeline.

---

### 5.5 `documents`
Stores the extracted document data from the PDF.

#### Example document: `documents/{documentId}`
Fields:
- `documentId`
- `circularId`
- `companyId`
- `rawText`
- `cleanText`
- `sections`
- `headings`
- `pageReferences`
- `paragraphReferences`
- `metadata`
- `extractionQuality`
- `createdAt`

This is the output of the Document Intelligence Agent.

---

### 5.6 `summaries`
Stores the compliance summary from the second agent.

#### Example document: `summaries/{summaryId}`
Fields:
- `summaryId`
- `circularId`
- `companyId`
- `executiveSummary`
- `keyChanges`
- `riskLevel`
- `impactedDepartments`
- `importantParagraphs`
- `confidence`
- `createdAt`

This is the human-readable explanation layer.

---

### 5.7 `obligations`
Stores each extracted obligation as a separate record.

#### Example document: `obligations/{obligationId}`
Fields:
- `obligationId`
- `circularId`
- `companyId`
- `title`
- `description`
- `type`
- `priority`
- `riskLevel`
- `department`
- `sourcePage`
- `sourceParagraph`
- `highlightColor`
- `status`
- `createdAt`

Suggested obligation types:
- `new`
- `modified`
- `existing`
- `evidence_required`
- `manual_review`

This collection helps drive the PDF highlight logic and the gap analysis.

---

### 5.8 `gapAnalysis`
Stores the comparison between the circular and the company baseline.

#### Example document: `gapAnalysis/{gapId}`
Fields:
- `gapId`
- `circularId`
- `companyId`
- `alreadyCompliant`
- `modifiedRequirements`
- `newRequirements`
- `missingEvidence`
- `manualReviewItems`
- `riskSummary`
- `gapScore`
- `createdAt`

Each category can be an array of objects.

Example item fields:
- `referenceId`
- `title`
- `baselineMatch`
- `severity`
- `reason`
- `sourcePage`

This is the core RICE differentiator.

---

### 5.9 `tasks`
Stores operational tasks generated from the gap analysis.

#### Example document: `tasks/{taskId}`
Fields:
- `taskId`
- `companyId`
- `circularId`
- `gapId`
- `title`
- `department`
- `ownerRole`
- `priority`
- `status`
- `dueDate`
- `evidenceRequired`
- `linkedObligationId`
- `createdAt`
- `completedAt`
- `completionNotes`

Suggested task status values:
- `pending`
- `in_progress`
- `awaiting_evidence`
- `reviewing`
- `completed`
- `blocked`

This collection powers the Tasks page.

---

### 5.10 `evidence`
Stores metadata for uploaded proof files.

#### Example document: `evidence/{evidenceId}`
Fields:
- `evidenceId`
- `taskId`
- `companyId`
- `circularId`
- `fileName`
- `storagePath`
- `fileType`
- `fileSize`
- `uploadedBy`
- `uploadedAt`
- `verificationStatus`
- `notes`
- `linkedObligationId`

Suggested verification statuses:
- `pending`
- `accepted`
- `rejected`
- `needs_review`

The actual file should live in Storage, while Firestore stores the metadata.

---

### 5.11 `chatThreads` and `messages`
If you want Ask RICE to keep a conversation history, use a separate collection.

#### Example
- `chatThreads/{threadId}`
- `chatThreads/{threadId}/messages/{messageId}`

Fields for thread:
- `threadId`
- `companyId`
- `circularId`
- `title`
- `createdAt`
- `updatedAt`

Fields for message:
- `messageId`
- `role` (`user` or `assistant`)
- `text`
- `createdAt`
- `sourceRefs`

This is optional for MVP, but useful if you want the chatbot to feel contextual.

---

## 6. Suggested Cloud Storage structure

Use Storage for large files. Keep the folder structure simple and readable.

### Suggested paths
- `companies/{companyId}/circulars/{circularId}/original.pdf`
- `companies/{companyId}/circulars/{circularId}/highlighted.pdf`
- `companies/{companyId}/evidence/{evidenceId}/{fileName}`
- `companies/{companyId}/exports/{runId}/report.pdf`

### Why this structure works
- files stay grouped by company
- each circular keeps its own files together
- evidence is easy to trace back to a task
- later exports can be stored cleanly

### What should be stored in Storage
- original SEBI PDF
- evidence uploads
- any generated highlighted PDF
- optional export reports

### What should not be stored in Storage
- summaries
- obligations
- task records
- company profile data

Those belong in Firestore.

---

## 7. Workflow state design

The whole app should have a clear analysis flow.

### Suggested workflow state fields
- `status`
- `currentStep`
- `progressPercent`
- `activeAgent`
- `errors`
- `lastUpdated`
- `resultSummary`

### Example progression
1. PDF uploaded
2. Document agent runs
3. Summary agent runs
4. Gap agent runs
5. Task planner runs
6. Data saved to Firebase
7. UI updates

This can be tracked in `workflowRuns` and mirrored in the frontend state.

---

## 8. Realtime behavior

Firestore is good for this app because the UI can listen to updates as the workflow writes data.

That means:
- the dashboard can update automatically
- the task list can refresh without manual reload
- the analysis page can show intermediate agent output
- the circular page can show processed status changes live

A practical UI pattern is:
- create a workflow run document
- start processing
- listen to the document with a realtime listener
- update UI sections as each agent completes

This makes the demo feel alive.

---

## 9. Offline behavior

Firestore supports caching and offline use for active data. On the web, offline persistence is not enabled by default, so it must be enabled explicitly if you want cached behavior.

For the MVP, this matters because:
- the app can still show previously loaded data
- the demo can be resilient if the network is unstable
- re-opened records can stay visible while offline

### Important caution
If the app stores sensitive information, offline persistence should be enabled only on trusted devices. For the hackathon demo, that is usually fine because the company is fictional and the data is seeded for demonstration purposes.

---

## 10. Security model for the MVP

The MVP security model can be simple, but it should not be left open.

### Recommended MVP security strategy
- allow only authenticated access if possible
- or use a single demo account
- lock writes to the demo company data
- allow reads only for the demo environment
- restrict Storage uploads to the app context

### Firestore Security Rules goals
- prevent random public writes
- ensure only demo users can change data
- protect company-specific data
- allow uploads to the correct folder only

### Storage Security Rules goals
- only authenticated users can upload evidence
- files should match expected company paths
- file types and sizes can be validated
- prevent arbitrary file placement

Firebase Security Rules are the main defense line for both Firestore and Storage.

---

## 11. Demo seed data

The database should be preloaded with enough data to show a believable compliance environment.

### Seed the following
- one company: SOUBH Securities Pvt. Ltd.
- one current baseline snapshot
- several existing obligations
- a few sample tasks
- a small set of evidence files
- one or two historical circular entries
- one or two completed workflow runs

### Why seed data matters
If the app starts empty, the product feels unfinished. Seed data lets the judges immediately see:
- a real company baseline
- existing compliance posture
- what gets updated when a new circular arrives

---

## 12. Future purpose of Firebase in RICE

The MVP uses Firebase simply and directly. But the same structure can grow later.

### Future expansions
- multiple companies
- multiple users per company
- role-based access
- approval workflows
- real audit history
- policy versioning
- compliance calendars
- team notifications
- integration with document upload portals
- richer analytics

If the Firestore schema is designed well now, you will not need to rebuild the system later.

### Long-term advantage
The current MVP documents, tasks, and evidence records can evolve into a real compliance platform with the same data foundation.

---

## 13. What Firebase should not do

To keep the MVP clean, Firebase should not become the place where every kind of logic lives.

### Do not use Firebase for
- prompt engineering
- AI reasoning
- PDF parsing logic
- browser UI state only
- heavy computation

Those belong in the frontend workflow and AI calls. Firebase stores the results, not the reasoning process itself.

---

## 14. Recommended demo flow using Firebase

1. User opens RICE.
2. Dashboard reads the current company snapshot from Firestore.
3. User uploads or discovers a circular.
4. PDF goes to Storage.
5. A workflow run document is created in Firestore.
6. Agent outputs are written back to Firestore step by step.
7. The analysis page shows structured results.
8. The gap analysis and task documents appear.
9. Evidence uploads are stored in Storage and linked in Firestore.
10. Dashboard and task pages update automatically.

This flow makes the system feel coherent and easy to explain.

---

## 15. Example JSON shape for the demo company

```json
{
  "companyId": "soubh-securities",
  "name": "SOUBH Securities Pvt. Ltd.",
  "industry": "Stock Broker",
  "type": "Demo Broker",
  "demoMode": true,
  "baselineVersion": "v1",
  "departments": ["Compliance", "Operations", "IT", "Customer Support"],
  "status": "active",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 16. Example JSON shape for a circular

```json
{
  "circularId": "circular_2026_001",
  "companyId": "soubh-securities",
  "sourceType": "manual_upload",
  "title": "Cybersecurity Compliance Update",
  "issuer": "SEBI",
  "circularNumber": "SEBI/2026/001",
  "issueDate": "2026-06-29",
  "effectiveDate": "2026-07-15",
  "status": "processed",
  "storagePath": "companies/soubh-securities/circulars/circular_2026_001/original.pdf"
}
```

---

## 17. Example JSON shape for a task

```json
{
  "taskId": "task_001",
  "companyId": "soubh-securities",
  "circularId": "circular_2026_001",
  "title": "Revise Cybersecurity Audit Schedule",
  "department": "IT",
  "priority": "high",
  "status": "pending",
  "dueDate": "2026-07-15",
  "evidenceRequired": ["Updated policy PDF", "Approval note"]
}
```

---

## 18. Final recommendation

For the MVP, keep Firebase simple and structured:

- Firestore for all app data
- Storage for all files
- Auth if needed, but minimal
- realtime listeners for dashboard updates
- seeded demo company data
- strict but simple security rules
- clear document names and collection names

The success of RICE depends on whether the data model feels trustworthy. If the database is clean, the app will feel intelligent. If the database is messy, the AI will feel random.

This file is the base plan for the Firebase layer of the project.
