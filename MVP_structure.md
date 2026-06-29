# RICE MVP Structure

> **Project:** RICE — Regulatory Intelligence & Compliance Engine  
> **Purpose of this document:** This is the single source of truth for the MVP. It defines the product scope, user flow, pages, AI agents, data model, and demo experience.  
> **Important:** This is an MVP specification, not a full enterprise product plan. Everything here is designed to show the core idea clearly, quickly, and convincingly in a hackathon demo.

---

## 1. Product Summary

RICE is an AI-powered compliance intelligence engine for stock broker compliance officers. It helps a brokerage understand SEBI circulars, detect what changed, compare the new rule against the company’s existing compliance baseline, and turn the change into operational tasks.

The key idea is simple:

**Regulatory text → compliance understanding → gap detection → task generation → evidence tracking**

RICE is not a generic chatbot. It is not just a PDF reader. It is an action-oriented compliance workflow tool.

---

## 2. Problem the MVP Solves

A compliance officer at a stock broker receives a new SEBI circular. The officer must quickly answer:

- What does this circular say?
- What changed compared to the existing compliance baseline?
- Which rules are already covered?
- Which rules are new?
- Which rules are modified?
- What evidence is needed?
- What tasks should be created?
- Who should act on them?
- Can I prove compliance later?

RICE answers those questions in one place.

The MVP focuses on one regulated entity type: **stock broker compliance**.

---

## 3. Target User

### Primary User
**Compliance Officer at a stock broker**

### Secondary Users
- Operations team
- IT / security team
- Internal reviewers
- Demo judges

### User needs
- Fast reading of circulars
- Transparent explanation of AI output
- Clear comparison with existing company policies
- Task creation from obligations
- Proof/evidence tracking
- Simple audit-ready workflow

---

## 4. Demo Company Baseline

The MVP uses one preloaded fictional company:

**SOUBH Securities Pvt. Ltd.**

This company acts as the existing compliance baseline. It is already set up in the app so the system can compare new circulars with current internal rules, policies, and tasks.

### Why this matters
Without a baseline company, the product cannot detect:
- already compliant items
- changed rules
- missing evidence
- newly introduced obligations

### Demo baseline contains
- company profile
- departments
- current compliance status
- existing policies
- sample tasks
- sample evidence
- historical circular processing state

---

## 5. MVP Goals

The MVP must demonstrate all of these:

1. A new SEBI circular can be discovered or uploaded.
2. The app can extract meaningful information from the circular.
3. The app can compare it against the demo company baseline.
4. The app can show what changed.
5. The app can generate tasks from the changes.
6. The app can show the PDF with transparent highlights.
7. The app can support a simple chatbot for questions.
8. The app can store results in Firebase.
9. The whole flow should feel like an agentic compliance system.

---

## 6. Core Product Positioning

RICE should be presented as:

**An AI compliance operating system that turns SEBI circulars into actionable compliance work for stock brokers.**

The strongest demo message is:

> “RICE does not just summarize circulars. It compares them against your company’s current compliance state and tells you what to do next.”

---

## 7. MVP Architecture Philosophy

The MVP should feel frontend-first and lightweight.

### Allowed in MVP
- React UI
- TypeScript logic
- Firebase for storage
- Gemini API for AI reasoning
- PDF display in browser
- Highlight overlays
- Simple workflow orchestration in frontend

### Not needed in MVP
- Traditional backend server
- Complex auth system
- Large admin panel
- Full multi-role permission model
- Advanced analytics
- Notifications engine
- Enterprise-grade audit module

The MVP should feel polished, not oversized.

---

## 8. AI Agent Design

The MVP uses **4 AI agents**.

### Agent 1 — Document Intelligence Agent
**Job:** Read the SEBI circular PDF and extract structured document data.

**Outputs:**
- title
- circular number
- issue date
- sections
- clean text
- page references
- paragraph references

**Why it matters:**  
This is the foundation. The rest of the system depends on clean document understanding.

---

### Agent 2 — Compliance Analysis Agent
**Job:** Convert the circular into a human-readable compliance summary.

**Outputs:**
- executive summary
- key changes
- obligations
- impact level
- affected departments
- important paragraphs

**Why it matters:**  
This is what helps a compliance officer understand the document quickly.

---

### Agent 3 — Gap Analysis Agent
**Job:** Compare the new obligations against the existing company baseline.

