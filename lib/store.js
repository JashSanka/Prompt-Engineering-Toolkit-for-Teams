'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockPrompts, mockTestSuites, mockResults, mockTemplates } from './mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState('001');
  const [prompts, setPrompts] = useState(mockPrompts);
  const [testSuites, setTestSuites] = useState(mockTestSuites);
  const [results, setResults] = useState(mockResults);
  const [templates, setTemplates] = useState(mockTemplates);
  const [toasts, setToasts] = useState([]);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved'

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, fading: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, duration);
  }, []);

  const getCurrentPrompt = useCallback(() => {
    return prompts.find(p => p.prompt_id === currentPromptId) || prompts[0];
  }, [prompts, currentPromptId]);

  const savePromptVersion = useCallback((promptId, newText) => {
    setSaveStatus('saving');
    setTimeout(() => {
      setPrompts(prev => prev.map(p => {
        if (p.prompt_id !== promptId) return p;
        const latestVersion = p.versions[p.versions.length - 1];
        const nextNum = parseInt(latestVersion.version_id.replace('v', '')) + 1;
        return {
          ...p,
          versions: [...p.versions, {
            version_id: `v${nextNum}`,
            prompt_text: newText,
            created_at: new Date().toISOString(),
          }],
        };
      }));
      setSaveStatus('saved');
      addToast('Version saved successfully', 'success');
    }, 800);
  }, [addToast]);

  const rollbackVersion = useCallback((promptId, versionId) => {
    setPrompts(prev => prev.map(p => {
      if (p.prompt_id !== promptId) return p;
      const target = p.versions.find(v => v.version_id === versionId);
      if (!target) return p;
      const latestNum = parseInt(p.versions[p.versions.length - 1].version_id.replace('v', ''));
      return {
        ...p,
        versions: [...p.versions, {
          version_id: `v${latestNum + 1}`,
          prompt_text: target.prompt_text,
          created_at: new Date().toISOString(),
          rolledBackFrom: versionId,
        }],
      };
    }));
    addToast(`Rolled back to ${versionId} — new version created`, 'info');
  }, [addToast]);

  const toggleFavorite = useCallback((promptId) => {
    setPrompts(prev => prev.map(p =>
      p.prompt_id === promptId ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  }, []);

  const addTestCase = useCallback((suiteId, testCase) => {
    setTestSuites(prev => prev.map(s =>
      s.suite_id === suiteId
        ? { ...s, test_cases: [...s.test_cases, { id: `tc${Date.now()}`, ...testCase }] }
        : s
    ));
    addToast('Test case added', 'success');
  }, [addToast]);

  const runExecution = useCallback((promptId, versionId, suiteId) => {
    addToast('Running tests...', 'info', 1500);
    const suite = testSuites.find(s => s.suite_id === suiteId);
    if (!suite) return;

    setTimeout(() => {
      const newResult = {
        result_id: `r${Date.now()}`,
        prompt_id: promptId,
        version_id: versionId,
        suite_id: suiteId,
        timestamp: new Date().toISOString(),
        outputs: suite.test_cases.map(tc => ({
          test_case_id: tc.id,
          input: tc.input,
          output: `[Simulated AI response for: "${tc.input.substring(0, 40)}..."]`,
          exec_time_ms: 800 + Math.floor(Math.random() * 600),
          token_count: 40 + Math.floor(Math.random() * 40),
          score: null,
          keyword_match: 60 + Math.floor(Math.random() * 35),
          length_valid: true,
        })),
      };
      setResults(prev => [newResult, ...prev]);
      addToast('Execution complete!', 'success');
    }, 2000);
  }, [testSuites, addToast]);

  const saveAsTemplate = useCallback((prompt, versionId) => {
    const version = prompt.versions.find(v => v.version_id === versionId);
    if (!version) return;
    const newTemplate = {
      template_id: `T${String(templates.length + 1).padStart(3, '0')}`,
      title: prompt.title,
      category: prompt.tags[0] || 'General',
      description: `${versionId} of ${prompt.title}`,
      prompt_text: version.prompt_text,
      usage_count: 0,
    };
    setTemplates(prev => [newTemplate, ...prev]);
    addToast('Saved to Template Library!', 'success');
  }, [templates, addToast]);

  const scoreOutput = useCallback((resultId, outputIndex, score) => {
    setResults(prev => prev.map(r => {
      if (r.result_id !== resultId) return r;
      const outputs = r.outputs.map((o, i) => i === outputIndex ? { ...o, score } : o);
      return { ...r, outputs };
    }));
  }, []);

  return (
    <AppContext.Provider value={{
      activeSection, setActiveSection,
      darkMode, setDarkMode,
      sidebarCollapsed, setSidebarCollapsed,
      currentPromptId, setCurrentPromptId,
      prompts, testSuites, results, templates,
      toasts,
      saveStatus, setSaveStatus,
      addToast,
      getCurrentPrompt,
      savePromptVersion,
      rollbackVersion,
      toggleFavorite,
      addTestCase,
      runExecution,
      saveAsTemplate,
      scoreOutput,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
