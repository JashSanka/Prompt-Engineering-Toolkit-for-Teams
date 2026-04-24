/**
 * lib/cpqs.js
 *
 * CPQS — Composite Prompt Quality Score
 *
 * Formula:
 *   CPQS = (R × 0.30) + (K × 0.25) + (L × 0.15) + (S × 0.15) + (C × 0.15)
 *
 * Metrics:
 *   R  — Relevance       (user-rated 1–5)
 *   K  — Keyword Match   (auto, derived from keyword_match %)
 *   L  — Length          (auto, derived from output word count)
 *   S  — Structure       (user-rated 1–5)
 *   C  — Coherence       (user-rated 1–5)
 */

// ─── Weights ──────────────────────────────────────────────────────────────────

export const WEIGHTS = {
  R: 0.30, // Relevance
  K: 0.25, // Keyword Match
  L: 0.15, // Length
  S: 0.15, // Structure
  C: 0.15, // Coherence
};

// ─── Individual Metric Calculators ────────────────────────────────────────────

/**
 * K — Keyword Match Score (rescaled from 0–100% to 0–5)
 *
 * @param {number|null} keywordMatchPct - Percentage from store (0–100), or null
 * @returns {number} Score in the range 0–5, or 0 if unavailable
 */
export function calcK(keywordMatchPct) {
  if (keywordMatchPct === null || keywordMatchPct === undefined) return 0;
  // Rescale: (pct / 100) * 5
  return Math.min(5, Math.max(0, (keywordMatchPct / 100) * 5));
}

/**
 * L — Length Score
 *
 * Scoring:
 *   - Within valid range (minWords–maxWords) → 5
 *   - Slightly outside (±20%) → 3
 *   - Clearly invalid → 1
 *
 * @param {string} output - The model output text
 * @param {number} [minWords=20]  - Minimum acceptable word count
 * @param {number} [maxWords=200] - Maximum acceptable word count
 * @returns {number} 1 | 3 | 5
 */
export function calcL(output, minWords = 20, maxWords = 200) {
  const wordCount = output.trim().split(/\s+/).filter(Boolean).length;
  const slackMin = minWords * 0.8;  // 20% below min
  const slackMax = maxWords * 1.2;  // 20% above max

  if (wordCount >= minWords && wordCount <= maxWords) return 5;       // Valid range
  if (wordCount >= slackMin && wordCount <= slackMax) return 3;       // Slightly off
  return 1;                                                            // Invalid
}

/**
 * CPQS — Master composite score
 *
 * @param {{ R: number, K: number, L: number, S: number, C: number }} metrics
 * @returns {number} CPQS rounded to 2 decimal places (0–5)
 */
export function calcCPQS({ R, K, L, S, C }) {
  const score =
    (R * WEIGHTS.R) +
    (K * WEIGHTS.K) +
    (L * WEIGHTS.L) +
    (S * WEIGHTS.S) +
    (C * WEIGHTS.C);
  return Math.round(score * 100) / 100;
}

// ─── Color Band Helper ────────────────────────────────────────────────────────

/**
 * Returns a color band label based on the CPQS score.
 *
 * @param {number} score - CPQS score (0–5)
 * @returns {'high'|'medium'|'low'}
 */
export function cpqsBand(score) {
  if (score >= 4.0) return 'high';
  if (score >= 2.5) return 'medium';
  return 'low';
}

/**
 * Returns Tailwind CSS classes for the CPQS color band.
 *
 * @param {'high'|'medium'|'low'} band
 * @returns {string} Tailwind class string
 */
export function cpqsBandClasses(band) {
  switch (band) {
    case 'high':   return 'bg-green-100 text-green-800 border-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':    return 'bg-red-100 text-red-800 border-red-200';
    default:       return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

/**
 * Builds a human-readable tooltip string for the CPQS breakdown.
 *
 * @param {{ R: number, K: number, L: number, S: number, C: number }} metrics
 * @param {number} cpqs - Final CPQS score
 * @returns {string}
 */
export function cpqsTooltip({ R, K, L, S, C }, cpqs) {
  return [
    `CPQS Breakdown`,
    `R (Relevance)   : ${R.toFixed(2)} × 0.30 = ${(R * 0.30).toFixed(2)}`,
    `K (Keyword)     : ${K.toFixed(2)} × 0.25 = ${(K * 0.25).toFixed(2)}`,
    `L (Length)      : ${L.toFixed(2)} × 0.15 = ${(L * 0.15).toFixed(2)}`,
    `S (Structure)   : ${S.toFixed(2)} × 0.15 = ${(S * 0.15).toFixed(2)}`,
    `C (Coherence)   : ${C.toFixed(2)} × 0.15 = ${(C * 0.15).toFixed(2)}`,
    `─────────────────────────`,
    `CPQS            : ${cpqs.toFixed(2)}`,
  ].join('\n');
}
