'use strict';

/**
 * lib/promptResolver.js
 *
 * Resolves a prompt's text content given a promptId and version string.
 *
 * Resolution order:
 *   1. Read from data/prompts/prompts.json (via fileHandler)
 *   2. Fall back to inline mockData if the file is empty or missing
 *
 * Exported:
 *   resolvePrompt(promptId, version) → string (prompt_text)
 */

const { readPrompts } = require('./fileHandler');

// ─── Inline mock data fallback ────────────────────────────────────────────────
// Mirrors the structure in lib/mockData.js (ES module) but as CJS for the server.
// Used when data/prompts/prompts.json is absent or empty.

const MOCK_PROMPTS = [
  {
    prompt_id: '001',
    title: 'Article Summarizer',
    versions: [
      { version_id: 'v1', prompt_text: 'Summarize the following text in 3 bullet points:\n\n{{input}}' },
      { version_id: 'v2', prompt_text: 'You are an expert summarizer. Condense the following article into 3 clear, concise bullet points.\n\n{{input}}' },
      { version_id: 'v3', prompt_text: 'Role: Expert content analyst\nTask: Summarize the text below into exactly 3 bullet points.\nFormat: Use \'•\' for each bullet point.\n\nText:\n{{input}}' },
      { version_id: 'v4', prompt_text: 'Role: Expert content analyst with 10 years of experience.\nTask: Analyze and summarize the following text into exactly 3 bullet points. Each bullet should cover: (1) Main claim, (2) Key evidence, (3) Actionable conclusion.\nFormat: Start each bullet with \'•\' and keep each under 25 words.\nConstraints: No jargon. Plain language only.\n\nText:\n{{input}}' },
    ],
  },
  {
    prompt_id: '002',
    title: 'Code Reviewer',
    versions: [
      { version_id: 'v1', prompt_text: 'Review this code for bugs:\n\n{{input}}' },
      { version_id: 'v2', prompt_text: 'You are a senior software engineer. Review the following code for bugs, performance issues, and best practices.\n\n{{input}}' },
    ],
  },
  {
    prompt_id: '003',
    title: 'Email Composer',
    versions: [
      { version_id: 'v1', prompt_text: 'Write a professional email about:\n\n{{input}}' },
      { version_id: 'v2', prompt_text: 'Compose a professional business email.\nContext: {{input}}\nTone: Formal but warm. End with a clear call to action.' },
    ],
  },
  {
    prompt_id: '004',
    title: 'Meeting Notes Generator',
    versions: [
      { version_id: 'v1', prompt_text: 'Generate meeting notes from this transcript:\n\n{{input}}' },
    ],
  },
];

// ─── Main Resolver ────────────────────────────────────────────────────────────

/**
 * Resolves the prompt text for a given promptId and version.
 *
 * @param {string} promptId  - The prompt identifier (e.g. "001")
 * @param {string} version   - The version string (e.g. "v2")
 * @returns {string}         - The raw prompt_text string containing {{input}}
 * @throws {Error}           - If the prompt or version is not found
 */
function resolvePrompt(promptId, version) {
  console.log(`[promptResolver] Resolving promptId="${promptId}" version="${version}"`);

  // ── 1. Try live data from file ───────────────────────────────────────────
  let fileBased = [];
  try {
    fileBased = readPrompts();
    console.log(`[promptResolver] Loaded ${fileBased.length} prompt(s) from prompts.json`);
  } catch (err) {
    console.warn('[promptResolver] Could not read prompts.json:', err.message);
  }

  // ── 2. Merge: file-based takes priority; fall back to mock for missing IDs ─
  // Build a combined list: file entries first, then any mock entries whose
  // prompt_id is not already covered by the file.
  const fileIds = new Set(fileBased.map(p => p.prompt_id));
  const merged  = [
    ...fileBased,
    ...MOCK_PROMPTS.filter(p => !fileIds.has(p.prompt_id)),
  ];

  if (fileBased.length === 0) {
    console.log('[promptResolver] prompts.json empty — using mock data only.');
  }

  // ── 3. Find the prompt by ID ──────────────────────────────────────────────
  const prompt = merged.find(p => p.prompt_id === promptId);
  if (!prompt) {
    throw new Error(`[promptResolver] Prompt not found: promptId="${promptId}"`);
  }

  // ── 4. Find the specific version ──────────────────────────────────────────
  const versionEntry = (prompt.versions || []).find(v => v.version_id === version);
  if (!versionEntry) {
    const available = (prompt.versions || []).map(v => v.version_id).join(', ');
    throw new Error(
      `[promptResolver] Version "${version}" not found for prompt "${promptId}". ` +
      `Available versions: [${available}]`
    );
  }

  console.log(`[promptResolver] Resolved "${prompt.title}" ${version} (${versionEntry.prompt_text.length} chars)`);
  return versionEntry.prompt_text;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = { resolvePrompt };
