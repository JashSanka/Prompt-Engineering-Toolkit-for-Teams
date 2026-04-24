'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { calcK, calcL, calcCPQS, cpqsBandClasses, cpqsBand, cpqsTooltip } from '@/lib/cpqs';
import Modal from '../ui/Modal';

// ─── Constants ────────────────────────────────────────────────────────────────
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

// ─── Groq helpers ─────────────────────────────────────────────────────────────
async function callGroq(messages, apiKey, maxTokens = 512, temperature = 0.7) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function scoreMetric(label, description, input, output, apiKey) {
  const prompt = `You are an expert AI output evaluator. Score the following AI output for "${label}" on a scale of 1–5.\n${description}\nReturn ONLY the integer score (1, 2, 3, 4, or 5). No explanation.\n\nInput: ${input}\nOutput: ${output}`;
  const raw = await callGroq([{ role: 'user', content: prompt }], apiKey, 10, 0.1);
  const n = parseInt(raw, 10);
  return (!isNaN(n) && n >= 1 && n <= 5) ? n : 3;
}

// ─── CPQS Formula Explainer ───────────────────────────────────────────────────
const METRICS_INFO = [
  {
    key: 'R', label: 'Relevance', weight: '30%', color: 'var(--accent-purple)',
    ratedBy: '🤖 AI', icon: '🎯',
    desc: 'How well the output answers the input prompt. Scored 1–5 by AI.',
  },
  {
    key: 'K', label: 'Keyword Match', weight: '25%', color: 'var(--accent-blue)',
    ratedBy: '⚙️ Auto', icon: '🔑',
    desc: 'Percentage of important keywords from the expected output found in the AI output. Rescaled to 0–5.',
  },
  {
    key: 'L', label: 'Length', weight: '15%', color: 'var(--accent-green)',
    ratedBy: '⚙️ Auto', icon: '📏',
    desc: 'Whether the output is within an acceptable word-count range (20–200 words). Scored 1, 3, or 5.',
  },
  {
    key: 'S', label: 'Structure', weight: '15%', color: 'var(--accent-orange)',
    ratedBy: '🤖 AI', icon: '🏗️',
    desc: 'How logically organised and clearly formatted the output is. Scored 1–5 by AI.',
  },
  {
    key: 'C', label: 'Coherence', weight: '15%', color: '#ef4444',
    ratedBy: '👤 You', icon: '🔗',
    desc: 'How consistent, readable and easy-to-follow the output is. Rated 1–5 by you after results are shown.',
  },
];

function CpqsExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 18px', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📊</span> How is CPQS calculated?
        </span>
        <span style={{
          fontSize: '0.75rem', color: 'var(--text-muted)',
          display: 'inline-block', transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none',
        }}>▼</span>
      </button>

      {open && (
        <div style={{ padding: '20px 20px 24px', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Formula bar */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Composite Prompt Quality Score Formula
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.93rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.8 }}>
              CPQS = (R × 0.30) + (K × 0.25) + (L × 0.15) + (S × 0.15) + (C × 0.15)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              All metrics on a 1–5 scale · Final score ranges 0 → 5
            </div>
          </div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            {METRICS_INFO.map(m => (
              <div key={m.key} style={{
                background: 'var(--bg-secondary)', border: `1px solid ${m.color}40`,
                borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
                  <span style={{
                    fontSize: '0.68rem', background: `${m.color}18`, color: m.color,
                    border: `1px solid ${m.color}40`, borderRadius: 4, padding: '2px 7px', fontWeight: 700,
                  }}>×{m.weight}</span>
                </div>
                <div style={{ fontWeight: 700, color: m.color, fontSize: '0.88rem' }}>{m.key} — {m.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{m.desc}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Rated by: <strong style={{ color: 'var(--text-primary)' }}>{m.ratedBy}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Score bands */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Score Bands
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Excellent', range: '4.0 – 5.0', color: 'var(--accent-green)', bg: 'var(--accent-green)15' },
                { label: 'Good',      range: '2.5 – 3.9', color: 'var(--accent-orange)', bg: 'var(--accent-orange)15' },
                { label: 'Needs Work', range: '0.0 – 2.4', color: '#ef4444', bg: '#ef444415' },
              ].map(b => (
                <div key={b.label} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: b.bg, border: `1px solid ${b.color}40`, borderRadius: 8, padding: '8px 14px',
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: b.color }}>{b.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.range}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Coherence Picker (user-rated) ────────────────────────────────────────────
function CoherencePicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: 120 }}>Coherence (C)</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              width: 30, height: 30, borderRadius: 6,
              border: `2px solid ${value >= n ? '#ef4444' : 'var(--border)'}`,
              background: value >= n ? '#ef444420' : 'var(--bg-secondary)',
              color: value >= n ? '#ef4444' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>you rate</span>
    </div>
  );
}

// ─── Score Row ────────────────────────────────────────────────────────────────
function ScoreRow({ label, val, color, note }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        {label}
        {note && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>({note})</span>}
      </span>
      <span style={{ fontWeight: 700, color, fontSize: '0.85rem' }}>{val}</span>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ data, cpqs, coh, setCoh, badgeClass }) {
  return (
    <div className="split-pane">
      <div className="split-pane-header justify-between">
        <div className="flex gap-2 items-center">
          <span className={`badge ${badgeClass}`}>{data.versionId}</span>
          <span className={`badge ${cpqsBandClasses(cpqsBand(cpqs))}`}>CPQS {cpqs.toFixed(2)}</span>
        </div>
        <span className="text-xs text-muted">{data.execMs}ms</span>
      </div>
      <div className="split-pane-body flex flex-col gap-4">

        {/* Output */}
        <div>
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">AI Output</div>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '12px 14px', fontSize: '0.83rem', color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 220, overflowY: 'auto',
          }}>
            {data.output}
          </div>
        </div>

        {/* Scores */}
        <div>
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Scores</div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
            <ScoreRow label="Relevance (R)"     val={`${data.R}/5`}  color="var(--accent-purple)" note="AI rated" />
            <ScoreRow label="Structure (S)"     val={`${data.S}/5`}  color="var(--accent-orange)" note="AI rated" />
            <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <CoherencePicker value={coh} onChange={setCoh} />
            </div>
            <ScoreRow label="Length (L)"        val={`${data.L}/5`}  color="var(--accent-green)"  note="auto" />
            <ScoreRow label="Word Count"        val={data.words}     color="var(--text-secondary)" />
            <ScoreRow label="Response Time"     val={`${data.execMs}ms`} color="var(--text-secondary)" />
          </div>
        </div>

        {/* CPQS breakdown */}
        <div style={{
          fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace',
          whiteSpace: 'pre', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: 8,
          padding: '10px 14px', lineHeight: 1.8,
        }}>
          {cpqsTooltip({ R: data.R, K: data.K, L: data.L, S: data.S, C: coh }, cpqs)}
        </div>

      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Compare() {
  const { currentPromptId, prompts, addToast } = useApp();
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const prompt = prompts.find(p => p.prompt_id === currentPromptId);

  const [versionA, setVersionA]   = useState('');
  const [versionB, setVersionB]   = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [loading, setLoading]     = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [compResult, setCompResult]   = useState(null);

  // User-rated Coherence — separate so CPQS updates live
  const [cohA, setCohA] = useState(3);
  const [cohB, setCohB] = useState(3);

  if (!prompt) return null;

  const canCompare = versionA && versionB && versionA !== versionB;

  const liveCpqsA = useMemo(() => {
    if (!compResult) return 0;
    return calcCPQS({ R: compResult.a.R, K: compResult.a.K, L: compResult.a.L, S: compResult.a.S, C: cohA });
  }, [compResult, cohA]);

  const liveCpqsB = useMemo(() => {
    if (!compResult) return 0;
    return calcCPQS({ R: compResult.b.R, K: compResult.b.K, L: compResult.b.L, S: compResult.b.S, C: cohB });
  }, [compResult, cohB]);

  const winner = useMemo(() => {
    if (!compResult) return null;
    if (liveCpqsA > liveCpqsB + 0.05) return { v: versionA, reason: `Higher CPQS (${liveCpqsA.toFixed(2)} vs ${liveCpqsB.toFixed(2)})` };
    if (liveCpqsB > liveCpqsA + 0.05) return { v: versionB, reason: `Higher CPQS (${liveCpqsB.toFixed(2)} vs ${liveCpqsA.toFixed(2)})` };
    if (compResult.a.execMs < compResult.b.execMs - 100) return { v: versionA, reason: `Tied on CPQS — faster (${compResult.a.execMs}ms vs ${compResult.b.execMs}ms)` };
    if (compResult.b.execMs < compResult.a.execMs - 100) return { v: versionB, reason: `Tied on CPQS — faster (${compResult.b.execMs}ms vs ${compResult.a.execMs}ms)` };
    return { v: 'Tie', reason: 'Identical performance across all metrics' };
  }, [compResult, liveCpqsA, liveCpqsB, versionA, versionB]);

  const handleOpenModal = () => {
    if (!GROQ_API_KEY) {
      addToast('❌ VITE_GROQ_API_KEY missing from .env', 'error', 5000);
      return;
    }
    if (!canCompare) { addToast('Select two different versions first.', 'error'); return; }
    setTestInput('');
    setCompResult(null);
    setModalOpen(true);
  };

  const handleRunComparison = async () => {
    if (!testInput.trim()) { addToast('Enter a test input first.', 'error'); return; }
    const verA = prompt.versions.find(v => v.version_id === versionA);
    const verB = prompt.versions.find(v => v.version_id === versionB);
    if (!verA || !verB) return;

    setLoading(true);
    setLoadingStep('Running both versions...');

    try {
      const [outA, outB] = await Promise.all([
        (async () => {
          const filled = verA.prompt_text.replace('{{input}}', testInput);
          const start = Date.now();
          const text = await callGroq([{ role: 'user', content: filled }], GROQ_API_KEY);
          return { output: text, execMs: Date.now() - start };
        })(),
        (async () => {
          const filled = verB.prompt_text.replace('{{input}}', testInput);
          const start = Date.now();
          const text = await callGroq([{ role: 'user', content: filled }], GROQ_API_KEY);
          return { output: text, execMs: Date.now() - start };
        })(),
      ]);

      setLoadingStep('AI is scoring Relevance & Structure...');
      const [rA, sA, rB, sB] = await Promise.all([
        scoreMetric('Relevance', 'How well does the output address the input? (1=not at all, 5=perfectly)', testInput, outA.output, GROQ_API_KEY),
        scoreMetric('Structure', 'Is the output well-structured and clearly organised? (1=chaotic, 5=excellent)', testInput, outA.output, GROQ_API_KEY),
        scoreMetric('Relevance', 'How well does the output address the input? (1=not at all, 5=perfectly)', testInput, outB.output, GROQ_API_KEY),
        scoreMetric('Structure', 'Is the output well-structured and clearly organised? (1=chaotic, 5=excellent)', testInput, outB.output, GROQ_API_KEY),
      ]);

      setCohA(3);
      setCohB(3);

      setCompResult({
        input: testInput,
        a: { versionId: versionA, output: outA.output, execMs: outA.execMs, words: outA.output.trim().split(/\s+/).length, R: rA, S: sA, K: calcK(null), L: calcL(outA.output) },
        b: { versionId: versionB, output: outB.output, execMs: outB.execMs, words: outB.output.trim().split(/\s+/).length, R: rB, S: sB, K: calcK(null), L: calcL(outB.output) },
      });

      setModalOpen(false);
      addToast('✅ Done! Now rate Coherence for each version.', 'success', 4000);
    } catch (err) {
      addToast(`❌ Compare failed: ${err.message}`, 'error', 5000);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 h-full">

      {/* Header */}
      <div className="section-header mb-0">
        <div>
          <h2 className="section-title">A/B Compare</h2>
          <p className="section-subtitle">Select two versions, enter a test input — AI scores Relevance &amp; Structure, you rate Coherence.</p>
        </div>
      </div>

      {/* CPQS Formula Explainer */}
      <CpqsExplainer />

      {/* Version selectors + Compare button */}
      <div className="card flex flex-col gap-4">
        <div className="grid-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-secondary">Version A</label>
            <select className="select font-bold" value={versionA} onChange={e => { setVersionA(e.target.value); setCompResult(null); }}>
              <option value="">Select Version A</option>
              {prompt.versions.map(v => <option key={v.version_id} value={v.version_id}>{v.version_id}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-secondary">Version B</label>
            <select className="select font-bold" value={versionB} onChange={e => { setVersionB(e.target.value); setCompResult(null); }}>
              <option value="">Select Version B</option>
              {prompt.versions.map(v => <option key={v.version_id} value={v.version_id}>{v.version_id}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary" disabled={!canCompare} onClick={handleOpenModal}>
            🔀 Compare Versions
          </button>
        </div>
      </div>

      {/* Winner banner — updates live as Coherence is rated */}
      {compResult && winner && winner.v !== 'Tie' && (
        <div style={{ background: 'var(--accent-green)18', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '1.1rem' }}>🏆 {winner.v} Wins</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 4 }}>{winner.reason}</div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'right' }}>
            R &amp; S: AI rated<br />C: you rated
          </div>
        </div>
      )}
      {compResult && winner && winner.v === 'Tie' && (
        <div style={{ background: 'var(--accent-orange)18', border: '1px solid var(--accent-orange)', borderRadius: 12, padding: '14px 20px' }}>
          <div style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>🤝 Tie — {winner.reason}</div>
        </div>
      )}

      {/* Test input echo */}
      {compResult && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px' }}>
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Test Input: </span>
          <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)' }}>{compResult.input}</span>
        </div>
      )}

      {/* Side-by-side results */}
      {compResult ? (
        <div className="split-screen" style={{ minHeight: 400 }}>
          <MetricCard data={compResult.a} cpqs={liveCpqsA} coh={cohA} setCoh={setCohA} badgeClass="badge-purple" />
          <MetricCard data={compResult.b} cpqs={liveCpqsB} coh={cohB} setCoh={setCohB} badgeClass="badge-blue" />
        </div>
      ) : (
        <div className="empty-state card">
          <div className="empty-state-icon">🔀</div>
          <div className="empty-state-title">Ready to compare</div>
          <div className="empty-state-desc">
            Select two versions above and click <strong>Compare Versions</strong>.<br />
            AI will run both outputs then score <strong>Relevance</strong> and <strong>Structure</strong> automatically.<br />
            You rate <strong>Coherence</strong> — the winner updates in real-time.
          </div>
        </div>
      )}

      {/* Test Input Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !loading && setModalOpen(false)}
        title={`Compare ${versionA} vs ${versionB}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={loading}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleRunComparison}
              disabled={loading || !testInput.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  {loadingStep || 'Running...'}
                </>
              ) : '⚡ Run & Compare'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            AI will score <strong>Relevance</strong> and <strong>Structure</strong> automatically.<br />
            After results appear, you rate <strong>Coherence (1–5)</strong> for each version — CPQS updates live.
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Test Input</label>
            <textarea
              className="input"
              style={{ minHeight: 120, fontFamily: 'inherit', fontSize: '0.875rem', resize: 'vertical' }}
              placeholder={`Enter the input to test ${versionA} and ${versionB} against…`}
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
