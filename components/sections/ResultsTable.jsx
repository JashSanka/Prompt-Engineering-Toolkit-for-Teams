'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { calcK, calcL, calcCPQS, cpqsBand, cpqsBandClasses, cpqsTooltip } from '@/lib/cpqs';
import { ENDPOINTS } from '@/lib/api';

// ─── Star Rater Sub-component ─────────────────────────────────────────────────

/**
 * Renders 5 clickable stars for a 1–5 user rating.
 * @param {{ value: number, onChange: (n: number) => void, label: string }} props
 */
function StarRater({ value, onChange, label }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-0.5" title={`${label}: ${value || 0}/5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-base leading-none transition-colors ${
            star <= (hovered || value)
              ? 'text-amber-400'
              : 'text-gray-300 hover:text-amber-300'
          }`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Rate ${label} ${star} of 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── CPQS Badge Sub-component ─────────────────────────────────────────────────

/**
 * Displays the CPQS score with color coding and a hover tooltip.
 */
function CPQSBadge({ metrics, cpqs }) {
  const band    = cpqsBand(cpqs);
  const classes = cpqsBandClasses(band);
  const tooltip = cpqsTooltip(metrics, cpqs);

  return (
    <div className="relative group inline-flex">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold tabular-nums cursor-default ${classes}`}
      >
        {cpqs.toFixed(2)}
      </span>
      {/* Tooltip */}
      <div
        className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30
          w-64 bg-gray-900 text-gray-100 text-xs rounded-lg p-3
          font-mono whitespace-pre shadow-xl
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity duration-150
        "
      >
        {tooltip}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

// ─── Main ResultsTable Component ──────────────────────────────────────────────

