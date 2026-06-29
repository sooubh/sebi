# RICE Agent Specification

> **Project:** RICE — Regulatory Intelligence & Compliance Engine  
> **Document purpose:** This file defines every AI and workflow component used in the MVP. It explains what each agent does, what it receives, what it returns, how agents stay synchronized, what gets stored in Firebase, and how the frontend should react to each step.  
> **Scope:** This is written for the hackathon MVP, but the structure is designed so the same agent pattern can scale into a real product later.

---

## 1. Core design principle

RICE is a workflow system, not a single prompt.

The product must convert a SEBI circular into operational compliance actions in a predictable sequence:

1. read the circular
2. understand it
3. compare it with the company baseline
4. turn the difference into tasks
5. store everything as structured data
6. show the result transparently in the UI

To keep the system reliable, RICE uses a **shared state workflow**. Each step reads the current state, adds its own result, and passes the updated state forward.

---

## 2. Why this is an agentic workflow

RICE is designed as an agentic system because the problem itself is multi-step:

- document understanding is different from
- compliance interpretation
- which is different from
- gap comparison
- which is different from
- operational task creation

A single model call can technically try to do all of this, but that is harder to debug and less transparent in a demo. A multi-agent workflow makes the reasoning visible and lets the UI show progress step by step.

---

## 3. High-level workflow components

### AI Agents
RICE uses **4 AI agents**:

1. **Document Intelligence Agent**
2. **Compliance Analysis Agent**
3. **Gap Analysis Agent**
4. **Task Planning Agent**

### Non-AI workflow controller
A simple orchestration layer coordinates the agents. This is not an AI agent. It is the state manager that decides which step runs next.

### Supporting utilities
- PDF parser / text extractor
- highlight mapper
- Firebase writer
- Firebase reader
- chatbot retrieval layer
- workflow progress tracker

---

## 4. Shared state model

All agents use the same shared state object.

### Shared state fields
- `companyProfile`
- `baseline`
- `circularMetadata`
- `documentData`
- `summaryData`
- `obligations`
- `highlightMap`
- `gapAnalysis`
- `tasks`
- `evidenceSuggestions`
- `chatContext`
- `workflowStatus`
- `errors`
- `timestamps`

### Shared state rule
Each agent:
- reads the latest state
- processes only its responsibility
- writes its output back into the state
- never overwrites fields owned by another agent unless explicitly instructed

This prevents agents from working in isolation and keeps the workflow synchronized.

---

## 5. Standard output format for every agent

Every agent should return structured JSON.

### Base response shape
```json
{
  "status": "success",
  "agent": "agent_name",
  "step": "step_name",
  "timestamp": "ISO_TIMESTAMP",
  "data": {},
  "warnings": [],
  "errors": []
}
```

### Supported statuses
- `success`
- `partial_success`
- `needs_review`
- `error`

### Design rule
If the agent output is not parseable JSON, the workflow should treat it as a failure. The MVP should prefer strict structured outputs over free-form prose wherever possible.

---

## 6. Agent 1 — Document Intelligence Agent

### Purpose
This agent reads the SEBI circular PDF and converts it into structured document data.

### What it should do
- extract text from the PDF
- identify the title
- identify circular number and issue date if present
- detect headings and sections
- split the document into paragraphs or logical chunks
- preserve page references
- produce a clean text version for the next agent
- create highlight anchors for later UI mapping

### Input
- uploaded PDF file or Storage URL
- circular metadata if already known
- company context if needed

### Output
- clean text
- document sections
- headings
- page references
- paragraph references
- metadata
- extraction quality score

### Output JSON shape
```json
{
  "status": "success",
  "agent": "document_intelligence",
  "step": "pdf_extraction",
  "data": {
    "title": "string",
    "circularNumber": "string",
    "issuer": "SEBI",
    "issueDate": "string",
    "effectiveDate": "string",
    "pageCount": 0,
    "sections": [
      {
        "sectionId": "s1",
        "heading": "string",
        "page": 1,
        "text": "string"
      }
    ],
    "cleanText": "string",
    "paragraphMap": [
      {
        "paragraphId": "p1",
        "page": 1,
        "text": "string"
      }
    ],
    "extractionQuality": 0.0
  },
  "warnings": [],
  "errors": []
}
```

