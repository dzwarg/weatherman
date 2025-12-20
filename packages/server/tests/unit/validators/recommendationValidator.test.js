import { describe, it, expect } from 'vitest';
import { validateRecommendationRequest } from '../../../src/validators/recommendationValidator.js';

describe('recommendationValidator', () => {
  const validRequest = {
    profile: {
      id: '4yo-girl',
      age: 4,
      gender: 'girl',
    },
    weather: {
      temperature: 45,
      feelsLike: 42,
      conditions: 'Cloudy',
      precipitationProbability: 30,
      windSpeed: 8,
      uvIndex: 4,
    },
    prompt: 'What should I wear to school?',
    timeframe: 'morning',
  };

  describe('profile validation', () => {
    it('should validate correct profile', () => {
      const result = validateRecommendationRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should require profile', () => {
      const request = { ...validRequest, profile: undefined };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Profile is required');
    });

    it('should require profile ID', () => {
      const request = {
        ...validRequest,
        profile: { age: 4, gender: 'girl' },
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Profile ID is required');
    });

    it('should validate profile ID against valid profiles', () => {
      const request = {
        ...validRequest,
        profile: { ...validRequest.profile, id: 'invalid-profile' },
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Profile ID must be one of');
    });

    it('should accept all valid profile IDs', () => {
      const validIds = ['4yo-girl', '7yo-boy', '10yo-boy'];

      for (const id of validIds) {
        const request = {
          ...validRequest,
          profile: { ...validRequest.profile, id },
        };
        const result = validateRecommendationRequest(request);

        expect(result.isValid).toBe(true);
      }
    });

    it('should require profile age', () => {
      const request = {
        ...validRequest,
        profile: { id: '4yo-girl', gender: 'girl' },
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Profile age is required');
    });

    it('should validate age is a number', () => {
      const request = {
        ...validRequest,
        profile: { ...validRequest.profile, age: '4' },
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Profile age must be a number');
    });

    it('should require profile gender', () => {
      const request = {
        ...validRequest,
        profile: { id: '4yo-girl', age: 4 },
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Profile gender is required');
    });

    it('should validate gender is girl or boy', () => {
      const request = {
        ...validRequest,
        profile: { ...validRequest.profile, gender: 'other' },
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Profile gender must be either "girl" or "boy"');
    });
  });

  describe('weather validation', () => {
    it('should require weather', () => {
      const request = { ...validRequest, weather: undefined };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weather data is required');
    });

    it('should require temperature', () => {
      const request = {
        ...validRequest,
        weather: { conditions: 'Cloudy' },
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weather temperature is required');
    });

    it('should validate temperature is a number', () => {
      const request = {
        ...validRequest,
        weather: { ...validRequest.weather, temperature: '45' },
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weather temperature must be a number');
    });

    it('should validate temperature range', () => {
      const tooLow = {
        ...validRequest,
        weather: { ...validRequest.weather, temperature: -101 },
      };
      const tooHigh = {
        ...validRequest,
        weather: { ...validRequest.weather, temperature: 151 },
      };

      expect(validateRecommendationRequest(tooLow).isValid).toBe(false);
      expect(validateRecommendationRequest(tooHigh).isValid).toBe(false);
    });

    it('should accept valid temperature range', () => {
      const temperatures = [-100, -50, 0, 32, 75, 100, 150];

      for (const temp of temperatures) {
        const request = {
          ...validRequest,
          weather: { ...validRequest.weather, temperature: temp },
        };
        const result = validateRecommendationRequest(request);

        expect(result.isValid).toBe(true);
      }
    });

    it('should require conditions', () => {
      const request = {
        ...validRequest,
        weather: { temperature: 45 },
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weather conditions are required');
    });

    it('should accept optional weather fields', () => {
      const minimalRequest = {
        profile: validRequest.profile,
        weather: {
          temperature: 45,
          conditions: 'Cloudy',
        },
      };
      const result = validateRecommendationRequest(minimalRequest);

      expect(result.isValid).toBe(true);
    });
  });

  describe('prompt validation', () => {
    it('should allow optional prompt', () => {
      const request = { ...validRequest, prompt: undefined };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(true);
    });

    it('should validate prompt is a string', () => {
      const request = {
        ...validRequest,
        prompt: 123,
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Prompt must be a string');
    });

    it('should validate prompt length', () => {
      const longPrompt = 'a'.repeat(501);
      const request = {
        ...validRequest,
        prompt: longPrompt,
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Prompt must be 500 characters or less');
    });

    it('should accept valid prompt lengths', () => {
      const prompts = [
        '',
        'short',
        'a'.repeat(250),
        'a'.repeat(500),
      ];

      for (const prompt of prompts) {
        const request = { ...validRequest, prompt };
        const result = validateRecommendationRequest(request);

        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('timeframe validation', () => {
    it('should allow optional timeframe', () => {
      const request = { ...validRequest, timeframe: undefined };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(true);
    });

    it('should validate timeframe values', () => {
      const validTimeframes = ['morning', 'afternoon', 'evening', 'today'];

      for (const timeframe of validTimeframes) {
        const request = { ...validRequest, timeframe };
        const result = validateRecommendationRequest(request);

        expect(result.isValid).toBe(true);
      }
    });

    it('should reject invalid timeframe', () => {
      const request = {
        ...validRequest,
        timeframe: 'invalid',
      };
      const result = validateRecommendationRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Timeframe must be one of');
    });
  });

  describe('multiple errors', () => {
    it('should return all validation errors', () => {
      const badRequest = {
        profile: { id: 'invalid', age: '4', gender: 'other' },
        weather: { temperature: 'hot', conditions: null },
        prompt: 123,
        timeframe: 'invalid',
      };
      const result = validateRecommendationRequest(badRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should validate all fields even with early errors', () => {
      const badRequest = {
        profile: null,
        weather: null,
        prompt: 123,
      };
      const result = validateRecommendationRequest(badRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Profile is required');
      expect(result.errors).toContain('Weather data is required');
      expect(result.errors).toContain('Prompt must be a string');
    });
  });

  describe('complete validation', () => {
    it('should validate complete request with all optional fields', () => {
      const completeRequest = {
        profile: {
          id: '7yo-boy',
          age: 7,
          gender: 'boy',
        },
        weather: {
          temperature: 35,
          feelsLike: 28,
          conditions: 'Rain',
          precipitationProbability: 80,
          windSpeed: 12,
          uvIndex: 2,
          humidity: 70,
        },
        prompt: 'What should I wear to play soccer?',
        timeframe: 'afternoon',
      };
      const result = validateRecommendationRequest(completeRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate minimal valid request', () => {
      const minimalRequest = {
        profile: {
          id: '4yo-girl',
          age: 4,
          gender: 'girl',
        },
        weather: {
          temperature: 50,
          conditions: 'Clear',
        },
      };
      const result = validateRecommendationRequest(minimalRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });
});
