import axios from 'axios';
import { config } from '../config/env.js';
import { TIMEOUTS } from '../config/constants.js';
import { APIError } from '../middleware/errorHandler.js';

/**
 * Weather proxy service
 * Handles communication with external weather API
 */

/**
 * Fetch current weather and forecast data for a location
 * Since One Call API requires subscription, we fetch from free endpoints and combine
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} units - Units (imperial or metric)
 * @returns {Promise<Object>} Weather data in One Call API format
 */
export async function getWeather(lat, lon, units = 'imperial') {
  try {
    // Fetch current weather and 5-day forecast in parallel (both are free tier)
    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(`${config.weatherApiUrl}/weather`, {
        params: { lat, lon, units, appid: config.weatherApiKey },
        timeout: TIMEOUTS.WEATHER_API,
      }),
      axios.get(`${config.weatherApiUrl}/forecast`, {
        params: { lat, lon, units, appid: config.weatherApiKey },
        timeout: TIMEOUTS.WEATHER_API,
      }),
    ]);

    const current = currentResponse.data;
    const forecast = forecastResponse.data;

    // Transform to One Call API format that frontend expects
    return {
      lat: current.coord.lat,
      lon: current.coord.lon,
      timezone: forecast.city.timezone ? `UTC${forecast.city.timezone / 3600}` : 'UTC',
      timezone_offset: forecast.city.timezone || 0,
      current: {
        dt: current.dt,
        sunrise: current.sys.sunrise,
        sunset: current.sys.sunset,
        temp: current.main.temp,
        feels_like: current.main.feels_like,
        pressure: current.main.pressure,
        humidity: current.main.humidity,
        uvi: 0, // Not available in free tier
        clouds: current.clouds.all,
        visibility: current.visibility,
        wind_speed: current.wind.speed,
        wind_deg: current.wind.deg,
        wind_gust: current.wind.gust,
        weather: current.weather,
        pop: 0, // Not available in current weather
      },
      hourly: forecast.list.slice(0, 48).map(item => ({
        dt: item.dt,
        temp: item.main.temp,
        feels_like: item.main.feels_like,
        pressure: item.main.pressure,
        humidity: item.main.humidity,
        clouds: item.clouds.all,
        visibility: item.visibility,
        wind_speed: item.wind.speed,
        wind_deg: item.wind.deg,
        wind_gust: item.wind.gust,
        weather: item.weather,
        pop: item.pop || 0,
      })),
      daily: aggregateDailyForecast(forecast.list),
    };
  } catch (error) {
    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      throw new APIError(
        'Weather service did not respond within 5 seconds',
        503,
        'WEATHER_API_TIMEOUT',
        { timeout: TIMEOUTS.WEATHER_API }
      );
    }

    // Handle API errors
    if (error.response) {
      throw new APIError(
        error.response.data?.message || 'Weather API error',
        error.response.status,
        'WEATHER_API_ERROR',
        { statusCode: error.response.status }
      );
    }

    // Handle network errors
    throw new APIError(
      'Unable to connect to weather service',
      503,
      'SERVICE_UNAVAILABLE',
      { originalError: error.message }
    );
  }
}

/**
 * Aggregate 3-hour forecast data into daily forecasts
 * @param {Array} hourlyList - 3-hour forecast list from API
 * @returns {Array} Daily forecast data
 */
function aggregateDailyForecast(hourlyList) {
  const dailyMap = new Map();

  hourlyList.forEach(item => {
    const date = new Date(item.dt * 1000).toDateString();

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        dt: item.dt,
        temps: [],
        feels_like: [],
        weather: item.weather,
        pop: item.pop || 0,
        humidity: [],
        wind_speed: [],
      });
    }

    const day = dailyMap.get(date);
    day.temps.push(item.main.temp);
    day.feels_like.push(item.main.feels_like);
    day.humidity.push(item.main.humidity);
    day.wind_speed.push(item.wind.speed);
    day.pop = Math.max(day.pop, item.pop || 0);
  });

  return Array.from(dailyMap.values()).map(day => ({
    dt: day.dt,
    temp: {
      day: average(day.temps),
      min: Math.min(...day.temps),
      max: Math.max(...day.temps),
      night: day.temps[day.temps.length - 1],
      eve: day.temps[Math.floor(day.temps.length * 0.75)],
      morn: day.temps[0],
    },
    feels_like: {
      day: average(day.feels_like),
      night: day.feels_like[day.feels_like.length - 1],
      eve: day.feels_like[Math.floor(day.feels_like.length * 0.75)],
      morn: day.feels_like[0],
    },
    humidity: Math.round(average(day.humidity)),
    wind_speed: average(day.wind_speed),
    weather: day.weather,
    pop: day.pop,
    uvi: 0, // Not available in free tier
  })).slice(0, 8); // Return up to 8 days
}

/**
 * Calculate average of an array of numbers
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} Average value
 */
function average(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Fetch weather forecast for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} units - Units (imperial or metric)
 * @returns {Promise<Object>} Forecast data
 */
export async function getForecast(lat, lon, units = 'imperial') {
  try {
    const response = await axios.get(`${config.weatherApiUrl}/forecast`, {
      params: {
        lat,
        lon,
        units,
        appid: config.weatherApiKey,
      },
      timeout: TIMEOUTS.WEATHER_API,
    });

    return response.data;
  } catch (error) {
    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      throw new APIError(
        'Weather service did not respond within 5 seconds',
        503,
        'WEATHER_API_TIMEOUT',
        { timeout: TIMEOUTS.WEATHER_API }
      );
    }

    // Handle API errors
    if (error.response) {
      throw new APIError(
        error.response.data?.message || 'Weather API error',
        error.response.status,
        'WEATHER_API_ERROR',
        { statusCode: error.response.status }
      );
    }

    // Handle network errors
    throw new APIError(
      'Unable to connect to weather service',
      503,
      'SERVICE_UNAVAILABLE',
      { originalError: error.message }
    );
  }
}

export default {
  getWeather,
  getForecast,
};
