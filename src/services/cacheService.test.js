/**
 * Tests for cacheService
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import cacheService from './cacheService';

describe('cacheService', () => {
  const mockWeatherData = {
    location: { lat: 42.36, lon: -71.06, name: 'Boston' },
    current: { temperature: 70, conditions: 'Clear' },
    fetchedAt: new Date().toISOString(),
    cacheExpiry: new Date(Date.now() + 3600000).toISOString(),
  };

  beforeEach(async () => {
    // Ensure DB is initialized
    await cacheService.init();
  });

  afterEach(async () => {
    // Clear cache after each test
    await cacheService.clear();
  });

  describe('init', () => {
    it('should initialize database', async () => {
      const db = await cacheService.init();

      expect(db).toBeDefined();
      expect(cacheService.db).not.toBeNull();
    });

    it('should return existing database if already initialized', async () => {
      const db1 = await cacheService.init();
      const db2 = await cacheService.init();

      expect(db1).toBe(db2);
    });
  });

  describe('generateKey', () => {
    it('should generate key from coordinates', () => {
      const key = cacheService.generateKey(42.36, -71.06);

      expect(key).toBe('42.36,-71.06');
    });

    it('should round coordinates to 2 decimal places', () => {
      const key = cacheService.generateKey(42.36789, -71.06543);

      expect(key).toBe('42.37,-71.07');
    });

    it('should handle negative coordinates', () => {
      const key = cacheService.generateKey(-42.36, -71.06);

      expect(key).toBe('-42.36,-71.06');
    });
  });

  describe('set and get', () => {
    it('should store and retrieve weather data', async () => {
      await cacheService.set(42.36, -71.06, mockWeatherData);

      const result = await cacheService.get(42.36, -71.06);

      expect(result).toEqual(mockWeatherData);
    });

    it('should return null for non-existent data', async () => {
      const result = await cacheService.get(40.71, -74.01);

      expect(result).toBeNull();
    });

    it('should update existing entry', async () => {
      await cacheService.set(42.36, -71.06, mockWeatherData);

      const updatedData = {
        ...mockWeatherData,
        current: { temperature: 75, conditions: 'Sunny' },
      };

      await cacheService.set(42.36, -71.06, updatedData);

      const result = await cacheService.get(42.36, -71.06);

      expect(result.current.temperature).toBe(75);
    });

    it('should round coordinates when storing and retrieving', async () => {
      await cacheService.set(42.36789, -71.06543, mockWeatherData);

      const result = await cacheService.get(42.37, -71.07);

      expect(result).toEqual(mockWeatherData);
    });
  });

  describe('remove', () => {
    it('should remove cached data', async () => {
      await cacheService.set(42.36, -71.06, mockWeatherData);

      let result = await cacheService.get(42.36, -71.06);
      expect(result).not.toBeNull();

      await cacheService.remove(42.36, -71.06);

      result = await cacheService.get(42.36, -71.06);
      expect(result).toBeNull();
    });

    it('should not error when removing non-existent entry', async () => {
      await expect(cacheService.remove(40.71, -74.01)).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cached data', async () => {
      // Add multiple entries
      await cacheService.set(42.36, -71.06, mockWeatherData);
      await cacheService.set(40.71, -74.01, {
        ...mockWeatherData,
        location: { lat: 40.71, lon: -74.01, name: 'New York' },
      });

      await cacheService.clear();

      const result1 = await cacheService.get(42.36, -71.06);
      const result2 = await cacheService.get(40.71, -74.01);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('enforceMaxEntries', () => {
    it('should remove oldest entries when max exceeded', async () => {
      // Store max entries + 2
      const maxEntries = cacheService.maxEntries;
      const entries = [];

      for (let i = 0; i < maxEntries + 2; i++) {
        const data = {
          ...mockWeatherData,
          location: { lat: 42 + i * 0.01, lon: -71 - i * 0.01 },
          fetchedAt: new Date(Date.now() - (maxEntries + 2 - i) * 1000).toISOString(),
        };
        entries.push(data);
        await cacheService.set(data.location.lat, data.location.lon, data);
      }

      // The oldest 2 entries should have been removed
      const oldest1 = await cacheService.get(entries[0].location.lat, entries[0].location.lon);
      const oldest2 = await cacheService.get(entries[1].location.lat, entries[1].location.lon);
      const newest = await cacheService.get(
        entries[entries.length - 1].location.lat,
        entries[entries.length - 1].location.lon
      );

      expect(oldest1).toBeNull();
      expect(oldest2).toBeNull();
      expect(newest).not.toBeNull();
    });

    it('should not remove entries when under max', async () => {
      const data1 = { ...mockWeatherData, location: { lat: 42.36, lon: -71.06 } };
      const data2 = {
        ...mockWeatherData,
        location: { lat: 40.71, lon: -74.01 },
        fetchedAt: new Date(Date.now() - 1000).toISOString(),
      };

      await cacheService.set(42.36, -71.06, data1);
      await cacheService.set(40.71, -74.01, data2);

      // Both should still exist
      const result1 = await cacheService.get(42.36, -71.06);
      const result2 = await cacheService.get(40.71, -74.01);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
    });
  });

  describe('database persistence', () => {
    it('should persist data across service instances', async () => {
      await cacheService.set(42.36, -71.06, mockWeatherData);

      // Simulate recreating the service (resetting db reference)
      const originalDb = cacheService.db;
      cacheService.db = null;

      await cacheService.init();

      const result = await cacheService.get(42.36, -71.06);

      expect(result).toEqual(mockWeatherData);

      // Restore original db
      cacheService.db = originalDb;
    });
  });

});
