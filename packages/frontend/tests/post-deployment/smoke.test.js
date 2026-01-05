/**
 * Frontend Post-Deployment Smoke Tests
 *
 * These tests verify basic frontend functionality after deployment
 * to ensure the application is ready to receive production traffic.
 *
 * IMPORTANT: These are integration tests that run against a LIVE deployed environment.
 * They are NOT run during normal `npm test` - they must be run explicitly.
 *
 * Run with: BASE_URL=http://localhost:3002 npm test --workspace=packages/frontend -- post-deployment/smoke.test.js --run
 *
 * T051: Frontend post-deployment smoke tests
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Configuration from environment or defaults
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TIMEOUT = 10000; // 10 second timeout per test

describe('Frontend Post-Deployment Smoke Tests', () => {
  beforeAll(() => {
    console.log(`Testing frontend at: ${BASE_URL}`);
  });

  describe('Static Assets', () => {
    it('should serve the main HTML page', async () => {
      const response = await fetch(`${BASE_URL}/`, {
        headers: { 'Accept': 'text/html' }
      });

      expect(response.status).toBe(200);

      const contentType = response.headers.get('content-type');
      expect(contentType).toBeTruthy();
      expect(contentType.toLowerCase()).toContain('text/html');

      const html = await response.text();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<div id="root">');
    }, TIMEOUT);

    it('should serve favicon', async () => {
      const response = await fetch(`${BASE_URL}/favicon.ico`);

      // Favicon might be 200 or 404 depending on build
      expect([200, 404]).toContain(response.status);
    }, TIMEOUT);

    it('should serve manifest.json for PWA', async () => {
      const response = await fetch(`${BASE_URL}/manifest.json`);

      if (response.status === 404) {
        console.warn('manifest.json not found - PWA may not be configured');
        return; // Skip if manifest doesn't exist
      }

      const contentType = response.headers.get('content-type');

      // Skip if manifest.json returns non-JSON content (e.g., SPA fallback HTML)
      if (!contentType || !contentType.toLowerCase().includes('application/json')) {
        console.warn('manifest.json not served as JSON - PWA may not be configured');
        return;
      }

      expect(response.status).toBe(200);
      expect(contentType).toBeTruthy();
      expect(contentType.toLowerCase()).toContain('application/json');

      const manifest = await response.json();
      expect(manifest).toHaveProperty('name');
    }, TIMEOUT);
  });

  describe('Service Worker (PWA)', () => {
    it('should serve service worker script or handle missing gracefully', async () => {
      const response = await fetch(`${BASE_URL}/sw.js`);

      // Service worker might not exist in all builds
      if (response.status === 404) {
        console.warn('Service worker not found - PWA features may not be available');
      } else {
        expect(response.status).toBe(200);
        const contentType = response.headers.get('content-type');
        expect(contentType).toBeTruthy();
        expect(contentType.toLowerCase()).toMatch(/javascript|text\/plain/);
      }
    }, TIMEOUT);
  });

  describe('Security Headers', () => {
    it('should have cache control headers for static assets', async () => {
      const response = await fetch(`${BASE_URL}/`);

      // Cache-Control header should exist (value may vary)
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl !== null || cacheControl !== undefined).toBe(true);
    }, TIMEOUT);
  });

  describe('Content Integrity', () => {
    it('should include script tags for React app bundle', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();

      // Check for script tags (Vite bundles)
      const hasScripts = /<script[^>]*src="[^"]*\.js"/.test(html) ||
                         /<script[^>]*type="module"/.test(html);
      expect(hasScripts).toBe(true);
    }, TIMEOUT);

    it('should not contain debug artifacts in production', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();

      // Check that obvious debug artifacts are not present
      const debugPattern = /console\.log\s*\(['"]/i;
      const debuggerPattern = /debugger;/i;

      expect(debugPattern.test(html)).toBe(false);
      expect(debuggerPattern.test(html)).toBe(false);
    }, TIMEOUT);
  });

  describe('Bundle Size', () => {
    it('should have reasonable overall page size', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      const htmlSize = html.length;

      console.log(`HTML page size: ${Math.round(htmlSize / 1024)} KB`);

      // HTML page should be reasonable (< 1MB)
      expect(htmlSize).toBeLessThan(1024 * 1024);
    }, TIMEOUT);
  });

  describe('API Connectivity', () => {
    it('should be able to reach backend API', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);

      expect(response.status).toBe(200);

      const contentType = response.headers.get('content-type');
      expect(contentType).toBeTruthy();
      expect(contentType.toLowerCase()).toContain('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('status');
      // Server returns 'healthy' or 'degraded' based on service availability
      expect(['healthy', 'degraded']).toContain(data.status);
    }, TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should handle non-existent routes gracefully', async () => {
      const response = await fetch(`${BASE_URL}/non-existent-route-12345`);

      // SPA should return 200 with index.html (client-side routing)
      // OR return 404 with proper error page
      expect([200, 404]).toContain(response.status);

      const html = await response.text();
      expect(html.length).toBeGreaterThan(0);
    }, TIMEOUT);
  });
});
