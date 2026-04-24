'use strict';

/**
 * server.js
 *
 * Lightweight Express API server for the Prompt Evaluation Tool.
 * Runs alongside the Vite dev server (use `npm run dev:full`).
 *
 * Routes:
 *   POST /execute            → Run test cases through the execution engine
 *   POST /results            → Save/merge a result entry for a prompt version
 *   GET  /results/:promptId  → Retrieve all results for a given prompt
 *   GET  /health             → Health check
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { appendResult, getResultsByPromptId } = require('./lib/resultsHandler');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow requests from the Vite dev server and any Render-deployed frontend
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  }
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /results
 *
 * Body:
 * {
 *   promptId: string,
 *   version:  string,
 *   results:  Array<{
 *     input, output, R, K, L, S, C, CPQS, timestamp
 *   }>
 * }
 */
app.post('/results', (req, res) => {
  const { promptId, version, results } = req.body;

  // Validate required fields
  if (!promptId || !version || !Array.isArray(results)) {
    return res.status(400).json({
      error: 'Invalid payload. Required: promptId (string), version (string), results (array).',
    });
  }

  try {
    appendResult({ promptId, version, results });
    return res.status(201).json({
      message: `Results for prompt "${promptId}" version "${version}" saved successfully.`,
      count: results.length,
    });
  } catch (err) {
    console.error('[POST /results] Error:', err.message);
    return res.status(500).json({ error: 'Failed to save results.' });
  }
});

/**
 * GET /results/:promptId
 *
 * Returns all result log entries for the given promptId.
 */
app.get('/results/:promptId', (req, res) => {
  const { promptId } = req.params;

  try {
    const entries = getResultsByPromptId(promptId);
    return res.status(200).json({ promptId, entries });
  } catch (err) {
    console.error('[GET /results/:promptId] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch results.' });
  }
});

/**
 * POST /execute
 *
 * Runs a set of test cases against a specific prompt version using the
 * execution engine. Supports both real Groq API and mock mode.
 *
 * Body:
 * {
 *   promptId: string,          // e.g. "001"
 *   version:  string,          // e.g. "v2"
 *   tests: [
 *     { id: string, input: string }
 *   ]
 * }
 *
 * Response (200):
 * {
 *   promptId: string,
 *   version:  string,
 *   results: [
 *     { id, input, output, time, tokenCount, error }
 *   ]
 * }
 */
app.post('/execute', async (req, res) => {
  const { promptId, version, tests } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!promptId || typeof promptId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid field: promptId (string required).' });
  }
  if (!version || typeof version !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid field: version (string required).' });
  }
  if (!Array.isArray(tests) || tests.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid field: tests (non-empty array required).' });
  }

  // Validate each test case has at least id and input
  for (const [i, tc] of tests.entries()) {
    if (!tc.id || typeof tc.id !== 'string') {
      return res.status(400).json({ error: `tests[${i}].id is missing or not a string.` });
    }
    if (!tc.input || typeof tc.input !== 'string') {
      return res.status(400).json({ error: `tests[${i}].input is missing or not a string.` });
    }
  }

  console.log(`[POST /execute] promptId="${promptId}" version="${version}" tests=${tests.length}`);

  // ── Lazy-load execution engine (avoids startup cost if route never called) ─
  let runExecution;
  try {
    ({ runExecution } = require('./lib/executionEngine'));
  } catch (err) {
    console.error('[POST /execute] Failed to load executionEngine:', err.message);
    return res.status(500).json({ error: 'Execution engine unavailable.' });
  }

  // ── Run execution ─────────────────────────────────────────────────────────
  try {
    const result = await runExecution({ promptId, version, tests });
    return res.status(200).json(result);
  } catch (err) {
    // Prompt resolution failures (bad ID/version) surface here
    console.error('[POST /execute] Execution failed:', err.message);

    const isNotFound = err.message.includes('not found');
    return res.status(isNotFound ? 404 : 500).json({
      error: err.message,
    });
  }
});

// ─── Static Files (Frontend) ──────────────────────────────────────────────────
// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    port:   PORT,
    mode:   process.env.GROQ_API_KEY ? 'real-ai' : 'mock-ai',
  });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const mode = process.env.GROQ_API_KEY ? '🤖 real Groq AI' : '🎭 MOCK mode (no API key)';
  console.log(`[server] API running at http://localhost:${PORT} — ${mode}`);
  console.log('[server] Routes: POST /execute  |  POST /results  |  GET /results/:id  |  GET /health');
});
