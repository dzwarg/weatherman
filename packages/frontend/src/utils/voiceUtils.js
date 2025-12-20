/**
 * Voice Utilities
 * Query parsing, intent extraction, and location detection
 */

import { WAKE_PHRASE } from './constants.js';

/**
 * Check if transcript contains wake phrase
 * @param {string} transcript - Raw voice transcript
 * @returns {boolean} True if wake phrase detected
 */
export function containsWakePhrase(transcript) {
  const normalized = transcript.toLowerCase().trim();
  return normalized.includes(WAKE_PHRASE.toLowerCase());
}

/**
 * Remove wake phrase from transcript
 * @param {string} transcript - Raw voice transcript
 * @returns {string} Cleaned transcript
 */
export function removeWakePhrase(transcript) {
  const normalized = transcript.toLowerCase();
  const wakePhrase = WAKE_PHRASE.toLowerCase();

  if (normalized.includes(wakePhrase)) {
    return transcript
      .replace(new RegExp(wakePhrase, 'gi'), '')
      .trim();
  }

  return transcript.trim();
}

/**
 * Parse intent from voice query
 * @param {string} transcript - Voice transcript
 * @returns {string} Intent type
 */
export function parseIntent(transcript) {
  const normalized = transcript.toLowerCase();

  // Clothing advice keywords
  const clothingKeywords = ['wear', 'clothing', 'clothes', 'outfit', 'dress', 'put on'];
  if (clothingKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'clothing_advice';
  }

  // Weather check keywords
  const weatherKeywords = ['weather', 'temperature', 'forecast', 'rain', 'sunny', 'cold', 'hot'];
  if (weatherKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'weather_check';
  }

  // Location query keywords
  if (normalized.includes(' in ') || normalized.includes(' at ')) {
    return 'location_query';
  }

  // Default to clothing advice (main use case)
  return 'clothing_advice';
}

/**
 * Extract time reference from query
 * @param {string} transcript - Voice transcript
 * @returns {string|null} Time reference or null
 */
export function extractTimeReference(transcript) {
  const normalized = transcript.toLowerCase();

  const timeMap = {
    today: ['today', 'right now', 'currently'],
    tomorrow: ['tomorrow'],
    'this afternoon': ['afternoon', 'later today'],
    'this evening': ['evening', 'tonight'],
    'this week': ['this week'],
    'this weekend': ['weekend'],
  };

  for (const [key, patterns] of Object.entries(timeMap)) {
    if (patterns.some((pattern) => normalized.includes(pattern))) {
      return key;
    }
  }

  // Default to today if no time reference
  return 'today';
}

/**
 * Extract location from query
 * @param {string} transcript - Voice transcript
 * @returns {string|null} Location name or null
 */
export function extractLocation(transcript) {
  // Look for "in [location]" or "at [location]" patterns
  const inMatch = transcript.match(/\bin\s+([a-zA-Z\s]+)/i);
  const atMatch = transcript.match(/\bat\s+([a-zA-Z\s]+)/i);

  if (inMatch) {
    return inMatch[1].trim();
  }

  if (atMatch) {
    return atMatch[1].trim();
  }

  return null;
}

/**
 * Parse complete voice query
 * @param {string} rawTranscript - Raw voice transcript
 * @param {number} confidence - Recognition confidence (0-1)
 * @returns {Object} Parsed query object
 */
export function parseVoiceQuery(rawTranscript, confidence = 1.0) {
  // Remove wake phrase
  const cleanedTranscript = removeWakePhrase(rawTranscript);

  // Parse components
  const parsedIntent = parseIntent(cleanedTranscript);
  const timeReference = extractTimeReference(cleanedTranscript);
  const location = extractLocation(cleanedTranscript);

  return {
    rawTranscript,
    cleanedTranscript,
    parsedIntent,
    entities: {
      timeReference,
      location,
      followUp: !containsWakePhrase(rawTranscript),
    },
    recognitionConfidence: confidence,
  };
}

/**
 * Validate if query is in scope
 * @param {string} transcript - Voice transcript
 * @returns {boolean} True if query is in scope
 */
export function isQueryInScope(transcript) {
  const normalized = transcript.toLowerCase();

  // Out of scope keywords
  const outOfScopeKeywords = [
    'play music',
    'call',
    'text message',
    'email',
    'search for',
    'open',
    'navigate',
    'directions',
  ];

  return !outOfScopeKeywords.some((keyword) => normalized.includes(keyword));
}

/**
 * Generate friendly error message for out-of-scope queries
 * @returns {string} Error message
 */
export function getOutOfScopeMessage() {
  return "I can help with weather and clothing advice. Try asking 'What should I wear today?'";
}
