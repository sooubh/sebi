import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Dashboard from './pages/Dashboard';
import Circulars from './pages/Circulars';
import Workspace from './pages/Workspace';
import GapAnalysis from './pages/GapAnalysis';
import Tasks from './pages/Tasks';
import { PDFViewerProvider } from './components/pdf/PDFViewerContext';

export default function App() {
  return (
    <PDFViewerProvider>
      <Router>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/circulars" element={<Circulars />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/gap-analysis" element={<GapAnalysis />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </Router>
    </PDFViewerProvider>
  );
}
