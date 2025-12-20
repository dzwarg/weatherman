import { describe, it, expect } from 'vitest';
import { getClothingRecommendations } from '../../../src/utils/clothingRules.js';

describe('clothingRules (fallback)', () => {
  describe('getClothingRecommendations', () => {
    it('should recommend warm clothing for cold weather', () => {
      const result = getClothingRecommendations({
        profile: { id: '4yo-girl', age: 4, gender: 'girl' },
        weather: {
          temperature: 30,
          feelsLike: 25,
          conditions: 'Snow',
          precipitationProbability: 80,
          windSpeed: 15,
          uvIndex: 1,
        },
      });

      expect(result.recommendations.outerwear).toBeDefined();
      expect(result.recommendations.outerwear.length).toBeGreaterThan(0);
      expect(result.recommendations.outerwear.some(item =>
        item.item.toLowerCase().includes('coat') || item.item.toLowerCase().includes('jacket')
      )).toBe(true);
    });

    it('should recommend light clothing for hot weather', () => {
      const result = getClothingRecommendations({
        profile: { id: '10yo-boy', age: 10, gender: 'boy' },
        weather: {
          temperature: 85,
          feelsLike: 88,
          conditions: 'Clear',
          precipitationProbability: 5,
          windSpeed: 5,
          uvIndex: 9,
        },
      });

      expect(result.recommendations.baseLayers).toBeDefined();
      expect(result.recommendations.bottoms).toBeDefined();
      expect(result.recommendations.bottoms.some(item =>
        item.item.toLowerCase().includes('shorts')
      )).toBe(true);
    });

    it('should recommend rain gear for rainy weather', () => {
      const result = getClothingRecommendations({
        profile: { id: '7yo-boy', age: 7, gender: 'boy' },
        weather: {
          temperature: 55,
          feelsLike: 52,
          conditions: 'Rain',
          precipitationProbability: 90,
          windSpeed: 10,
          uvIndex: 2,
        },
      });

      expect(result.recommendations.outerwear).toBeDefined();
      expect(result.recommendations.footwear).toBeDefined();
      expect(
        result.recommendations.outerwear.some(item =>
          item.item.toLowerCase().includes('rain')
        ) ||
        result.recommendations.accessories.some(item =>
          item.item.toLowerCase().includes('umbrella')
        )
      ).toBe(true);
    });

    it('should include age-appropriate language for 4yo', () => {
      const result = getClothingRecommendations({
        profile: { id: '4yo-girl', age: 4, gender: 'girl' },
        weather: {
          temperature: 60,
          feelsLike: 58,
          conditions: 'Partly Cloudy',
          precipitationProbability: 20,
          windSpeed: 8,
          uvIndex: 5,
        },
      });

      expect(result.spokenResponse).toBeDefined();
      expect(typeof result.spokenResponse).toBe('string');
      expect(result.spokenResponse.length).toBeGreaterThan(0);
    });

    it('should return different recommendations for different profiles with same weather', () => {
      const weather = {
        temperature: 60,
        feelsLike: 58,
        conditions: 'Partly Cloudy',
        precipitationProbability: 20,
        windSpeed: 8,
        uvIndex: 5,
      };

      const girl4yo = getClothingRecommendations({
        profile: { id: '4yo-girl', age: 4, gender: 'girl' },
        weather,
      });

      const boy10yo = getClothingRecommendations({
        profile: { id: '10yo-boy', age: 10, gender: 'boy' },
        weather,
      });

      // Recommendations should differ (at least in language/complexity)
      expect(girl4yo.spokenResponse).not.toBe(boy10yo.spokenResponse);
    });

    it('should always return required fields', () => {
      const result = getClothingRecommendations({
        profile: { id: '7yo-boy', age: 7, gender: 'boy' },
        weather: {
          temperature: 70,
          feelsLike: 70,
          conditions: 'Clear',
          precipitationProbability: 0,
          windSpeed: 5,
          uvIndex: 6,
        },
      });

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('spokenResponse');
      expect(result).toHaveProperty('confidence');
      expect(result.recommendations).toHaveProperty('baseLayers');
      expect(result.recommendations).toHaveProperty('outerwear');
      expect(result.recommendations).toHaveProperty('bottoms');
      expect(result.recommendations).toHaveProperty('accessories');
      expect(result.recommendations).toHaveProperty('footwear');
    });
  });
});
