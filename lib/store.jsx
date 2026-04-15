'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockPrompts, mockTestSuites, mockResults, mockTemplates } from './mockData';

// ── Scoring Helpers ──────────────────────────────────────────
function keywordScore(output, expectedOutput) {
  if (!expectedOutput) return null;
  const keywords = expectedOutput
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4); // only meaningful words

  if (keywords.length === 0) return null;

  const lowerOutput = output.toLowerCase();
  const hits = keywords.filter(k => lowerOutput.includes(k));
  return Math.round((hits.length / keywords.length) * 100); // returns 0–100
}

function lengthScore(output, minWords = 20, maxWords = 200) {
  const wordCount = output.trim().split(/\s+/).length;
  if (wordCount < minWords) return false;
  if (wordCount > maxWords) return false;
  return true;
}
// ─────────────────────────────────────────────────────────────

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

  const runExecution = useCallback(async (promptId, versionId, suiteId) => {
    addToast('Running tests...', 'info', 1500);

    const suite = testSuites.find(s => s.suite_id === suiteId);
    const prompt = prompts.find(p => p.prompt_id === promptId);
    if (!suite || !prompt) return;

    const version = prompt.versions.find(v => v.version_id === versionId);
    if (!version) return;

    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

    try {
      const outputsPromises = suite.test_cases.map(async (tc) => {
        const filledPrompt = version.prompt_text.replace('{{input}}', tc.input);
        const start = Date.now();

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: filledPrompt }],
            max_tokens: 512,
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        const output = data.choices?.[0]?.message?.content || 'Error: no response';
        const exec_time_ms = Date.now() - start;
        const token_count = data.usage?.completion_tokens || 0;

        return {
          test_case_id: tc.id,
          input: tc.input,
          output,
          exec_time_ms,
          token_count,
          score: null,
          keyword_match: keywordScore(output, tc.expected_output),
          length_valid: lengthScore(output),
        };
      });

      const outputs = await Promise.all(outputsPromises);

      const newResult = {
        result_id: `r${Date.now()}`,
        prompt_id: promptId,
        version_id: versionId,
        suite_id: suiteId,
        timestamp: new Date().toISOString(),
        outputs,
      };

      setResults(prev => [newResult, ...prev]);
      addToast('Execution complete!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Execution failed. Check API key or network.', 'error');
    }
  }, [testSuites, prompts, addToast]);

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

  const compareVersions = useCallback((promptId, versionAId, versionBId) => {
    const versionAResults = results.filter(
      r => r.prompt_id === promptId && r.version_id === versionAId
    );
    const versionBResults = results.filter(
      r => r.prompt_id === promptId && r.version_id === versionBId
    );

    if (versionAResults.length === 0 || versionBResults.length === 0) {
      addToast('Run both versions before comparing!', 'error');
      return null;
    }

    // flatten all outputs for each version
    const aOutputs = versionAResults.flatMap(r => r.outputs);
    const bOutputs = versionBResults.flatMap(r => r.outputs);

    // average score (manual 1-5)
    const avgScore = (outputs) => {
      const scored = outputs.filter(o => o.score !== null);
      if (scored.length === 0) return 0;
      return scored.reduce((sum, o) => sum + o.score, 0) / scored.length;
    };

    // average keyword match (0-100)
    const avgKeyword = (outputs) => {
      const matched = outputs.filter(o => o.keyword_match !== null);
      if (matched.length === 0) return 0;
      return matched.reduce((sum, o) => sum + o.keyword_match, 0) / matched.length;
    };

    // average output length in words
    const avgLength = (outputs) =>
      outputs.reduce((sum, o) => sum + o.output.trim().split(/\s+/).length, 0) / outputs.length;

    // average response time
    const avgSpeed = (outputs) =>
      outputs.reduce((sum, o) => sum + o.exec_time_ms, 0) / outputs.length;

    const aScore    = avgScore(aOutputs);
    const bScore    = avgScore(bOutputs);
    const aKeyword  = avgKeyword(aOutputs);
    const bKeyword  = avgKeyword(bOutputs);
    const aLength   = avgLength(aOutputs);
    const bLength   = avgLength(bOutputs);
    const aSpeed    = avgSpeed(aOutputs);
    const bSpeed    = avgSpeed(bOutputs);

    // winner = whoever has higher keyword match (most reliable automatic metric)
    const winner = aKeyword >= bKeyword ? versionAId : versionBId;

    return {
      versionA: {
        id: versionAId,
        avgScore:   Math.round(aScore * 10) / 10,
        avgKeyword: Math.round(aKeyword),
        avgLength:  Math.round(aLength),
        avgSpeed:   Math.round(aSpeed),
      },
      versionB: {
        id: versionBId,
        avgScore:   Math.round(bScore * 10) / 10,
        avgKeyword: Math.round(bKeyword),
        avgLength:  Math.round(bLength),
        avgSpeed:   Math.round(bSpeed),
      },
      winner,
    };
  }, [results, addToast]);

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
      saveAsTemplate,
      scoreOutput,
      compareVersions,
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
