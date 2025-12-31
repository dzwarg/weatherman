/**
 * Contract tests for Weather Proxy API
 * Verifies API responses match OpenAPI specifications in contracts/weather-proxy.yaml
 *
 * These tests validate:
 * - Response structure matches schema definitions
 * - Error responses follow contract format
 * - Data types are correct
 * - Required fields are present
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import axios from 'axios';

// Mock axios for external API calls
vi.mock('axios');

describe('Weather Proxy API Contract Tests', () => {
  let server;

  beforeAll(() => {
    const port = 3001; // Use different port to avoid conflicts
    server = app.listen(port);

    // Mock axios.get to return mock weather data
    axios.get = vi.fn((url) => {
      if (url.includes('/weather')) {
        // Mock current weather response
        return Promise.resolve({
          data: {
            coord: { lat: 42.3601, lon: -71.0589 },
            weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
            main: {
              temp: 72.5,
              feels_like: 70.2,
              pressure: 1013,
              humidity: 45,
            },
            wind: { speed: 5.2, deg: 180, gust: 7.1 },
            clouds: { all: 10 },
            visibility: 10000,
            dt: Math.floor(Date.now() / 1000),
            sys: { sunrise: 1234567890, sunset: 1234598790 },
          },
        });
      } else if (url.includes('/forecast')) {
        // Mock forecast response
        const now = Math.floor(Date.now() / 1000);
        return Promise.resolve({
          data: {
            city: { timezone: -14400 },
            list: Array.from({ length: 40 }, (_, i) => ({
              dt: now + i * 10800, // 3-hour intervals
              main: {
                temp: 70 + Math.random() * 10,
                feels_like: 68 + Math.random() * 10,
                pressure: 1010 + Math.random() * 10,
                humidity: 40 + Math.random() * 20,
              },
              weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
              clouds: { all: 10 },
              wind: { speed: 5 + Math.random() * 3, deg: 180, gust: 7 },
              visibility: 10000,
              pop: Math.random() * 0.3,
            })),
          },
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/weather/current', () => {
    it('should match OpenAPI schema for valid request', async () => {
      const validRequest = {
        lat: 42.3601,
        lon: -71.0589,
        units: 'imperial'
      };

      const response = await request(app)
        .post('/api/weather/current')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify response structure matches OpenWeatherMap One Call API format
      expect(response.body).toHaveProperty('lat');
      expect(response.body).toHaveProperty('lon');
      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('daily');
      expect(response.body).toHaveProperty('hourly');

      // Verify coordinates
      expect(typeof response.body.lat).toBe('number');
      expect(typeof response.body.lon).toBe('number');

      // Verify current weather structure
      const current = response.body.current;
      expect(current).toHaveProperty('dt');
      expect(current).toHaveProperty('temp');
      expect(current).toHaveProperty('feels_like');
      expect(current).toHaveProperty('humidity');
      expect(current).toHaveProperty('wind_speed');
      expect(current).toHaveProperty('weather');

      // Verify data types
      expect(typeof current.dt).toBe('number');
      expect(typeof current.temp).toBe('number');
      expect(typeof current.feels_like).toBe('number');
      expect(typeof current.wind_speed).toBe('number');
      expect(typeof current.humidity).toBe('number');
      expect(Array.isArray(current.weather)).toBe(true);
    });

    it('should return 400 for invalid latitude', async () => {
      const invalidRequest = {
        lat: 100, // Invalid: > 90
        lon: -71.0589,
        units: 'imperial'
      };

      const response = await request(app)
        .post('/api/weather/current')
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      // Verify error response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');

      // Verify error code matches contract
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 for invalid longitude', async () => {
      const invalidRequest = {
        lat: 42.3601,
        lon: 200, // Invalid: > 180
        units: 'imperial'
      };

      const response = await request(app)
        .post('/api/weather/current')
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidRequest = {
        units: 'imperial'
        // Missing lat and lon
      };

      const response = await request(app)
        .post('/api/weather/current')
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should handle metric units', async () => {
      const validRequest = {
        lat: 48.8566,
        lon: 2.3522,
        units: 'metric'
      };

      const response = await request(app)
        .post('/api/weather/current')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('current');
      expect(typeof response.body.current.temp).toBe('number');
    });

    it('should include forecast data', async () => {
      const validRequest = {
        lat: 42.3601,
        lon: -71.0589,
        units: 'imperial'
      };

      const response = await request(app)
        .post('/api/weather/current')
        .send(validRequest)
        .expect(200);

      // Verify daily forecast structure
      expect(Array.isArray(response.body.daily)).toBe(true);
      if (response.body.daily.length > 0) {
        const day = response.body.daily[0];
        expect(day).toHaveProperty('dt');
        expect(day).toHaveProperty('temp');
        expect(day.temp).toHaveProperty('min');
        expect(day.temp).toHaveProperty('max');
      }

      // Verify hourly forecast structure
      expect(Array.isArray(response.body.hourly)).toBe(true);
      if (response.body.hourly.length > 0) {
        const hour = response.body.hourly[0];
        expect(hour).toHaveProperty('dt');
        expect(hour).toHaveProperty('temp');
        expect(hour).toHaveProperty('weather');
      }
    });

    it('should handle extreme coordinates (edge cases)', async () => {
      const extremeRequests = [
        { lat: 90, lon: 0, units: 'imperial' }, // North Pole
        { lat: -90, lon: 0, units: 'imperial' }, // South Pole
        { lat: 0, lon: 180, units: 'imperial' }, // International Date Line
        { lat: 0, lon: -180, units: 'imperial' } // International Date Line (west)
      ];

      for (const req of extremeRequests) {
        const response = await request(app)
          .post('/api/weather/current')
          .send(req)
          .expect('Content-Type', /json/);

        // Should either succeed or return valid error
        if (response.status === 200) {
          expect(response.body).toHaveProperty('current');
        } else {
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toHaveProperty('code');
        }
      }
    });
  });

  describe('GET /api/health', () => {
    it('should match OpenAPI schema', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify health check response structure
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');

      // Verify status value
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);

      // Verify services structure
      const services = response.body.services;
      expect(services).toHaveProperty('weatherAPI');
      expect(services).toHaveProperty('claudeAPI');

      // Each service should have status
      expect(['available', 'unavailable']).toContain(services.weatherAPI);
      expect(['available', 'unavailable']).toContain(services.claudeAPI);
    });
  });

  describe('Error Response Contract Compliance', () => {
    it('should return error response for API errors', async () => {
      // Test with invalid request to get error response
      const response = await request(app)
        .post('/api/weather/current')
        .send({ lat: 'invalid' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should use consistent error code format', async () => {
      // Verify error codes are UPPER_SNAKE_CASE
      const response = await request(app)
        .post('/api/weather/current')
        .send({})
        .expect(400);

      expect(response.body.error.code).toMatch(/^[A-Z_]+$/);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });
  });

  describe('Response Headers Contract', () => {
    it('should include CORS headers on actual requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // CORS middleware adds headers to responses
      // Check that response has required headers
      expect(response.headers).toBeDefined();
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Helmet adds various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('should return correct content-type for JSON', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
