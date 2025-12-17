/**
 * Tests for weatherUtils
 */

import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  mapWeatherCondition,
  parseWeatherResponse,
  isExpired,
  getTimeDifference,
} from './weatherUtils';

describe('weatherUtils', () => {
  describe('celsiusToFahrenheit', () => {
    it('should convert celsius to fahrenheit', () => {
      expect(celsiusToFahrenheit(0)).toBe(32);
      expect(celsiusToFahrenheit(100)).toBe(212);
      expect(celsiusToFahrenheit(20)).toBe(68);
      expect(celsiusToFahrenheit(-40)).toBe(-40);
    });

    it('should round to nearest integer', () => {
      expect(celsiusToFahrenheit(22.7)).toBe(73);
      expect(celsiusToFahrenheit(22.3)).toBe(72);
    });
  });

  describe('mapWeatherCondition', () => {
    it('should map clear weather condition', () => {
      const result = mapWeatherCondition('01d', 'clear sky');
      expect(result).toBe('Clear and sunny');
    });

    it('should map rainy weather condition', () => {
      const result = mapWeatherCondition('10d', 'light rain');
      expect(result).toBe('Rainy');
    });

    it('should map cloudy weather condition', () => {
      const result = mapWeatherCondition('03d', 'few clouds');
      expect(result).toBe('Cloudy');
    });

    it('should handle unknown codes', () => {
      const result = mapWeatherCondition('99x', 'unknown');
      expect(result).toBe('unknown');
    });
  });

  describe('parseWeatherResponse', () => {
    it('should parse OpenWeatherMap API response', () => {
      const apiResponse = {
        timezone: 'America/New_York',
        current: {
          dt: Date.now() / 1000,
          temp: 20,
          feels_like: 18,
          weather: [{ id: 800, description: 'clear sky', icon: '01d' }],
          pop: 0.2,
          wind_speed: 5,
          uvi: 3,
          humidity: 60,
        },
        hourly: [],
        daily: [],
      };

      const location = { lat: 42.36, lon: -71.06, name: 'Boston' };
      const result = parseWeatherResponse(apiResponse, location);

      expect(result.location.name).toBe('Boston');
      expect(result.current.temperature).toBe(20);
      expect(result.current.feelsLike).toBe(18);
      expect(result.current.conditions).toBe('Clear and sunny');
      expect(result.current.humidity).toBe(60);
    });

    it('should handle missing optional fields', () => {
      const apiResponse = {
        timezone: 'America/New_York',
        current: {
          dt: Date.now() / 1000,
          temp: 20,
          feels_like: 20,
          weather: [{ id: 800, description: 'clear', icon: '01d' }],
          humidity: 50,
          uvi: 0,
          wind_speed: 0,
        },
        hourly: [],
        daily: [],
      };

      const location = { lat: 42.36, lon: -71.06, name: 'Test' };
      const result = parseWeatherResponse(apiResponse, location);

      expect(result.current.precipitationProbability).toBe(0);
      expect(result.current.windSpeed).toBe(0);
      expect(result.current.uvIndex).toBe(0);
    });
  });

  describe('isExpired', () => {
    it('should return true for expired timestamps', () => {
      const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      expect(isExpired(pastTime)).toBe(true);
    });

    it('should return false for future timestamps', () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
      expect(isExpired(futureTime)).toBe(false);
    });

    it('should return true for null (treats as epoch)', () => {
      expect(isExpired(null)).toBe(true);
    });
  });

  describe('getTimeDifference', () => {
    it('should return time difference in human-readable format', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      expect(getTimeDifference(oneMinuteAgo)).toBe('1 minute ago');

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(getTimeDifference(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('should handle hours', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      expect(getTimeDifference(oneHourAgo)).toBe('1 hour ago');
    });

    it('should handle days', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(getTimeDifference(oneDayAgo)).toBe('1 day ago');
    });
  });
});
