'use strict';

/**
 * fileHandler.js
 *
 * A production-safe Node.js file handling module for managing
 * prompt data stored in data/prompts/prompts.json.
 *
 * Uses only Node.js built-in modules: fs, path
 *
 * Exported functions:
 *   - readPrompts()        → Read all prompts from JSON file
 *   - writePrompts(data)   → Write prompts array to JSON file
 *   - safeWritePrompts(data) → Atomically write prompts (crash-safe)
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ────────────────────────────────────────────────────────────────

/** Absolute path to the prompts directory */
const PROMPTS_DIR = path.resolve(__dirname, '..', 'data', 'prompts');

/** Absolute path to the main prompts JSON file */
const PROMPTS_FILE_PATH = path.join(PROMPTS_DIR, 'prompts.json');

/** Absolute path to the temporary file used in atomic writes */
const PROMPTS_TEMP_PATH = path.join(PROMPTS_DIR, 'prompts.tmp.json');

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Ensures the target directory exists. Creates it recursively if missing.
 *
 * @param {string} dirPath - Absolute path of the directory to ensure.
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Validates that the provided value is a non-null array.
 * Throws a TypeError if validation fails.
 *
 * @param {*} data - Value to validate.
 * @throws {TypeError} If data is not an array.
 */
function validateArray(data) {
  if (!Array.isArray(data)) {
    throw new TypeError(
      `[fileHandler] Invalid data: expected an array, received ${typeof data}.`
    );
  }
}

// ─── Exported Functions ───────────────────────────────────────────────────────

/**
 * Reads all prompts from data/prompts/prompts.json.
 *
 * Behaviour:
 *  - Returns [] if the file does not exist.
 *  - Returns [] if the file is empty.
 *  - Returns [] and logs a warning if the JSON is malformed.
 *  - Returns the parsed array on success.
 *
 * @returns {Array} Array of prompt objects.
 */
function readPrompts() {
  ensureDirectoryExists(PROMPTS_DIR);

  // File does not exist yet — return empty array
  if (!fs.existsSync(PROMPTS_FILE_PATH)) {
    return [];
  }

  let raw;
  try {
    raw = fs.readFileSync(PROMPTS_FILE_PATH, 'utf8').trim();
  } catch (err) {
    console.error('[fileHandler] Failed to read prompts.json:', err.message);
    return [];
  }

  // File is empty — return empty array
  if (!raw) {
    return [];
  }

  // Attempt to parse JSON safely
  try {
    const parsed = JSON.parse(raw);

    // Guard: the root value must be an array
    if (!Array.isArray(parsed)) {
      console.warn(
        '[fileHandler] prompts.json does not contain an array at its root. Returning [].'
      );
      return [];
    }

    return parsed;
  } catch (err) {
    console.warn(
      '[fileHandler] prompts.json contains malformed JSON. Returning [].',
      err.message
    );
    return [];
  }
}

/**
 * Writes an array of prompts to data/prompts/prompts.json.
 *
 * Behaviour:
 *  - Validates that data is an array before writing.
 *  - Formats JSON with 2-space indentation.
 *  - Creates the directory if it does not exist.
 *  - Throws a TypeError if data is not an array.
 *
 * @param {Array} data - Array of prompt objects to persist.
 * @throws {TypeError} If data is not an array.
 */
function writePrompts(data) {
  validateArray(data);
  ensureDirectoryExists(PROMPTS_DIR);

  try {
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(PROMPTS_FILE_PATH, json, 'utf8');
  } catch (err) {
    console.error('[fileHandler] Failed to write prompts.json:', err.message);
    throw err;
  }
}

/**
 * Atomically writes an array of prompts to data/prompts/prompts.json.
 *
 * Strategy:
 *  1. Write serialised data to a temporary file (prompts.tmp.json).
 *  2. Rename the temp file over the original (atomic on most OS/fs).
 *  3. Clean up the temp file if the rename fails.
 *
 * This prevents prompts.json from being left in a corrupt/partial state
 * if the process crashes or the disk fills up mid-write.
 *
 * @param {Array} data - Array of prompt objects to persist.
 * @throws {TypeError} If data is not an array.
 * @throws {Error}     If the write or rename operation fails.
 */
function safeWritePrompts(data) {
  validateArray(data);
  ensureDirectoryExists(PROMPTS_DIR);

  const json = JSON.stringify(data, null, 2);

  try {
    // Step 1: Write to a temporary file
    fs.writeFileSync(PROMPTS_TEMP_PATH, json, 'utf8');
  } catch (err) {
    console.error('[fileHandler] Failed to write temp file:', err.message);
    throw err;
  }

  try {
    // Step 2: Atomically rename temp → original
    fs.renameSync(PROMPTS_TEMP_PATH, PROMPTS_FILE_PATH);
  } catch (err) {
    console.error('[fileHandler] Atomic rename failed:', err.message);

    // Step 3: Clean up orphaned temp file
    try {
      if (fs.existsSync(PROMPTS_TEMP_PATH)) {
        fs.unlinkSync(PROMPTS_TEMP_PATH);
      }
    } catch (cleanupErr) {
      console.warn('[fileHandler] Could not clean up temp file:', cleanupErr.message);
    }

    throw err;
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  readPrompts,
  writePrompts,
  safeWritePrompts,
};
