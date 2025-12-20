import { describe, it, expect } from 'vitest';
import { analyzePrompt, extractKeywords, extractTimeframe } from '../../../src/services/promptAnalysisService.js';

describe('promptAnalysisService', () => {
  describe('analyzePrompt', () => {
    it('should extract keywords and context from voice prompt', () => {
      const prompt = 'What should I wear to the playground today?';
      const result = analyzePrompt(prompt);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('context');
      expect(result.keywords).toBeInstanceOf(Array);
      expect(result.keywords).toContain('playground');
    });

    it('should handle empty prompt', () => {
      const result = analyzePrompt('');

      expect(result.keywords).toEqual([]);
      expect(result.context).toBe('general');
    });

    it('should extract activity context', () => {
      const prompt = 'going to school';
      const result = analyzePrompt(prompt);

      expect(result.context).toBe('school');
      expect(result.keywords).toContain('school');
    });

    it('should extract outdoor activity context', () => {
      const prompt = 'playing outside in the park';
      const result = analyzePrompt(prompt);

      expect(result.context).toBe('outdoor');
      expect(result.keywords).toContain('outside');
      expect(result.keywords).toContain('park');
    });

    it('should extract sports context', () => {
      const prompt = 'soccer practice this afternoon';
      const result = analyzePrompt(prompt);

      expect(result.context).toBe('sports');
      expect(result.keywords).toContain('soccer');
      expect(result.keywords).toContain('practice');
    });

    it('should be case insensitive', () => {
      const prompt = 'GOING TO THE PLAYGROUND';
      const result = analyzePrompt(prompt);

      expect(result.keywords).toContain('playground');
    });
  });

  describe('extractKeywords', () => {
    it('should extract relevant keywords', () => {
      const text = 'I want to go to the playground after school';
      const keywords = extractKeywords(text);

      expect(keywords).toBeInstanceOf(Array);
      expect(keywords).toContain('playground');
      expect(keywords).toContain('school');
    });

    it('should filter out common stop words', () => {
      const text = 'I want to go to the playground';
      const keywords = extractKeywords(text);

      expect(keywords).not.toContain('I');
      expect(keywords).not.toContain('want');
      expect(keywords).not.toContain('to');
      expect(keywords).not.toContain('the');
    });

    it('should handle empty text', () => {
      const keywords = extractKeywords('');

      expect(keywords).toEqual([]);
    });

    it('should extract activity-related keywords', () => {
      const text = 'playing soccer outside in the rain';
      const keywords = extractKeywords(text);

      expect(keywords).toContain('playing');
      expect(keywords).toContain('soccer');
      expect(keywords).toContain('outside');
      expect(keywords).toContain('rain');
    });
  });

  describe('extractTimeframe', () => {
    it('should extract morning timeframe', () => {
      const prompt = 'What should I wear this morning?';
      const timeframe = extractTimeframe(prompt);

      expect(timeframe).toBe('morning');
    });

    it('should extract afternoon timeframe', () => {
      const prompt = 'going to the park this afternoon';
      const timeframe = extractTimeframe(prompt);

      expect(timeframe).toBe('afternoon');
    });

    it('should extract evening timeframe', () => {
      const prompt = 'What should I wear tonight?';
      const timeframe = extractTimeframe(prompt);

      expect(timeframe).toBe('evening');
    });

    it('should default to "today" if no specific timeframe', () => {
      const prompt = 'What should I wear?';
      const timeframe = extractTimeframe(prompt);

      expect(timeframe).toBe('today');
    });

    it('should handle "now" as current time', () => {
      const prompt = 'What should I wear right now?';
      const timeframe = extractTimeframe(prompt);

      expect(['morning', 'afternoon', 'evening', 'today']).toContain(timeframe);
    });
  });
});