export default function ResultsTable() {
  const {
    results,
    currentPromptId,
    prompts,
    updateCpqsRating,
    addToast,
  } = useApp();

  // Local state for sort direction
  const [sortAsc, setSortAsc] = useState(false);

  // Filter to the current prompt's latest result run
  const prompt        = prompts.find(p => p.prompt_id === currentPromptId);
  const promptResults = results.filter(r => r.prompt_id === currentPromptId);
  const latestResult  = promptResults[0]; // results are prepended on run

  // ── Build rated rows with live CPQS ────────────────────────────────────────

  const rows = useMemo(() => {
    if (!latestResult) return [];

    return latestResult.outputs.map((out, idx) => {
      // R maps to existing manual `score` field (1-5 set via scoreOutput)
      const R = out.score        ?? 0;
      const S = out.structureScore ?? 0;
      const C = out.coherenceScore ?? 0;

      // Auto-calculated metrics
      const K    = calcK(out.keyword_match);
      const L    = calcL(out.output);
      const cpqs = (R && S && C) ? calcCPQS({ R, K, L, S, C }) : null;

      return { ...out, idx, R, K, L, S, C, cpqs };
    });
  }, [latestResult]);

  // ── Sort rows by CPQS ──────────────────────────────────────────────────────

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aCpqs = a.cpqs ?? -1;
      const bCpqs = b.cpqs ?? -1;
      return sortAsc ? aCpqs - bCpqs : bCpqs - aCpqs;
    });
  }, [rows, sortAsc]);

  // Find the index of the row with the highest CPQS
  const bestCpqs  = Math.max(...rows.map(r => r.cpqs ?? -1));
  const hasBest   = bestCpqs > 0;

  // ── Rating change handler ──────────────────────────────────────────────────

  const handleRatingChange = (outputIdx, field, value) => {
    updateCpqsRating(latestResult.result_id, outputIdx, field, value);
  };

  // ── Save results to backend ────────────────────────────────────────────────

  const handleSaveResults = async () => {
    if (!latestResult || rows.length === 0) return;

    const payload = {
      promptId: currentPromptId,
      version:  latestResult.version_id,
      results:  rows.map(r => ({
        input:     r.input,
        output:    r.output,
        R:         r.R,
        K:         parseFloat(r.K.toFixed(2)),
        L:         r.L,
        S:         r.S,
        C:         r.C,
        CPQS:      r.cpqs ?? 0,
        timestamp: new Date().toISOString(),
      })),
    };

    try {
      const res = await fetch(ENDPOINTS.RESULTS, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addToast('✅ Results saved to backend!', 'success');
    } catch (err) {
      console.error('[ResultsTable] Save failed:', err.message);
      addToast('❌ Save failed. Is the API server running? (`npm run server`)', 'error', 5000);
    }
  };

  // ─── Empty States ──────────────────────────────────────────────────────────

  if (!prompt) {
    return (
      <div className="empty-state card">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-title">No prompt selected</div>
        <div className="empty-state-desc">Select a prompt from the editor to view results.</div>
      </div>
    );
  }

  if (promptResults.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <div className="section-header mb-0">
          <div>
            <h2 className="section-title">📊 Results</h2>
            <p className="section-subtitle">CPQS scoring for <span className="font-semibold">{prompt.title}</span></p>
          </div>
        </div>
        <div className="empty-state card">
          <div className="empty-state-icon">🚀</div>
          <div className="empty-state-title">No results yet</div>
          <div className="empty-state-desc">Run the test suite from the Execute section to generate results.</div>
        </div>
      </div>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="section-header mb-0">
        <div>
          <h2 className="section-title">📊 Results</h2>
          <p className="section-subtitle">
            CPQS scoring for <span className="font-semibold">{prompt.title}</span>
            {' · '}{latestResult.version_id}
            {' · '}{latestResult.outputs.length} outputs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sort Toggle */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSortAsc(a => !a)}
            title="Toggle CPQS sort order"
          >
            {sortAsc ? '↑' : '↓'} Sort by CPQS
          </button>

          {/* Save Results */}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSaveResults}
            disabled={rows.length === 0}
          >
            💾 Save Results
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span> High (≥4.0)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Medium (2.5–3.9)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span> Low (&lt;2.5)
        </span>
        <span className="ml-auto italic">⭐ = rate manually · auto = calculated</span>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-semibold">Input</th>
              <th className="px-4 py-3 text-left font-semibold">Output</th>
              <th className="px-4 py-3 text-center font-semibold">
                R ⭐<br/><span className="text-[10px] font-normal normal-case">Relevance</span>
              </th>
              <th className="px-4 py-3 text-center font-semibold">
                K<br/><span className="text-[10px] font-normal normal-case text-blue-500">auto</span>
              </th>
              <th className="px-4 py-3 text-center font-semibold">
                L<br/><span className="text-[10px] font-normal normal-case text-blue-500">auto</span>
              </th>
              <th className="px-4 py-3 text-center font-semibold">
                S ⭐<br/><span className="text-[10px] font-normal normal-case">Structure</span>
              </th>
              <th className="px-4 py-3 text-center font-semibold">
                C ⭐<br/><span className="text-[10px] font-normal normal-case">Coherence</span>
              </th>
              <th className="px-4 py-3 text-center font-semibold">
                CPQS<br/><span className="text-[10px] font-normal normal-case">hover for details</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedRows.map((row) => {
              const isBest      = hasBest && row.cpqs === bestCpqs && row.cpqs > 0;
              const band        = row.cpqs !== null ? cpqsBand(row.cpqs) : null;
              const rowClasses  = isBest
                ? 'bg-green-50/40 dark:bg-green-900/10'
                : 'hover:bg-secondary/30 transition-colors';

              return (
                <tr key={row.test_case_id || row.idx} className={rowClasses}>

                  {/* Input */}
                  <td className="px-4 py-3 align-top max-w-[160px]">
                    <div className="flex items-start gap-1.5">
                      {isBest && (
                        <span title="Best Output" className="text-amber-400 shrink-0 mt-0.5">🏆</span>
                      )}
                      <span className="font-mono text-xs leading-relaxed line-clamp-4 text-primary">
                        {row.input}
                      </span>
                    </div>
                  </td>

                  {/* Output */}
                  <td className="px-4 py-3 align-top max-w-[280px]">
                    <span className="font-mono text-xs leading-relaxed line-clamp-6 text-secondary">
                      {row.output}
                    </span>
                    {row.exec_time_ms && (
                      <div className="mt-1 flex gap-2">
                        <span className="badge badge-blue">{row.token_count}t</span>
                        <span className="badge badge-orange">{row.exec_time_ms}ms</span>
                      </div>
                    )}
                  </td>

                  {/* R — Relevance (user rated) */}
                  <td className="px-4 py-3 align-middle text-center">
                    <StarRater
                      value={row.R}
                      label="Relevance"
                      onChange={(v) => handleRatingChange(row.idx, 'R', v)}
                    />
                    <div className="text-[10px] text-muted mt-0.5">{row.R || '—'}/5</div>
                  </td>

                  {/* K — Keyword (auto) */}
                  <td className="px-4 py-3 align-middle text-center">
                    <span className="badge badge-blue text-xs">
                      {row.K.toFixed(2)}
                    </span>
                    {row.keyword_match !== null && (
                      <div className="text-[10px] text-muted mt-0.5">{row.keyword_match}%</div>
                    )}
                  </td>

                  {/* L — Length (auto) */}
                  <td className="px-4 py-3 align-middle text-center">
                    <span className={`badge text-xs ${
                      row.L === 5 ? 'badge-green' : row.L === 3 ? 'badge-orange' : 'badge-red'
                    }`}>
                      {row.L === 5 ? '✓ Valid' : row.L === 3 ? '~ Near' : '✗ Off'}
                    </span>
                    <div className="text-[10px] text-muted mt-0.5">{row.output.trim().split(/\s+/).length}w</div>
                  </td>

                  {/* S — Structure (user rated) */}
                  <td className="px-4 py-3 align-middle text-center">
                    <StarRater
                      value={row.S}
                      label="Structure"
                      onChange={(v) => handleRatingChange(row.idx, 'S', v)}
                    />
                    <div className="text-[10px] text-muted mt-0.5">{row.S || '—'}/5</div>
                  </td>

                  {/* C — Coherence (user rated) */}
                  <td className="px-4 py-3 align-middle text-center">
                    <StarRater
                      value={row.C}
                      label="Coherence"
                      onChange={(v) => handleRatingChange(row.idx, 'C', v)}
                    />
                    <div className="text-[10px] text-muted mt-0.5">{row.C || '—'}/5</div>
                  </td>

                  {/* CPQS — composite score with tooltip */}
                  <td className="px-4 py-3 align-middle text-center">
                    {row.cpqs !== null ? (
                      <CPQSBadge
                        metrics={{ R: row.R, K: row.K, L: row.L, S: row.S, C: row.C }}
                        cpqs={row.cpqs}
                      />
                    ) : (
                      <span className="text-muted text-xs italic">Rate R, S, C</span>
                    )}
                    {isBest && (
                      <div className="text-[10px] text-green-600 font-semibold mt-0.5">Best</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Summary Footer ── */}
      {rows.some(r => r.cpqs !== null) && (
        <div className="card flex flex-wrap gap-6 p-4 text-sm">
          <div>
            <div className="text-muted text-xs uppercase tracking-wider mb-1">Avg CPQS</div>
            <div className="font-bold text-lg">
              {(rows.reduce((s, r) => s + (r.cpqs ?? 0), 0) / rows.filter(r => r.cpqs !== null).length).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-muted text-xs uppercase tracking-wider mb-1">Best CPQS</div>
            <div className="font-bold text-lg text-green-500">{bestCpqs.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted text-xs uppercase tracking-wider mb-1">Rated</div>
            <div className="font-bold text-lg">{rows.filter(r => r.cpqs !== null).length} / {rows.length}</div>
          </div>
          <div>
            <div className="text-muted text-xs uppercase tracking-wider mb-1">Version</div>
            <div className="font-bold text-lg">{latestResult.version_id}</div>
          </div>
        </div>
      )}
    </div>
  );
}
