/**
 * lib/api.js
 * 
 * Centralized API configuration for the Prompt Engineering Toolkit.
 */

// The base URL for the backend server.
// In development, it defaults to localhost:3001.
// In production, it uses the VITE_API_URL environment variable.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const ENDPOINTS = {
  EXECUTE: `${API_URL}/execute`,
  RESULTS: `${API_URL}/results`,
  TESTSUITE: `${API_URL}/testsuite`,
  HEALTH: `${API_URL}/health`,
};
