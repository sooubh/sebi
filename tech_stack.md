# RICE Tech Stack

> **Project:** RICE — Regulatory Intelligence & Compliance Engine  
> **Purpose:** This document freezes the tech stack for the MVP so the implementation stays consistent while building the app.

---

## 1. Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Lucide React

---

## 2. State Management

- Zustand
- TanStack Query

---

## 3. AI Layer

- Google Gemini API
- Google Gen AI SDK
- Structured JSON outputs
- Custom workflow manager in TypeScript
- 4 sequential AI agents

---

## 4. AI Workflow

- Document Intelligence Agent
- Compliance Analysis Agent
- Gap Analysis Agent
- Task Planning Agent
- Shared workflow state
- Sequential agent execution
- Frontend-first orchestration

---

## 5. Database

- Firebase Firestore

---

## 6. File Storage

- Firebase Storage

---

## 7. Authentication

- Firebase Authentication

---

## 8. PDF Handling

- PDF.js (`pdfjs-dist`)
- `react-pdf`
- Custom highlight overlay
- `react-pdf-viewer` plugins for optional future enhancement

---

## 9. RSS / Discovery

- Browser Fetch API
- RSS/XML parser

---

## 10. Forms and Validation

- React Hook Form
- Zod

---

## 11. Charts and Visualization

- Recharts

---

## 12. Utilities

- date-fns
- clsx
- class-variance-authority

---

## 13. Deployment

- Vercel for frontend
- Firebase for backend services

---

## 14. Development Tools

- Git
- GitHub
- ESLint
- Prettier
- GitHub Actions (optional)

---

## 15. Final MVP Architecture

```text
React + TypeScript
        │
        ▼
Workflow Manager
        │
        ├── Document Agent
        ├── Compliance Agent
        ├── Gap Analysis Agent
        └── Task Planner Agent
        │
        ▼
Gemini API
        │
        ▼
Firebase Firestore + Storage
        │
        ▼
PDF Viewer + Dashboard + Tasks
```

---

## 16. MVP Rule

Keep the stack lightweight.  
Do not add a custom backend unless the MVP absolutely needs it.
