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

    // Call Claude API
    const message = await anthropic.messages.create({
      model: CLAUDE_SETTINGS.model,
      max_tokens: CLAUDE_SETTINGS.maxTokens,
      temperature: CLAUDE_SETTINGS.temperature,
      system,
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

  // Determine age-appropriate language style
  const languageStyle = getLanguageStyle(profile.age);

  // System context
  const systemParts = [];
  systemParts.push(`You are a helpful clothing advisor for a ${profile.age} year old ${profile.gender}.`);
  systemParts.push(`Use ${languageStyle} language that is appropriate for this age.`);
  systemParts.push('Keep recommendations practical and appropriate for the child\'s age.');
  if (profile.age < 6) {
    systemParts.push('For young children, prioritize easy-to-wear items with simple fasteners.');
  }

  const system = systemParts.join(' ');

  // User message with weather and context
  const userParts = [];

  userParts.push('Current weather conditions:');
  userParts.push(`- Temperature: ${weather.temperature}°F`);
  if (weather.feelsLike !== undefined) {
    userParts.push(`- Feels like: ${weather.feelsLike}°F`);
  }
  userParts.push(`- Conditions: ${weather.conditions}`);
  if (weather.precipitationProbability !== undefined) {
    userParts.push(`- Chance of precipitation: ${weather.precipitationProbability}%`);
  }
  if (weather.windSpeed !== undefined) {
    userParts.push(`- Wind speed: ${weather.windSpeed} mph`);
  }
  if (weather.uvIndex !== undefined) {
    userParts.push(`- UV index: ${weather.uvIndex}`);
  }

  // User context
  if (userPrompt) {
    userParts.push(`\nContext: ${userPrompt}`);
  }

  if (timeframe) {
    userParts.push(`Timeframe: ${timeframe}`);
  }

  // Task instructions - request JSON format
  userParts.push('\nPlease recommend appropriate clothing for this child based on the weather and context.');
  userParts.push('Respond with ONLY a valid JSON object in this exact format (no markdown, no code blocks):');
  userParts.push('');
  userParts.push('{');
  userParts.push('  "recommendations": {');
  userParts.push('    "baseLayers": ["item1", "item2"],');
  userParts.push('    "outerwear": ["item1", "item2"],');
  userParts.push('    "bottoms": ["item1", "item2"],');
  userParts.push('    "accessories": ["item1", "item2"],');
  userParts.push('    "footwear": ["item1", "item2"]');
  userParts.push('  },');
  userParts.push('  "spokenResponse": "A friendly, age-appropriate sentence or two explaining the recommendations"');
  userParts.push('}');
  userParts.push('');
  userParts.push('IMPORTANT: Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any other text.');

  const userMessage = userParts.join('\n');

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
