import { describe, it, expect } from 'vitest';
import { validateWeatherRequest } from '../../../src/validators/weatherValidator.js';

describe('weatherValidator', () => {
  describe('validateWeatherRequest', () => {
    it('should accept valid coordinates and units', () => {
      const validRequest = {
        lat: 42.3601,
        lon: -71.0589,
        units: 'imperial',
      };

      const result = validateWeatherRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should accept valid coordinates without units (default imperial)', () => {
      const validRequest = {
        lat: 42.3601,
        lon: -71.0589,
      };

      const result = validateWeatherRequest(validRequest);
      expect(result.isValid).toBe(true);
    });

    it('should reject latitude out of range (> 90)', () => {
      const invalidRequest = {
        lat: 91,
        lon: -71.0589,
        units: 'imperial',
      };

      const result = validateWeatherRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Latitude must be between -90 and 90');
    });

    it('should reject latitude out of range (< -90)', () => {
      const invalidRequest = {
        lat: -91,
        lon: -71.0589,
        units: 'imperial',
      };

      const result = validateWeatherRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Latitude must be between -90 and 90');
    });

    it('should reject longitude out of range (> 180)', () => {
      const invalidRequest = {
        lat: 42.3601,
        lon: 181,
        units: 'imperial',
      };

      const result = validateWeatherRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Longitude must be between -180 and 180');
    });

    it('should reject longitude out of range (< -180)', () => {
      const invalidRequest = {
        lat: 42.3601,
        lon: -181,
        units: 'imperial',
      };

      const result = validateWeatherRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Longitude must be between -180 and 180');
    });

    it('should reject invalid units', () => {
      const invalidRequest = {
        lat: 42.3601,
        lon: -71.0589,
        units: 'celsius', // Should be 'metric' not 'celsius'
      };

      const result = validateWeatherRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Units must be either "imperial" or "metric"');
    });

    it('should reject missing latitude', () => {
      const invalidRequest = {
        lon: -71.0589,
        units: 'imperial',
      };

      const result = validateWeatherRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Latitude is required');
    });

    it('should reject missing longitude', () => {
      const invalidRequest = {
        lat: 42.3601,
        units: 'imperial',
      };

      const result = validateWeatherRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Longitude is required');
    });
  });
});
