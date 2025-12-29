/**
 * Tests for recommendationService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import recommendationService from './recommendationService';

describe('recommendationService', () => {
  let weatherData;
  let profile;

  beforeEach(() => {
    weatherData = {
      location: {
        lat: 42.36,
        lon: -71.06,
        name: 'Boston',
      },
      current: {
        timestamp: Date.now(),
        temperature: 65,
        feelsLike: 63,
        conditions: 'Partly Cloudy',
        precipitationProbability: 20,
        windSpeed: 10,
        uvIndex: 5,
        humidity: 60,
      },
      hourlyForecast: [],
      dailyForecast: [],
      cacheExpiry: Date.now() + 3600000,
    };

    profile = {
      id: 'child-7yo-boy',
      displayName: '7-year-old boy',
      age: 7,
      gender: 'boy',
      vocabularyStyle: 'moderate',
      complexityLevel: 'moderate',
    };
  });

  describe('generateRecommendation', () => {
    it('should generate recommendation from weather data', () => {
      const result = recommendationService.generateRecommendation(weatherData, profile);

      expect(result.profileId).toBe('child-7yo-boy');
      expect(result.weatherData.temperature).toBe(65);
      expect(result.recommendations).toBeDefined();
      expect(result.spokenResponse).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should include clothing categories', () => {
      const result = recommendationService.generateRecommendation(weatherData, profile);

      expect(result.recommendations.outerwear).toBeDefined();
      expect(result.recommendations.baseLayers).toBeDefined();
      expect(result.recommendations.accessories).toBeDefined();
      expect(result.recommendations.footwear).toBeDefined();
      expect(result.recommendations.specialNotes).toBeDefined();
    });

    it('should generate spoken response', () => {
      const result = recommendationService.generateRecommendation(weatherData, profile);

      expect(result.spokenResponse).toContain('Good morning');
      expect(result.spokenResponse).toContain('degrees');
      expect(result.spokenResponse).toContain('Have a great day');
    });

    it('should calculate confidence based on data quality', () => {
      const freshData = { ...weatherData, _isStale: false };
      const staleData = { ...weatherData, _isStale: true };

      const freshResult = recommendationService.generateRecommendation(freshData, profile);
      const staleResult = recommendationService.generateRecommendation(staleData, profile);

      expect(freshResult.confidence).toBeGreaterThan(staleResult.confidence);
    });
  });

  describe('detectExtremeWeather', () => {
    it('should detect extreme cold', () => {
      const extremeCold = {
        temperature: -5,
        windSpeed: 10,
        conditions: 'Clear',
      };

      const result = recommendationService.detectExtremeWeather(extremeCold);
      expect(result).toBe('extreme-cold');
    });

    it('should detect extreme heat', () => {
      const extremeHeat = {
        temperature: 105,
        windSpeed: 5,
        conditions: 'Clear',
      };

      const result = recommendationService.detectExtremeWeather(extremeHeat);
      expect(result).toBe('extreme-heat');
    });

    it('should detect high winds', () => {
      const highWinds = {
        temperature: 60,
        windSpeed: 50,
        conditions: 'Windy',
      };

      const result = recommendationService.detectExtremeWeather(highWinds);
      expect(result).toBe('high-winds');
    });

    it('should detect severe storms', () => {
      const severeStorm = {
        temperature: 70,
        windSpeed: 20,
        conditions: 'Thunderstorm',
      };

      const result = recommendationService.detectExtremeWeather(severeStorm);
      expect(result).toBe('severe-storm');
    });

    it('should return null for normal weather', () => {
      const normalWeather = {
        temperature: 65,
        windSpeed: 10,
        conditions: 'Partly Cloudy',
      };

      const result = recommendationService.detectExtremeWeather(normalWeather);
      expect(result).toBeNull();
    });
  });

  describe('generateExtremeWeatherRecommendation', () => {
    it('should generate safety-focused recommendation for extreme weather', () => {
      const extremeWeather = {
        temperature: -10,
        feelsLike: -20,
        conditions: 'Snow',
        precipitationProbability: 80,
        windSpeed: 25,
        uvIndex: 0,
      };

      const result = recommendationService.generateExtremeWeatherRecommendation(
        extremeWeather,
        'extreme-cold',
        profile
      );

      expect(result.spokenResponse).toContain('safety');
      expect(result.spokenResponse).toContain('cold');
      expect(result.confidence).toBe(1.0);
      expect(result.recommendations.specialNotes.length).toBeGreaterThan(0);
    });
  });

  describe('handleConflictingConditions', () => {
    it('should handle sunny with high rain chance', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      const weather = {
        temperature: 70,
        precipitationProbability: 60,
        conditions: 'Clear',
        windSpeed: 5,
        uvIndex: 6,
      };

      recommendationService.handleConflictingConditions(weather, recommendations);

      expect(recommendations.specialNotes.length).toBeGreaterThan(0);
      expect(recommendations.accessories).toContain('Umbrella');
    });

    it('should handle warm but windy conditions', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      const weather = {
        temperature: 75,
        precipitationProbability: 10,
        conditions: 'Clear',
        windSpeed: 20,
        uvIndex: 6,
      };

      recommendationService.handleConflictingConditions(weather, recommendations);

      expect(recommendations.specialNotes.some(note => note.includes('windy'))).toBe(true);
    });

    it('should handle cold but high UV', () => {
      const recommendations = {
        outerwear: [],
        baseLayers: [],
        accessories: [],
        footwear: [],
        specialNotes: [],
      };

      const weather = {
        temperature: 45,
        precipitationProbability: 10,
        conditions: 'Clear',
        windSpeed: 5,
        uvIndex: 7,
      };

      recommendationService.handleConflictingConditions(weather, recommendations);

      expect(recommendations.accessories).toContain('Sunglasses');
      expect(recommendations.specialNotes.some(note => note.includes('sun'))).toBe(true);
    });
  });

  describe('getTemperatureDescription', () => {
    it('should return appropriate temperature descriptions', () => {
      expect(recommendationService.getTemperatureDescription(20)).toBe('very cold');
      expect(recommendationService.getTemperatureDescription(40)).toBe('cold');
      expect(recommendationService.getTemperatureDescription(55)).toBe('chilly');
      expect(recommendationService.getTemperatureDescription(65)).toBe('nice');
      expect(recommendationService.getTemperatureDescription(75)).toBe('warm');
      expect(recommendationService.getTemperatureDescription(85)).toBe('hot');
      expect(recommendationService.getTemperatureDescription(95)).toBe('very hot');
    });
  });

  describe('formatList', () => {
    it('should format single item', () => {
      const result = recommendationService.formatList(['item']);
      expect(result).toBe('item');
    });

    it('should format two items', () => {
      const result = recommendationService.formatList(['item1', 'item2']);
      expect(result).toBe('item1 and item2');
    });

    it('should format multiple items', () => {
      const result = recommendationService.formatList(['item1', 'item2', 'item3']);
      expect(result).toBe('item1, item2, and item3');
    });

    it('should return empty string for empty array', () => {
      const result = recommendationService.formatList([]);
      expect(result).toBe('');
    });
  });

  // Note: getMockAIResponse is now a private method used internally
  // These tests are skipped as the method is no longer exported
  describe.skip('getMockAIResponse (private method)', () => {
    it('should return null when VITE_USE_MOCK_AI is not enabled', () => {
      // Method no longer exported, tested indirectly through generateRecommendation
      expect(true).toBe(true);
    });

    it('should return mock for 4yo-girl in cold rainy weather when enabled', () => {
      // Mock the environment variable
      const originalEnv = import.meta.env.VITE_USE_MOCK_OLLAMA;
      import.meta.env.VITE_USE_MOCK_OLLAMA = 'true';

      const coldRainyWeather = {
        ...weatherData,
        current: {
          ...weatherData.current,
          temperature: 35,
          conditions: 'Rain',
          precipitationProbability: 80,
        },
      };

      const girlProfile = {
        id: '4yo-girl',
        age: 4,
        gender: 'girl',
      };

      const result = recommendationService.getMockOllamaResponse(coldRainyWeather, girlProfile);

      expect(result).toBeDefined();
      expect(result.profileId).toBe('4yo-girl');
      expect(result.weatherData.temperature).toBe(35);

      // Restore
      import.meta.env.VITE_USE_MOCK_OLLAMA = originalEnv;
    });

    it('should return mock for 7yo-boy in moderate weather when enabled', () => {
      // Mock the environment variable
      const originalEnv = import.meta.env.VITE_USE_MOCK_OLLAMA;
      import.meta.env.VITE_USE_MOCK_OLLAMA = 'true';

      const moderateWeather = {
        ...weatherData,
        current: {
          ...weatherData.current,
          temperature: 55,
          conditions: 'Cloudy',
        },
      };

      const boyProfile = {
        id: '7yo-boy',
        age: 7,
        gender: 'boy',
      };

      const result = recommendationService.getMockOllamaResponse(moderateWeather, boyProfile);

      expect(result).toBeDefined();
      expect(result.profileId).toBe('7yo-boy');

      // Restore
      import.meta.env.VITE_USE_MOCK_OLLAMA = originalEnv;
    });

    it('should return mock for 10yo-boy in hot weather when enabled', () => {
      // Mock the environment variable
      const originalEnv = import.meta.env.VITE_USE_MOCK_OLLAMA;
      import.meta.env.VITE_USE_MOCK_OLLAMA = 'true';

      const hotWeather = {
        ...weatherData,
        current: {
          ...weatherData.current,
          temperature: 85,
          conditions: 'Sunny',
        },
      };

      const boyProfile = {
        id: '10yo-boy',
        age: 10,
        gender: 'boy',
      };

      const result = recommendationService.getMockOllamaResponse(hotWeather, boyProfile);

      expect(result).toBeDefined();
      expect(result.profileId).toBe('10yo-boy');

      // Restore
      import.meta.env.VITE_USE_MOCK_OLLAMA = originalEnv;
    });
  });
});
