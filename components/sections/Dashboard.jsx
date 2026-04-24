'use client';
import { useApp } from '@/lib/store';
import { calcK, calcL, calcCPQS, cpqsBand, cpqsBandClasses } from '@/lib/cpqs';
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

function ActivityItem({ icon, text, time, color, badge }) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.activityIcon} style={{ background: `${color}20`, color }}>{icon}</div>
      <div className={styles.activityContent} style={{ flex: 1 }}>
        <div className="flex justify-between items-center w-full">
          <span className={styles.activityText} style={{ fontWeight: 500 }}>{text}</span>
          {badge && <span className={`badge ${badge.className}`}>{badge.text}</span>}
        </div>
        <span className={styles.activityTime}>{time}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { prompts, testSuites, results, templates, setActiveSection, addNewPrompt, setCurrentPromptId } = useApp();

  // --- Calculate CPQS Average ---
  let totalCpqs = 0;
  let cpqsCount = 0;
  results.forEach(result => {
    result.outputs.forEach(out => {
      const R = out.score !== null && out.score !== undefined ? out.score : 3;
      const S = out.structureScore !== null && out.structureScore !== undefined ? out.structureScore : 3;
      const C = out.coherenceScore !== null && out.coherenceScore !== undefined ? out.coherenceScore : 3;
      const K = calcK(out.keyword_match);
      const L = calcL(out.output);
      totalCpqs += calcCPQS({ R, K, L, S, C });
      cpqsCount++;
    });
  });
  const avgCpqs = cpqsCount > 0 ? (totalCpqs / cpqsCount).toFixed(2) : 'N/A';

  const stats = [
    { icon: '📝', label: 'Total Prompts', value: prompts.length, color: 'var(--accent-blue)' },
    { icon: '📚', label: 'Templates', value: templates.length, color: 'var(--accent-purple)' },
    { icon: '⚡', label: 'Executions', value: results.length, color: 'var(--accent-green)' },
    { icon: '⭐', label: 'Avg. CPQS', value: avgCpqs, color: 'var(--accent-orange)' },
  ];

  // --- Dynamic Recent Runs ---
  const recentRuns = [...results]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5)
    .map(r => {
      const prompt = prompts.find(p => p.prompt_id === r.prompt_id);
      const title = prompt ? prompt.title : `Prompt ${r.prompt_id}`;
      
      // Calculate avg CPQS for this specific run
      let rTotalCpqs = 0;
      r.outputs.forEach(out => {
        const R = out.score ?? 3;
        const S = out.structureScore ?? 3;
        const C = out.coherenceScore ?? 3;
        const K = calcK(out.keyword_match);
        const L = calcL(out.output);
        rTotalCpqs += calcCPQS({ R, K, L, S, C });
      });
      const rAvgCpqs = r.outputs.length > 0 ? rTotalCpqs / r.outputs.length : 0;
      const band = cpqsBand(rAvgCpqs);

      return {
        id: r.result_id,
        icon: '🧪',
        text: `Executed ${title} (${r.version_id})`,
        time: new Date(r.timestamp).toLocaleDateString() + ' ' + new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: 'var(--accent-green)',
        badge: { text: `CPQS ${rAvgCpqs.toFixed(1)}`, className: cpqsBandClasses(band) }
      };
    });

  // --- Dynamic Recent Prompts ---
  const recentPrompts = [...prompts]
    .sort((a, b) => new Date(b.versions[b.versions.length - 1].created_at) - new Date(a.versions[a.versions.length - 1].created_at))
    .slice(0, 5);

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
              <div className="section-title">Recent Test Runs</div>
              <div className="section-subtitle">Your latest execution results</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('results')}>View All</button>
          </div>
          <div className={styles.activityList}>
            {recentRuns.length > 0 ? (
              recentRuns.map((a, i) => <ActivityItem key={i} {...a} />)
            ) : (
              <div className="text-sm text-muted p-4 text-center border border-border rounded-lg border-dashed">No recent runs</div>
            )}
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
              {recentPrompts.map(p => (
                <div 
                  key={p.prompt_id} 
                  className={`${styles.promptItem} cursor-pointer hover:border-accent-blue transition-colors`}
                  onClick={() => { setCurrentPromptId(p.prompt_id); setActiveSection('prompts'); }}
                >
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
