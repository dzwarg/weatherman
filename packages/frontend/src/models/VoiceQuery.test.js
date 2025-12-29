/**
 * Tests for VoiceQuery model
 */

import { describe, it, expect } from 'vitest';
import { VoiceQuery } from './VoiceQuery';

describe('VoiceQuery', () => {
  const validQuery = {
    rawTranscript: 'what should I wear today',
    parsedIntent: 'clothing_advice',
    recognitionConfidence: 0.95,
    entities: {
      timeReference: 'today',
      location: null,
    },
    profileId: '7yo-boy',
  };

  describe('constructor', () => {
    it('should create valid query', () => {
      const query = new VoiceQuery(validQuery);

      expect(query.rawTranscript).toBe('what should I wear today');
      expect(query.parsedIntent).toBe('clothing_advice');
      expect(query.recognitionConfidence).toBe(0.95);
      expect(query.profileId).toBe('7yo-boy');
      expect(query.id).toBeDefined();
      expect(query.timestamp).toBeDefined();
    });

    it('should generate unique ID if not provided', () => {
      const query1 = new VoiceQuery(validQuery);
      const query2 = new VoiceQuery(validQuery);

      expect(query1.id).not.toBe(query2.id);
    });
  });

  describe('validation', () => {
    it('should throw error for invalid confidence', () => {
      expect(() => new VoiceQuery({ ...validQuery, recognitionConfidence: 1.5 })).toThrow('confidence');
      expect(() => new VoiceQuery({ ...validQuery, recognitionConfidence: -0.1 })).toThrow('confidence');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const query = new VoiceQuery(validQuery);
      const json = query.toJSON();

      expect(json.rawTranscript).toBe('what should I wear today');
      expect(json.parsedIntent).toBe('clothing_advice');
      expect(json.recognitionConfidence).toBe(0.95);
      expect(json.id).toBeDefined();
    });
  });

  describe('fromJSON', () => {
    it('should deserialize from JSON', () => {
      const original = new VoiceQuery(validQuery);
      const json = original.toJSON();
      const restored = VoiceQuery.fromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.rawTranscript).toBe(original.rawTranscript);
      expect(restored.parsedIntent).toBe(original.parsedIntent);
    });
  });
});
