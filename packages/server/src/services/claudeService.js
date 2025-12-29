/**
 * Claude AI Service
 * Handles communication with the Anthropic Claude API for generating clothing recommendations
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';
import { CLAUDE_SETTINGS } from '../config/constants.js';

// Initialize Anthropic client (will be null if no API key)
let anthropic = null;
if (config.anthropicApiKey) {
  anthropic = new Anthropic({
    apiKey: config.anthropicApiKey,
  });
}

/**
 * Generate clothing advice using Claude API
 * @param {Object} request - Recommendation request
 * @returns {Promise<Object>} Structured recommendation object with recommendations and spokenResponse
 */
export async function generateClothingAdvice(request) {
  if (!anthropic) {
    throw new Error('Claude API key not configured');
  }

  try {
    // Build the prompt
    const { system, userMessage } = buildPrompt(request);

    // Call Claude API with prompt caching for system prompt
    // System prompt is static and should be cached (saves 90% on cached tokens)
    const message = await anthropic.messages.create({
      model: CLAUDE_SETTINGS.model,
      max_tokens: CLAUDE_SETTINGS.maxTokens,
      temperature: CLAUDE_SETTINGS.temperature,
      system: [
        {
          type: 'text',
          text: system,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text from response
    if (!message.content || message.content.length === 0) {
      throw new Error('Invalid response from Claude API');
    }

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent) {
      throw new Error('No text content in Claude API response');
    }

    // Parse JSON response
    let responseText = textContent.text.trim();

    // Remove markdown code blocks if present (Claude sometimes adds them despite instructions)
    responseText = responseText.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '');

    try {
      const parsed = JSON.parse(responseText);

      // Validate structure
      if (!parsed.recommendations || !parsed.spokenResponse) {
        throw new Error('Invalid JSON structure: missing recommendations or spokenResponse');
      }

      return parsed;
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', responseText);
      throw new Error(`Invalid JSON response from Claude: ${parseError.message}`);
    }
  } catch (error) {
    // Log error details
    console.error('Claude API error:', {
      message: error.message,
      type: error.constructor.name,
      status: error.status,
    });

    // Re-throw for upstream handling
    throw error;
  }
}

/**
 * Check if Claude service is healthy (API key is available)
 * @returns {Promise<boolean>} True if Claude API is configured
 */
export async function checkHealth() {
  // Simple check: is API key configured?
  if (!config.anthropicApiKey) {
    return false;
  }

  // Optional: make a minimal API call to verify the key works
  // For now, just check if the key is present
  return anthropic !== null;
}

/**
 * Build a structured prompt for Claude
 * @param {Object} request - Recommendation request
 * @returns {Object} Object with system and userMessage strings
 */
export function buildPrompt(request) {
  const { profile, weather, prompt: userPrompt, timeframe } = request;

  // Concise system context (reduced from ~70 to ~35 tokens)
  const system = `Clothing advisor for ${profile.age}yo ${profile.gender}. ${getLanguageStyle(profile.age)} language.${profile.age < 6 ? ' Easy-to-wear items.' : ''}`;

  // Build compact weather data (reduced from ~40 to ~25 tokens)
  const weatherData = [
    `${weather.temperature}°F`,
    weather.feelsLike !== undefined && `feels ${weather.feelsLike}°F`,
    weather.conditions,
    weather.precipitationProbability !== undefined && `${weather.precipitationProbability}% precip`,
    weather.windSpeed !== undefined && `${weather.windSpeed}mph wind`,
    weather.uvIndex !== undefined && `UV${weather.uvIndex}`,
  ]
    .filter(Boolean)
    .join(', ');

  // Compact user message (reduced from ~150 to ~60 tokens)
  const parts = [
    `Weather: ${weatherData}`,
    userPrompt && `Activity: ${userPrompt}`,
    timeframe && `Time: ${timeframe}`,
    '\nReturn JSON only:',
    '{"recommendations":{"baseLayers":["..."],"outerwear":["..."],"bottoms":["..."],"accessories":["..."],"footwear":["..."]},"spokenResponse":"..."}',
  ].filter(Boolean);

  const userMessage = parts.join('\n');

  return { system, userMessage };
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
