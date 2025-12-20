import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

/**
 * Validates that required environment variables are present
 * @throws {Error} If required variables are missing
 */
function validateEnv() {
  const required = ['WEATHER_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate on load
validateEnv();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  weatherApiKey: process.env.WEATHER_API_KEY,
  weatherApiUrl: process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'mistral:latest',
};

export default config;
