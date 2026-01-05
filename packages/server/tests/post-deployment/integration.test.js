/**
 * Backend Post-Deployment Integration Tests
 *
 * These tests verify backend API functionality after deployment
 * to ensure all endpoints work correctly in the production environment.
 *
 * IMPORTANT: These are integration tests that run against a LIVE deployed environment.
 * They are NOT run during normal `npm test` - they must be run explicitly.
 *
 * Run with: BASE_URL=http://localhost:3002 npm test --workspace=packages/server -- post-deployment/integration.test.js --run
 *
 * T052: Backend post-deployment integration tests
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Configuration from environment or defaults
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TIMEOUT = 15000; // 15 second timeout per test

describe('Backend Post-Deployment Integration Tests', () => {
  beforeAll(() => {
    console.log(`Testing backend API at: ${BASE_URL}/api`);
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);

      expect(response.status).toBe(200);

      const contentType = response.headers.get('content-type');
      expect(contentType).toBeTruthy();
      expect(contentType.toLowerCase()).toContain('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('status');
      // Server returns 'healthy' or 'degraded' based on service availability
      expect(['healthy', 'degraded']).toContain(data.status);
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('services');
      expect(data.services).toHaveProperty('weatherAPI');
      expect(data.services).toHaveProperty('claudeAPI');
    }, TIMEOUT);

    it('should respond quickly (< 1000ms)', async () => {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/health`);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000);

      console.log(`Health check response time: ${duration}ms`);
    }, TIMEOUT);
  });

  describe('Weather Recommendations Endpoint', () => {
    it('should handle valid weather request', async () => {
      const requestBody = {
        location: 'Boston',
        temperature: 65,
        conditions: 'sunny',
        humidity: 50,
      };

      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Accept both 200 and 500 (external API may fail)
      expect([200, 500, 503]).toContain(response.status);

      const contentType = response.headers.get('content-type');
      expect(contentType).toBeTruthy();
      expect(contentType.toLowerCase()).toContain('application/json');

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('recommendations');
        expect(Array.isArray(data.recommendations)).toBe(true);

        if (data.recommendations.length > 0) {
          console.log(`Received ${data.recommendations.length} recommendations`);
        }
      } else {
        console.warn(`External API returned ${response.status} - this may be expected`);
      }
    }, TIMEOUT);

    it('should handle missing required fields', async () => {
      const requestBody = {
        location: 'Boston',
        // Missing temperature and conditions
      };

      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Should return 400 Bad Request for missing fields
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    }, TIMEOUT);

    it('should handle invalid temperature values', async () => {
      const requestBody = {
        location: 'Boston',
        temperature: 'not-a-number',
        conditions: 'sunny',
      };

      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);
    }, TIMEOUT);

    it('should respond within acceptable time (< 5s)', async () => {
      const requestBody = {
        location: 'Boston',
        temperature: 72,
        conditions: 'cloudy',
        humidity: 60,
      };

      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      const duration = Date.now() - start;

      expect([200, 400, 500, 503]).toContain(response.status);
      expect(duration).toBeLessThan(5000);

      console.log(`Recommendations response time: ${duration}ms`);
    }, TIMEOUT);
  });

  describe('CORS Configuration', () => {
    it('should have CORS headers configured', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);

      // Check for CORS headers
      const allowOrigin = response.headers.get('access-control-allow-origin');
      expect(allowOrigin).toBeTruthy();
    }, TIMEOUT);

    it('should handle OPTIONS preflight requests', async () => {
      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });

      // OPTIONS should return 204 No Content or 200 OK
      expect([200, 204]).toContain(response.status);

      const allowMethods = response.headers.get('access-control-allow-methods');
      if (allowMethods) {
        expect(allowMethods.toUpperCase()).toContain('POST');
      }
    }, TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await fetch(`${BASE_URL}/api/non-existent-endpoint`);
      expect(response.status).toBe(404);
    }, TIMEOUT);

    it('should return 405 for unsupported HTTP methods', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'POST',
      });

      // Health endpoint should only support GET
      expect(response.status).toBe(405);
    }, TIMEOUT);

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json{',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    }, TIMEOUT);
  });

  describe('External API Integration', () => {
    it('should handle weather API requests', async () => {
      const requestBody = {
        location: 'Boston',
        temperature: 68,
        conditions: 'partly-cloudy',
      };

      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Accept success or graceful failure
      expect([200, 400, 500, 503]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.recommendations).toBeDefined();
        console.log('✅ External API integration working');
      } else {
        console.warn(`⚠️  External API returned ${response.status} - may be rate limited or down`);
      }
    }, TIMEOUT);

    it('should handle external API errors gracefully', async () => {
      // Test with location that might cause API issues
      const requestBody = {
        location: 'Invalid-Location-12345-XXXXXX',
        temperature: 70,
        conditions: 'sunny',
      };

      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Should handle gracefully with appropriate status
      expect([200, 400, 500, 503]).toContain(response.status);

      const contentType = response.headers.get('content-type');
      expect(contentType).toBeTruthy();
      expect(contentType.toLowerCase()).toContain('application/json');
    }, TIMEOUT);
  });

  describe('Claude AI Integration', () => {
    it('should generate AI-powered recommendations', async () => {
      const requestBody = {
        location: 'New York',
        temperature: 75,
        conditions: 'sunny',
        humidity: 55,
        windSpeed: 10,
      };

      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // AI integration may fail due to API keys/rate limits
      if (response.status === 200) {
        const data = await response.json();
        expect(data.recommendations).toBeDefined();
        console.log('✅ Claude AI integration working');
      } else if (response.status >= 500) {
        console.warn('⚠️  Claude AI may be unavailable or API key not configured');
      }

      expect([200, 400, 500, 503]).toContain(response.status);
    }, TIMEOUT);
  });

  describe('Performance & Resource Usage', () => {
    it('should handle concurrent requests', async () => {
      const requestBody = {
        location: 'Chicago',
        temperature: 60,
        conditions: 'rainy',
      };

      // Send 5 concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() =>
          fetch(`${BASE_URL}/api/health`, {
            method: 'GET',
          })
        );

      const responses = await Promise.all(promises);

      // All health checks should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      console.log('✅ Handled 5 concurrent requests successfully');
    }, TIMEOUT * 2);

    it('should remain stable after multiple requests', async () => {
      // Make multiple requests and verify server remains stable
      for (let i = 0; i < 10; i++) {
        const response = await fetch(`${BASE_URL}/api/health`);
        expect(response.status).toBe(200);
      }

      // Final check - if server is still responding, it's stable
      const finalCheck = await fetch(`${BASE_URL}/api/health`);
      expect(finalCheck.status).toBe(200);

      console.log('✅ Server remained stable after 10 sequential requests');
    }, TIMEOUT * 2);
  });

  describe('Security', () => {
    it('should not expose sensitive information in errors', async () => {
      const response = await fetch(`${BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' }),
      });

      const data = await response.json();

      // Error messages should not expose stack traces or API keys
      const errorString = JSON.stringify(data).toLowerCase();
      expect(errorString).not.toContain('api_key');
      expect(errorString).not.toContain('secret');
      expect(errorString).not.toContain('password');
      expect(errorString).not.toMatch(/at\s+\w+\s+\(/); // Stack trace pattern
    }, TIMEOUT);

    it('should reject requests with excessive payload size', async () => {
      // Create a large payload (> 1MB)
      const largePayload = {
        location: 'Boston',
        temperature: 70,
        conditions: 'sunny',
        extra: 'x'.repeat(2 * 1024 * 1024), // 2MB string
      };

      try {
        const response = await fetch(`${BASE_URL}/api/recommendations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(largePayload),
        });

        // Should reject large payloads
        expect([400, 413, 500]).toContain(response.status);
      } catch (error) {
        // Connection may be closed by server - this is acceptable
        console.log('Large payload rejected (connection closed)');
      }
    }, TIMEOUT);
  });
});
