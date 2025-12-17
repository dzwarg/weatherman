/**
 * Tests for Location model
 */

import { describe, it, expect } from 'vitest';
import { Location } from './Location';

describe('Location', () => {
  const validLocation = {
    lat: 42.36,
    lon: -71.06,
    name: 'Boston',
    source: 'device',
    timezone: 'America/New_York',
    accuracy: 50,
  };

  describe('constructor', () => {
    it('should create valid location', () => {
      const location = new Location(validLocation);

      expect(location.lat).toBe(42.36);
      expect(location.lon).toBe(-71.06);
      expect(location.name).toBe('Boston');
      expect(location.source).toBe('device');
      expect(location.timezone).toBe('America/New_York');
      expect(location.lastUpdated).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should throw error for invalid latitude', () => {
      expect(() => new Location({ ...validLocation, lat: 91 })).toThrow('Latitude');
      expect(() => new Location({ ...validLocation, lat: -91 })).toThrow('Latitude');
    });

    it('should throw error for invalid longitude', () => {
      expect(() => new Location({ ...validLocation, lon: 181 })).toThrow('Longitude');
      expect(() => new Location({ ...validLocation, lon: -181 })).toThrow('Longitude');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const location = new Location(validLocation);
      const json = location.toJSON();

      expect(json.lat).toBe(42.36);
      expect(json.lon).toBe(-71.06);
      expect(json.name).toBe('Boston');
    });
  });

  describe('fromJSON', () => {
    it('should deserialize from JSON', () => {
      const original = new Location(validLocation);
      const json = original.toJSON();
      const restored = Location.fromJSON(json);

      expect(restored.lat).toBe(original.lat);
      expect(restored.lon).toBe(original.lon);
      expect(restored.name).toBe(original.name);
    });
  });
});
