import React, { useState } from 'react';
import { ENDPOINTS } from '@/lib/api';

const TestSuiteCreator = ({ promptId = "default-prompt-id" }) => {
  // 1. State Management
  const [testCases, setTestCases] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTest, setCurrentTest] = useState({ id: '', input: '', expected: '' });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  // Generate a simple unique ID for test cases
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 2. Functionality: Add Test Case
  const handleAddClick = () => {
    setCurrentTest({ id: generateId(), input: '', expected: '' });
    setIsEditing(true);
    setError('');
  };

  // 2. Functionality: Edit Test Case
  const handleEditClick = (test) => {
    setCurrentTest(test);
    setIsEditing(true);
    setError('');
  };

  // 2. Functionality: Delete Test Case
  const handleDeleteClick = (id) => {
    setTestCases(testCases.filter(test => test.id !== id));
  };

  // Save the currently editing test case into the state array
  const handleSaveTest = () => {
    // Validation: input must not be empty
    if (!currentTest.input.trim()) {
      setError('Input field is required.');
      return;
    }

    // Check if updating existing or adding new
    const existingIndex = testCases.findIndex(t => t.id === currentTest.id);
    if (existingIndex >= 0) {
      const updatedTestCases = [...testCases];
      updatedTestCases[existingIndex] = currentTest;
      setTestCases(updatedTestCases);
    } else {
      setTestCases([...testCases, currentTest]);
    }

    // Reset editing state
    setIsEditing(false);
    setCurrentTest({ id: '', input: '', expected: '' });
    setError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentTest({ id: '', input: '', expected: '' });
    setError('');
  };

  // 3. API Integration: Send test cases to backend
  const handleSaveSuite = async () => {
    if (testCases.length === 0) return;
    setIsSaving(true);
    
    try {
      const payload = {
        promptId: promptId,
        tests: testCases
      };
      
      console.log('Sending POST /testsuite payload:', payload);
      
      // Simulated API Call
      // const response = await fetch(ENDPOINTS.TESTSUITE, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      
      // Mock network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      alert('Test suite saved successfully!');
    } catch (err) {
      console.error('Failed to save test suite:', err);
      alert('Error saving test suite.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white/50 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100">
      {/* 4. UI Design: Header & Extra (Total number & disable save logic) */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Test Cases</h2>
          <span className="px-3 py-1 text-sm font-semibold text-indigo-700 bg-indigo-100 rounded-full">
            {testCases.length} Total
          </span>
        </div>
        
        <div className="flex gap-3">
          {!isEditing && (
            <button
              onClick={handleAddClick}
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100"
            >
              + Add Test Case
            </button>
          )}
          <button
            onClick={() => setShowTemplate(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:ring-4 focus:ring-gray-100"
          >
            View Template
          </button>
          <button
            onClick={handleSaveSuite}
            disabled={testCases.length === 0 || isSaving}
            className={`px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg shadow-sm
              ${testCases.length === 0 || isSaving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-100'}`}
          >
            {isSaving ? 'Saving...' : 'Save Test Suite'}
          </button>
        </div>
      </div>

      {/* Editor Section (Inline Edit) */}
      {isEditing && (
        <div className="p-5 mb-6 border border-indigo-200 rounded-xl bg-indigo-50/50 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            {testCases.some(t => t.id === currentTest.id) ? 'Edit Test Case' : 'New Test Case'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Input <span className="text-red-500">*</span>
              </label>
              <textarea
                value={currentTest.input}
                onChange={(e) => setCurrentTest({ ...currentTest, input: e.target.value })}
                placeholder="Enter the test prompt input..."
                className={`w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                  error ? 'border-red-500 bg-red-50/50' : 'border-gray-200 bg-white'
                }`}
                rows={3}
              />
              {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Expected Output <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={currentTest.expected}
                onChange={(e) => setCurrentTest({ ...currentTest, expected: e.target.value })}
                placeholder="Enter the expected response..."
                className="w-full p-3 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTest}
                className="px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Save Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Section */}
      {!isEditing && testCases.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <p className="text-gray-500">No test cases yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testCases.map((test) => (
            <div 
              key={test.id} 
              className="flex flex-col gap-4 p-5 transition-all bg-white border border-gray-200 shadow-sm md:flex-row rounded-xl hover:shadow-md hover:border-indigo-100 group"
            >
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Input
                  </h4>
                  <div className="p-3.5 text-sm text-gray-800 bg-gray-50 rounded-lg whitespace-pre-wrap font-mono border border-gray-100">
                    {test.input}
                  </div>
                </div>
                
                {test.expected && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold text-green-600 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Expected Output
                    </h4>
                    <div className="p-3.5 text-sm text-green-900 bg-green-50 border border-green-100 rounded-lg whitespace-pre-wrap font-mono">
                      {test.expected}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditClick(test)}
                  className="p-2 text-gray-500 transition-colors rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100"
                  title="Edit test case"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteClick(test.id)}
                  className="p-2 text-gray-500 transition-colors rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100"
                  title="Delete test case"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Template Preview Modal */}
      {showTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Test Suite Template Payload</h3>
              <button 
                onClick={() => setShowTemplate(false)}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-5 bg-gray-50 max-h-[60vh] overflow-y-auto">
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                {JSON.stringify({ promptId, tests: testCases }, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end p-5 bg-white border-t border-gray-100">
              <button
                onClick={() => setShowTemplate(false)}
                className="px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSuiteCreator;
