/**
 * useWeather Hook
 * Manages weather data fetching and caching
 */

import { useState, useEffect, useCallback } from 'react';
import weatherService from '../services/weatherService.js';

export function useWeather(location = null, autoFetch = false) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  /**
   * Fetch weather data
   * @param {Object} loc - Location object with lat, lon
   */
  const fetchWeather = useCallback(async (loc) => {
    if (!loc || !loc.lat || !loc.lon) {
      setError('Invalid location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await weatherService.getCurrentWeather(loc);
      setWeather(data);
      setIsStale(!!data._isStale);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch weather');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Get forecast for multiple days
   * @param {Object} loc - Location object
   * @param {number} days - Number of days
   */
  const fetchForecast = useCallback(async (loc, days = 5) => {
    if (!loc || !loc.lat || !loc.lon) {
      setError('Invalid location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await weatherService.getForecast(loc, days);
      setWeather(data);
      setIsStale(!!data._isStale);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch forecast');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Refresh weather data
   */
  const refresh = useCallback(() => {
    if (location) {
      fetchWeather(location);
    }
  }, [location, fetchWeather]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(async () => {
    try {
      await weatherService.clearCache();
      setWeather(null);
      setIsStale(false);
    } catch (err) {
      setError(err.message || 'Failed to clear cache');
    }
  }, []);

  /**
   * Auto-fetch on location change
   */
  useEffect(() => {
    if (autoFetch && location) {
      fetchWeather(location);
    }
  }, [location, autoFetch, fetchWeather]);

  return {
    weather,
    loading,
    error,
    isStale,
    fetchWeather,
    fetchForecast,
    refresh,
    clearCache,
  };
}
