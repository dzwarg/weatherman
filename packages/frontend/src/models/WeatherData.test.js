/**
 * Tests for WeatherData model
 */

import { describe, it, expect } from 'vitest';
import { WeatherData } from './WeatherData';

describe('WeatherData', () => {
  const validWeatherData = {
    location: {
      lat: 42.36,
      lon: -71.06,
      name: 'Boston',
      timezone: 'America/New_York',
    },
    current: {
      timestamp: new Date().toISOString(),
      temperature: 70,
      feelsLike: 68,
      conditions: 'Clear',
      precipitationProbability: 10,
      windSpeed: 5,
      humidity: 60,
      uvIndex: 5,
      icon: '01d',
    },
    dailyForecast: [
      { date: '2024-01-01', temperatureHigh: 75, temperatureLow: 55, conditions: 'Sunny', precipitationProbability: 5, windSpeed: 10, uvIndex: 7, icon: '01d' },
      { date: '2024-01-02', temperatureHigh: 73, temperatureLow: 53, conditions: 'Partly Cloudy', precipitationProbability: 10, windSpeed: 12, uvIndex: 6, icon: '02d' },
      { date: '2024-01-03', temperatureHigh: 71, temperatureLow: 51, conditions: 'Cloudy', precipitationProbability: 20, windSpeed: 15, uvIndex: 4, icon: '03d' },
      { date: '2024-01-04', temperatureHigh: 69, temperatureLow: 49, conditions: 'Rainy', precipitationProbability: 80, windSpeed: 18, uvIndex: 2, icon: '10d' },
      { date: '2024-01-05', temperatureHigh: 72, temperatureLow: 52, conditions: 'Clear', precipitationProbability: 5, windSpeed: 10, uvIndex: 7, icon: '01d' },
    ],
  };

  describe('constructor', () => {
    it('should create valid weather data', () => {
      const weather = new WeatherData(validWeatherData);

      expect(weather.location.name).toBe('Boston');
      expect(weather.current.temperature).toBe(70);
      expect(weather.dailyForecast).toHaveLength(5);
      expect(weather.fetchedAt).toBeDefined();
      expect(weather.cacheExpiry).toBeDefined();
    });

    it('should calculate cache expiry if not provided', () => {
      const weather = new WeatherData(validWeatherData);
      const fetchedDate = new Date(weather.fetchedAt);
      const expiryDate = new Date(weather.cacheExpiry);

      const diffHours = (expiryDate - fetchedDate) / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(1, 0);
    });
  });

  describe('validation', () => {
    it('should throw error for missing location', () => {
      const { location: _location, ...dataWithoutLocation } = validWeatherData;
      expect(() => new WeatherData(dataWithoutLocation)).toThrow('Location');
    });

    it('should throw error for invalid location coordinates', () => {
      const invalidLocation = { ...validWeatherData, location: { lat: 91, lon: -71, name: 'Invalid' } };
      expect(() => new WeatherData(invalidLocation)).toThrow('Latitude');
    });

    it('should throw error for missing current weather', () => {
      const { current: _current, ...dataWithoutCurrent } = validWeatherData;
      expect(() => new WeatherData(dataWithoutCurrent)).toThrow('Current');
    });
  });

  describe('isFresh', () => {
    it('should identify fresh weather data', () => {
      const weather = new WeatherData(validWeatherData);

      expect(weather.isFresh()).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const weather = new WeatherData(validWeatherData);
      const json = weather.toJSON();

      expect(json.location.name).toBe('Boston');
      expect(json.current.temperature).toBe(70);
      expect(json.dailyForecast).toHaveLength(5);
    });
  });

  describe('fromJSON', () => {
    it('should deserialize from JSON', () => {
      const original = new WeatherData(validWeatherData);
      const json = original.toJSON();
      const restored = WeatherData.fromJSON(json);

      expect(restored.location.name).toBe(original.location.name);
      expect(restored.current.temperature).toBe(original.current.temperature);
    });
  });
});
