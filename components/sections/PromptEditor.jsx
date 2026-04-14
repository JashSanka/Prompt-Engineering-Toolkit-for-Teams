'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { frameworks } from '@/lib/mockData';
import Modal from '../ui/Modal';
import styles from './PromptEditor.module.css';

export default function PromptEditor() {
  const { getCurrentPrompt, savePromptVersion, rollbackVersion, addToast, saveStatus } = useApp();
  const prompt = getCurrentPrompt();
  
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'history' | 'testcases'
  const [text, setText] = useState('');
  const [showFrameworks, setShowFrameworks] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [frameworkVals, setFrameworkVals] = useState({});
  const [rollbackModal, setRollbackModal] = useState({ show: false, version: null });

  useEffect(() => {
    if (prompt) {
      setText(prompt.versions[prompt.versions.length - 1].prompt_text);
    }
  }, [prompt]);

  if (!prompt) return null;

  const currentVersion = prompt.versions[prompt.versions.length - 1];

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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className="flex flex-col gap-2">
          <input 
            type="text" 
            className={styles.titleInput} 
            defaultValue={prompt.title} 
            placeholder="Prompt Title"
          />
          <div className="tag-chips">
            {prompt.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
            <button className="tag-chip removable" style={{ padding: '0 6px' }}>+</button>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="tabs">
            <button className={`tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>Editor</button>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
            <button className={`tab ${activeTab === 'testcases' ? 'active' : ''}`} onClick={() => setActiveTab('testcases')}>Test Cases</button>
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
            {saveStatus === 'saving' && <span className="text-secondary text-xs">Saving...</span>}
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

        {/* Right Sidebar - Version Control */}
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
                  </div>
                  {v.version_id !== currentVersion.version_id && (
                    <button 
                      className="btn btn-ghost btn-icon" 
                      onClick={() => setRollbackModal({ show: true, version: v.version_id })}
                      title="Rollback to this version"
                    >
                      ↩️
                    </button>
                  )}
                </div>
              ))}
            </div>
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
    </div>
  );
}
