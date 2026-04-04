/**
 * Application constants
 */

// Rate limiting
export const RATE_LIMITS = {
  WEATHER_API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max requests per window
  },
  RECOMMENDATIONS_API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Max requests per window
  },
};

// API timeouts
export const TIMEOUTS = {
  WEATHER_API: 5000, // 5 seconds
  CLAUDE_API: 30000, // 30 seconds (Claude API can be slower)
};

// Claude API settings
export const CLAUDE_SETTINGS = {
  model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: 1024,
  temperature: 0.7,
};

// User profiles
export const USER_PROFILES = [
  { id: '5yo-girl', age: 5, gender: 'girl', description: '5 year old girl - simple clothing, easy fasteners' },
  { id: '8yo-boy', age: 8, gender: 'boy', description: '8 year old boy - moderate complexity' },
  { id: '11yo-boy', age: 11, gender: 'boy', description: '11 year old boy - more complex clothing options' },
];

export default {
  RATE_LIMITS,
  TIMEOUTS,
  CLAUDE_SETTINGS,
  USER_PROFILES,
};
