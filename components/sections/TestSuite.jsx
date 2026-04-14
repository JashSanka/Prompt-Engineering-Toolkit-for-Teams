'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import Modal from '../ui/Modal';

export default function TestSuite() {
  const { testSuites, currentPromptId, prompts, addTestCase, setActiveSection } = useApp();
  const prompt = prompts.find(p => p.prompt_id === currentPromptId);
  const suite = testSuites.find(s => s.prompt_id === currentPromptId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInput, setNewInput] = useState('');
  const [newExpected, setNewExpected] = useState('');

  if (!prompt) return null;

  const handleAdd = () => {
    if (!newInput.trim() || !suite) return;
    addTestCase(suite.suite_id, {
      input: newInput,
      expected_output: newExpected
    });
    setNewInput('');
    setNewExpected('');
    setIsModalOpen(false);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="section-header">
        <div>
          <h2 className="section-title">Test Cases for "{prompt.title}"</h2>
          <p className="section-subtitle">Define benchmark inputs and expected outputs to evaluate your prompts.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setActiveSection('execute')}>▶ Run Tests</button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Test Case</button>
        </div>
      </div>

      {!suite || suite.test_cases.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🧪</div>
          <div className="empty-state-title">No test cases yet</div>
          <div className="empty-state-desc">Create your first test case to evaluate how this prompt performs against real inputs.</div>
          <button className="btn btn-primary mt-2" onClick={() => setIsModalOpen(true)}>+ Add First Test</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>ID</th>
                <th style={{ width: '45%' }}>Input</th>
                <th style={{ width: '45%' }}>Expected Output (Optional)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suite.test_cases.map((tc, idx) => (
                <tr key={tc.id}>
                  <td className="font-mono text-xs">{idx + 1}</td>
                  <td>
                    <div className="text-primary font-semibold truncate" style={{ maxWidth: '400px' }}>
                      {tc.input.length > 80 ? tc.input.substring(0, 80) + '...' : tc.input}
                    </div>
                  </td>
                  <td>
                    {tc.expected_output ? (
                      <div className="text-secondary text-sm truncate" style={{ maxWidth: '400px' }}>
                         {tc.expected_output.length > 80 ? tc.expected_output.substring(0, 80) + '...' : tc.expected_output}
                      </div>
                    ) : (
                      <span className="text-muted text-sm italic">None specified</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-icon">✏️</button>
                    <button className="btn-icon text-muted hover-red">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Test Case"
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Save Case</button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Test Input <span className="text-accent-red">*</span></label>
            <textarea 
              className="textarea" 
              placeholder="Enter the input text that will replace {{input}} in your prompt..."
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              style={{ minHeight: '100px' }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Expected Output (Optional)</label>
            <textarea 
              className="textarea" 
              placeholder="What should the perfect AI response look like?"
              value={newExpected}
              onChange={(e) => setNewExpected(e.target.value)}
              style={{ minHeight: '100px' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
