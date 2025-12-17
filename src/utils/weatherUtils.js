/**
 * Weather Utilities
 * Helper functions for weather data transformation and analysis
 */

/**
 * Convert Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
export function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Convert Fahrenheit to Celsius
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
export function fahrenheitToCelsius(fahrenheit) {
  return Math.round(((fahrenheit - 32) * 5) / 9);
}

/**
 * Map OpenWeatherMap condition code to friendly description
 * @param {string} conditionCode - OpenWeatherMap weather condition code
 * @param {string} description - OpenWeatherMap description
 * @returns {string} Friendly weather description
 */
export function mapWeatherCondition(conditionCode, description) {
  const conditionMap = {
    '01d': 'Clear and sunny',
    '01n': 'Clear',
    '02d': 'Partly cloudy',
    '02n': 'Partly cloudy',
    '03d': 'Cloudy',
    '03n': 'Cloudy',
    '04d': 'Very cloudy',
    '04n': 'Very cloudy',
    '09d': 'Rainy',
    '09n': 'Rainy',
    '10d': 'Rainy',
    '10n': 'Rainy',
    '11d': 'Thunderstorms',
    '11n': 'Thunderstorms',
    '13d': 'Snowy',
    '13n': 'Snowy',
    '50d': 'Foggy',
    '50n': 'Foggy',
  };

  return conditionMap[conditionCode] || description || 'Unknown';
}

/**
 * Parse OpenWeatherMap API response to our WeatherData format
 * @param {Object} apiResponse - Raw API response from OpenWeatherMap
 * @param {Object} location - Location object with lat, lon, name, timezone
 * @returns {Object} Parsed weather data
 */
export function parseWeatherResponse(apiResponse, location) {
  const current = apiResponse.current;
  const daily = apiResponse.daily;
  const hourly = apiResponse.hourly;
  const alerts = apiResponse.alerts || [];

  return {
    location: {
      lat: location.lat,
      lon: location.lon,
      name: location.name,
      timezone: apiResponse.timezone || location.timezone,
    },
    current: {
      timestamp: new Date(current.dt * 1000).toISOString(),
      temperature: Math.round(current.temp),
      feelsLike: Math.round(current.feels_like),
      conditions: mapWeatherCondition(current.weather[0].icon, current.weather[0].description),
      precipitationProbability: Math.round((current.pop || 0) * 100),
      windSpeed: Math.round(current.wind_speed),
      windGust: current.wind_gust ? Math.round(current.wind_gust) : undefined,
      humidity: current.humidity,
      uvIndex: Math.round(current.uvi),
      icon: current.weather[0].icon,
    },
    hourlyForecast: hourly ? hourly.slice(0, 48).map((hour) => ({
      timestamp: new Date(hour.dt * 1000).toISOString(),
      temperature: Math.round(hour.temp),
      feelsLike: Math.round(hour.feels_like),
      conditions: mapWeatherCondition(hour.weather[0].icon, hour.weather[0].description),
      precipitationProbability: Math.round((hour.pop || 0) * 100),
      windSpeed: Math.round(hour.wind_speed),
      humidity: hour.humidity,
      uvIndex: Math.round(hour.uvi),
      icon: hour.weather[0].icon,
    })) : [],
    dailyForecast: daily.slice(0, 8).map((day) => ({
      date: new Date(day.dt * 1000).toISOString().split('T')[0],
      temperatureHigh: Math.round(day.temp.max),
      temperatureLow: Math.round(day.temp.min),
      conditions: mapWeatherCondition(day.weather[0].icon, day.weather[0].description),
      precipitationProbability: Math.round((day.pop || 0) * 100),
      windSpeed: Math.round(day.wind_speed),
      uvIndex: Math.round(day.uvi),
      icon: day.weather[0].icon,
    })),
    alerts: alerts.map((alert) => ({
      title: alert.event,
      description: alert.description,
      severity: alert.tags && alert.tags.length > 0 ? alert.tags[0] : 'moderate',
      start: new Date(alert.start * 1000).toISOString(),
      end: new Date(alert.end * 1000).toISOString(),
    })),
    fetchedAt: new Date().toISOString(),
    cacheExpiry: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  };
}

/**
 * Determine if weather data is expired
 * @param {string} cacheExpiry - Cache expiry timestamp
 * @returns {boolean} True if expired
 */
export function isExpired(cacheExpiry) {
  return new Date() > new Date(cacheExpiry);
}

/**
 * Get human-readable time difference
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Human-readable time difference (e.g., "5 minutes ago")
 */
export function getTimeDifference(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
