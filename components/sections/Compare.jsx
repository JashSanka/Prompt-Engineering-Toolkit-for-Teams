'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';

export default function Compare() {
  const { currentPromptId, prompts, results } = useApp();
  const prompt = prompts.find(p => p.prompt_id === currentPromptId);
  const promptResults = results.filter(r => r.prompt_id === currentPromptId);

  const [versionA, setVersionA] = useState('');
  const [versionB, setVersionB] = useState('');

  if (!prompt) return null;

  const resultA = promptResults.find(r => r.version_id === versionA);
  const resultB = promptResults.find(r => r.version_id === versionB);

  // Derive Winner Logic natively if possible
  let winner = null;
  let reason = '';

  if (resultA && resultB && resultA.outputs.length > 0 && resultB.outputs.length > 0) {
    const scoreA = resultA.outputs.reduce((a, b) => a + (b.score || 0), 0) / resultA.outputs.length;
    const scoreB = resultB.outputs.reduce((a, b) => a + (b.score || 0), 0) / resultB.outputs.length;
    const matchA = resultA.outputs.reduce((a, b) => a + b.keyword_match, 0) / resultA.outputs.length;
    const matchB = resultB.outputs.reduce((a, b) => a + b.keyword_match, 0) / resultB.outputs.length;

    if (scoreA > scoreB) {
      winner = versionA;
      reason = 'Higher average human score';
    } else if (scoreB > scoreA) {
      winner = versionB;
      reason = 'Higher average human score';
    } else if (matchA > matchB) {
      winner = versionA;
      reason = 'Better keyword matching';
    } else if (matchB > matchA) {
      winner = versionB;
      reason = 'Better keyword matching';
    } else {
      winner = 'Tie';
      reason = 'Scores and matches are identical';
    }
  }


  return (
    <div className="animate-fade-in flex flex-col gap-6 h-full">
      <div className="section-header mb-0">
        <div>
          <h2 className="section-title">A/B Compare</h2>
          <p className="section-subtitle">Side-by-side comparison of execution results across versions.</p>
        </div>
      </div>

      <div className="grid-2 gap-4">
        <select className="select font-bold text-lg" value={versionA} onChange={e => setVersionA(e.target.value)}>
          <option value="">Select Version A</option>
          {prompt.versions.map(v => <option key={v.version_id} value={v.version_id}>{v.version_id}</option>)}
        </select>
        
        <select className="select font-bold text-lg" value={versionB} onChange={e => setVersionB(e.target.value)}>
          <option value="">Select Version B</option>
          {prompt.versions.map(v => <option key={v.version_id} value={v.version_id}>{v.version_id}</option>)}
        </select>
      </div>

      {winner && winner !== 'Tie' && (
        <div className="card bg-accent-green-dim border-accent-green mb-4 p-4 flex items-center justify-between">
          <div>
            <div className="text-accent-green font-bold text-lg flex items-center gap-2">
              🏆 {winner} Wins
            </div>
            <div className="text-secondary text-sm mt-1">Reason: <span className="font-semibold">{reason}</span></div>
          </div>
        </div>
      )}

      {versionA && versionB ? (
        <div className="split-screen" style={{ minHeight: 400 }}>
          {/* Version A Pane */}
          <div className="split-pane">
            <div className="split-pane-header justify-between">
              <span className="badge badge-purple">{versionA}</span>
              {resultA && <span className="text-xs text-muted">Latest Exec</span>}
            </div>
            <div className="split-pane-body">
              {!resultA ? (
                <div className="empty-state text-sm">No execution run for this version. Go to Execute to run tests.</div>
              ) : (
                <div className="flex flex-col gap-6">
                  {resultA.outputs.map((out, i) => (
                    <div key={i} className="flex flex-col gap-3 pb-4 border-b border-border">
                      <div className="text-sm font-semibold">{out.input.substring(0, 50)}...</div>
                      <div className="text-sm p-3 bg-secondary rounded-lg whitespace-pre-wrap">{out.output}</div>
                      <div className="flex gap-3 text-xs">
                        <span className="badge badge-orange">Score: {out.score || 'N/A'}</span>
                        <span className="badge badge-blue">{out.token_count} tokens</span>
                        <span className="badge badge-green">{out.keyword_match}% match</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Version B Pane */}
          <div className="split-pane">
            <div className="split-pane-header justify-between">
              <span className="badge badge-blue">{versionB}</span>
              {resultB && <span className="text-xs text-muted">Latest Exec</span>}
            </div>
            <div className="split-pane-body">
              {!resultB ? (
                <div className="empty-state text-sm">No execution run for this version. Go to Execute to run tests.</div>
              ) : (
                <div className="flex flex-col gap-6">
                  {resultB.outputs.map((out, i) => (
                    <div key={i} className="flex flex-col gap-3 pb-4 border-b border-border">
                      <div className="text-sm font-semibold">{out.input.substring(0, 50)}...</div>
                      <div className="text-sm p-3 bg-secondary rounded-lg whitespace-pre-wrap">{out.output}</div>
                      <div className="flex gap-3 text-xs">
                        <span className="badge badge-orange">Score: {out.score || 'N/A'}</span>
                        <span className="badge badge-blue">{out.token_count} tokens</span>
                        <span className="badge badge-green">{out.keyword_match}% match</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state card">
          <div className="empty-state-icon">🔀</div>
          <div className="empty-state-title">Select versions to compare</div>
          <div className="empty-state-desc">Choose two versions from the dropdowns above to see a side-by-side comparison of their outputs.</div>
        </div>
      )}
    </div>
  );
}
