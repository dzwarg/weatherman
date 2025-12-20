/**
 * Tests for weatherService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import weatherService, { WeatherServiceError } from './weatherService';
import apiClient from './apiClient';
import cacheService from './cacheService';
import { WeatherData } from '../models/WeatherData';

// Mock dependencies
vi.mock('./apiClient');
vi.mock('./cacheService');
vi.mock('../models/WeatherData');

describe('weatherService', () => {
  const mockLocation = {
    lat: 42.36,
    lon: -71.06,
    name: 'Boston',
  };

  const mockApiResponse = {
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset apiClient mocks
    apiClient.getCurrentWeather = vi.fn();

    // Reset cacheService mocks
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
    cacheService.clear.mockResolvedValue(undefined);
  });

  describe('WeatherServiceError', () => {
    it('should create error with code and details', () => {
      const error = new WeatherServiceError('Test error', 'TEST_CODE', { foo: 'bar' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ foo: 'bar' });
      expect(error.name).toBe('WeatherServiceError');
    });
  });

  describe('validateLocation', () => {
    it('should validate correct location', () => {
      expect(() => weatherService.validateLocation(mockLocation)).not.toThrow();
    });

    it('should throw error for null location', () => {
      expect(() => weatherService.validateLocation(null)).toThrow(WeatherServiceError);
      expect(() => weatherService.validateLocation(null)).toThrow('Location object is required');
    });

    it('should throw error for non-object location', () => {
      expect(() => weatherService.validateLocation('invalid')).toThrow(WeatherServiceError);
    });

    it('should throw error for non-number coordinates', () => {
      expect(() => weatherService.validateLocation({ lat: 'invalid', lon: -71 })).toThrow();
      expect(() => weatherService.validateLocation({ lat: 42, lon: 'invalid' })).toThrow();
    });

    it('should throw error for out-of-range latitude', () => {
      expect(() => weatherService.validateLocation({ lat: 91, lon: -71 })).toThrow();
      expect(() => weatherService.validateLocation({ lat: -91, lon: -71 })).toThrow();
    });

    it('should throw error for out-of-range longitude', () => {
      expect(() => weatherService.validateLocation({ lat: 42, lon: 181 })).toThrow();
      expect(() => weatherService.validateLocation({ lat: 42, lon: -181 })).toThrow();
    });
  });

  describe('fetchWeatherData', () => {
    it('should call apiClient with correct parameters', async () => {
      apiClient.getCurrentWeather.mockResolvedValueOnce(mockApiResponse);

      const result = await weatherService.fetchWeatherData(42.36, -71.06);

      expect(apiClient.getCurrentWeather).toHaveBeenCalledWith(42.36, -71.06, 'imperial');
      expect(result).toEqual(mockApiResponse);
    });

    it('should convert APIClientError to WeatherServiceError', async () => {
      const apiError = new Error('API Error');
      apiError.name = 'APIClientError';
      apiError.code = 'TIMEOUT';
      apiError.statusCode = 408;
      apiClient.getCurrentWeather.mockRejectedValueOnce(apiError);

      await expect(weatherService.fetchWeatherData(42.36, -71.06))
        .rejects.toThrow(WeatherServiceError);
    });
  });

  describe('getLocationName', () => {
    it('should extract name from timezone', async () => {
      const name = await weatherService.getLocationName(
        42.36,
        -71.06,
        { timezone: 'America/New_York' }
      );

      expect(name).toBe('New York');
    });

    it('should handle timezone with underscores', async () => {
      const name = await weatherService.getLocationName(
        42.36,
        -71.06,
        { timezone: 'America/Los_Angeles' }
      );

      expect(name).toBe('Los Angeles');
    });

    it('should use coordinates when no timezone', async () => {
      const name = await weatherService.getLocationName(42.36, -71.06, {});

      expect(name).toBe('42.36, -71.06');
    });
  });


  describe('getCurrentWeather', () => {
    it('should return fresh cached data', async () => {
      const mockWeatherData = {
        location: mockLocation,
        current: { temperature: 70 },
        fetchedAt: new Date().toISOString(),
        cacheExpiry: new Date(Date.now() + 3600000).toISOString(),
      };

      cacheService.get.mockResolvedValueOnce(mockWeatherData);

      // Mock WeatherData.fromJSON to return a mock with isFresh method
      const mockInstance = {
        ...mockWeatherData,
        isFresh: vi.fn().mockReturnValue(true),
      };
      WeatherData.fromJSON.mockReturnValueOnce(mockInstance);

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result.isFresh()).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(42.36, -71.06);
      expect(apiClient.getCurrentWeather).not.toHaveBeenCalled();
    });

    it('should fetch fresh data when cache is stale', async () => {
      const staleData = {
        location: mockLocation,
        fetchedAt: new Date(Date.now() - 7200000).toISOString(),
        cacheExpiry: new Date(Date.now() - 3600000).toISOString(),
      };

      cacheService.get.mockResolvedValueOnce(staleData);

      const mockStaleInstance = {
        ...staleData,
        isFresh: vi.fn().mockReturnValue(false),
      };
      WeatherData.fromJSON.mockReturnValueOnce(mockStaleInstance);

      apiClient.getCurrentWeather.mockResolvedValueOnce(mockApiResponse);

      const mockNewInstance = {
        toJSON: vi.fn().mockReturnValue({}),
      };
      WeatherData.mockImplementationOnce(() => mockNewInstance);

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(apiClient.getCurrentWeather).toHaveBeenCalledWith(42.36, -71.06, 'imperial');
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should fetch when no cache exists', async () => {
      cacheService.get.mockResolvedValueOnce(null);

      apiClient.getCurrentWeather.mockResolvedValueOnce(mockApiResponse);

      const mockInstance = {
        toJSON: vi.fn().mockReturnValue({}),
      };
      WeatherData.mockImplementationOnce(() => mockInstance);

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(apiClient.getCurrentWeather).toHaveBeenCalledWith(42.36, -71.06, 'imperial');
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should use stale cache when API fails', async () => {
      const staleData = {
        location: mockLocation,
        fetchedAt: new Date(Date.now() - 7200000).toISOString(),
      };

      cacheService.get
        .mockResolvedValueOnce(null) // First call for fresh cache
        .mockResolvedValueOnce(staleData); // Second call for fallback

      const mockStaleInstance = {
        ...staleData,
        _isStale: false,
      };
      WeatherData.fromJSON.mockReturnValueOnce(mockStaleInstance);

      apiClient.getCurrentWeather.mockRejectedValueOnce(new Error('API Error'));

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result._isStale).toBe(true);
    });

    it('should throw error when API fails and no cache', async () => {
      cacheService.get.mockResolvedValue(null);
      apiClient.getCurrentWeather.mockRejectedValueOnce(new Error('API Error'));

      await expect(weatherService.getCurrentWeather(mockLocation))
        .rejects.toThrow();
    });

    it('should validate location', async () => {
      await expect(weatherService.getCurrentWeather({ lat: 'invalid', lon: -71 }))
        .rejects.toThrow(WeatherServiceError);
    });

    it('should handle cache read errors gracefully', async () => {
      cacheService.get.mockRejectedValueOnce(new Error('Cache error'));

      apiClient.getCurrentWeather.mockResolvedValueOnce(mockApiResponse);

      const mockInstance = {
        toJSON: vi.fn().mockReturnValue({}),
      };
      WeatherData.mockImplementationOnce(() => mockInstance);

      // Should still fetch from API
      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(apiClient.getCurrentWeather).toHaveBeenCalled();
    });

    it('should handle cache write errors gracefully', async () => {
      cacheService.get.mockResolvedValueOnce(null);
      cacheService.set.mockRejectedValueOnce(new Error('Cache write error'));

      apiClient.getCurrentWeather.mockResolvedValueOnce(mockApiResponse);

      const mockInstance = {
        toJSON: vi.fn().mockReturnValue({}),
      };
      WeatherData.mockImplementationOnce(() => mockInstance);

      // Should still return data even if cache write fails
      await expect(weatherService.getCurrentWeather(mockLocation))
        .resolves.toBeDefined();
    });
  });

  describe('getForecast', () => {
    it('should return forecast data', async () => {
      cacheService.get.mockResolvedValueOnce(null);

      apiClient.getCurrentWeather.mockResolvedValueOnce(mockApiResponse);

      const mockInstance = {
        dailyForecast: [1, 2, 3, 4, 5, 6, 7, 8],
        toJSON: vi.fn().mockReturnValue({}),
      };
      WeatherData.mockImplementationOnce(() => mockInstance);

      const result = await weatherService.getForecast(mockLocation, 5);

      expect(result.dailyForecast).toHaveLength(5);
    });

    it('should not trim if forecast is shorter than requested', async () => {
      cacheService.get.mockResolvedValueOnce(null);

      apiClient.getCurrentWeather.mockResolvedValueOnce(mockApiResponse);

      const mockInstance = {
        dailyForecast: [1, 2, 3],
        toJSON: vi.fn().mockReturnValue({}),
      };
      WeatherData.mockImplementationOnce(() => mockInstance);

      const result = await weatherService.getForecast(mockLocation, 5);

      expect(result.dailyForecast).toHaveLength(3);
    });
  });

  describe('getCacheStatus', () => {
    it('should return status for existing cache', async () => {
      const cachedData = {
        fetchedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        cacheExpiry: new Date(Date.now() + 1800000).toISOString(), // 30 min from now
      };

      cacheService.get.mockResolvedValueOnce(cachedData);

      const mockInstance = {
        ...cachedData,
        isFresh: vi.fn().mockReturnValue(true),
      };
      WeatherData.fromJSON.mockReturnValueOnce(mockInstance);

      const status = await weatherService.getCacheStatus(mockLocation);

      expect(status.exists).toBe(true);
      expect(status.fresh).toBe(true);
      expect(status.age).toBeGreaterThan(0);
      expect(status.fetchedAt).toBe(cachedData.fetchedAt);
      expect(status.expiresAt).toBe(cachedData.cacheExpiry);
    });

    it('should return status for non-existent cache', async () => {
      cacheService.get.mockResolvedValueOnce(null);

      const status = await weatherService.getCacheStatus(mockLocation);

      expect(status.exists).toBe(false);
      expect(status.fresh).toBe(false);
      expect(status.age).toBeNull();
      expect(status.fetchedAt).toBeNull();
      expect(status.expiresAt).toBeNull();
    });

    it('should throw error on cache failure', async () => {
      cacheService.get.mockRejectedValueOnce(new Error('Cache error'));

      await expect(weatherService.getCacheStatus(mockLocation))
        .rejects.toThrow(WeatherServiceError);
    });

    it('should validate location', async () => {
      await expect(weatherService.getCacheStatus({ lat: 'invalid', lon: -71 }))
        .rejects.toThrow(WeatherServiceError);
    });
  });

  describe('clearCache', () => {
    it('should clear cache successfully', async () => {
      await weatherService.clearCache();

      expect(cacheService.clear).toHaveBeenCalled();
    });

    it('should throw error on cache clear failure', async () => {
      cacheService.clear.mockRejectedValueOnce(new Error('Clear failed'));

      await expect(weatherService.clearCache())
        .rejects.toThrow(WeatherServiceError);
    });
  });
});