**Outputs:**
- already compliant
- modified requirements
- new requirements
- missing evidence
- manual review flags

**Why it matters:**  
This is the core differentiator. It turns text into decision-making.

---

### Agent 4 — Task Planning Agent
**Job:** Convert compliance gaps into actionable tasks.

**Outputs:**
- task title
- department
- owner type
- priority
- due date
- evidence required
- completion checklist

**Why it matters:**  
This is the operational part. It turns compliance findings into work.

---

## 9. Agent Flow

The agents run in sequence through a workflow manager.

### Flow
1. User uploads or discovers a circular.
2. Document Intelligence Agent processes the PDF.
3. Compliance Analysis Agent summarizes the document.
4. Gap Analysis Agent compares it with the company baseline.
5. Task Planning Agent generates tasks.
6. Results are saved to Firebase.
7. UI updates with highlights, gaps, and tasks.

### Shared state idea
Each agent reads the current workflow state and writes its output back into the same object.

Example state fields:
- companyProfile
- documentData
- summary
- obligations
- gapAnalysis
- tasks
- highlights
- evidenceSuggestions

This makes the agents synchronized without needing them to communicate directly.

---

## 10. Input Methods

The MVP supports **two ways** to bring in a circular.

### A. Manual Upload
The user uploads a PDF directly.

Use case:
- judge demo
- internal testing
- fallback when RSS is not available

### B. RSS Discovery
The system checks for newly discovered circulars from the feed.

Use case:
- automatic detection
- demoing proactive monitoring
- showing real-world usefulness

Both paths should end in the same analysis workflow.

---

## 11. Main MVP Pages

The MVP should have **5 pages only**.

### Page 1 — Dashboard
Purpose: Show the current state at a glance.

Sections:
- company name
- compliance score
- latest circular status
- pending tasks
- critical alerts
- quick summary card
- recent activity

The dashboard should be simple and confidence-building.

---

### Page 2 — SEBI Circulars
Purpose: Show uploaded or discovered circulars.

Sections:
- circular list
- upload button
- RSS-discovered item
- status tags
- open for analysis
- processed indicator

This page is where the user begins working on a circular.

---

### Page 3 — Circular Analysis Workspace
Purpose: Show the PDF side by side with AI output.

This is the most important page in the demo.

Sections:
- PDF viewer
- colored highlights
- AI summary panel
- key changes panel
- obligations panel
- side notes explaining why text is highlighted
- Ask RICE chatbot panel

The PDF must be visible directly on the page.

Highlight logic:
- green = already compliant
- yellow = modified requirement
- red = new obligation / high risk
- blue = evidence-related text

Clicking a highlight or obligation should show the corresponding reasoning.

---

### Page 4 — Gap Analysis
Purpose: Show the comparison between new circular and company baseline.

Sections:
- already compliant
- changed items
- new obligations
- evidence missing
- risk level
- generate tasks button

This page should be clear and structured. It is the “so what?” page.

---

### Page 5 — Tasks
Purpose: Show operational work created from the analysis.

Sections:
- task list
- task status
- department tag
- priority tag
- evidence upload
- mark complete
- assigned obligations

This page keeps the demo practical.

---

## 12. Recommended Layout for the Main Analysis Page

The Circular Analysis Workspace should be the visual centerpiece.

### Suggested layout
- Left panel: AI output
- Middle / right panel: PDF viewer
- Bottom or side strip: chatbot and quick actions

### Left panel content
- AI summary
- key changes
- obligations
- gap explanations
- generated task preview

### PDF panel content
- original PDF rendering
- highlight overlays
- click-to-jump interactions
- visible page and paragraph cues

### Why this page matters
This is where the product shows:
- transparency
- traceability
- explainability
- human verification
- operational relevance

This page should feel like “AI compliance review in action.”

---

## 13. Chatbot Scope

The MVP includes a simple chatbot called **Ask RICE**.

### Chatbot purpose
- answer extra questions
- explain a highlighted section
- clarify a change
- explain why a task was created
- answer questions using current app data only

### Chatbot should NOT be
- a generic assistant
- a free-form open internet chatbot
- the main navigation path
- the primary output of the product

### Good chatbot questions
- What changed in this circular?
- Why is this rule marked high risk?
- Which department should handle this?
- What evidence is needed?
- Show me the exact paragraph that triggered this task.

