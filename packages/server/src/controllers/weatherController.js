import { validateWeatherRequest } from '../validators/weatherValidator.js';
import { getWeather, getForecast } from '../services/weatherProxyService.js';
import { APIError } from '../middleware/errorHandler.js';

/**
 * Weather controller
 * Handles weather API endpoint requests
 */

/**
 * Get current weather for a location
 * POST /api/weather/current
 */
export async function getCurrentWeather(req, res, next) {
  try {
    // Validate request
    const validation = validateWeatherRequest(req.body);
    if (!validation.isValid) {
      throw new APIError(
        validation.errors.join(', '),
        400,
        'INVALID_REQUEST',
        { field: 'body', errors: validation.errors }
      );
    }

    const { lat, lon, units = 'imperial' } = req.body;

    // Fetch weather data
    const weatherData = await getWeather(lat, lon, units);

    // Return weather data
    res.json(weatherData);
  } catch (error) {
    next(error);
  }
}

/**
 * Get weather forecast for a location
 * POST /api/weather/forecast
 */
export async function getWeatherForecast(req, res, next) {
  try {
    // Validate request
    const validation = validateWeatherRequest(req.body);
    if (!validation.isValid) {
      throw new APIError(
        validation.errors.join(', '),
        400,
        'INVALID_REQUEST',
        { field: 'body', errors: validation.errors }
      );
    }

    const { lat, lon, units = 'imperial' } = req.body;

    // Fetch forecast data
    const forecastData = await getForecast(lat, lon, units);

    // Return forecast data
    res.json(forecastData);
  } catch (error) {
    next(error);
  }
}

export default {
  getCurrentWeather,
  getWeatherForecast,
};
