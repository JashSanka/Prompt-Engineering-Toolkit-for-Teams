'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import StarRating from '../ui/StarRating';

export default function ExecuteEngine() {
  const { currentPromptId, prompts, testSuites, results, runExecution, scoreOutput } = useApp();
  
  const prompt = prompts.find(p => p.prompt_id === currentPromptId);
  const suite = testSuites.find(s => s.prompt_id === currentPromptId);
  
  const [selectedVersion, setSelectedVersion] = useState(prompt?.versions[prompt.versions.length - 1].version_id || '');
  const promptResults = results.filter(r => r.prompt_id === currentPromptId);

  if (!prompt) return null;

  const handleRun = () => {
    if (suite && selectedVersion) {
      runExecution(prompt.prompt_id, selectedVersion, suite.suite_id);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="section-header mb-0">
        <div>
          <h2 className="section-title">Execution Engine</h2>
          <p className="section-subtitle">Run prompt versions against your test suites and score the outputs.</p>
        </div>
      </div>

      <div className="card bg-secondary" style={{ padding: '20px' }}>
        <div className="flex items-end gap-4" style={{ maxWidth: '800px' }}>
          <div className="flex-1">
            <label className="text-sm font-semibold mb-2 block text-secondary">Target Version</label>
            <select 
              className="select" 
              value={selectedVersion} 
              onChange={e => setSelectedVersion(e.target.value)}
            >
              {[...prompt.versions].reverse().map(v => (
                <option key={v.version_id} value={v.version_id}>
                  {v.version_id}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-semibold mb-2 block text-secondary">Test Suite</label>
            <select className="select" disabled>
              <option>{suite ? suite.name : 'No suite available'}</option>
            </select>
          </div>
          <button 
            className="btn btn-primary btn-lg" 
            style={{ marginBottom: '2px' }}
            disabled={!suite}
            onClick={handleRun}
          >
            ▶ Run Execution
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {promptResults.length === 0 ? (
          <div className="empty-state text-muted pt-12">
            No execution results yet for this prompt.
          </div>
        ) : (
          promptResults.map(result => (
            <div key={result.result_id} className="card shadow-md">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="badge badge-purple px-3 py-1 text-sm">{result.version_id}</span>
                  <span className="text-secondary text-sm">{new Date(result.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-muted">Avg Time:</span> 
                    <span className="text-primary">{(result.outputs.reduce((acc, curr) => acc + curr.exec_time_ms, 0) / result.outputs.length).toFixed(0)}ms</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {result.outputs.map((out, idx) => (
                  <div key={idx} className="flex flex-col border border-border rounded-lg overflow-hidden">
                    {/* Input/Output Split */}
                    <div className="grid-2 bg-secondary/30">
                      <div className="p-4 border-r border-border">
                        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Input</div>
                        <div className="text-sm text-primary">{out.input}</div>
                      </div>
                      <div className="p-4 bg-surface">
                        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">AI Output</div>
                        <div className="text-sm text-primary whitespace-pre-wrap">{out.output}</div>
                      </div>
                    </div>
                    
                    {/* Scoring & Metrics Bar */}
                    <div className="p-3 bg-secondary/50 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        {/* Rating */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-secondary">Quality:</span>
                          <StarRating 
                            value={out.score || 0} 
                            onChange={(val) => scoreOutput(result.result_id, idx, val)} 
                            size="sm"
                          />
                        </div>
                        {/* Keyword Match Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-secondary">Match:</span>
                          <span className={`badge ${out.keyword_match > 80 ? 'badge-green' : out.keyword_match > 60 ? 'badge-orange' : 'badge-red'}`}>
                            {out.keyword_match}%
                          </span>
                        </div>
                        {/* Length Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-secondary">Length:</span>
                          <span className="badge badge-gray">{out.length_valid ? 'Valid' : 'Invalid'}</span>
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="flex items-center gap-4 text-xs font-medium text-muted">
                        <span>⚡ {out.exec_time_ms}ms</span>
                        <span>📏 {out.token_count} tokens</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
