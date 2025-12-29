import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateRecommendations, isClaudeAvailable, clearClaudeCache } from '../../../src/services/recommendationService.js';
import * as claudeService from '../../../src/services/claudeService.js';
import * as clothingRules from '../../../src/utils/clothingRules.js';

// Mock dependencies
vi.mock('../../../src/services/claudeService.js');
vi.mock('../../../src/utils/clothingRules.js');

describe('recommendationService', () => {
  beforeEach(() => {
    // Clear cache and mocks before each test
    clearClaudeCache();
    vi.clearAllMocks();
  });
  const mockRequest = {
    profile: {
      id: '4-girl',
      age: 4,
      gender: 'girl',
    },
    weather: {
      temperature: 35,
      feelsLike: 28,
      conditions: 'Rain',
      precipitationProbability: 80,
      windSpeed: 12,
      uvIndex: 2,
    },
    prompt: 'What should I wear to the playground?',
    timeframe: 'morning',
  };

  const mockRuleBasedRecommendations = {
    baseLayers: [{ item: 'Long-sleeve thermal shirt', reason: 'To stay warm' }],
    outerwear: [{ item: 'Warm winter coat', reason: 'Cold and rainy weather' }],
    bottoms: [{ item: 'Warm pants', reason: 'To keep legs warm' }],
    accessories: [{ item: 'Warm hat', reason: 'Protect from cold' }],
    footwear: [{ item: 'Rain boots', reason: 'Rainy conditions' }],
  };

  describe('generateRecommendations', () => {
    it('should use Claude when available', async () => {
      const mockClaudeResponse = {
        recommendations: mockRuleBasedRecommendations,
        spokenResponse: 'Wear warm clothes!',
      };

      claudeService.checkHealth.mockResolvedValue(true);
      claudeService.generateClothingAdvice.mockResolvedValue(mockClaudeResponse);

      const result = await generateRecommendations(mockRequest);

      expect(claudeService.checkHealth).toHaveBeenCalled();
      expect(claudeService.generateClothingAdvice).toHaveBeenCalledWith(mockRequest);
      expect(result.recommendations).toEqual(mockRuleBasedRecommendations);
      expect(result.spokenResponse).toBe('Wear warm clothes!');
      expect(result.source).toBe('claude');
    });

    it('should fallback to rules when Claude is unavailable', async () => {
      claudeService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(claudeService.checkHealth).toHaveBeenCalled();
      expect(claudeService.generateClothingAdvice).not.toHaveBeenCalled();
      expect(clothingRules.getClothingRecommendations).toHaveBeenCalledWith(mockRequest);
      expect(result.recommendations).toEqual(mockRuleBasedRecommendations);
      expect(result.source).toBe('rules');
    });

    it('should fallback to rules when Claude fails', async () => {
      claudeService.checkHealth.mockResolvedValue(true);
      claudeService.generateClothingAdvice.mockRejectedValue(new Error('Claude error'));
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(result.recommendations).toEqual(mockRuleBasedRecommendations);
      expect(result.source).toBe('rules');
    });

    it('should include profile ID in response', async () => {
      claudeService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(result.profileId).toBe('4-girl');
    });

    it('should include weather data in response', async () => {
      claudeService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(result.weatherData).toEqual(mockRequest.weather);
    });

    it('should generate unique recommendation ID', async () => {
      claudeService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result1 = await generateRecommendations(mockRequest);
      const result2 = await generateRecommendations(mockRequest);

      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });

    it('should include timestamp', async () => {
      claudeService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const before = new Date().toISOString();
      const result = await generateRecommendations(mockRequest);
      const after = new Date().toISOString();

      expect(result.createdAt).toBeDefined();
      expect(result.createdAt >= before).toBe(true);
      expect(result.createdAt <= after).toBe(true);
    });

    it('should handle different profiles', async () => {
      const profiles = ['4-girl', '7-boy', '10-boy'];

      for (const profileId of profiles) {
        const request = {
          ...mockRequest,
          profile: { ...mockRequest.profile, id: profileId },
        };

        claudeService.checkHealth.mockResolvedValue(false);
        clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

        const result = await generateRecommendations(request);

        expect(result.profileId).toBe(profileId);
      }
    });

    it('should handle different weather conditions', async () => {
      const conditions = ['Clear', 'Rain', 'Snow', 'Clouds', 'Thunderstorm'];

      for (const condition of conditions) {
        const request = {
          ...mockRequest,
          weather: { ...mockRequest.weather, conditions: condition },
        };

        claudeService.checkHealth.mockResolvedValue(false);
        clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

        const result = await generateRecommendations(request);

        expect(result.weatherData.conditions).toBe(condition);
      }
    });

    it('should include confidence score', async () => {
      claudeService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(result.confidence).toBeDefined();
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should set higher confidence for Claude responses', async () => {
      const mockClaudeResponse = {
        recommendations: mockRuleBasedRecommendations,
        spokenResponse: 'Wear warm clothes!',
      };

      claudeService.checkHealth.mockResolvedValue(true);
      claudeService.generateClothingAdvice.mockResolvedValue(mockClaudeResponse);

      const claudeResult = await generateRecommendations(mockRequest);

      // Clear cache so the next call actually checks health again
      clearClaudeCache();

      claudeService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const rulesResult = await generateRecommendations(mockRequest);

      expect(claudeResult.confidence).toBeGreaterThan(rulesResult.confidence);
    });
  });

  describe('isClaudeAvailable', () => {
    it('should return true when Claude is healthy', async () => {
      claudeService.checkHealth.mockResolvedValue(true);

      const available = await isClaudeAvailable();

      expect(available).toBe(true);
      expect(claudeService.checkHealth).toHaveBeenCalled();
    });

    it('should return false when Claude is unhealthy', async () => {
      claudeService.checkHealth.mockResolvedValue(false);

      const available = await isClaudeAvailable();

      expect(available).toBe(false);
    });

    it('should return false when health check fails', async () => {
      claudeService.checkHealth.mockRejectedValue(new Error('Health check error'));

      const available = await isClaudeAvailable();

      expect(available).toBe(false);
    });

    it('should cache result for short duration', async () => {
      claudeService.checkHealth.mockResolvedValue(true);

      await isClaudeAvailable();
      await isClaudeAvailable();

      // Should only call health check once due to caching
      expect(claudeService.checkHealth).toHaveBeenCalledTimes(1);
    });
  });
});
