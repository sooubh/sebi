import React from 'react';
import { PDFViewerProvider } from './components/pdf/PDFViewerContext';
import { PDFWorkspaceDemo } from './components/pdf/PDFWorkspaceDemo';

export default function App() {
  return (
    <PDFViewerProvider>
      <PDFWorkspaceDemo />
    </PDFViewerProvider>
  );
}
