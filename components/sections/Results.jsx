'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import StarRating from '../ui/StarRating';

export default function Results() {
  const { prompts, results, scoreOutput, setCurrentPromptId, setActiveSection } = useApp();

  const [filterPromptId, setFilterPromptId] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const filteredResults = results
    .filter(r => filterPromptId === 'all' || r.prompt_id === filterPromptId)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      if (sortBy === 'score') {
        const avgA = a.outputs.reduce((s, o) => s + (o.score || 0), 0) / a.outputs.length;
        const avgB = b.outputs.reduce((s, o) => s + (o.score || 0), 0) / b.outputs.length;
        return avgB - avgA;
      }
      return 0;
    });

  const getPromptName = (id) => prompts.find(p => p.prompt_id === id)?.title || id;

  const openInExecute = (promptId) => {
    setCurrentPromptId(promptId);
    setActiveSection('execute');
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="section-header mb-0">
        <div>
          <h2 className="section-title">All Results</h2>
          <p className="section-subtitle">Browse all past AI execution results across every prompt and version.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveSection('execute')}>
          ▶ Run New Test
        </button>
      </div>

      {/* Filters */}
      <div className="card bg-secondary" style={{ padding: '16px' }}>
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-secondary">Filter by Prompt</label>
            <select className="select" value={filterPromptId} onChange={e => setFilterPromptId(e.target.value)} style={{ minWidth: 200 }}>
              <option value="all">All Prompts</option>
              {prompts.map(p => <option key={p.prompt_id} value={p.prompt_id}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-secondary">Sort by</label>
            <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score">Highest Score</option>
            </select>
          </div>
          <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No results yet</div>
          <div className="empty-state-desc">Run some executions first to see results here.</div>
          <button className="btn btn-primary mt-2" onClick={() => setActiveSection('execute')}>▶ Go to Execute</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredResults.map(result => {
            const prompt = prompts.find(p => p.prompt_id === result.prompt_id);
            const avgTime = result.outputs.reduce((a, o) => a + o.exec_time_ms, 0) / result.outputs.length;
            const avgKeyword = result.outputs.filter(o => o.keyword_match !== null).reduce((a, o) => a + (o.keyword_match || 0), 0) / (result.outputs.filter(o => o.keyword_match !== null).length || 1);
            const totalTokens = result.outputs.reduce((a, o) => a + o.token_count, 0);

            return (
              <div key={result.result_id} className="card shadow-md">
                {/* Result Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-purple">{result.version_id}</span>
                    <span className="font-semibold text-primary">{getPromptName(result.prompt_id)}</span>
                    <span className="text-secondary text-sm">{new Date(result.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-4 text-sm font-medium">
                      <span className="text-muted">⚡ {avgTime.toFixed(0)}ms avg</span>
                      <span className="text-muted">📏 {totalTokens} tokens</span>
                      <span className={`badge ${avgKeyword > 80 ? 'badge-green' : avgKeyword > 60 ? 'badge-orange' : 'badge-red'}`}>
                        {Math.round(avgKeyword)}% match
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openInExecute(result.prompt_id)}
                    >
                      Re-run →
                    </button>
                  </div>
                </div>

                {/* Output Cards */}
                <div className="flex flex-col gap-4">
                  {result.outputs.map((out, idx) => (
                    <div key={idx} className="flex flex-col border border-border rounded-lg overflow-hidden">
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
                      <div className="p-3 bg-secondary/50 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-secondary">Quality:</span>
                            <StarRating
                              value={out.score || 0}
                              onChange={(val) => scoreOutput(result.result_id, idx, val)}
                              size="sm"
                            />
                          </div>
                          {out.keyword_match !== null && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-secondary">Match:</span>
                              <span className={`badge ${out.keyword_match > 80 ? 'badge-green' : out.keyword_match > 60 ? 'badge-orange' : 'badge-red'}`}>
                                {out.keyword_match}%
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-secondary">Length:</span>
                            <span className="badge badge-gray">{out.length_valid ? 'Valid' : 'Short'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-muted">
                          <span>⚡ {out.exec_time_ms}ms</span>
                          <span>📏 {out.token_count} tokens</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
