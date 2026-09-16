// ========================= BETTING STRATEGY =========================
// Edit this file freely — changes are hot-reloaded WITHOUT restarting
// the browser or logging in again.
// =====================================================================

module.exports = {
  // Base bet multiplier (Level 1 bet amount)
  BASE_BET: 2,

  // Minimum level to start betting
  MIN_LEVEL: 1,

  // Betting flags
  BET_BIG_SMALL: true,     // ✅ ON
  BET_RED_GREEN: true,     // ✅ ON

  // Quality filter — bet on these qualities only
  ALLOWED_QUALITIES: ["A", "B"],

  // Martingale bet sizing: quantity = 2^(level-1)
  // Level comes from the prediction engine (bsLayer / rgLayer)
  // Level 1 → 1, Level 2 → 2, Level 3 → 4, Level 4 → 8, etc.
  //
  // Override with a custom table if you want different amounts:
  // BET_TABLE: { 1: 1, 2: 4, 3: 8, 4: 16, 5: 32, 6: 64 }
  BET_TABLE: null,  // null = use 2^(level-1) formula

  // Max level to bet on — skip if layer exceeds this (safety limit)
  MAX_LEVEL: 7,
};
