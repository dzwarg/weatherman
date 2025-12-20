import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateRecommendations, isOllamaAvailable, clearOllamaCache } from '../../../src/services/recommendationService.js';
import * as ollamaService from '../../../src/services/ollamaService.js';
import * as clothingRules from '../../../src/utils/clothingRules.js';
import * as ollamaResponseParser from '../../../src/utils/ollamaResponseParser.js';

// Mock dependencies
vi.mock('../../../src/services/ollamaService.js');
vi.mock('../../../src/utils/clothingRules.js');
vi.mock('../../../src/utils/ollamaResponseParser.js');

describe('recommendationService', () => {
  beforeEach(() => {
    // Clear cache and mocks before each test
    clearOllamaCache();
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
    it('should use Ollama when available', async () => {
      const mockOllamaResponse = 'Base layers: Thermal shirt\nSpoken: Wear warm clothes!';
      const mockParsedResponse = {
        recommendations: mockRuleBasedRecommendations,
        spokenResponse: 'Wear warm clothes!',
      };

      ollamaService.checkHealth.mockResolvedValue(true);
      ollamaService.generateClothingAdvice.mockResolvedValue(mockOllamaResponse);
      ollamaResponseParser.parseOllamaResponse.mockReturnValue(mockParsedResponse);

      const result = await generateRecommendations(mockRequest);

      expect(ollamaService.checkHealth).toHaveBeenCalled();
      expect(ollamaService.generateClothingAdvice).toHaveBeenCalledWith(mockRequest);
      expect(result.recommendations).toEqual(mockRuleBasedRecommendations);
      expect(result.spokenResponse).toBe('Wear warm clothes!');
      expect(result.source).toBe('ollama');
    });

    it('should fallback to rules when Ollama is unavailable', async () => {
      ollamaService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(ollamaService.checkHealth).toHaveBeenCalled();
      expect(ollamaService.generateClothingAdvice).not.toHaveBeenCalled();
      expect(clothingRules.getClothingRecommendations).toHaveBeenCalledWith(mockRequest);
      expect(result.recommendations).toEqual(mockRuleBasedRecommendations);
      expect(result.source).toBe('rules');
    });

    it('should fallback to rules when Ollama fails', async () => {
      ollamaService.checkHealth.mockResolvedValue(true);
      ollamaService.generateClothingAdvice.mockRejectedValue(new Error('Ollama error'));
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(result.recommendations).toEqual(mockRuleBasedRecommendations);
      expect(result.source).toBe('rules');
    });

    it('should include profile ID in response', async () => {
      ollamaService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(result.profileId).toBe('4-girl');
    });

    it('should include weather data in response', async () => {
      ollamaService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(result.weatherData).toEqual(mockRequest.weather);
    });

    it('should generate unique recommendation ID', async () => {
      ollamaService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result1 = await generateRecommendations(mockRequest);
      const result2 = await generateRecommendations(mockRequest);

      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });

    it('should include timestamp', async () => {
      ollamaService.checkHealth.mockResolvedValue(false);
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

        ollamaService.checkHealth.mockResolvedValue(false);
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

        ollamaService.checkHealth.mockResolvedValue(false);
        clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

        const result = await generateRecommendations(request);

        expect(result.weatherData.conditions).toBe(condition);
      }
    });

    it('should include confidence score', async () => {
      ollamaService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const result = await generateRecommendations(mockRequest);

      expect(result.confidence).toBeDefined();
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should set higher confidence for Ollama responses', async () => {
      const mockOllamaResponse = 'Ollama recommendations';
      const mockParsedResponse = {
        recommendations: mockRuleBasedRecommendations,
        spokenResponse: 'Wear warm clothes!',
      };

      ollamaService.checkHealth.mockResolvedValue(true);
      ollamaService.generateClothingAdvice.mockResolvedValue(mockOllamaResponse);
      ollamaResponseParser.parseOllamaResponse.mockReturnValue(mockParsedResponse);

      const ollamaResult = await generateRecommendations(mockRequest);

      // Clear cache so the next call actually checks health again
      clearOllamaCache();

      ollamaService.checkHealth.mockResolvedValue(false);
      clothingRules.getClothingRecommendations.mockReturnValue(mockRuleBasedRecommendations);

      const rulesResult = await generateRecommendations(mockRequest);

      expect(ollamaResult.confidence).toBeGreaterThan(rulesResult.confidence);
    });
  });

  describe('isOllamaAvailable', () => {
    it('should return true when Ollama is healthy', async () => {
      ollamaService.checkHealth.mockResolvedValue(true);

      const available = await isOllamaAvailable();

      expect(available).toBe(true);
      expect(ollamaService.checkHealth).toHaveBeenCalled();
    });

    it('should return false when Ollama is unhealthy', async () => {
      ollamaService.checkHealth.mockResolvedValue(false);

      const available = await isOllamaAvailable();

      expect(available).toBe(false);
    });

    it('should return false when health check fails', async () => {
      ollamaService.checkHealth.mockRejectedValue(new Error('Health check error'));

      const available = await isOllamaAvailable();

      expect(available).toBe(false);
    });

    it('should cache result for short duration', async () => {
      ollamaService.checkHealth.mockResolvedValue(true);

      await isOllamaAvailable();
      await isOllamaAvailable();

      // Should only call health check once due to caching
      expect(ollamaService.checkHealth).toHaveBeenCalledTimes(1);
    });
  });
});
