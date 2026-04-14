'use client';
import { useApp } from '@/lib/store';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Dashboard from '../sections/Dashboard';
import PromptEditor from '../sections/PromptEditor';
import TestSuite from '../sections/TestSuite';
import ExecuteEngine from '../sections/ExecuteEngine';
import Compare from '../sections/Compare';
import TemplateLibrary from '../sections/TemplateLibrary';
import Favorites from '../sections/Favorites';
import ToastContainer from '../ui/Toast';

export default function AppShell() {
  const { activeSection } = useApp();

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'prompts': return <PromptEditor />;
      case 'testsuites': return <TestSuite />;
      case 'execute': return <ExecuteEngine />;
      case 'compare': return <Compare />;
      case 'templates': return <TemplateLibrary />;
      case 'favorites': return <Favorites />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6" style={{ padding: '24px' }}>
          {renderSection()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