---

## 14. Frontend-Only Workflow Idea

The MVP should feel like it runs mostly on the frontend.

### Frontend responsibilities
- UI rendering
- file upload handling
- workflow step display
- agent sequencing
- state management
- PDF viewer
- highlight overlays
- chatbot interface

### Firebase responsibilities
- store company data
- store circular metadata
- store extracted outputs
- store tasks
- store evidence references
- store processed states

### AI responsibilities
- text understanding
- summarization
- gap detection
- task planning

This keeps the app lightweight and hackathon-friendly.

---

## 15. Data Stored in Firebase

Firebase is the persistence layer for the MVP.

### Suggested collections
- `companies`
- `circulars`
- `documents`
- `summaries`
- `obligations`
- `gapAnalysis`
- `tasks`
- `evidence`
- `workflowRuns`
- `chatMessages`

### What each stores
- company profile and baseline info
- circular metadata
- extracted PDF data
- agent outputs
- comparison results
- generated tasks
- uploaded evidence references
- processing history
- chatbot interaction history

---

## 16. Company Baseline Data

SOUBH Securities should have preloaded baseline data.

### Baseline includes
- active policies
- known departments
- prior compliance state
- sample completed tasks
- sample pending tasks
- sample evidence references
- existing risk tags

### Why this matters
The system needs a “before” state so the new circular can be compared against it.

---

## 17. Highlight Logic

The PDF highlight system should show why a sentence matters.

### Highlight types
- **Green:** already compliant
- **Yellow:** modified rule
- **Red:** new or high-risk item
- **Blue:** evidence or proof-related text

### Expected interaction
When the user clicks a highlight:
- the relevant explanation appears
- the corresponding obligation appears
- the gap analysis section updates
- the task reference appears if one exists

This gives the demo transparency and trust.

---

## 18. Evidence Handling

Evidence handling in MVP should stay simple.

### Evidence actions
- upload file
- link to task
- mark as submitted
- mark as verified
- show pending status

### Evidence examples
- policy PDF
- signed approval
- audit report
- internal memo
- screenshot
- log extract

The MVP does not need a complex evidence lifecycle. It just needs enough structure to show compliance proof exists.

---

## 19. Demo Scenario

The demo should follow one clear story.

### Demo story
1. SOUBH Securities exists in the system.
2. A new SEBI circular is discovered or uploaded.
3. The document agent processes the PDF.
4. The summary agent explains the circular.
5. The gap agent compares it to the company baseline.
6. The planner creates tasks.
7. The PDF shows highlights.
8. The officer asks Ask RICE a question.
9. The officer uploads evidence.
10. The task is marked complete.

This is enough to show the full compliance loop.

---

## 20. What Makes This MVP Different

The MVP should not look like a PDF chatbot.

Its differentiators are:
- company baseline comparison
- color-coded highlight transparency
- separate AI reasoning steps
- task generation from gaps
- side-by-side compliance review
- operational workflow output

These are the key reasons judges should see it as more than a document summary tool.

---

## 21. Out of Scope for MVP

These should be excluded from the first version:
- user authentication system
- role-based permissions
- alerts and notifications
- advanced analytics dashboard
- audit trail explorer
- multiple company support
- editable policy authoring
- full document versioning system
- complex approval workflows
- mobile app
- large admin settings area

The MVP should stay focused and demo-ready.

---

## 22. Final MVP Promise

If someone asks what RICE does, the answer should be:

**RICE reads SEBI circulars, compares them with a stock broker’s existing compliance baseline, shows what changed, highlights the exact PDF text, and turns the difference into actionable tasks.**

That is the entire product in one sentence.

---

## 23. Build Order

The MVP should be built in this order:

1. Freeze company baseline
2. Build page structure
3. Build PDF upload and viewer
4. Build highlight layer
5. Build AI agent workflow
6. Build gap analysis output
7. Build tasks page
8. Build Ask RICE chatbot
9. Store outputs in Firebase
10. Polish demo flow

---

## 24. Final Notes

This document is the master plan. If a feature is not in this file, it is not part of the MVP unless specifically added later.

Keep the product:
- focused
- explainable
- transparent
- operational
- demo-friendly

The goal is not to build the biggest system.

The goal is to build the clearest one.
