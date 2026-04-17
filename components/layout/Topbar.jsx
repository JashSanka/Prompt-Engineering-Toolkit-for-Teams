'use client';
import { useApp } from '@/lib/store';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { getCurrentPrompt, saveStatus, darkMode, setDarkMode, setActiveSection, savePromptVersion, addToast, searchQuery, setSearchQuery } = useApp();
  const prompt = getCurrentPrompt();
  const currentVersion = prompt?.versions[prompt.versions.length - 1];

  const handleSave = () => {
    if (prompt && currentVersion) {
      savePromptVersion(prompt.prompt_id, currentVersion.prompt_text);
      addToast('Snapshot saved as new version', 'success');
    }
  };

  const handleRun = () => {
    setActiveSection('execute');
  };

  const handleCompare = () => {
    setActiveSection('compare');
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) setActiveSection('prompts');
  };

  return (
    <header className={styles.topbar}>
      {/* Search */}
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search prompts, templates, test suites..."
          value={searchQuery}
          onChange={handleSearch}
        />
        <kbd className={styles.searchKbd}>⌘K</kbd>
      </div>

      {/* Current Context */}
      {prompt && (
        <div className={styles.context}>
          <span className={styles.contextName}>{prompt.title}</span>
          <span className={`badge badge-blue ${styles.versionBadge}`}>
            {currentVersion?.version_id} · Current
          </span>
        </div>
      )}

      <div className={styles.actions}>
        {/* Save Status */}
        <span className={`${styles.saveStatus} ${saveStatus === 'saving' ? styles.saving : styles.saved}`}>
          {saveStatus === 'saving' ? (
            <><span className={styles.spinner} />Saving…</>
          ) : (
            <><span className={styles.savedDot} />Saved</>
          )}
        </span>

        <div className={styles.divider} />

        {/* Action Buttons */}
        <button className={`btn btn-ghost btn-sm ${styles.actionBtn}`} onClick={handleSave}>
          💾 Save
        </button>
        <button className={`btn btn-primary btn-sm ${styles.actionBtn}`} onClick={handleRun}>
          ▶ Run
        </button>
        <button className={`btn btn-secondary btn-sm ${styles.actionBtn}`} onClick={handleCompare}>
          🔀 Compare
        </button>

        <div className={styles.divider} />

        {/* Dark Mode Toggle */}
        <button
          className={styles.themeToggle}
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className={styles.toggleTrack}>
            <span className={`${styles.toggleThumb} ${darkMode ? styles.dark : styles.light}`} />
          </span>
          <span className={styles.themeIcon}>{darkMode ? '🌙' : '☀️'}</span>
        </button>
      </div>
    </header>
  );
}