### Success criteria
- text extracted successfully
- document structure preserved
- enough context is available for summarization

### Failure cases
- scanned PDF with poor OCR quality
- blank or image-only PDF
- corrupted file
- low extraction confidence

### Retry policy
- try extraction once with the main parser
- if text is poor, mark `needs_review`
- if still unusable, stop workflow and ask for manual upload or a better file

### What the UI should show
- processing spinner
- extracted title
- page count
- extraction status
- “view parsed text” option for debugging

---

## 7. Agent 2 — Compliance Analysis Agent

### Purpose
This agent turns the raw document into a human-readable compliance explanation.

### What it should do
- create an executive summary
- identify key changes
- list obligations
- assign risk level
- identify affected departments
- create references to the exact page or paragraph
- mark text regions for highlighting

### Input
- output of Agent 1
- current company context
- optional baseline summary for better framing

### Output
- executive summary
- key changes
- obligations
- departments affected
- initial risk tags
- highlight candidates

### Output JSON shape
```json
{
  "status": "success",
  "agent": "compliance_analysis",
  "step": "summary_and_obligations",
  "data": {
    "executiveSummary": [
      "string"
    ],
    "keyChanges": [
      {
        "changeId": "c1",
        "type": "new|modified|removed",
        "description": "string",
        "riskLevel": "low|medium|high|critical",
        "sourcePage": 1,
        "sourceParagraph": "p1"
      }
    ],
    "obligations": [
      {
        "obligationId": "o1",
        "title": "string",
        "description": "string",
        "department": "Compliance|IT|Operations|Support|Other",
        "priority": "low|medium|high|critical",
        "riskLevel": "low|medium|high|critical",
        "sourcePage": 1,
        "sourceParagraph": "p1"
      }
    ],
    "highlightMap": [
      {
        "sourcePage": 1,
        "sourceParagraph": "p1",
        "highlightColor": "green|yellow|red|blue",
        "reason": "string"
      }
    ]
  },
  "warnings": [],
  "errors": []
}
```

### Success criteria
- summary is concise and understandable
- obligations are specific enough to compare later
- departments are mapped logically
- highlight reasons are traceable

### Failure cases
- too much vague text
- missing obligation boundaries
- summary too long or generic
- no clear department assignment

### Retry policy
- if output is too broad, rerun with stricter instructions
- if obligations are low quality, mark for manual review

### What the UI should show
- AI summary
- key changes
- obligation list
- risk labels
- explanation text for each highlight

---

## 8. Agent 3 — Gap Analysis Agent

### Purpose
This is the core RICE agent. It compares the new obligations against the existing company baseline.

### What it should do
- compare obligations against the baseline
- find already compliant items
- identify modified requirements
- detect brand new requirements
- identify missing evidence
- mark items needing manual review
- produce an implementation gap report

### Input
- obligations from Agent 2
- company baseline from Firebase
- current policies
- existing tasks
- existing evidence references

### Output
- already compliant list
- modified requirements
- new requirements
- missing evidence
- compliance risk summary
- gap score
- manual review items

### Output JSON shape
```json
{
  "status": "success",
  "agent": "gap_analysis",
  "step": "baseline_compare",
  "data": {
    "alreadyCompliant": [
      {
        "referenceId": "a1",
        "title": "string",
        "reason": "string",
        "sourcePage": 1
      }
    ],
    "modifiedRequirements": [
      {
        "referenceId": "m1",
        "title": "string",
        "baselineMatch": "string",
        "difference": "string",
        "severity": "medium|high|critical",
        "sourcePage": 1
      }
    ],
    "newRequirements": [
      {
        "referenceId": "n1",
        "title": "string",
        "reason": "string",
        "severity": "medium|high|critical",
        "sourcePage": 1
      }
    ],
    "missingEvidence": [
      {
        "referenceId": "e1",
        "title": "string",
        "expectedEvidence": [
          "string"
        ],
        "reason": "string",
        "severity": "medium|high|critical"
      }
    ],
    "manualReviewItems": [
      {
        "referenceId": "r1",
        "title": "string",
        "reason": "string"
      }
    ],
    "riskSummary": {
      "overallRiskLevel": "low|medium|high|critical",
      "gapScore": 0,
      "impactNotes": [
        "string"
      ]
    }
  },
  "warnings": [],
  "errors": []
}
```

