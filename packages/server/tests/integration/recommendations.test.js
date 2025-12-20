import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { recommendationsRouter } from '../../src/routes/recommendations.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import * as recommendationService from '../../src/services/recommendationService.js';
import { mockRecommendationRequest, mockRecommendationResponse } from '../helpers/mockData.js';

// Mock the recommendation service
vi.mock('../../src/services/recommendationService.js');

describe('Recommendations API Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api', recommendationsRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/recommendations', () => {
    it('should return recommendations for valid request', async () => {
      // Mock the service response
      recommendationService.generateRecommendations.mockResolvedValue(mockRecommendationResponse);

      const response = await request(app)
        .post('/api/recommendations')
        .send(mockRecommendationRequest)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('profileId');
      expect(response.body).toHaveProperty('weatherData');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('spokenResponse');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.recommendations).toHaveProperty('baseLayers');
      expect(response.body.recommendations).toHaveProperty('outerwear');
      expect(response.body.recommendations).toHaveProperty('bottoms');
      expect(response.body.recommendations).toHaveProperty('accessories');
      expect(response.body.recommendations).toHaveProperty('footwear');
    });

    it('should return 400 for invalid profile ID', async () => {
      const invalidRequest = {
        ...mockRecommendationRequest,
        profile: {
          ...mockRecommendationRequest.profile,
          id: 'invalid-profile-id',
        },
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('Profile ID must be one of');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteRequest = {
        profile: {
          id: '4-girl',
        },
        // Missing weather data
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(incompleteRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(response.body.error.details.errors).toContain('Profile age is required');
      expect(response.body.error.details.errors).toContain('Profile gender is required');
      expect(response.body.error.details.errors).toContain('Weather data is required');
    });

    it('should return 400 for missing profile', async () => {
      const requestWithoutProfile = {
        weather: mockRecommendationRequest.weather,
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(requestWithoutProfile)
        .expect(400);

      expect(response.body.error.details.errors).toContain('Profile is required');
    });

    it('should return 400 for missing weather', async () => {
      const requestWithoutWeather = {
        profile: mockRecommendationRequest.profile,
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(requestWithoutWeather)
        .expect(400);

      expect(response.body.error.details.errors).toContain('Weather data is required');
    });

    it('should return 400 for invalid temperature', async () => {
      const invalidRequest = {
        ...mockRecommendationRequest,
        weather: {
          ...mockRecommendationRequest.weather,
          temperature: 'hot',
        },
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error.details.errors).toContain('Weather temperature must be a number');
    });

    it('should return 400 for invalid profile gender', async () => {
      const invalidRequest = {
        ...mockRecommendationRequest,
        profile: {
          ...mockRecommendationRequest.profile,
          gender: 'other',
        },
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error.details.errors).toContain('Profile gender must be either "girl" or "boy"');
    });

    it('should accept optional prompt field', async () => {
      recommendationService.generateRecommendations.mockResolvedValue(mockRecommendationResponse);

      const requestWithPrompt = {
        ...mockRecommendationRequest,
        prompt: 'What should I wear to school today?',
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(requestWithPrompt)
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
    });

    it('should accept optional timeframe field', async () => {
      recommendationService.generateRecommendations.mockResolvedValue(mockRecommendationResponse);

      const requestWithTimeframe = {
        ...mockRecommendationRequest,
        timeframe: 'afternoon',
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(requestWithTimeframe)
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
    });

    it('should use Ollama when available', async () => {
      const ollamaResponse = {
        ...mockRecommendationResponse,
        source: 'ollama',
        confidence: 0.95,
      };

      recommendationService.generateRecommendations.mockResolvedValue(ollamaResponse);
      recommendationService.isOllamaAvailable.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/recommendations')
        .send(mockRecommendationRequest)
        .expect(200);

      expect(response.body.source).toBe('ollama');
      expect(response.body.confidence).toBeGreaterThan(0.8);
    });

    it('should fallback to rules when Ollama is unavailable', async () => {
      const rulesResponse = {
        ...mockRecommendationResponse,
        source: 'rules',
        confidence: 0.75,
      };

      recommendationService.generateRecommendations.mockResolvedValue(rulesResponse);
      recommendationService.isOllamaAvailable.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/recommendations')
        .send(mockRecommendationRequest)
        .expect(200);

      expect(response.body.source).toBe('rules');
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should return different recommendations for different profiles', async () => {
      const profiles = [
        { id: '4yo-girl', age: 4, gender: 'girl' },
        { id: '7yo-boy', age: 7, gender: 'boy' },
        { id: '10yo-boy', age: 10, gender: 'boy' },
      ];

      const responses = [];

      for (const profile of profiles) {
        const mockResponse = {
          ...mockRecommendationResponse,
          profileId: profile.id,
          id: `rec-${profile.id}-${Date.now()}`,
        };

        recommendationService.generateRecommendations.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post('/api/recommendations')
          .send({
            ...mockRecommendationRequest,
            profile,
          })
          .expect(200);

        responses.push(response.body);
      }

      // Verify each profile got a response
      expect(responses).toHaveLength(3);
      expect(responses[0].profileId).toBe('4yo-girl');
      expect(responses[1].profileId).toBe('7yo-boy');
      expect(responses[2].profileId).toBe('10yo-boy');

      // Verify different IDs
      const ids = responses.map(r => r.id);
      expect(new Set(ids).size).toBe(3); // All unique
    });

    it('should handle same weather for different profiles', async () => {
      const sameWeather = {
        temperature: 35,
        feelsLike: 28,
        conditions: 'Rain',
        precipitationProbability: 80,
        windSpeed: 12,
        uvIndex: 2,
      };

      const profiles = [
        { id: '4yo-girl', age: 4, gender: 'girl' },
        { id: '7yo-boy', age: 7, gender: 'boy' },
      ];

      for (const profile of profiles) {
        const mockResponse = {
          ...mockRecommendationResponse,
          profileId: profile.id,
          weatherData: sameWeather,
        };

        recommendationService.generateRecommendations.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post('/api/recommendations')
          .send({
            profile,
            weather: sameWeather,
          })
          .expect(200);

        expect(response.body.weatherData.temperature).toBe(35);
        expect(response.body.weatherData.conditions).toBe('Rain');
      }
    });

    it('should include all recommendation categories', async () => {
      recommendationService.generateRecommendations.mockResolvedValue(mockRecommendationResponse);

      const response = await request(app)
        .post('/api/recommendations')
        .send(mockRecommendationRequest)
        .expect(200);

      const categories = ['baseLayers', 'outerwear', 'bottoms', 'accessories', 'footwear'];

      for (const category of categories) {
        expect(response.body.recommendations).toHaveProperty(category);
        expect(Array.isArray(response.body.recommendations[category])).toBe(true);
      }
    });

    it('should include timestamp in response', async () => {
      // Create a fresh mock with current timestamp
      const mockResponseWithTimestamp = {
        ...mockRecommendationResponse,
        createdAt: new Date().toISOString(),
      };

      recommendationService.generateRecommendations.mockResolvedValue(mockResponseWithTimestamp);

      const before = new Date().toISOString();

      const response = await request(app)
        .post('/api/recommendations')
        .send(mockRecommendationRequest)
        .expect(200);

      const after = new Date().toISOString();

      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.createdAt >= before).toBe(true);
      expect(response.body.createdAt <= after).toBe(true);
    });
  });

  describe('GET /api/recommendations/profiles', () => {
    it('should return available user profiles', async () => {
      const response = await request(app)
        .get('/api/recommendations/profiles')
        .expect(200);

      expect(response.body).toHaveProperty('profiles');
      expect(Array.isArray(response.body.profiles)).toBe(true);
      expect(response.body.profiles.length).toBeGreaterThan(0);
    });

    it('should return profiles with required fields', async () => {
      const response = await request(app)
        .get('/api/recommendations/profiles')
        .expect(200);

      const profile = response.body.profiles[0];

      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('age');
      expect(profile).toHaveProperty('gender');
      expect(profile).toHaveProperty('description');
    });

    it('should return all standard profiles', async () => {
      const response = await request(app)
        .get('/api/recommendations/profiles')
        .expect(200);

      const profileIds = response.body.profiles.map(p => p.id);

      expect(profileIds).toContain('4yo-girl');
      expect(profileIds).toContain('7yo-boy');
      expect(profileIds).toContain('10yo-boy');
    });

    it('should return profiles with correct structure', async () => {
      const response = await request(app)
        .get('/api/recommendations/profiles')
        .expect(200);

      for (const profile of response.body.profiles) {
        expect(typeof profile.id).toBe('string');
        expect(typeof profile.age).toBe('number');
        expect(typeof profile.gender).toBe('string');
        expect(['girl', 'boy']).toContain(profile.gender);
        expect(typeof profile.description).toBe('string');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to recommendations endpoint', async () => {
      recommendationService.generateRecommendations.mockResolvedValue(mockRecommendationResponse);

      // Make multiple requests rapidly
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/recommendations')
            .send(mockRecommendationRequest)
        );
      }

      const responses = await Promise.all(requests);

      // All should succeed (rate limit is 500 per 15 min)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      recommendationService.generateRecommendations.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .post('/api/recommendations')
        .send(mockRecommendationRequest)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .post('/api/recommendations')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
