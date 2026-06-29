# RICE UI Pages Specification

> **Project:** RICE — Regulatory Intelligence & Compliance Engine  
> **Document purpose:** This file defines the UI structure for the MVP page by page. It explains what each page looks like, what sections it contains, what the user can do there, and how the screen should behave in loading, empty, and error states.  
> **MVP rule:** Keep the app focused, readable, and demo-friendly. The UI should show the full compliance workflow without adding unnecessary enterprise complexity.

---

## 1. UI Design Direction

The UI should feel like a modern compliance SaaS product.

### Overall look and feel
- clean white or very light neutral background
- dark sidebar for navigation
- soft colored status chips
- rounded cards
- strong spacing
- minimal clutter
- clear hierarchy
- readable typography
- transparent AI explanations
- one strong accent color for the product identity

### Visual goal
The interface should feel:
- professional
- trustworthy
- calm
- operational
- easy to scan during a live demo

### Design principle
Show the important thing first. Use cards, chips, short summaries, and visual grouping so the user can understand the situation quickly.

---

## 2. App Shell

The entire app should use one consistent shell.

### Left sidebar
- Dashboard
- SEBI Circulars
- Analysis Workspace
- Gap Analysis
- Tasks

### Top bar
- company name
- current circular name
- search or quick action
- user badge or demo badge
- notification or status indicator

### Main content area
The content area should change per page while the sidebar remains constant.

### Global floating control
A small floating or docked **Ask RICE** control can appear on most pages, but it should remain secondary to the main workflow.

---

## 3. MVP Page Count

The MVP should have **5 main pages**.

1. Dashboard  
2. SEBI Circulars  
3. Circular Analysis Workspace  
4. Gap Analysis  
5. Tasks  

This is enough to demonstrate the full compliance flow clearly.

---

# PAGE 1 — DASHBOARD

## 4. Dashboard purpose

The dashboard is the first screen the user sees. Its job is to answer one question quickly:

**Am I compliant, and what needs attention right now?**

This page should not be overloaded. It should act as a summary view only.

---

## 5. Dashboard layout

### Top section
A compact hero area with:
- company name
- demo company status
- one-line compliance context
- current overall compliance score
- latest circular summary

### Middle section
A row of summary cards:
- Compliance Score
- Active Tasks
- Overdue Tasks
- New Circulars
- Missing Evidence
- High Risk Items

### Lower section
- Recent circulars
- Recent workflow activity
- top alerts
- short AI insight card

---

## 6. Dashboard sections in detail

### 6.1 Company header block
Shows:
- SOUBH Securities Pvt. Ltd.
- Demo company tag
- Stock broker profile
- baseline version
- current status

This block gives the user context immediately.

### 6.2 Compliance score card
Shows:
- percentage score
- trend indicator
- short note such as “3 gaps need review”

This is the most visible health metric.

### 6.3 Task summary cards
Separate cards for:
- pending
- in progress
- overdue
- completed

These should be visually clear and easy to compare.

### 6.4 Alert panel
Shows:
- critical gaps
- missing evidence
- newly detected obligations
- urgent tasks due soon

### 6.5 Recent activity feed
Shows:
- circular processed
- tasks created
- evidence uploaded
- task completed
- chatbot question answered

### 6.6 AI insight card
A short card that explains the current compliance posture in one or two sentences.

Example style:
- “A new circular introduces 3 obligations. 2 are already covered. 1 requires policy update.”

This makes the dashboard feel intelligent without becoming a chatbot page.

---

## 7. Dashboard interactions

User actions:
- click a circular to open it
- click a task to inspect it
- click an alert to jump to the relevant page
- click compliance score to see explanation

---

## 8. Dashboard empty state

If no data exists:
- show seeded demo company
- show “No circular processed yet”
- show one CTA: “Upload or discover a circular”

---

## 9. Dashboard loading state

Use:
- skeleton cards
- placeholder rows
- spinner only for the top status area

---

## 10. Dashboard error state

If data loading fails:
- show a simple error banner
- keep sidebar visible
- provide retry button
- do not break the whole page

---

# PAGE 2 — SEBI CIRCULARS

## 11. Circulars page purpose

This page is the entry point for circular intake.

It should support two sources:
- manual PDF upload
- RSS-discovered circulars

This page shows what came in and lets the user open it for analysis.

---

## 12. Circulars page layout

### Top strip
- page title
- source tabs
- upload button
- refresh/discover button
- search field
- filter chips

