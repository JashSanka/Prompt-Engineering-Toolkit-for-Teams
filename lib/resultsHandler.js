'use strict';

/**
 * lib/resultsHandler.js
 *
 * Production-safe handler for results_log.json.
 * Follows the same atomic-write pattern as lib/fileHandler.js.
 *
 * Exported functions:
 *   - readResults()          → Read all result log entries
 *   - writeResults(data)     → Write results array atomically
 *   - appendResult(entry)    → Append or merge a single result entry
 *   - getResultsByPromptId(promptId) → Filter results by promptId
 */

const fs   = require('fs');
const path = require('path');

// ─── Constants ────────────────────────────────────────────────────────────────

const RESULTS_DIR   = path.resolve(__dirname, '..', 'data', 'results');
const RESULTS_FILE  = path.join(RESULTS_DIR, 'results_log.json');
const RESULTS_TEMP  = path.join(RESULTS_DIR, 'results_log.tmp.json');

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function validateArray(data) {
  if (!Array.isArray(data)) {
    throw new TypeError(
      `[resultsHandler] Expected array, received ${typeof data}.`
    );
  }
}

// ─── Exported Functions ───────────────────────────────────────────────────────

/**
 * Read all results from results_log.json.
 * Returns [] if file doesn't exist or is empty/malformed.
 *
 * @returns {Array}
 */
function readResults() {
  ensureDir(RESULTS_DIR);
  if (!fs.existsSync(RESULTS_FILE)) return [];

  let raw;
  try {
    raw = fs.readFileSync(RESULTS_FILE, 'utf8').trim();
  } catch (err) {
    console.error('[resultsHandler] Failed to read results_log.json:', err.message);
    return [];
  }

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn('[resultsHandler] Malformed JSON in results_log.json. Returning [].', err.message);
    return [];
  }
}

/**
 * Atomically write the full results array to results_log.json.
 *
 * @param {Array} data
 */
function writeResults(data) {
  validateArray(data);
  ensureDir(RESULTS_DIR);

  const json = JSON.stringify(data, null, 2);

  try {
    fs.writeFileSync(RESULTS_TEMP, json, 'utf8');
  } catch (err) {
    console.error('[resultsHandler] Failed to write temp file:', err.message);
    throw err;
  }

  try {
    fs.renameSync(RESULTS_TEMP, RESULTS_FILE);
  } catch (err) {
    console.error('[resultsHandler] Atomic rename failed:', err.message);
    try {
      if (fs.existsSync(RESULTS_TEMP)) fs.unlinkSync(RESULTS_TEMP);
    } catch (_) {}
    throw err;
  }
}

/**
 * Append or merge a single result entry.
 * If an entry with the same (promptId, version) exists, replaces it.
 *
 * @param {{ promptId: string, version: string, results: Array }} entry
 */
function appendResult(entry) {
  const existing = readResults();
  const idx = existing.findIndex(
    e => e.promptId === entry.promptId && e.version === entry.version
  );

  if (idx >= 0) {
    existing[idx] = entry; // Replace existing entry for same version
  } else {
    existing.push(entry);  // Append new entry
  }

  writeResults(existing);
}

/**
 * Get all result entries for a given promptId.
 *
 * @param {string} promptId
 * @returns {Array}
 */
function getResultsByPromptId(promptId) {
  return readResults().filter(e => e.promptId === promptId);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  readResults,
  writeResults,
  appendResult,
  getResultsByPromptId,
};
