/**
 * Recommendation service
 * Orchestrates Ollama calls and fallback logic
 */

import { getClothingRecommendations } from '../utils/clothingRules.js';
import * as ollamaService from './ollamaService.js';
import { parseOllamaResponse } from '../utils/ollamaResponseParser.js';
import crypto from 'crypto';

// Cache for Ollama availability check (5 minute TTL)
let ollamaAvailableCache = null;
let ollamaCacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate clothing recommendations
 * @param {Object} request - Recommendation request with profile and weather
 * @returns {Promise<Object>} Recommendations with structured format
 */
export async function generateRecommendations(request) {
  const startTime = Date.now();

  try {
    // Check if Ollama is available (with caching)
    const ollamaAvailable = await isOllamaAvailable();

    if (ollamaAvailable) {
      try {
        // Try to get recommendations from Ollama
        const ollamaResponse = await ollamaService.generateClothingAdvice(request);
        const parsed = parseOllamaResponse(ollamaResponse);

        // Return structured response with Ollama recommendations
        return {
          id: generateId(),
          profileId: request.profile.id,
          weatherData: request.weather,
          recommendations: parsed.recommendations,
          spokenResponse: parsed.spokenResponse,
          source: 'ollama',
          confidence: 0.95, // Higher confidence for LLM-generated
          createdAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        };
      } catch (ollamaError) {
        // Log Ollama error and fall through to rule-based fallback
        console.warn('Ollama generation failed, falling back to rules:', {
          error: ollamaError.message,
          profile: request.profile.id,
        });
      }
    }

    // Fallback to rule-based recommendations
    const recommendations = getClothingRecommendations(request);
    const spokenResponse = generateSpokenResponse(request, recommendations);

    return {
      id: generateId(),
      profileId: request.profile.id,
      weatherData: request.weather,
      recommendations: recommendations.recommendations || recommendations,
      spokenResponse,
      source: 'rules',
      confidence: 0.85, // Slightly lower confidence for rule-based
      createdAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Recommendation generation error:', error);
    throw error;
  }
}

/**
 * Check if Ollama service is available (with caching)
 * @returns {Promise<boolean>} True if available
 */
export async function isOllamaAvailable() {
  const now = Date.now();

  // Return cached result if still valid
  if (ollamaAvailableCache !== null && now < ollamaCacheExpiry) {
    return ollamaAvailableCache;
  }

  // Check Ollama health
  try {
    const available = await ollamaService.checkHealth();

    // Cache the result
    ollamaAvailableCache = available;
    ollamaCacheExpiry = now + CACHE_TTL;

    return available;
  } catch (error) {
    // On error, cache as unavailable
    ollamaAvailableCache = false;
    ollamaCacheExpiry = now + CACHE_TTL;
    return false;
  }
}

/**
 * Clear the Ollama availability cache (primarily for testing)
 */
export function clearOllamaCache() {
  ollamaAvailableCache = null;
  ollamaCacheExpiry = 0;
}

/**
 * Generate a unique ID for recommendations
 * @returns {string} Unique ID
 */
function generateId() {
  return `rec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Generate a spoken response from rule-based recommendations
 * @param {Object} request - Original request
 * @param {Object} recommendations - Rule-based recommendations
 * @returns {string} Spoken response
 */
function generateSpokenResponse(request, recommendations) {
  const parts = [];
  const { weather } = request;
  const recs = recommendations.recommendations || recommendations;

  // Weather summary
  const tempDesc = getTemperatureDescription(weather.temperature);
  parts.push(`It's ${tempDesc} today at ${weather.temperature} degrees.`);

  if (weather.conditions) {
    parts.push(`The weather is ${weather.conditions.toLowerCase()}.`);
  }

  // Main clothing items
  const items = [];
  if (recs.outerwear && recs.outerwear.length > 0) {
    items.push(recs.outerwear[0].item || recs.outerwear[0]);
  }
  if (recs.baseLayers && recs.baseLayers.length > 0) {
    items.push(recs.baseLayers[0].item || recs.baseLayers[0]);
  }

  if (items.length > 0) {
    parts.push(`You should wear ${items.join(' and ')}.`);
  }

  // Accessories
  if (recs.accessories && recs.accessories.length > 0) {
    const accessory = recs.accessories[0].item || recs.accessories[0];
    parts.push(`Don't forget your ${accessory}!`);
  }

  return parts.join(' ');
}

/**
 * Get child-friendly temperature description
 * @param {number} temperature - Temperature in Fahrenheit
 * @returns {string} Description
 */
function getTemperatureDescription(temperature) {
  if (temperature < 32) return 'very cold';
  if (temperature < 45) return 'cold';
  if (temperature < 60) return 'chilly';
  if (temperature < 70) return 'nice';
  if (temperature < 80) return 'warm';
  if (temperature < 90) return 'hot';
  return 'very hot';
}

export default {
  generateRecommendations,
  isOllamaAvailable,
};