### Success criteria
- every major obligation is categorized
- changes are clearly separated
- evidence gaps are visible
- result feels like a real compliance review

### Failure cases
- no baseline match found
- all items labeled “new” due to weak baseline
- vague similarity matching
- contradiction with existing company data

### Retry policy
- if baseline is too weak, request a manual review
- if comparison confidence is low, mark uncertain items
- if company baseline is missing, stop and ask for baseline data

### What the UI should show
- side-by-side comparison cards
- status chips for compliant / modified / new / missing
- a risk score
- a “Generate Tasks” button

### Why this agent matters most
This is the part that makes RICE different from a circular chatbot. It tells the user what changed relative to their current compliance state.

---

## 9. Agent 4 — Task Planning Agent

### Purpose
This agent turns compliance gaps into operational tasks.

### What it should do
- convert new and modified obligations into tasks
- assign the correct department
- suggest a logical owner role
- set priority
- define evidence requirements
- generate a simple completion checklist
- estimate urgency

### Input
- gap analysis output
- company departments
- baseline task patterns
- evidence suggestions

### Output
- task list
- owner assignments
- evidence requirements
- due date suggestions
- task checklists

### Output JSON shape
```json
{
  "status": "success",
  "agent": "task_planning",
  "step": "task_generation",
  "data": {
    "tasks": [
      {
        "taskId": "t1",
        "title": "string",
        "description": "string",
        "department": "IT|Compliance|Operations|Support|Other",
        "ownerRole": "string",
        "priority": "low|medium|high|critical",
        "status": "pending",
        "dueDateSuggestion": "ISO_DATE",
        "linkedReferenceId": "n1",
        "evidenceRequired": [
          "string"
        ],
        "checklist": [
          "string"
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
```

### Success criteria
- tasks are concrete and action-oriented
- each task has a department
- each task has proof expectations
- no duplicate or filler tasks

### Failure cases
- tasks are too generic
- no department assigned
- due dates are unreasonable
- one requirement becomes multiple redundant tasks

### Retry policy
- if tasks are vague, regenerate with stricter instructions
- if ownership is unclear, mark task as `manual_review`
- if evidence cannot be determined, ask the user to confirm

### What the UI should show
- task cards
- priority indicator
- department tag
- evidence needed list
- status update controls

---

## 10. Ask RICE chatbot specification

### Purpose
Ask RICE is a lightweight contextual assistant for questions related to the current circular, the company baseline, and generated analysis.

### Allowed scope
- explain a highlighted section
- clarify a gap
- explain why a task exists
- summarize the change in simple words
- point to relevant obligations
- answer questions based on current app data

### Not allowed scope
- open internet knowledge
- unrelated general chat
- making up regulations
- replacing the actual analysis pipeline

### Input
- current circular data
- summary data
- gap analysis
- tasks
- company baseline snapshot

### Output
- concise answer
- optional source reference
- optional next action suggestion

### Chatbot response shape
```json
{
  "status": "success",
  "agent": "chatbot",
  "step": "answer",
  "data": {
    "reply": "string",
    "references": [
      {
        "type": "obligation|paragraph|task|baseline",
        "id": "string"
      }
    ]
  },
  "warnings": [],
  "errors": []
}
```

### Good example questions
- What changed in this circular?
- Why is this marked high risk?
- Which team owns this action?
- What evidence do I need to upload?
- Show me the text that triggered this task.

### What the UI should show
- a small side panel or drawer
- simple chat bubbles
- source-linked answers
- recent conversation history

---

## 11. Workflow manager specification

### Purpose
The workflow manager coordinates all agents.

