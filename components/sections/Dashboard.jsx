'use client';
import { useApp } from '@/lib/store';
import styles from './Dashboard.module.css';

function StatCard({ icon, label, value, change, color }) {
  return (
    <div className="stat-card animate-fade-in-up">
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      </div>
      <div className="stat-number" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {change && <div className={`stat-change ${change.startsWith('+') ? 'up' : 'neutral'}`}>{change}</div>}
    </div>
  );
}

function ActivityItem({ icon, text, time, color }) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.activityIcon} style={{ background: `${color}20`, color }}>{icon}</div>
      <div className={styles.activityContent}>
        <span className={styles.activityText}>{text}</span>
        <span className={styles.activityTime}>{time}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { prompts, testSuites, results, templates, setActiveSection, addNewPrompt } = useApp();

  const stats = [
    { icon: '✏️', label: 'Total Prompts', value: prompts.length, change: `+${prompts.length} this week`, color: 'var(--accent-blue)' },
    { icon: '🧪', label: 'Test Suites', value: testSuites.length, change: `${testSuites.reduce((a, s) => a + s.test_cases.length, 0)} total cases`, color: 'var(--accent-purple)' },
    { icon: '⚡', label: 'Executions', value: results.length, change: '+2 today', color: 'var(--accent-green)' },
    { icon: '📚', label: 'Templates', value: templates.length, change: 'Ready to use', color: 'var(--accent-orange)' },
  ];

  const activities = [
    { icon: '💾', text: 'Article Summarizer → v4 saved', time: '2 hrs ago', color: 'var(--accent-blue)' },
    { icon: '⚡', text: 'Executed test suite on v3 & v4', time: '5 hrs ago', color: 'var(--accent-green)' },
    { icon: '⭐', text: 'Email Composer added to favorites', time: '1 day ago', color: 'var(--accent-orange)' },
    { icon: '📚', text: 'RTF Summarizer saved as template', time: '2 days ago', color: 'var(--accent-purple)' },
    { icon: '🧪', text: 'New test case added to Suite 001', time: '2 days ago', color: 'var(--accent-red)' },
    { icon: '🔀', text: 'Compared v3 vs v4 — v4 wins', time: '3 days ago', color: 'var(--accent-blue)' },
  ];

  return (
    <div className={styles.dashboard}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.welcomeTitle}>Welcome back! 👋</h1>
          <p className={styles.welcomeSub}>
            You have {prompts.reduce((a, p) => a + p.versions.length, 0)} prompt versions across {prompts.length} prompts.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setActiveSection('templates')}>
            📚 Browse Templates
          </button>
          <button className="btn btn-primary" onClick={() => { addNewPrompt('Untitled Prompt'); setActiveSection('prompts'); }}>
            ✏️ New Prompt
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ gap: '16px' }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Activity */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <div className="section-title">Recent Activity</div>
              <div className="section-subtitle">Your latest actions</div>
            </div>
          </div>
          <div className={styles.activityList}>
            {activities.map((a, i) => <ActivityItem key={i} {...a} />)}
          </div>
        </div>

        {/* Quick Prompts */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-header" style={{ marginBottom: 12 }}>
              <div className="section-title">Quick Start</div>
            </div>
            <div className={styles.quickActions}>
              {[
                { icon: '✏️', label: 'Create Prompt', section: 'prompts', color: 'var(--accent-blue)' },
                { icon: '🧪', label: 'Add Test Case', section: 'testsuites', color: 'var(--accent-purple)' },
                { icon: '▶️', label: 'Run Tests', section: 'execute', color: 'var(--accent-green)' },
                { icon: '🔀', label: 'Compare Versions', section: 'compare', color: 'var(--accent-orange)' },
              ].map((action) => (
                <button
                  key={action.section}
                  className={styles.quickAction}
                  onClick={() => setActiveSection(action.section)}
                >
                  <div className={styles.quickActionIcon} style={{ background: `${action.color}15`, color: action.color }}>
                    {action.icon}
                  </div>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Top Prompts */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: 12 }}>
              <div className="section-title">Your Prompts</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('prompts')}>View All →</button>
            </div>
            <div className={styles.promptList}>
              {prompts.map(p => (
                <div key={p.prompt_id} className={styles.promptItem}>
                  <div className={styles.promptInfo}>
                    <span className={styles.promptName}>{p.title}</span>
                    <div className="flex gap-2" style={{ marginTop: 4, flexWrap: 'wrap' }}>
                      {p.tags.slice(0, 2).map(t => (
                        <span key={t} className="badge badge-gray" style={{ fontSize: '0.68rem' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-blue">{p.versions[p.versions.length - 1].version_id}</span>
                    {p.isFavorite && <span title="Favorited">⭐</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
