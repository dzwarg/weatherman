/**
 * Ollama Service
 * Handles communication with the Ollama API for generating clothing recommendations
 */

import axios from 'axios';
import { TIMEOUTS } from '../config/constants.js';

// Ollama API endpoint
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:latest';

/**
 * Generate clothing advice using Ollama
 * @param {Object} request - Recommendation request
 * @returns {Promise<string>} Ollama response text
 */
export async function generateClothingAdvice(request) {
  try {
    // Build the prompt
    const prompt = buildPrompt(request);

    // Call Ollama API
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      },
      {
        timeout: TIMEOUTS.OLLAMA_API,
      }
    );

    // Validate response
    if (!response.data || !response.data.response) {
      throw new Error('Invalid response from Ollama API');
    }

    if (response.data.error) {
      throw new Error(`Ollama API error: ${response.data.error}`);
    }

    return response.data.response;
  } catch (error) {
    // Log error details
    console.error('Ollama API error:', {
      message: error.message,
      code: error.code,
      url: `${OLLAMA_BASE_URL}/api/generate`,
    });

    // Re-throw for upstream handling
    throw error;
  }
}

/**
 * Check if Ollama service is healthy
 * @returns {Promise<boolean>} True if Ollama is reachable
 */
export async function checkHealth() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 3000, // Short timeout for health check
    });

    return response.status === 200;
  } catch (error) {
    console.warn('Ollama health check failed:', {
      message: error.message,
      code: error.code,
    });
    return false;
  }
}

/**
 * Build a structured prompt for Ollama
 * @param {Object} request - Recommendation request
 * @returns {string} Formatted prompt
 */
export function buildPrompt(request) {
  const { profile, weather, prompt: userPrompt, timeframe } = request;

  // Determine age-appropriate language style
  const languageStyle = getLanguageStyle(profile.age);

  // Build the prompt sections
  const sections = [];

  // System context
  sections.push(`You are a helpful clothing advisor for a ${profile.age} year old ${profile.gender}.`);
  sections.push(`Use ${languageStyle} language that is appropriate for this age.`);

  // Weather information
  sections.push('\nCurrent weather conditions:');
  sections.push(`- Temperature: ${weather.temperature}°F`);
  if (weather.feelsLike !== undefined) {
    sections.push(`- Feels like: ${weather.feelsLike}°F`);
  }
  sections.push(`- Conditions: ${weather.conditions}`);
  if (weather.precipitationProbability !== undefined) {
    sections.push(`- Chance of precipitation: ${weather.precipitationProbability}%`);
  }
  if (weather.windSpeed !== undefined) {
    sections.push(`- Wind speed: ${weather.windSpeed} mph`);
  }
  if (weather.uvIndex !== undefined) {
    sections.push(`- UV index: ${weather.uvIndex}`);
  }

  // User context
  if (userPrompt) {
    sections.push(`\nContext: ${userPrompt}`);
  }

  if (timeframe) {
    sections.push(`Timeframe: ${timeframe}`);
  }

  // Task instructions
  sections.push('\nPlease recommend appropriate clothing for this child based on the weather and context.');
  sections.push('Organize your response in the following format:');
  sections.push('');
  sections.push('Base layers: [items]');
  sections.push('Outerwear: [items]');
  sections.push('Bottoms: [items]');
  sections.push('Accessories: [items]');
  sections.push('Footwear: [items]');
  sections.push('');
  sections.push('Spoken: [A friendly, age-appropriate sentence or two explaining the recommendations]');
  sections.push('');
  sections.push('Keep recommendations practical and appropriate for the child\'s age.');
  if (profile.age < 6) {
    sections.push('For young children, prioritize easy-to-wear items with simple fasteners.');
  }

  return sections.join('\n');
}

/**
 * Determine language complexity based on age
 * @param {number} age - Child's age
 * @returns {string} Language style description
 */
function getLanguageStyle(age) {
  if (age < 6) {
    return 'simple, fun, and easy to understand';
  }
  if (age < 10) {
    return 'clear and friendly';
  }
  return 'straightforward';
}

export default {
  generateClothingAdvice,
  checkHealth,
  buildPrompt,
};
