'use strict';

/**
 * lib/aiCaller.js
 *
 * Isolated AI API caller for the execution engine.
 *
 * Behaviour:
 *   - If GROQ_API_KEY is set  → calls Groq API (llama-3.1-8b-instant)
 *   - If GROQ_API_KEY is absent → returns a deterministic mock response (dev mode)
 *   - AbortController enforces a configurable timeout (default 15 000ms)
 *   - All errors are re-thrown so the caller can catch them per test case
 *
 * Exported:
 *   callAI(fullPrompt, options?) → Promise<{ output: string, tokenCount: number }>
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const GROQ_API_URL  = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const DEFAULT_TIMEOUT_MS = 15_000;

// ─── Mock Response ────────────────────────────────────────────────────────────

/**
 * Returns a realistic-looking mock response after a short artificial delay.
 * Used when GROQ_API_KEY is not configured (local dev / CI).
 *
 * @param {string} prompt
 * @returns {Promise<{ output: string, tokenCount: number }>}
 */
async function mockCallAI(prompt) {
  // Simulate a realistic network delay (300–900ms)
  const delay = 300 + Math.floor(Math.random() * 600);
  await new Promise(resolve => setTimeout(resolve, delay));

  // Build a deterministic mock output that looks plausible
  const preview = prompt.slice(0, 80).replace(/\n/g, ' ');
  const output = [
    `[MOCK] Simulated AI response for prompt:`,
    `"${preview}..."`,
    ``,
    `• Key insight 1: The prompt has been received and processed successfully.`,
    `• Key insight 2: This is a mock response \u2014 set GROQ_API_KEY to use real AI.`,
    `• Key insight 3: Execution engine is working correctly end-to-end.`,
  ].join('\n');

  console.log(`[aiCaller] MOCK mode — returning simulated response (${delay}ms delay)`);
  return { output, tokenCount: output.split(/\s+/).length };
}

// ─── Real Groq Caller ─────────────────────────────────────────────────────────

/**
 * Calls the Groq API with AbortController-based timeout.
 *
 * @param {string} fullPrompt      - The complete prompt string (prompt_text + input)
 * @param {string} apiKey          - Groq API key
 * @param {number} timeoutMs       - Request timeout in milliseconds
 * @param {string} model           - Groq model ID
 * @returns {Promise<{ output: string, tokenCount: number }>}
 * @throws {Error} on timeout, HTTP error, or empty response
 */
async function groqCallAI(fullPrompt, apiKey, timeoutMs, model) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
    console.warn(`[aiCaller] Request aborted — exceeded ${timeoutMs}ms timeout.`);
  }, timeoutMs);

  let response;
  try {
    response = await fetch(GROQ_API_URL, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages:   [{ role: 'user', content: fullPrompt }],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });
  } catch (err) {
    // AbortError thrown when timeout fires
    if (err.name === 'AbortError') {
      throw new Error(`Groq API request timed out after ${timeoutMs}ms`);
    }
    throw new Error(`Network error calling Groq API: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  // Handle non-2xx HTTP responses
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message || detail;
    } catch (_) { /* ignore parse errors on error body */ }
    throw new Error(`Groq API error: ${detail}`);
  }

  // Parse the response body
  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error(`Failed to parse Groq API response: ${err.message}`);
  }

  // Extract the output text
  const output = data?.choices?.[0]?.message?.content?.trim();
  if (!output) {
    throw new Error('Groq API returned an empty response.');
  }

  const tokenCount = data?.usage?.completion_tokens ?? output.split(/\s+/).length;

  console.log(`[aiCaller] Groq response received — ${tokenCount} tokens`);
  return { output, tokenCount };
}

// ─── Public Interface ─────────────────────────────────────────────────────────

/**
 * Call the AI (Groq or mock) with a fully-assembled prompt string.
 *
 * @param {string} fullPrompt
 * @param {object} [options]
 * @param {number} [options.timeout=15000]                  - Timeout in ms
 * @param {string} [options.model='llama-3.1-8b-instant']   - Groq model ID
 * @returns {Promise<{ output: string, tokenCount: number }>}
 */
async function callAI(fullPrompt, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    model   = DEFAULT_MODEL,
  } = options;

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn('[aiCaller] GROQ_API_KEY not set — running in MOCK mode.');
    return mockCallAI(fullPrompt);
  }

  return groqCallAI(fullPrompt, apiKey, timeout, model);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = { callAI };
