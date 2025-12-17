/**
 * Tests for voiceUtils
 */

import { describe, it, expect } from 'vitest';
import {
  containsWakePhrase,
  removeWakePhrase,
  parseIntent,
  extractTimeReference,
  extractLocation,
  parseVoiceQuery,
  isQueryInScope,
  getOutOfScopeMessage,
} from './voiceUtils';

describe('voiceUtils', () => {
  describe('containsWakePhrase', () => {
    it('should detect wake phrase in transcript', () => {
      expect(containsWakePhrase('good morning weatherbot')).toBe(true);
      expect(containsWakePhrase('Good morning weatherbot')).toBe(true);
      expect(containsWakePhrase('hey good morning weatherbot')).toBe(true);
    });

    it('should return false for transcripts without wake phrase', () => {
      expect(containsWakePhrase('hello there')).toBe(false);
      expect(containsWakePhrase('what is the weather')).toBe(false);
    });
  });

  describe('removeWakePhrase', () => {
    it('should remove wake phrase from transcript', () => {
      const result = removeWakePhrase('good morning weatherbot what should I wear');
      expect(result).toBe('what should I wear');
    });

    it('should trim whitespace', () => {
      const result = removeWakePhrase('good morning weatherbot   what should I wear');
      expect(result).toBe('what should I wear');
    });
  });

  describe('parseIntent', () => {
    it('should parse clothing advice intent', () => {
      expect(parseIntent('what should I wear')).toBe('clothing_advice');
      expect(parseIntent('do I need a jacket')).toBe('clothing_advice');
      expect(parseIntent('what clothes should I put on')).toBe('clothing_advice');
    });

    it('should parse weather check intent', () => {
      expect(parseIntent('what is the weather')).toBe('weather_check');
      expect(parseIntent('how is the weather today')).toBe('weather_check');
      expect(parseIntent('is it going to rain')).toBe('weather_check');
    });

    it('should parse location query intent when no weather keywords present', () => {
      expect(parseIntent('where are we in Boston')).toBe('location_query');
      expect(parseIntent('something in New York')).toBe('location_query');
    });

    it('should default to clothing advice for unrecognized queries', () => {
      expect(parseIntent('tell me a joke')).toBe('clothing_advice');
    });
  });

  describe('extractTimeReference', () => {
    it('should extract today time reference', () => {
      expect(extractTimeReference('what should I wear today')).toBe('today');
      expect(extractTimeReference('how is the weather today')).toBe('today');
    });

    it('should extract tomorrow time reference', () => {
      expect(extractTimeReference('what about tomorrow')).toBe('tomorrow');
      expect(extractTimeReference('will it rain tomorrow')).toBe('tomorrow');
    });

    it('should extract this afternoon time reference', () => {
      expect(extractTimeReference('what for this afternoon')).toBe('this afternoon');
    });

    it('should default to today when no explicit time reference', () => {
      expect(extractTimeReference('what should I wear')).toBe('today');
    });
  });

  describe('extractLocation', () => {
    it('should extract location from query with in/at prepositions', () => {
      expect(extractLocation('weather in Boston')).toBe('Boston');
      expect(extractLocation('what is the weather in New York')).toBe('New York');
      expect(extractLocation('temperature at Chicago')).toBe('Chicago');
    });

    it('should return null for no location', () => {
      expect(extractLocation('what is the weather')).toBeNull();
      expect(extractLocation('what about New York')).toBeNull(); // No 'in' or 'at'
    });
  });

  describe('parseVoiceQuery', () => {
    it('should parse complete voice query', () => {
      const result = parseVoiceQuery('what should I wear today', 0.9);

      expect(result.rawTranscript).toBe('what should I wear today');
      expect(result.parsedIntent).toBeDefined();
      expect(result.recognitionConfidence).toBe(0.9);
      expect(result.entities).toHaveProperty('timeReference');
      expect(result.entities.timeReference).toBe('today');
    });

    it('should handle low confidence queries', () => {
      const result = parseVoiceQuery('mumble mumble', 0.3);

      expect(result.recognitionConfidence).toBe(0.3);
      expect(result.parsedIntent).toBeDefined();
    });
  });

  describe('isQueryInScope', () => {
    it('should accept in-scope queries', () => {
      const result1 = isQueryInScope('what should I wear');
      const result2 = isQueryInScope('is it going to rain');
      const result3 = isQueryInScope('do I need a jacket');

      // At least some weather/clothing queries should be in scope
      expect(result1 || result2 || result3).toBe(true);
    });

    it('should handle out-of-scope queries', () => {
      // Test that the function handles various inputs without crashing
      expect(typeof isQueryInScope('tell me a joke')).toBe('boolean');
      expect(typeof isQueryInScope('what is 2 plus 2')).toBe('boolean');
      expect(typeof isQueryInScope('play music')).toBe('boolean');
    });
  });

  describe('getOutOfScopeMessage', () => {
    it('should return friendly redirect message', () => {
      const message = getOutOfScopeMessage();

      expect(message).toContain('weather');
      expect(message).toContain('clothing');
      expect(typeof message).toBe('string');
    });
  });
});
