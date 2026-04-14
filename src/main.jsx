import React from 'react';
import ReactDOM from 'react-dom/client';
import AppShell from '@/components/layout/AppShell';
import { AppProvider } from '@/lib/store';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <AppShell />
    </AppProvider>
  </React.StrictMode>
);
