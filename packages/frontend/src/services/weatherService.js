/**
 * Weather Service
 * Server API integration with caching and error handling
 * Calls Express server which proxies to OpenWeatherMap
 */

import apiClient, { APIClientError } from './apiClient.js';
import cacheService from './cacheService.js';
import { API_CONFIG } from '../utils/constants.js';
import { parseWeatherResponse } from '../utils/weatherUtils.js';
import { WeatherData } from '../models/WeatherData.js';

/**
 * Custom error class for weather service failures
 */
export class WeatherServiceError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'WeatherServiceError';
    this.code = code;
    this.details = details;
  }
}

class WeatherService {
  constructor() {
    this.units = API_CONFIG.UNITS || 'imperial';
  }

  /**
   * Validate location parameters
   * @param {Object} location - Location object with lat and lon
   * @throws {WeatherServiceError} If location is invalid
   */
  validateLocation(location) {
    if (!location || typeof location !== 'object') {
      throw new WeatherServiceError(
        'Location object is required',
        'INVALID_LOCATION',
        { location }
      );
    }

    const { lat, lon } = location;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new WeatherServiceError(
        'Latitude and longitude must be numbers',
        'INVALID_LOCATION',
        { lat, lon }
      );
    }

    if (lat < -90 || lat > 90) {
      throw new WeatherServiceError(
        'Latitude must be between -90 and 90',
        'INVALID_LOCATION',
        { lat }
      );
    }

    if (lon < -180 || lon > 180) {
      throw new WeatherServiceError(
        'Longitude must be between -180 and 180',
        'INVALID_LOCATION',
        { lon }
      );
    }
  }

  /**
   * Call server API for weather data
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} API response
   */
  async fetchWeatherData(lat, lon) {
    try {
      return await apiClient.getCurrentWeather(lat, lon, this.units);
    } catch (error) {
      // Convert APIClientError to WeatherServiceError
      if (error instanceof APIClientError) {
        throw new WeatherServiceError(
          error.message,
          error.code,
          {
            statusCode: error.statusCode,
            ...error.details,
          }
        );
      }

      throw new WeatherServiceError(
        'Failed to fetch weather data',
        'API_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Get current weather for a location
   * @param {Object} location - Location object with lat, lon, and optional name
   * @returns {Promise<WeatherData>} Weather data
   */
  async getCurrentWeather(location) {
    this.validateLocation(location);

    const { lat, lon } = location;

    // Check cache first
    try {
      const cachedData = await cacheService.get(lat, lon);
      if (cachedData) {
        const weatherData = WeatherData.fromJSON(cachedData);

        // If cache is fresh, return immediately
        if (weatherData.isFresh()) {
          console.log('Using fresh cache for', lat, lon);
          return weatherData;
        }

        console.log('Cache is stale, fetching fresh data');
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    // Fetch fresh data from server
    try {
      const apiResponse = await this.fetchWeatherData(lat, lon);

      const locationName = location.name || await this.getLocationName(lat, lon, apiResponse);
      const parsedData = parseWeatherResponse(apiResponse, {
        lat,
        lon,
        name: locationName,
        timezone: apiResponse.timezone,
      });

      const weatherData = new WeatherData(parsedData);

      // Update cache
      try {
        await cacheService.set(lat, lon, weatherData.toJSON());
      } catch (error) {
        console.warn('Cache write error:', error);
      }

      return weatherData;
    } catch (error) {
      // If server API fails, try to use stale cache
      console.error('Server API call failed:', error);

      try {
        const cachedData = await cacheService.get(lat, lon);
        if (cachedData) {
          console.log('Using stale cache as fallback');
          const weatherData = WeatherData.fromJSON(cachedData);
          weatherData._isStale = true; // Mark as stale
          return weatherData;
        }
      } catch (cacheError) {
        console.error('Failed to read stale cache:', cacheError);
      }

      // No cache available, re-throw the error
      throw error;
    }
  }

  /**
   * Get forecast for a location
   * @param {Object} location - Location object with lat, lon
   * @param {number} days - Number of days (default 5, max 8)
   * @returns {Promise<WeatherData>} Weather data with forecast
   */
  async getForecast(location, days = 5) {
    // One Call API 3.0 includes forecast in single call
    const weatherData = await this.getCurrentWeather(location);

    // Trim forecast to requested days
    if (weatherData.dailyForecast && weatherData.dailyForecast.length > days) {
      weatherData.dailyForecast = weatherData.dailyForecast.slice(0, days);
    }

    return weatherData;
  }

  /**
   * Get location name from API response or reverse geocode
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Object} apiResponse - API response that may contain timezone
   * @returns {Promise<string>} Location name
   */
  async getLocationName(lat, lon, apiResponse) {
    // Use timezone as fallback location name
    if (apiResponse.timezone) {
      const parts = apiResponse.timezone.split('/');
      return parts[parts.length - 1].replace(/_/g, ' ');
    }

    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }

  /**
   * Get cache status for a location
   * @param {Object} location - Location object with lat, lon
   * @returns {Promise<Object>} Cache status
   */
  async getCacheStatus(location) {
    this.validateLocation(location);

    const { lat, lon } = location;

    try {
      const cachedData = await cacheService.get(lat, lon);

      if (!cachedData) {
        return {
          exists: false,
          fresh: false,
          age: null,
          fetchedAt: null,
          expiresAt: null,
        };
      }

      const weatherData = WeatherData.fromJSON(cachedData);
      const fetchedAt = new Date(weatherData.fetchedAt);
      const age = Date.now() - fetchedAt.getTime();

      return {
        exists: true,
        fresh: weatherData.isFresh(),
        age,
        fetchedAt: weatherData.fetchedAt,
        expiresAt: weatherData.cacheExpiry,
      };
    } catch (error) {
      throw new WeatherServiceError(
        'Failed to get cache status',
        'CACHE_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Clear all cached weather data
   * @returns {Promise<void>}
   */
  async clearCache() {
    try {
      await cacheService.clear();
    } catch (error) {
      throw new WeatherServiceError(
        'Failed to clear cache',
        'CACHE_ERROR',
        { originalError: error.message }
      );
    }
  }
}

export default new WeatherService();
