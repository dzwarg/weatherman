/**
 * API Client
 * Central client for making requests to the Express server
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * Custom error class for API failures
 */
export class APIClientError extends Error {
  constructor(message, code, statusCode, details = {}) {
    super(message);
    this.name = 'APIClientError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class APIClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.timeout = DEFAULT_TIMEOUT;
  }

  /**
   * Make API request with timeout and error handling
   * @param {string} endpoint - API endpoint (e.g., '/weather/current')
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };

    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Server returns standardized error format
        if (errorData.error) {
          throw new APIClientError(
            errorData.error.message || response.statusText,
            errorData.error.code || 'API_ERROR',
            response.status,
            errorData.error.details || {}
          );
        }

        throw new APIClientError(
          response.statusText || 'API request failed',
          'API_ERROR',
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error.name === 'AbortError') {
        throw new APIClientError(
          `API request timed out after ${this.timeout}ms`,
          'TIMEOUT',
          408,
          { timeout: this.timeout }
        );
      }

      // Re-throw APIClientError
      if (error instanceof APIClientError) {
        throw error;
      }

      // Handle network errors
      throw new APIClientError(
        'Network error occurred',
        'NETWORK_ERROR',
        0,
        { originalError: error.message }
      );
    }
  }

  /**
   * Make GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} API response
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Make POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} API response
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get server health status
   * @returns {Promise<Object>} Health status
   */
  async getHealth() {
    return this.get('/health');
  }

  /**
   * Get current weather from server
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} units - Units (imperial, metric, standard)
   * @returns {Promise<Object>} Weather data
   */
  async getCurrentWeather(lat, lon, units = 'imperial') {
    return this.post('/weather/current', { lat, lon, units });
  }

  /**
   * Get weather forecast from server
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} units - Units (imperial, metric, standard)
   * @returns {Promise<Object>} Forecast data
   */
  async getWeatherForecast(lat, lon, units = 'imperial') {
    return this.post('/weather/forecast', { lat, lon, units });
  }

  /**
   * Get clothing recommendations from server
   * @param {Object} profile - User profile
   * @param {Object} weather - Weather data
   * @param {string} voicePrompt - Optional voice prompt context
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations(profile, weather, voicePrompt = '') {
    return this.post('/recommendations', { profile, weather, voicePrompt });
  }

  /**
   * Get available user profiles
   * @returns {Promise<Object>} Available profiles
   */
  async getProfiles() {
    return this.get('/recommendations/profiles');
  }
}

export default new APIClient();
