'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import Modal from '../ui/Modal';

export default function TestSuite() {
  const { testSuites, currentPromptId, prompts, addTestCase, deleteTestCase, editTestCase, setActiveSection } = useApp();
  const prompt = prompts.find(p => p.prompt_id === currentPromptId);
  const suite = testSuites.find(s => s.prompt_id === currentPromptId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [deletingCase, setDeletingCase] = useState(null);
  const [newInput, setNewInput] = useState('');
  const [newExpected, setNewExpected] = useState('');

  if (!prompt) return null;

  const handleAdd = () => {
    if (!newInput.trim() || !suite) return;
    addTestCase(suite.suite_id, { input: newInput, expected_output: newExpected });
    setNewInput('');
    setNewExpected('');
    setIsAddModalOpen(false);
  };

  const openEdit = (tc) => {
    setEditingCase({ ...tc });
    setIsEditModalOpen(true);
  };

  const handleEdit = () => {
    if (!editingCase || !suite) return;
    editTestCase(suite.suite_id, editingCase.id, {
      input: editingCase.input,
      expected_output: editingCase.expected_output,
    });
    setIsEditModalOpen(false);
    setEditingCase(null);
  };

  const openDelete = (tc) => {
    setDeletingCase(tc);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (!deletingCase || !suite) return;
    deleteTestCase(suite.suite_id, deletingCase.id);
    setIsDeleteConfirmOpen(false);
    setDeletingCase(null);
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
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>+ Add Test Case</button>
        </div>
      </div>

      {!suite || suite.test_cases.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🧪</div>
          <div className="empty-state-title">No test cases yet</div>
          <div className="empty-state-desc">Create your first test case to evaluate how this prompt performs against real inputs.</div>
          <button className="btn btn-primary mt-2" onClick={() => setIsAddModalOpen(true)}>+ Add First Test</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '42%' }}>Input</th>
                <th style={{ width: '42%' }}>Expected Output</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suite.test_cases.map((tc, idx) => (
                <tr key={tc.id}>
                  <td className="font-mono text-xs">{idx + 1}</td>
                  <td>
                    <div className="text-primary font-semibold" style={{ maxWidth: '380px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {tc.input.length > 120 ? tc.input.substring(0, 120) + '…' : tc.input}
                    </div>
                  </td>
                  <td>
                    {tc.expected_output ? (
                      <div className="text-secondary text-sm" style={{ maxWidth: '380px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {tc.expected_output.length > 120 ? tc.expected_output.substring(0, 120) + '…' : tc.expected_output}
                      </div>
                    ) : (
                      <span className="text-muted text-sm italic">None specified</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Edit test case"
                        onClick={() => openEdit(tc)}
                      >✏️</button>
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Delete test case"
                        onClick={() => openDelete(tc)}
                        style={{ color: 'var(--accent-red)' }}
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setNewInput(''); setNewExpected(''); }}
        title="Add Test Case"
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!newInput.trim()} onClick={handleAdd}>Save Case</button>
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

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingCase(null); }}
        title="Edit Test Case"
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit}>Save Changes</button>
          </>
        }
      >
        {editingCase && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Test Input <span className="text-accent-red">*</span></label>
              <textarea
                className="textarea"
                value={editingCase.input}
                onChange={(e) => setEditingCase(prev => ({ ...prev, input: e.target.value }))}
                style={{ minHeight: '100px' }}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Expected Output (Optional)</label>
              <textarea
                className="textarea"
                value={editingCase.expected_output || ''}
                onChange={(e) => setEditingCase(prev => ({ ...prev, expected_output: e.target.value }))}
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => { setIsDeleteConfirmOpen(false); setDeletingCase(null); }}
        title="Delete Test Case?"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ background: 'var(--accent-red)' }} onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p className="text-secondary text-sm">This will permanently remove this test case. Are you sure?</p>
        {deletingCase && (
          <div className="mt-3 p-3 bg-secondary rounded-lg text-sm font-mono text-primary">
            {deletingCase.input.substring(0, 100)}{deletingCase.input.length > 100 ? '…' : ''}
          </div>
        )}
      </Modal>
    </div>
  );
}
