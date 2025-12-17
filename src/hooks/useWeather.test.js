/**
 * Tests for useWeather hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWeather } from './useWeather';
import weatherService from '../services/weatherService';

vi.mock('../services/weatherService');

describe('useWeather', () => {
  const mockLocation = {
    lat: 42.36,
    lon: -71.06,
    name: 'Boston',
  };

  const mockWeatherData = {
    location: mockLocation,
    current: { temperature: 70, conditions: 'Clear' },
    dailyForecast: [
      { date: '2024-01-01', temperatureHigh: 75, temperatureLow: 55 },
      { date: '2024-01-02', temperatureHigh: 73, temperatureLow: 53 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    weatherService.getCurrentWeather.mockResolvedValue(mockWeatherData);
    weatherService.getForecast.mockResolvedValue(mockWeatherData);
    weatherService.clearCache.mockResolvedValue();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useWeather());

      expect(result.current.weather).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isStale).toBe(false);
    });

    it('should not auto-fetch when autoFetch is false', () => {
      renderHook(() => useWeather(mockLocation, false));

      expect(weatherService.getCurrentWeather).not.toHaveBeenCalled();
    });

    it('should auto-fetch when autoFetch is true', async () => {
      renderHook(() => useWeather(mockLocation, true));

      await waitFor(() => {
        expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(mockLocation);
      });
    });
  });

  describe('fetchWeather', () => {
    it('should fetch weather successfully', async () => {
      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.fetchWeather(mockLocation);
      });

      expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(mockLocation);
      expect(result.current.weather).toEqual(mockWeatherData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle invalid location', async () => {
      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.fetchWeather(null);
      });

      expect(weatherService.getCurrentWeather).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Invalid location');
    });

    it('should handle missing coordinates', async () => {
      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.fetchWeather({ name: 'Boston' });
      });

      expect(result.current.error).toBe('Invalid location');
    });

    it('should set loading state during fetch', async () => {
      let resolveWeather;
      weatherService.getCurrentWeather.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveWeather = resolve;
        });
      });

      const { result } = renderHook(() => useWeather());

      act(() => {
        result.current.fetchWeather(mockLocation);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await act(async () => {
        resolveWeather(mockWeatherData);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle fetch errors', async () => {
      weatherService.getCurrentWeather.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.fetchWeather(mockLocation);
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.loading).toBe(false);
      expect(result.current.weather).toBeNull();
    });

    it('should detect stale data', async () => {
      const staleData = { ...mockWeatherData, _isStale: true };
      weatherService.getCurrentWeather.mockResolvedValue(staleData);

      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.fetchWeather(mockLocation);
      });

      expect(result.current.isStale).toBe(true);
    });
  });

  describe('fetchForecast', () => {
    it('should fetch forecast successfully', async () => {
      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.fetchForecast(mockLocation, 5);
      });

      expect(weatherService.getForecast).toHaveBeenCalledWith(mockLocation, 5);
      expect(result.current.weather).toEqual(mockWeatherData);
    });

    it('should use default 5 days for forecast', async () => {
      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.fetchForecast(mockLocation);
      });

      expect(weatherService.getForecast).toHaveBeenCalledWith(mockLocation, 5);
    });

    it('should handle invalid location', async () => {
      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.fetchForecast(null);
      });

      expect(result.current.error).toBe('Invalid location');
    });

    it('should handle forecast errors', async () => {
      weatherService.getForecast.mockRejectedValue(new Error('Forecast failed'));

      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.fetchForecast(mockLocation);
      });

      expect(result.current.error).toBe('Forecast failed');
    });
  });

  describe('refresh', () => {
    it('should refresh weather data', async () => {
      const { result } = renderHook(() => useWeather(mockLocation));

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(mockLocation);
      });
    });

    it('should not refresh when no location', async () => {
      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.refresh();
      });

      expect(weatherService.getCurrentWeather).not.toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear cache successfully', async () => {
      const { result } = renderHook(() => useWeather());

      // Set some weather data first
      await act(async () => {
        await result.current.fetchWeather(mockLocation);
      });

      expect(result.current.weather).not.toBeNull();

      // Clear cache
      await act(async () => {
        await result.current.clearCache();
      });

      expect(weatherService.clearCache).toHaveBeenCalled();
      expect(result.current.weather).toBeNull();
      expect(result.current.isStale).toBe(false);
    });

    it('should handle cache clear errors', async () => {
      weatherService.clearCache.mockRejectedValue(new Error('Clear failed'));

      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.clearCache();
      });

      expect(result.current.error).toBe('Clear failed');
    });
  });

  describe('location changes', () => {
    it('should refetch when location changes with autoFetch', async () => {
      const newLocation = { lat: 40.71, lon: -74.01, name: 'New York' };

      const { rerender } = renderHook(
        ({ location, autoFetch }) => useWeather(location, autoFetch),
        {
          initialProps: { location: mockLocation, autoFetch: true },
        }
      );

      await waitFor(() => {
        expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(mockLocation);
      });

      weatherService.getCurrentWeather.mockClear();

      rerender({ location: newLocation, autoFetch: true });

      await waitFor(() => {
        expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(newLocation);
      });
    });

    it('should not refetch when autoFetch is false', async () => {
      const newLocation = { lat: 40.71, lon: -74.01, name: 'New York' };

      const { rerender } = renderHook(
        ({ location, autoFetch }) => useWeather(location, autoFetch),
        {
          initialProps: { location: mockLocation, autoFetch: false },
        }
      );

      expect(weatherService.getCurrentWeather).not.toHaveBeenCalled();

      rerender({ location: newLocation, autoFetch: false });

      expect(weatherService.getCurrentWeather).not.toHaveBeenCalled();
    });
  });

  describe('error clearing', () => {
    it('should clear error on successful fetch', async () => {
      weatherService.getCurrentWeather.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useWeather());

      // First fetch fails
      await act(async () => {
        await result.current.fetchWeather(mockLocation);
      });
      expect(result.current.error).toBe('First error');

      // Second fetch succeeds
      weatherService.getCurrentWeather.mockResolvedValueOnce(mockWeatherData);
      await act(async () => {
        await result.current.fetchWeather(mockLocation);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
