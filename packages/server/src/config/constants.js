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
  OLLAMA_API: 10000, // 10 seconds
};

// Ollama settings
export const OLLAMA_SETTINGS = {
  temperature: 0.7,
  maxTokens: 500,
};

// User profiles
export const USER_PROFILES = [
  { id: '4yo-girl', age: 4, gender: 'girl', description: '4 year old girl - simple clothing, easy fasteners' },
  { id: '7yo-boy', age: 7, gender: 'boy', description: '7 year old boy - moderate complexity' },
  { id: '10yo-boy', age: 10, gender: 'boy', description: '10 year old boy - more complex clothing options' },
];

export default {
  RATE_LIMITS,
  TIMEOUTS,
  OLLAMA_SETTINGS,
  USER_PROFILES,
};
