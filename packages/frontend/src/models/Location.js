/**
 * Location Model
 * Geographic area for weather data retrieval
 */

export class Location {
  constructor({
    lat,
    lon,
    name,
    source,
    accuracy = null,
    lastUpdated = new Date().toISOString(),
    timezone,
  }) {
    this.lat = lat;
    this.lon = lon;
    this.name = name;
    this.source = source;
    this.accuracy = accuracy;
    this.lastUpdated = lastUpdated;
    this.timezone = timezone;

    this.validate();
  }

  validate() {
    if (this.lat < -90 || this.lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (this.lon < -180 || this.lon > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Location name cannot be empty');
    }

    const validSources = ['device', 'user_specified'];
    if (!validSources.includes(this.source)) {
      throw new Error(`Source must be one of: ${validSources.join(', ')}`);
    }

    if (this.source === 'device' && this.accuracy === null) {
      console.warn('Device location should include accuracy');
    }

    if (!this.timezone) {
      throw new Error('Timezone is required');
    }
  }

  toJSON() {
    return {
      lat: this.lat,
      lon: this.lon,
      name: this.name,
      source: this.source,
      accuracy: this.accuracy,
      lastUpdated: this.lastUpdated,
      timezone: this.timezone,
    };
  }

  static fromJSON(json) {
    return new Location(json);
  }
}
