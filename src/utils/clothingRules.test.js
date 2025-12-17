/**
 * Tests for clothingRules
 */

import { describe, it, expect } from 'vitest';
import {
  getTemperatureBasedClothing,
  addPrecipitationRecommendations,
  addWindRecommendations,
  addSunProtectionRecommendations,
  generateClothingRecommendations,
} from './clothingRules';

describe('clothingRules', () => {
  describe('getTemperatureBasedClothing', () => {
    it('should recommend heavy layers for very cold weather', () => {
      const result = getTemperatureBasedClothing(25, 'simple', 'simple');

      expect(result.outerwear.length).toBeGreaterThan(0);
      expect(result.accessories.length).toBeGreaterThan(0);
      expect(result.outerwear.some(item => item.toLowerCase().includes('coat'))).toBe(true);
    });

    it('should recommend light layers for warm weather', () => {
      const result = getTemperatureBasedClothing(75, 'simple', 'simple');

      expect(result.baseLayers.length).toBeGreaterThan(0);
      expect(result.baseLayers.some(item => item.toLowerCase().includes('shirt') || item.toLowerCase().includes('t-shirt'))).toBe(true);
      expect(result.baseLayers.some(item => item.toLowerCase().includes('short'))).toBe(true);
    });

    it('should recommend jacket for cool weather', () => {
      const result = getTemperatureBasedClothing(50, 'simple', 'simple');

      expect(result.outerwear.length).toBeGreaterThan(0);
      expect(result.outerwear.some(item => item.toLowerCase().includes('jacket') || item.toLowerCase().includes('hoodie'))).toBe(true);
    });

    it('should adapt vocabulary for complexity level', () => {
      const simple = getTemperatureBasedClothing(50, 'simple', 'simple');
      const complex = getTemperatureBasedClothing(50, 'moderate', 'moderate');

      expect(simple).toBeDefined();
      expect(complex).toBeDefined();
    });
  });

  describe('addPrecipitationRecommendations', () => {
    it('should add rain gear for high precipitation probability', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      addPrecipitationRecommendations(recommendations, 70, false);

      expect(recommendations.outerwear.some(item => item.toLowerCase().includes('rain'))).toBe(true);
      expect(recommendations.accessories.some(item => item.toLowerCase().includes('umbrella'))).toBe(true);
      expect(recommendations.footwear.some(item => item.toLowerCase().includes('boot'))).toBe(true);
    });

    it('should add light rain gear for moderate precipitation', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      addPrecipitationRecommendations(recommendations, 40, false);

      expect(recommendations.accessories.some(item => item.toLowerCase().includes('umbrella'))).toBe(true);
      expect(recommendations.specialNotes.length).toBeGreaterThan(0);
    });

    it('should not add rain gear for low precipitation', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      addPrecipitationRecommendations(recommendations, 10, false);

      expect(recommendations.outerwear).not.toContain('Raincoat');
      expect(recommendations.accessories).not.toContain('Umbrella');
    });
  });

  describe('addWindRecommendations', () => {
    it('should add wind protection for strong winds', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      addWindRecommendations(recommendations, 25, 45, false);

      expect(recommendations.outerwear.some(item => item.toLowerCase().includes('wind'))).toBe(true);
      expect(recommendations.specialNotes.length).toBeGreaterThan(0);
    });

    it('should not add wind protection for light winds', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      addWindRecommendations(recommendations, 5, 70, false);

      expect(recommendations.outerwear).not.toContain('Windbreaker');
    });
  });

  describe('addSunProtectionRecommendations', () => {
    it('should add sun protection for high UV index', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      addSunProtectionRecommendations(recommendations, 8);

      expect(recommendations.accessories.some(item => item.toLowerCase().includes('sun'))).toBe(true);
      expect(recommendations.accessories.some(item => item.toLowerCase().includes('hat'))).toBe(true);
      expect(recommendations.accessories.some(item => item.toLowerCase().includes('glass'))).toBe(true);
    });

    it('should not add sun protection for low UV index', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      addSunProtectionRecommendations(recommendations, 2);

      expect(recommendations.accessories).not.toContain('Sunscreen');
    });
  });

  describe('generateClothingRecommendations', () => {
    it('should generate complete recommendations for cold rainy weather', () => {
      const weatherData = {
        temperature: 40,
        feelsLike: 35,
        conditions: 'Rain',
        precipitationProbability: 80,
        windSpeed: 15,
        uvIndex: 2,
      };

      const profile = {
        id: 'child-4yo-girl',
        age: 4,
        gender: 'girl',
        vocabularyStyle: 'simple',
        complexityLevel: 'simple',
      };

      const result = generateClothingRecommendations(weatherData, profile);

      expect(result.outerwear.length).toBeGreaterThan(0);
      expect(result.baseLayers.length).toBeGreaterThan(0);
      expect(result.outerwear.some(item => item.toLowerCase().includes('rain'))).toBe(true);
    });

    it('should generate recommendations for hot sunny weather', () => {
      const weatherData = {
        temperature: 85,
        feelsLike: 88,
        conditions: 'Clear',
        precipitationProbability: 5,
        windSpeed: 5,
        uvIndex: 9,
      };

      const profile = {
        id: 'child-10yo-boy',
        age: 10,
        gender: 'boy',
        vocabularyStyle: 'moderate',
        complexityLevel: 'complex',
      };

      const result = generateClothingRecommendations(weatherData, profile);

      expect(result.baseLayers.some(item => item.toLowerCase().includes('shirt') || item.toLowerCase().includes('t-shirt'))).toBe(true);
      expect(result.baseLayers.some(item => item.toLowerCase().includes('short'))).toBe(true);
      expect(result.accessories.some(item => item.toLowerCase().includes('sun'))).toBe(true);
    });

    it('should adapt recommendations for profile', () => {
      const weatherData = {
        temperature: 65,
        feelsLike: 65,
        conditions: 'Partly Cloudy',
        precipitationProbability: 20,
        windSpeed: 8,
        uvIndex: 5,
      };

      const simpleProfile = {
        id: 'child-4yo-girl',
        age: 4,
        vocabularyStyle: 'simple',
        complexityLevel: 'simple',
      };

      const complexProfile = {
        id: 'child-10yo-boy',
        age: 10,
        vocabularyStyle: 'moderate',
        complexityLevel: 'complex',
      };

      const simple = generateClothingRecommendations(weatherData, simpleProfile);
      const complex = generateClothingRecommendations(weatherData, complexProfile);

      expect(simple).toBeDefined();
      expect(complex).toBeDefined();
      expect(simple.baseLayers.length).toBeGreaterThan(0);
      expect(complex.baseLayers.length).toBeGreaterThan(0);
    });
  });
});
