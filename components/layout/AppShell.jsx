'use client';
import { useApp } from '@/lib/store';
import Topbar from './Topbar';
import PromptEditor from '../sections/PromptEditor';
import Compare from '../sections/Compare';
import TemplateLibrary from '../sections/TemplateLibrary';
import ResultsTable from '../sections/ResultsTable';
import Dashboard from '../sections/Dashboard';
import ToastContainer from '../ui/Toast';

export default function AppShell() {
  const { activeSection } = useApp();

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'prompts':   return <PromptEditor />;
      case 'compare':  return <Compare />;
      case 'templates': return <TemplateLibrary />;
      case 'results':  return <ResultsTable />;
      default:         return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-primary">
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6" style={{ padding: '24px' }}>
          {renderSection()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
