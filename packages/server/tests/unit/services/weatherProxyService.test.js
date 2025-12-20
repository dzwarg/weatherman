import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWeather } from '../../../src/services/weatherProxyService.js';
import { mockWeatherResponse, mockForecastResponse } from '../../helpers/mockData.js';

// Mock axios
vi.mock('axios');

describe('weatherProxyService', () => {
  describe('getWeather', () => {
    let mockAxios;

    beforeEach(async () => {
      // Reset mocks before each test
      vi.clearAllMocks();

      // Get the mocked axios module
      mockAxios = await import('axios');
    });

    it('should successfully fetch weather data', async () => {
      // Mock both API calls (weather + forecast)
      mockAxios.default.get
        .mockResolvedValueOnce({ data: mockWeatherResponse, status: 200 })
        .mockResolvedValueOnce({ data: mockForecastResponse, status: 200 });

      const result = await getWeather(42.3601, -71.0589, 'imperial');

      // Verify both endpoints were called
      expect(mockAxios.default.get).toHaveBeenCalledTimes(2);
      expect(mockAxios.default.get).toHaveBeenCalledWith(
        expect.stringContaining('weather'),
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 42.3601,
            lon: -71.0589,
            units: 'imperial',
          }),
        })
      );
      expect(mockAxios.default.get).toHaveBeenCalledWith(
        expect.stringContaining('forecast'),
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 42.3601,
            lon: -71.0589,
            units: 'imperial',
          }),
        })
      );

      // Verify response has One Call API format
      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('hourly');
      expect(result).toHaveProperty('daily');
    });

    it('should handle weather API timeout', async () => {
      mockAxios.default.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      });

      await expect(getWeather(42.3601, -71.0589, 'imperial')).rejects.toThrow(
        'Weather service did not respond within 5 seconds'
      );
    });

    it('should handle weather API errors', async () => {
      mockAxios.default.get.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid API key' },
        },
      });

      await expect(getWeather(42.3601, -71.0589, 'imperial')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockAxios.default.get.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'Network error',
      });

      await expect(getWeather(42.3601, -71.0589, 'imperial')).rejects.toThrow();
    });

    it('should transform API response correctly', async () => {
      // Mock both API calls
      mockAxios.default.get
        .mockResolvedValueOnce({ data: mockWeatherResponse, status: 200 })
        .mockResolvedValueOnce({ data: mockForecastResponse, status: 200 });

      const result = await getWeather(42.3601, -71.0589, 'imperial');

      // Verify the response has One Call API structure
      expect(result).toHaveProperty('lat');
      expect(result).toHaveProperty('lon');
      expect(result).toHaveProperty('timezone');
      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('hourly');
      expect(result).toHaveProperty('daily');

      // Verify current weather structure
      expect(result.current).toHaveProperty('dt');
      expect(result.current).toHaveProperty('temp');
      expect(result.current).toHaveProperty('feels_like');
      expect(result.current).toHaveProperty('weather');
      expect(result.current).toHaveProperty('wind_speed');

      // Verify hourly and daily arrays exist
      expect(Array.isArray(result.hourly)).toBe(true);
      expect(Array.isArray(result.daily)).toBe(true);
    });
  });
});
