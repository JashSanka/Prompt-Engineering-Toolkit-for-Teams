'use strict';

/**
 * lib/executionEngine.js
 *
 * Core orchestrator for the prompt test execution pipeline.
 *
 * Flow:
 *   1. Resolve prompt text (promptResolver)
 *   2. For each test case in parallel (Promise.all):
 *       a. Replace {{input}} placeholder with test input
 *       b. Measure wall-clock execution time
 *       c. Call AI API (aiCaller)
 *       d. Capture output, time, tokenCount
 *       e. On error → capture error message, mark error: true
 *   3. Return structured result object
 *
 * Exported:
 *   runExecution({ promptId, version, tests }) → Promise<ExecutionResult>
 */

const { resolvePrompt } = require('./promptResolver');
const { callAI }        = require('./aiCaller');

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────

/**
 * @typedef {Object} TestCase
 * @property {string} id    - Unique test case identifier
 * @property {string} input - Raw user input to inject into the prompt
 */

/**
 * @typedef {Object} TestResult
 * @property {string}  id         - Original test case ID
 * @property {string}  input      - The input that was sent
 * @property {string}  output     - The AI response (or error message)
 * @property {number}  time       - Wall-clock execution time in ms
 * @property {number}  tokenCount - Completion token count (0 on error)
 * @property {boolean} error      - Whether this result represents an error
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {string}       promptId - The prompt identifier
 * @property {string}       version  - The prompt version used
 * @property {TestResult[]} results  - One result per input test case
 */

// ─── Single Test Executor ─────────────────────────────────────────────────────

/**
 * Execute a single test case against the resolved prompt template.
 * Always resolves (never rejects) — errors are captured in the result object.
 *
 * @param {TestCase}   testCase    - The test case to run
 * @param {string}     promptText  - Raw prompt template (may contain {{input}})
 * @param {object}     [aiOptions] - Options forwarded to callAI
 * @returns {Promise<TestResult>}
 */
async function executeOne(testCase, promptText, aiOptions = {}) {
  const { id, input } = testCase;

  // Inject the test input into the prompt template
  const fullPrompt = promptText.includes('{{input}}')
    ? promptText.replace('{{input}}', input)
    : `${promptText}\nInput: ${input}`;  // graceful fallback if no placeholder

  console.log(`[engine] Starting test case "${id}" — input: "${input.slice(0, 60)}..."`);

  const startTime = Date.now();

  try {
    const { output, tokenCount } = await callAI(fullPrompt, aiOptions);
    const time = Date.now() - startTime;

    console.log(`[engine] ✅ Test case "${id}" completed in ${time}ms — ${tokenCount} tokens`);

    return {
      id,
      input,
      output,
      time,
      tokenCount,
      error: false,
    };

  } catch (err) {
    const time = Date.now() - startTime;

    console.error(`[engine] ❌ Test case "${id}" failed after ${time}ms:`, err.message);

    return {
      id,
      input,
      output: `[ERROR] ${err.message}`,
      time,
      tokenCount: 0,
      error: true,
    };
  }
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Run all test cases for a given prompt version in parallel.
 *
 * @param {object}     params
 * @param {string}     params.promptId  - Prompt identifier
 * @param {string}     params.version   - Version string (e.g. "v2")
 * @param {TestCase[]} params.tests     - Array of test cases to execute
 * @param {object}     [params.aiOptions] - Optional overrides for callAI
 * @returns {Promise<ExecutionResult>}
 * @throws {Error} If prompt resolution fails (bad promptId/version)
 */
async function runExecution({ promptId, version, tests, aiOptions = {} }) {
  const execStart = Date.now();

  console.log(
    `[engine] ▶ Starting execution — promptId="${promptId}" version="${version}" tests=${tests.length}`
  );

  // 1. Resolve the prompt text — throws if not found
  let promptText;
  try {
    promptText = resolvePrompt(promptId, version);
  } catch (err) {
    console.error('[engine] Prompt resolution failed:', err.message);
    throw err; // propagate to the route handler for a 500 response
  }

  // 2. Run all test cases in parallel
  const results = await Promise.all(
    tests.map(tc => executeOne(tc, promptText, aiOptions))
  );

  const totalTime = Date.now() - execStart;
  const successCount = results.filter(r => !r.error).length;

  console.log(
    `[engine] ✔ Execution complete in ${totalTime}ms — ` +
    `${successCount}/${results.length} succeeded`
  );

  return { promptId, version, results };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = { runExecution };
