/**
 * Contract tests for Recommendations API
 * Verifies API responses match OpenAPI specifications in contracts/recommendations.yaml
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Recommendations API Contract Tests', () => {
  let server;

  beforeAll(() => {
    const port = 3002; // Use different port to avoid conflicts
    server = app.listen(port);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/recommendations', () => {
    it('should match OpenAPI schema for valid request', async () => {
      const validRequest = {
        profile: {
          id: '4yo-girl',
          age: 4,
          gender: 'girl'
        },
        weather: {
          temperature: 35,
          feelsLike: 28,
          conditions: 'Rain',
          precipitationProbability: 80,
          windSpeed: 12,
          uvIndex: 2
        },
        prompt: 'What should I wear to the playground today?',
        timeframe: 'morning'
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify response structure matches schema
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('profileId');
      expect(response.body).toHaveProperty('weatherData');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('spokenResponse');
      expect(response.body).toHaveProperty('source');
      expect(response.body).toHaveProperty('confidence');

      // Verify profileId matches request
      expect(response.body.profileId).toBe('4yo-girl');

      // Verify recommendations structure (matches claudeService.js format)
      const recs = response.body.recommendations;
      expect(recs).toHaveProperty('baseLayers');
      expect(recs).toHaveProperty('outerwear');
      expect(recs).toHaveProperty('bottoms');
      expect(recs).toHaveProperty('accessories');
      expect(recs).toHaveProperty('footwear');

      // All recommendation categories should be arrays
      expect(Array.isArray(recs.baseLayers)).toBe(true);
      expect(Array.isArray(recs.outerwear)).toBe(true);
      expect(Array.isArray(recs.bottoms)).toBe(true);
      expect(Array.isArray(recs.accessories)).toBe(true);
      expect(Array.isArray(recs.footwear)).toBe(true);

      // Verify weather data structure
      const weather = response.body.weatherData;
      expect(weather).toHaveProperty('temperature');
      expect(weather).toHaveProperty('feelsLike');
      expect(weather).toHaveProperty('conditions');
      expect(weather).toHaveProperty('precipitationProbability');
      expect(weather).toHaveProperty('windSpeed');
      expect(weather).toHaveProperty('uvIndex');

      // Verify data types
      expect(typeof response.body.id).toBe('string');
      expect(typeof response.body.spokenResponse).toBe('string');
      expect(typeof response.body.source).toBe('string');
      expect(typeof response.body.confidence).toBe('number');

      // Verify source is valid enum value
      expect(['claude', 'rules', 'cache']).toContain(response.body.source);

      // Verify confidence is in valid range
      expect(response.body.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle 7-year-old boy profile', async () => {
      const validRequest = {
        profile: {
          id: '7yo-boy',
          age: 7,
          gender: 'boy'
        },
        weather: {
          temperature: 75,
          feelsLike: 78,
          conditions: 'Sunny',
          precipitationProbability: 5,
          windSpeed: 8,
          uvIndex: 7
        },
        prompt: 'Going to soccer practice',
        timeframe: 'afternoon'
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.profileId).toBe('7yo-boy');
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should handle 10-year-old boy profile', async () => {
      const validRequest = {
        profile: {
          id: '10yo-boy',
          age: 10,
          gender: 'boy'
        },
        weather: {
          temperature: 85,
          feelsLike: 88,
          conditions: 'Clear',
          precipitationProbability: 5,
          windSpeed: 5,
          uvIndex: 8
        },
        prompt: "I'm going to a birthday party",
        timeframe: 'afternoon'
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.profileId).toBe('10yo-boy');
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should return 400 for invalid profile age', async () => {
      const invalidRequest = {
        profile: {
          id: 'invalid-age',
          age: 15, // Not 4, 7, or 10
          gender: 'boy'
        },
        weather: {
          temperature: 70,
          feelsLike: 68,
          conditions: 'Clear',
          precipitationProbability: 10,
          windSpeed: 5,
          uvIndex: 5
        }
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 for invalid gender', async () => {
      const invalidRequest = {
        profile: {
          id: 'invalid-gender',
          age: 7,
          gender: 'invalid' // Not 'boy' or 'girl'
        },
        weather: {
          temperature: 70,
          feelsLike: 68,
          conditions: 'Clear',
          precipitationProbability: 10,
          windSpeed: 5,
          uvIndex: 5
        }
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 for missing profile', async () => {
      const invalidRequest = {
        weather: {
          temperature: 70,
          feelsLike: 68,
          conditions: 'Clear',
          precipitationProbability: 10,
          windSpeed: 5,
          uvIndex: 5
        }
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 for missing weather', async () => {
      const invalidRequest = {
        profile: {
          id: '4yo-girl',
          age: 4,
          gender: 'girl'
        }
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should handle optional prompt field', async () => {
      const requestWithoutPrompt = {
        profile: {
          id: '4yo-girl',
          age: 4,
          gender: 'girl'
        },
        weather: {
          temperature: 70,
          feelsLike: 68,
          conditions: 'Clear',
          precipitationProbability: 10,
          windSpeed: 5,
          uvIndex: 5
        }
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(requestWithoutPrompt)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
    });

    it('should handle optional timeframe field', async () => {
      const requestWithoutTimeframe = {
        profile: {
          id: '7yo-boy',
          age: 7,
          gender: 'boy'
        },
        weather: {
          temperature: 60,
          feelsLike: 58,
          conditions: 'Cloudy',
          precipitationProbability: 30,
          windSpeed: 10,
          uvIndex: 3
        },
        prompt: 'Going outside'
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(requestWithoutTimeframe)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
    });

    it('should handle extreme cold weather', async () => {
      const coldWeatherRequest = {
        profile: {
          id: '4yo-girl',
          age: 4,
          gender: 'girl'
        },
        weather: {
          temperature: -10,
          feelsLike: -20,
          conditions: 'Snow',
          precipitationProbability: 90,
          windSpeed: 20,
          uvIndex: 1
        },
        prompt: 'Going to school'
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(coldWeatherRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      // Should recommend heavy winter gear
      const recs = response.body.recommendations;
      expect(recs.outerwear.length).toBeGreaterThan(0);
      expect(recs.accessories.length).toBeGreaterThan(0);
    });

    it('should handle extreme hot weather', async () => {
      const hotWeatherRequest = {
        profile: {
          id: '10yo-boy',
          age: 10,
          gender: 'boy'
        },
        weather: {
          temperature: 100,
          feelsLike: 110,
          conditions: 'Clear',
          precipitationProbability: 0,
          windSpeed: 5,
          uvIndex: 11
        },
        prompt: 'Playing outside'
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(hotWeatherRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      // Should recommend sun protection
      const recs = response.body.recommendations;
      expect(recs.accessories.length).toBeGreaterThan(0); // Hat, sunglasses
    });

    it('should handle high precipitation probability', async () => {
      const rainyRequest = {
        profile: {
          id: '7yo-boy',
          age: 7,
          gender: 'boy'
        },
        weather: {
          temperature: 55,
          feelsLike: 52,
          conditions: 'Rain',
          precipitationProbability: 95,
          windSpeed: 15,
          uvIndex: 2
        }
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(rainyRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      // Should recommend rain gear
      const recs = response.body.recommendations;
      expect(recs.outerwear.length).toBeGreaterThan(0);
      expect(recs.accessories.length).toBeGreaterThan(0);
    });

    it('should include spoken response for voice output', async () => {
      const validRequest = {
        profile: {
          id: '4yo-girl',
          age: 4,
          gender: 'girl'
        },
        weather: {
          temperature: 65,
          feelsLike: 63,
          conditions: 'Partly Cloudy',
          precipitationProbability: 20,
          windSpeed: 8,
          uvIndex: 5
        },
        prompt: 'What should I wear?'
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(validRequest)
        .expect(200);

      // Spoken response should be age-appropriate
      expect(response.body.spokenResponse).toBeTruthy();
      expect(typeof response.body.spokenResponse).toBe('string');
      expect(response.body.spokenResponse.length).toBeGreaterThan(10);
    });
  });

  describe('Recommendation Data Validation', () => {
    it('should return non-empty recommendations for normal weather', async () => {
      const request_data = {
        profile: {
          id: '7yo-boy',
          age: 7,
          gender: 'boy'
        },
        weather: {
          temperature: 70,
          feelsLike: 68,
          conditions: 'Clear',
          precipitationProbability: 10,
          windSpeed: 5,
          uvIndex: 5
        }
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(request_data)
        .expect(200);

      const recs = response.body.recommendations;

      // At minimum, should have bottoms and one other category
      const totalItems =
        recs.baseLayers.length +
        recs.outerwear.length +
        recs.bottoms.length +
        recs.accessories.length +
        recs.footwear.length;

      expect(totalItems).toBeGreaterThan(0);
    });

    it('should use appropriate vocabulary for age 4', async () => {
      const request_data = {
        profile: {
          id: '4yo-girl',
          age: 4,
          gender: 'girl'
        },
        weather: {
          temperature: 70,
          feelsLike: 68,
          conditions: 'Sunny',
          precipitationProbability: 5,
          windSpeed: 5,
          uvIndex: 6
        }
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(request_data)
        .expect(200);

      // Spoken response should use simple language
      const spoken = response.body.spokenResponse.toLowerCase();

      // Should not use complex weather terminology
      expect(spoken).not.toMatch(/precipitation|meteorological|atmospheric/);
    });

    it('should generate recommendations for different profiles', async () => {
      // Note: Available profiles are 4yo-girl, 7yo-boy, 10yo-boy
      // Can't perfectly test same-age gender differentiation with current profiles
      const girlRequest = {
        profile: {
          id: '4yo-girl',
          age: 4,
          gender: 'girl'
        },
        weather: {
          temperature: 70,
          feelsLike: 68,
          conditions: 'Clear',
          precipitationProbability: 10,
          windSpeed: 5,
          uvIndex: 5
        }
      };

      const boyRequest = {
        profile: {
          id: '7yo-boy',
          age: 7,
          gender: 'boy'
        },
        weather: girlRequest.weather
      };

      const girlResponse = await request(app)
        .post('/api/recommendations')
        .send(girlRequest)
        .expect(200);

      const boyResponse = await request(app)
        .post('/api/recommendations')
        .send(boyRequest)
        .expect(200);

      // Both should succeed and have valid recommendation structure
      expect(girlResponse.body).toHaveProperty('recommendations');
      expect(girlResponse.body.profileId).toBe('4yo-girl');
      expect(boyResponse.body).toHaveProperty('recommendations');
      expect(boyResponse.body.profileId).toBe('7yo-boy');

      // Both should have spoken responses appropriate for their age
      expect(girlResponse.body.spokenResponse).toBeTruthy();
      expect(boyResponse.body.spokenResponse).toBeTruthy();
    });
  });

  describe('Error Response Contract Compliance', () => {
    it('should return consistent error format', async () => {
      const invalidRequest = {
        profile: {
          id: 'invalid',
          age: 99,
          gender: 'invalid'
        }
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
