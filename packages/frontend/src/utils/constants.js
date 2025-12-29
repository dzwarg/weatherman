/**
 * Application Constants
 * Central configuration for the Weatherman application
 */

// Wake phrase for voice activation
export const WAKE_PHRASE = 'good morning weatherbot';

// Predefined user profiles
// Note: IDs match server format (4yo-girl, 7yo-boy, 10yo-boy)
export const PROFILES = [
  {
    id: '4yo-girl',
    age: 4,
    gender: 'girl',
    complexityLevel: 'simple',
    vocabularyStyle: 'girl-typical',
    displayName: '4 year old girl',
  },
  {
    id: '7yo-boy',
    age: 7,
    gender: 'boy',
    complexityLevel: 'moderate',
    vocabularyStyle: 'boy-typical',
    displayName: '7 year old boy',
  },
  {
    id: '10yo-boy',
    age: 10,
    gender: 'boy',
    complexityLevel: 'complex',
    vocabularyStyle: 'boy-typical',
    displayName: '10 year old boy',
  },
];

// API Configuration
export const API_CONFIG = {
  OPENWEATHER_API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY,
  // Use proxy in development to avoid CORS issues
  OPENWEATHER_BASE_URL: import.meta.env.DEV
    ? '/api/weather/onecall'
    : 'https://api.openweathermap.org/data/3.0/onecall',
  TIMEOUT: parseInt(import.meta.env.VITE_OPENWEATHER_TIMEOUT) || 5000,
  UNITS: 'imperial', // Fahrenheit
};

// Cache Configuration
export const CACHE_CONFIG = {
  WEATHER_DURATION: parseInt(import.meta.env.VITE_WEATHER_CACHE_DURATION) || 3600000, // 1 hour
  DATABASE_NAME: 'weatherbot',
  WEATHER_STORE: 'weatherCache',
  MAX_WEATHER_ENTRIES: 10,
};

// Storage Keys
export const STORAGE_KEYS = {
  SELECTED_PROFILE: 'weatherbot:selectedProfile',
  APP_PREFERENCES: 'weatherbot:appPreferences',
  CURRENT_LOCATION: 'weatherbot:currentLocation',
  VOICE_STATE: 'weatherbot:voiceState',
};

// Voice Configuration
export const VOICE_CONFIG = {
  LANGUAGE: 'en-US',
  RATE: 0.9, // Child-friendly: slightly slower
  PITCH: 1.1, // Child-friendly: slightly higher
  VOLUME: 1.0,
};

// Timeout Configuration
export const TIMEOUTS = {
  API_CALL: 5000,
  VOICE_RECOGNITION: 10000,
  SPEECH_SYNTHESIS: 30000,
};

// Temperature ranges for recommendations
export const TEMPERATURE_RANGES = {
  EXTREME_COLD: -Infinity,
  COLD: 32,
  COOL: 45,
  MILD: 60,
  WARM: 75,
  HOT: 85,
  EXTREME_HOT: Infinity,
};

// Precipitation thresholds
export const PRECIPITATION_THRESHOLDS = {
  NONE: 0,
  LOW: 30,
  MODERATE: 60,
  HIGH: 100,
};

// Wind speed thresholds (mph)
export const WIND_THRESHOLDS = {
  CALM: 0,
  LIGHT: 10,
  MODERATE: 20,
  STRONG: 30,
};

// UV Index thresholds
export const UV_THRESHOLDS = {
  LOW: 0,
  MODERATE: 3,
  HIGH: 6,
  VERY_HIGH: 8,
  EXTREME: 11,
};
