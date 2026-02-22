/**
 * Bidding System Constants
 *
 * Values are loaded from environment variables with safe defaults.
 */

// Time window (in seconds) before auction end where a bid triggers anti-snipe extension
export const ANTI_SNIPE_SECONDS =
  Number(import.meta.env.VITE_ANTI_SNIPE_SECONDS) || 10;

// Duration (in seconds) to extend the auction by when anti-snipe is triggered
export const EXTENSION_SECONDS =
  Number(import.meta.env.VITE_EXTENSION_SECONDS) || 30;