### Responsibilities
- choose which agent runs next
- pass shared state forward
- stop on error
- write progress updates
- save intermediate results
- trigger Firebase writes after each major step

### Logic
1. receive PDF or RSS item
2. create workflow run
3. run Agent 1
4. if success, run Agent 2
5. if success, run Agent 3
6. if success, run Agent 4
7. save all outputs to Firebase
8. mark workflow complete

### Recovery behavior
- if an agent fails, store the error
- show the step that failed
- allow retry of that step
- keep earlier successful outputs

### Frontend-friendly implementation
The workflow manager can be a TypeScript state controller that:
- stores current step
- stores outputs
- calls Gemini step by step
- updates the UI after each agent finishes

---

## 12. State transition model

### Suggested run states
- `idle`
- `file_received`
- `document_parsed`
- `summary_ready`
- `gap_ready`
- `tasks_ready`
- `saved`
- `completed`
- `error`

### UI behavior by state
- `file_received` → show upload confirmation
- `document_parsed` → show extraction progress
- `summary_ready` → show AI summary
- `gap_ready` → show comparison cards
- `tasks_ready` → show generated tasks
- `completed` → show success state
- `error` → show retry option

This makes the demo feel smooth and understandable.

---

## 13. Data storage mapping

### Firestore stores
- company profile
- baseline snapshot
- circular metadata
- workflow run state
- document data
- summary data
- obligations
- gap analysis
- tasks
- evidence metadata
- chat history

### Storage stores
- original circular PDF
- optional highlighted PDF
- evidence files
- optional exported reports

### Why the split matters
Firestore is for structured records. Storage is for large files. Keeping them separate makes the app cleaner and easier to scale.

---

## 14. Prompting policy

Each agent should have a focused system prompt and a strict output schema.

### Prompt rules
- no free-form essays
- no unrelated explanations
- return JSON only
- use the company baseline as context
- mention uncertainty when needed
- keep answers specific and actionable

### Prompt construction
Each agent prompt should include:
- role
- task
- input format
- output schema
- failure behavior
- strict formatting instructions

The same prompt file can later be reused or tuned without changing the code structure.

---

## 15. Error handling policy

### Document Intelligence Agent errors
- unreadable PDF
- scan quality too low
- extraction failure

### Compliance Analysis Agent errors
- no clear obligations found
- too much vague language
- output not structurally valid

### Gap Analysis Agent errors
- baseline missing
- baseline too generic
- no comparable obligation match

### Task Planning Agent errors
- task output too broad
- no department assignment
- unclear evidence requirements

### General error handling rule
If an agent fails:
- keep the partial data that already exists
- mark the current run as `needs_review`
- do not discard the entire workflow unless the file is unusable

---

## 16. Quality rules for the MVP

The MVP should prioritize these qualities:

- **transparency**: user sees why the AI made a decision
- **traceability**: every finding links back to the PDF
- **actionability**: output becomes a task
- **consistency**: all agents use the same state shape
- **simplicity**: no unnecessary agent count
- **demo clarity**: results are easy to explain in a few minutes

---

## 17. What not to build into the agents

Do not make the agents do these things in the MVP:
- login management
- UI rendering
- direct Firebase authentication logic
- complex role permissions
- long policy drafting
- general internet research
- automatic legal final approval

These are outside the MVP scope.

---

## 18. Future scaling path

The same 4-agent design can later expand into:
- more granular regulation-specific agents
- policy drafting agent
- evidence validation agent
- audit report agent
- notification agent
- multi-company comparison agent

But the first version should stay at 4 agents only.

---

## 19. Final summary of each agent

### Agent 1
Reads PDF and structures the document.

### Agent 2
Explains the regulation and identifies obligations.

### Agent 3
Compares obligations with the company baseline and finds gaps.

### Agent 4
Turns gaps into tasks.

### Workflow manager
Connects all agents in sequence.

### Ask RICE
Answers contextual questions from current data only.

---

## 20. Final rule for the MVP

If the output does not help the user understand:
- what changed,
- what is missing,
- or what action to take,

then it is not useful enough for the MVP.

RICE should always move the user from document → understanding → action.
