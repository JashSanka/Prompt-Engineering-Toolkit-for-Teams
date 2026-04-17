'use client';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { frameworks } from '@/lib/mockData';
import Modal from '../ui/Modal';
import styles from './PromptEditor.module.css';

export default function PromptEditor() {
  const {
    prompts, getCurrentPrompt, savePromptVersion, rollbackVersion,
    addToast, saveStatus, toggleFavorite,
    currentPromptId, setCurrentPromptId,
    addNewPrompt, deletePrompt, saveAsTemplate,
    searchQuery,
  } = useApp();

  const prompt = getCurrentPrompt();

  const [activeTab, setActiveTab] = useState('editor');
  const [text, setText] = useState('');
  const [showFrameworks, setShowFrameworks] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [frameworkVals, setFrameworkVals] = useState({});
  const [rollbackModal, setRollbackModal] = useState({ show: false, version: null });
  const [newPromptModal, setNewPromptModal] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Quick Test state
  const [quickTestInput, setQuickTestInput] = useState('');
  const [quickTestOutput, setQuickTestOutput] = useState('');
  const [quickTestLoading, setQuickTestLoading] = useState(false);

  useEffect(() => {
    if (prompt) {
      setText(prompt.versions[prompt.versions.length - 1].prompt_text);
      setQuickTestOutput(''); // clear output when switching prompts
    }
  }, [prompt?.prompt_id]);

  if (!prompt) return null;

  const currentVersion = prompt.versions[prompt.versions.length - 1];

  // Filter prompt list by global search
  const filteredPrompts = searchQuery
    ? prompts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : prompts;

  const handleFrameworkChange = (k, v) => setFrameworkVals(prev => ({ ...prev, [k]: v }));

  const applyFramework = () => {
    if (!selectedFramework) return;
    const fw = frameworks[selectedFramework];
    setText(fw.template(frameworkVals));
    setShowFrameworks(false);
    setSelectedFramework(null);
    setFrameworkVals({});
    addToast('Framework applied! You can now edit the result.', 'success');
  };

  const executeRollback = () => {
    rollbackVersion(prompt.prompt_id, rollbackModal.version);
    setRollbackModal({ show: false, version: null });
  };

  const handleSaveVersion = () => {
    savePromptVersion(prompt.prompt_id, text);
  };

  const handleCreatePrompt = () => {
    if (!newPromptTitle.trim()) return;
    addNewPrompt(newPromptTitle.trim());
    setNewPromptTitle('');
    setNewPromptModal(false);
    setActiveTab('editor');
  };

  const handleDeletePrompt = () => {
    deletePrompt(prompt.prompt_id);
    setDeleteConfirmOpen(false);
  };

  const handleSaveAsTemplate = () => {
    saveAsTemplate(prompt, currentVersion.version_id);
  };

  const runQuickTest = useCallback(async () => {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      addToast('❌ Groq API key missing. Add VITE_GROQ_API_KEY to your .env file.', 'error', 5000);
      return;
    }
    if (!quickTestInput.trim()) {
      addToast('Enter a test input first.', 'error');
      return;
    }
    setQuickTestLoading(true);
    setQuickTestOutput('');
    try {
      const filledPrompt = text.replace('{{input}}', quickTestInput);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: filledPrompt }],
          max_tokens: 512,
          temperature: 0.7,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setQuickTestOutput(data.choices?.[0]?.message?.content || 'No response received.');
      addToast('✅ Quick test complete!', 'success');
    } catch (err) {
      addToast(`❌ Quick test failed: ${err.message}`, 'error', 5000);
    } finally {
      setQuickTestLoading(false);
    }
  }, [text, quickTestInput, addToast]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className="flex flex-col gap-2" style={{ flex: 1 }}>
          {/* Prompt Switcher */}
          <div className="flex items-center gap-3">
            <select
              className="select"
              value={currentPromptId}
              onChange={e => { setCurrentPromptId(e.target.value); setActiveTab('editor'); }}
              style={{ maxWidth: 260, fontWeight: 600 }}
            >
              {filteredPrompts.map(p => (
                <option key={p.prompt_id} value={p.prompt_id}>
                  {p.isFavorite ? '⭐ ' : ''}{p.title}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setNewPromptModal(true)}
              title="Create new prompt"
            >+ New</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => toggleFavorite(prompt.prompt_id)}
              title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >{prompt.isFavorite ? '⭐' : '☆'}</button>
          </div>

          <div className="tag-chips">
            {prompt.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="tabs">
            <button className={`tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>Editor</button>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
            <button className={`tab ${activeTab === 'testcases' ? 'active' : ''}`} onClick={() => setActiveTab('testcases')}>Test Cases</button>
            <button className={`tab ${activeTab === 'quicktest' ? 'active' : ''}`} onClick={() => setActiveTab('quicktest')}>⚡ Quick Test</button>
          </div>
        </div>
      </div>

      <div className={styles.workspace}>
        {/* Main Editor Area */}
        <div className={`${styles.mainEditor} card animate-fade-in`}>
          <div className={styles.toolbar}>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${showFrameworks ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowFrameworks(!showFrameworks)}
              >
                🧩 Use Framework
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => addToast('Auto-formatted!', 'info')}>
                ✨ Auto-format
              </button>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus === 'saving' && <span className="text-secondary text-xs">Saving...</span>}
              <button className="btn btn-secondary btn-sm" onClick={handleSaveAsTemplate} title="Save current version as template">
                📚 Save as Template
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveVersion}
                disabled={saveStatus === 'saving'}
              >
                💾 Save Version
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--accent-red)', opacity: 0.7 }}
                onClick={() => setDeleteConfirmOpen(true)}
                title="Delete this prompt"
              >
                🗑️
              </button>
            </div>
          </div>

          {showFrameworks && (
            <div className={styles.frameworkArea}>
              <div className="section-title text-sm mb-2">Select a Framework</div>
              <div className="framework-cards">
                {Object.values(frameworks).map(fw => (
                  <div
                    key={fw.name}
                    className={`framework-card ${selectedFramework === fw.name ? 'active' : ''}`}
                    onClick={() => setSelectedFramework(fw.name)}
                  >
                    <div className="framework-card-title">{fw.name}</div>
                    <div className="framework-card-abbr">{fw.fullName}</div>
                    <div className="framework-card-desc">{fw.description}</div>
                  </div>
                ))}
              </div>

              {selectedFramework && (
                <div className={`${styles.frameworkBuilder} mt-4`}>
                  <div className="grid-2">
                    {frameworks[selectedFramework].fields.map(f => (
                      <div key={f.key} className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-secondary">{f.label}</label>
                        <input
                          type="text"
                          className="input"
                          placeholder={f.placeholder}
                          value={frameworkVals[f.key] || ''}
                          onChange={e => handleFrameworkChange(f.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <button className="btn btn-primary" onClick={applyFramework}>Generate Prompt</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <textarea
            className={styles.editorTextarea}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your prompt here or select a framework above. Use {{input}} for variables..."
            spellCheck="false"
          />
        </div>

        {/* Right Sidebar Panels */}
        {activeTab === 'history' && (
          <div className={`${styles.versionPanel} card animate-fade-in`}>
            <div className="section-header">
              <div className="section-title">Version History</div>
            </div>

            <div className="version-timeline">
              {[...prompt.versions].reverse().map(v => (
                <div key={v.version_id} className={`version-item ${v.version_id === currentVersion.version_id ? 'current' : ''}`}>
                  <div>
                    <div className="version-label">
                      {v.version_id} {v.version_id === currentVersion.version_id && '(Current)'}
                      {v.rolledBackFrom && <span className="badge badge-gray ml-2">from {v.rolledBackFrom}</span>}
                    </div>
                    <div className="version-date">{new Date(v.created_at).toLocaleString()}</div>
                    {/* Preview snippet */}
                    <div className="text-muted text-xs mt-1" style={{ fontFamily: 'monospace', maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.prompt_text.substring(0, 60)}…
                    </div>
                  </div>
                  <div className="flex gap-1 flex-col items-end">
                    {v.version_id !== currentVersion.version_id && (
                      <>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => { setText(v.prompt_text); addToast(`Loaded ${v.version_id} into editor`, 'info'); }}
                          title="Load into editor"
                        >
                          📋
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => setRollbackModal({ show: true, version: v.version_id })}
                          title="Rollback to this version"
                        >
                          ↩️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Test Panel */}
        {activeTab === 'quicktest' && (
          <div className={`${styles.versionPanel} card animate-fade-in`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="section-header">
              <div>
                <div className="section-title">⚡ Quick Test</div>
                <div className="section-subtitle">Run a live AI test against the current prompt text</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-secondary">Test Input</label>
              <textarea
                className={styles.editorTextarea}
                style={{ minHeight: '80px', fontSize: '0.875rem' }}
                value={quickTestInput}
                onChange={e => setQuickTestInput(e.target.value)}
                placeholder="Enter your {{input}} value here..."
              />
            </div>

            <button
              className="btn btn-primary"
              disabled={quickTestLoading}
              onClick={runQuickTest}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {quickTestLoading ? (
                <>
                  <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Generating…
                </>
              ) : '⚡ Run Quick Test'}
            </button>

            {quickTestOutput && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">AI Output</label>
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  {quickTestOutput}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rollback Modal */}
      <Modal
        isOpen={rollbackModal.show}
        onClose={() => setRollbackModal({ show: false, version: null })}
        title={`Rollback to ${rollbackModal.version}?`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setRollbackModal({ show: false, version: null })}>Cancel</button>
            <button className="btn btn-primary" onClick={executeRollback}>Confirm Rollback</button>
          </>
        }
      >
        <p>Are you sure you want to rollback to <strong>{rollbackModal.version}</strong>?</p>
        <p className="text-muted mt-2 text-sm">
          This will not delete your current work. It will create a new version containing the content from {rollbackModal.version}.
        </p>
      </Modal>

      {/* New Prompt Modal */}
      <Modal
        isOpen={newPromptModal}
        onClose={() => { setNewPromptModal(false); setNewPromptTitle(''); }}
        title="Create New Prompt"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setNewPromptModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!newPromptTitle.trim()} onClick={handleCreatePrompt}>Create</button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold">Prompt Title</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Customer Support Reply"
            value={newPromptTitle}
            onChange={e => setNewPromptTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreatePrompt()}
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete Prompt Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={`Delete "${prompt.title}"?`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ background: 'var(--accent-red)' }} onClick={handleDeletePrompt}>Delete Prompt</button>
          </>
        }
      >
        <p className="text-secondary text-sm">This will permanently delete all versions, test cases, and results for this prompt.</p>
      </Modal>
    </div>
  );
}
