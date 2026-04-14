'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import Modal from '../ui/Modal';

export default function TemplateLibrary() {
  const { templates } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="section-header mb-0">
        <div>
          <h2 className="section-title">Template Library</h2>
          <p className="section-subtitle">Curated prompt templates for quick starts.</p>
        </div>
        <div className="searchWrapper ml-auto">
          <input className="input" placeholder="Search templates..." style={{ width: 250 }} />
        </div>
      </div>

      <div className="grid-3">
        {templates.map(tpl => (
          <div key={tpl.template_id} className="card card-hover flex flex-col h-full">
            <div className="flex items-start justify-between mb-2">
              <span className="badge badge-purple">{tpl.category}</span>
              <span className="text-xs font-semibold text-muted">Used {tpl.usage_count}x</span>
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
              <button className="btn btn-primary flex-1">
                + Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!selectedTemplate} 
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.title || 'Preview Template'}
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setSelectedTemplate(null)}>Close</button>
            <button className="btn btn-primary">Use This Template</button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <span className="badge badge-purple">{selectedTemplate?.category}</span>
          </div>
          <p className="text-sm text-secondary">{selectedTemplate?.description}</p>
          <div className="bg-secondary p-4 rounded-lg font-mono text-sm whitespace-pre-wrap border border-border">
            {selectedTemplate?.prompt_text}
          </div>
        </div>
      </Modal>
    </div>
  );
}