### Main list
A list or grid of circular cards.

### Right-side detail panel or modal
Click a circular to inspect:
- metadata
- source
- status
- preview
- open analysis button

---

## 13. Circular card contents

Each circular card should show:
- circular title
- circular number
- issue date
- source type
- process status
- risk tag
- count of obligations extracted
- affected department count

Cards should be compact and visually clear.

---

## 14. Source handling

### Manual upload mode
The user uploads a PDF manually.

### RSS discovery mode
The system shows new circulars detected from the feed.

Both modes should land in the same analysis workflow.

---

## 15. Circulars page interactions

User can:
- upload PDF
- refresh discovery
- search circulars
- filter by status
- filter by source
- open a circular
- re-run analysis if needed

---

## 16. Circulars empty state

If no circulars are present:
- show a friendly empty card
- explain the two intake methods
- provide two CTAs:
  - Upload PDF
  - Discover from RSS

---

## 17. Circulars loading state

Show:
- skeleton cards in the list
- loading label on discovery
- upload progress indicator if needed

---

## 18. Circulars error state

If discovery fails or upload fails:
- show a small banner
- keep the list visible if possible
- allow retry
- do not wipe existing circulars

---

# PAGE 3 — CIRCULAR ANALYSIS WORKSPACE

## 19. Purpose of this page

This is the main demo page.

It must show:
- the original PDF
- highlighted sections
- AI summary
- key changes
- obligations
- chatbot
- transparency of reasoning

This page should feel like a compliance review room.

---

## 20. Layout concept

### Left panel
AI output and explanation.

### Center or right panel
Embedded PDF viewer.

### Secondary side drawer or bottom panel
Ask RICE chatbot and quick actions.

This page should feel like a side-by-side review workspace, not a simple document viewer.

---

## 21. Main sections of the page

### 21.1 Header
- circular title
- issue date
- source
- status
- confidence score
- risk tag
- open original PDF button

### 21.2 AI summary box
A short summary in plain language.

Should answer:
- what the circular is about
- what changed
- who is affected
- why it matters

### 21.3 Key changes block
Separate chips or cards for:
- new items
- modified items
- already covered items
- evidence-related items

### 21.4 Obligations list
Each obligation should show:
- title
- department
- priority
- risk label
- source page
- source paragraph
- click to highlight in PDF

### 21.5 PDF viewer
The PDF must stay visible on the same page.

The viewer should support:
- zoom
- scroll
- page navigation
- highlight overlays
- click-to-jump from obligation to text
- hover explanation if possible

### 21.6 Ask RICE panel
A small chatbot area for contextual questions.

### 21.7 Source explanation strip
A small strip below the PDF or alongside it that explains the color legend and what each highlight means.

---

## 22. Highlight rules for the PDF

### Green
Already compliant / matched baseline

### Yellow
Modified requirement / changed language

### Red
New requirement / high risk

### Blue
Evidence or proof-related text

The highlight must have a clear reason attached.

---

## 23. What the user should be able to do here

- read the AI summary
- inspect the PDF
- click a highlight
- click an obligation
- ask a question
- see why a rule was flagged
- move into gap analysis

---

## 24. Circular workspace empty state

If no file is loaded:
- show a placeholder PDF frame
- show a message: “Upload or discover a circular to begin”
- show one CTA button

---

## 25. Circular workspace loading state

This page should show analysis progress step by step:
- parsing document
- summarizing
- comparing baseline
- generating tasks

Use step chips or a small progress timeline.

---

## 26. Circular workspace error state

If analysis fails:
- preserve the PDF if possible
- show which step failed
- allow retry for the failed step
- do not hide the existing outputs

---

# PAGE 4 — GAP ANALYSIS

## 27. Purpose of this page

This page answers the most important operational question:

**What changed relative to the company’s current compliance baseline?**

This is the decision page.

---

## 28. Layout concept

Use a clean comparison layout.

### Top section
- overall risk summary
- gap score
- compliance posture

### Middle section
Four comparison blocks:
- already compliant
- modified requirements
- new requirements
- missing evidence

### Bottom section
- manual review items
- generate tasks button
- short summary notes

---

## 29. Gap analysis sections in detail

### 29.1 Already compliant
Items already covered by the current baseline.

Each item should show:
- obligation title
- matched policy or control
- why it is considered covered

### 29.2 Modified requirements
Items that exist in baseline form but have changed.

