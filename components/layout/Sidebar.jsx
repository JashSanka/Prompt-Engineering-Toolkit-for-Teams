'use client';
import { useApp } from '@/lib/store';
import styles from './Sidebar.module.css';

const navItems = [
  { id: 'dashboard',   icon: '⚡', label: 'Dashboard' },
  { id: 'prompts',     icon: '✏️', label: 'Prompts' },
  { id: 'testsuites',  icon: '🧪', label: 'Test Suites' },
  { id: 'execute',     icon: '▶️', label: 'Execute' },
  { id: 'results',     icon: '📊', label: 'Results' },
  { id: 'compare',     icon: '🔀', label: 'Compare' },
  { id: 'templates',   icon: '📚', label: 'Templates' },
  { id: 'favorites',   icon: '⭐', label: 'Favorites' },
];

export default function Sidebar() {
  const { activeSection, setActiveSection, sidebarCollapsed, setSidebarCollapsed, prompts } = useApp();
  const favCount = prompts.filter(p => p.isFavorite).length;

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>⚗️</div>
        {!sidebarCollapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoMain}>PromptKit</span>
            <span className={styles.logoSub}>for Teams</span>
          </div>
        )}
      </div>

      <div className={styles.divider} />

      {/* Nav */}
      <nav className={styles.nav}>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
            onClick={() => setActiveSection(item.id)}
            title={sidebarCollapsed ? item.label : ''}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!sidebarCollapsed && (
              <span className={styles.navLabel}>{item.label}</span>
            )}
            {!sidebarCollapsed && item.id === 'favorites' && favCount > 0 && (
              <span className={styles.navBadge}>{favCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className={styles.collapseBtn}>
        <button
          className={styles.collapseButton}
          onClick={() => setSidebarCollapsed(c => !c)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>
    </aside>
  );
}
