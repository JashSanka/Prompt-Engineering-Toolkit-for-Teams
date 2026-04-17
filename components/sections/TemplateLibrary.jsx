'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import Modal from '../ui/Modal';

export default function TemplateLibrary() {
  const { templates, useTemplate } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];

  const filtered = templates.filter(tpl => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || tpl.title.toLowerCase().includes(q) || tpl.category.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q);
    const matchCat = activeCat === 'All' || tpl.category === activeCat;
    return matchSearch && matchCat;
  });

  const handleUse = (tpl) => {
    useTemplate(tpl);
    setSelectedTemplate(null);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="section-header mb-0">
        <div>
          <h2 className="section-title">Template Library</h2>
          <p className="section-subtitle">Curated prompt templates — click "Use Template" to open instantly in the editor.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="input"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: 220 }}
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            className={`btn btn-sm ${activeCat === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">No templates found</div>
          <div className="empty-state-desc">Try a different search or category.</div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(tpl => (
            <div key={tpl.template_id} className="card card-hover flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <span className="badge badge-purple">{tpl.category}</span>
                <span className="text-xs font-semibold text-muted">Used {tpl.usage_count}×</span>
              </div>

              <h3 className="font-bold text-primary mb-2 mt-2">{tpl.title}</h3>
              <p className="text-sm text-secondary mb-6 flex-1">{tpl.description}</p>

              <div className="flex items-center gap-2 mt-auto border-t border-border pt-4">
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => setSelectedTemplate(tpl)}
                >
                  👁 Preview
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => handleUse(tpl)}
                >
                  + Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.title || 'Preview Template'}
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setSelectedTemplate(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => handleUse(selectedTemplate)}>Use This Template →</button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-center">
            <span className="badge badge-purple">{selectedTemplate?.category}</span>
            <span className="text-xs text-muted">Used {selectedTemplate?.usage_count}×</span>
          </div>
          <p className="text-sm text-secondary">{selectedTemplate?.description}</p>
          <div className="bg-secondary p-4 rounded-lg font-mono text-sm whitespace-pre-wrap border border-border" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {selectedTemplate?.prompt_text}
          </div>
        </div>
      </Modal>
    </div>
  );
}