Each item should show:
- old state
- new state
- difference
- severity

### 29.3 New requirements
Items not currently covered by the baseline.

Each item should show:
- title
- business meaning
- affected department
- severity

### 29.4 Missing evidence
Items where the rule may already exist, but proof is missing.

Each item should show:
- expected evidence
- current status
- why it matters

### 29.5 Manual review items
Items where the AI is uncertain.

These should be visually softer but clearly visible.

---

## 30. Gap analysis interactions

User can:
- expand an item
- jump back to the highlighted PDF text
- open related task draft
- generate tasks from this page
- mark an item for manual review

---

## 31. Gap analysis empty state

If the system has nothing to compare:
- show a prompt to load a circular
- explain that a company baseline is required
- show the current demo baseline status

---

## 32. Gap analysis loading state

Use comparison skeletons and a “matching baseline” status indicator.

---

## 33. Gap analysis error state

If baseline data is missing or weak:
- show a banner
- explain that the baseline must be loaded
- provide a path back to the dashboard or company data

---

# PAGE 5 — TASKS

## 34. Purpose of this page

This page turns compliance analysis into operational work.

It should make it obvious what needs to be done next.

---

## 35. Tasks page layout

### Top section
- task overview cards
- task counts by status
- task counts by priority

### Main section
A task list or task board.

### Side panel or top filters
- status filter
- department filter
- priority filter
- evidence pending filter

---

## 36. Task card contents

Each task should show:
- title
- department
- owner role
- priority
- status
- due date
- linked obligation
- evidence required
- completion checkbox or action button

---

## 37. Task interaction model

User can:
- open a task
- upload evidence
- mark complete
- add notes
- view source obligation
- jump back to PDF highlight

---

## 38. Task states

Suggested states:
- pending
- in progress
- awaiting evidence
- reviewing
- completed
- blocked

These should be shown as clear chips.

---

## 39. Tasks empty state

If there are no tasks:
- show “No tasks generated yet”
- provide a CTA to open a circular
- explain that tasks appear after analysis

---

## 40. Tasks loading state

Use task skeleton cards and progress labels.

---

## 41. Tasks error state

If a task fails to save:
- show a simple error
- keep the draft visible
- allow retry

---

# 42. Shared UI components

These components should be reused across pages.

### Core components
- sidebar
- top bar
- status chips
- summary cards
- task cards
- circular cards
- highlight legend
- PDF frame
- chatbot drawer
- filter chips
- empty state panel
- loading skeletons
- error banners

---

# 43. Navigation behavior

### Sidebar behavior
The sidebar should stay fixed.

### Active state
The current page should be clearly marked.

### Jump behavior
From anywhere in the app, clicking a circular or task should open the relevant page and preserve context.

---

# 44. Modal and drawer usage

Use modals and drawers sparingly.

### Good uses
- circular preview
- Ask RICE
- task detail quick view
- evidence preview

### Bad uses
- putting all analysis in modals
- hiding the core workflow behind popups

---

# 45. Color and typography rules

### Color rules
- use one accent color for the brand
- red for risk and critical warnings
- yellow for changes and caution
- green for compliant states
- blue for evidence or information

### Typography rules
- large headings
- compact body text
- strong number styling for scores
- readable line spacing

---

# 46. Mobile and small-screen behavior

The MVP should still be usable on smaller screens, but the main demo can be desktop-first.

### On small screens
- sidebar becomes collapsible
- PDF and analysis stack vertically
- cards move into a single column
- chatbot becomes a bottom sheet or drawer

---

# 47. What not to include in UI MVP

Do not add:
- full settings page
- large analytics suite
- advanced admin panel
- multi-company switching
- custom report builder
- large permission matrix

These are not needed to show the main idea.

---

# 48. Final page summary

### Page 1 — Dashboard
Shows the compliance state in one glance.

### Page 2 — SEBI Circulars
Shows incoming circulars from upload or discovery.

### Page 3 — Circular Analysis Workspace
Shows PDF, highlights, AI summary, and chatbot.

### Page 4 — Gap Analysis
Shows what changed versus company baseline.

### Page 5 — Tasks
Shows operational follow-up work and evidence.

---

# 49. Final UI goal

The UI should help the user move through one continuous story:

**See the company state → inspect the circular → understand what changed → generate tasks → collect evidence**

If the user can understand that story in under a minute, the MVP design is working.
