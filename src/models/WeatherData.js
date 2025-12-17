/**
 * WeatherData Model
 * Current and forecast weather conditions for a location
 */

export class WeatherData {
  constructor({
    location,
    current,
    hourlyForecast = [],
    dailyForecast,
    alerts = [],
    fetchedAt = new Date().toISOString(),
    cacheExpiry = null,
  }) {
    this.location = location;
    this.current = current;
    this.hourlyForecast = hourlyForecast;
    this.dailyForecast = dailyForecast;
    this.alerts = alerts;
    this.fetchedAt = fetchedAt;
    this.cacheExpiry = cacheExpiry || this.calculateCacheExpiry(fetchedAt);

    this.validate();
  }

  calculateCacheExpiry(fetchedAt) {
    const expiryDate = new Date(fetchedAt);
    expiryDate.setHours(expiryDate.getHours() + 1);
    return expiryDate.toISOString();
  }

  validate() {
    // Validate location
    if (!this.location || !this.location.lat || !this.location.lon) {
      throw new Error('Location with lat and lon is required');
    }

    if (this.location.lat < -90 || this.location.lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (this.location.lon < -180 || this.location.lon > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    // Validate current weather
    if (!this.current) {
      throw new Error('Current weather data is required');
    }

    this.validateWeatherData(this.current);

    // Validate daily forecast
    if (!this.dailyForecast || this.dailyForecast.length < 5) {
      throw new Error('Daily forecast must include at least 5 days');
    }

    // Validate timestamps
    const fetchedDate = new Date(this.fetchedAt);
    const expiryDate = new Date(this.cacheExpiry);

    if (fetchedDate > new Date()) {
      throw new Error('fetchedAt cannot be in the future');
    }

    if (expiryDate <= fetchedDate) {
      throw new Error('cacheExpiry must be after fetchedAt');
    }
  }

  validateWeatherData(data) {
    if (data.temperature !== undefined && (data.temperature < -100 || data.temperature > 150)) {
      throw new Error('Temperature must be between -100°F and 150°F');
    }

    if (data.precipitationProbability !== undefined &&
        (data.precipitationProbability < 0 || data.precipitationProbability > 100)) {
      throw new Error('Precipitation probability must be between 0 and 100');
    }

    if (data.windSpeed !== undefined && data.windSpeed < 0) {
      throw new Error('Wind speed must be >= 0');
    }

    if (data.humidity !== undefined && (data.humidity < 0 || data.humidity > 100)) {
      throw new Error('Humidity must be between 0 and 100');
    }

    if (data.uvIndex !== undefined && data.uvIndex < 0) {
      throw new Error('UV index must be >= 0');
    }
  }

  isExpired() {
    return new Date() > new Date(this.cacheExpiry);
  }

  isFresh() {
    return !this.isExpired();
  }

  toJSON() {
    return {
      location: this.location,
      current: this.current,
      hourlyForecast: this.hourlyForecast,
      dailyForecast: this.dailyForecast,
      alerts: this.alerts,
      fetchedAt: this.fetchedAt,
      cacheExpiry: this.cacheExpiry,
    };
  }

  static fromJSON(json) {
    return new WeatherData(json);
  }
}
