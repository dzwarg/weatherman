/**
 * Frontend Post-Deployment Smoke Tests
 *
 * These tests verify basic frontend functionality after deployment
 * to ensure the application is ready to receive production traffic.
 *
 * Run with: npm test --workspace=packages/frontend -- post-deployment/smoke.test.js
 *
 * T051: Frontend post-deployment smoke tests
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
      const response = await fetch(`${BASE_URL}/`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');

      const html = await response.text();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<div id="root">');
    }, TIMEOUT);

    it('should serve favicon', async () => {
      const response = await fetch(`${BASE_URL}/favicon.ico`);
      expect(response.status).toBe(200);
    }, TIMEOUT);

    it('should serve manifest.json for PWA', async () => {
      const response = await fetch(`${BASE_URL}/manifest.json`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const manifest = await response.json();
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('short_name');
      expect(manifest).toHaveProperty('icons');
    }, TIMEOUT);
  });

  describe('Service Worker (PWA)', () => {
    it('should serve service worker script', async () => {
      const response = await fetch(`${BASE_URL}/sw.js`);

      // Service worker might not exist in dev mode, but should exist in production
      if (response.status === 200) {
        expect(response.headers.get('content-type')).toContain('javascript');
        const sw = await response.text();
        expect(sw.length).toBeGreaterThan(0);
      } else {
        // Allow 404 in non-PWA builds, but document it
        console.warn('Service worker not found - PWA features may not be available');
        expect([200, 404]).toContain(response.status);
      }
    }, TIMEOUT);
  });

  describe('Security Headers', () => {
    it('should have CORS headers configured', async () => {
      const response = await fetch(`${BASE_URL}/`);

      // Check for CORS headers (may vary by environment)
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        expect(['*', BASE_URL]).toContain(corsHeader);
      }
    }, TIMEOUT);

    it('should have cache control headers for static assets', async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect(response.headers.has('cache-control')).toBe(true);
    }, TIMEOUT);
  });

  describe('Content Integrity', () => {
    it('should include React app bundle', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();

      // Check for script tags (Vite bundles)
      expect(html).toMatch(/<script[^>]*src="[^"]*\.js"/);
    }, TIMEOUT);

    it('should not expose source maps in production', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();

      // Production builds should not include .map references
      if (process.env.NODE_ENV === 'production') {
        expect(html).not.toContain('.js.map');
        expect(html).not.toContain('.css.map');
      }
    }, TIMEOUT);

    it('should not contain debug logs', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();

      // Check that debug artifacts are not present
      expect(html.toLowerCase()).not.toContain('console.log');
      expect(html.toLowerCase()).not.toContain('debugger');
    }, TIMEOUT);
  });

  describe('Bundle Size', () => {
    it('should have reasonable bundle size', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();

      // Extract script src URLs
      const scriptMatches = html.matchAll(/<script[^>]*src="([^"]+)"/g);
      const scripts = Array.from(scriptMatches).map(match => match[1]);

      let totalSize = 0;
      for (const scriptSrc of scripts) {
        const scriptUrl = scriptSrc.startsWith('http')
          ? scriptSrc
          : `${BASE_URL}${scriptSrc}`;

        try {
          const scriptResponse = await fetch(scriptUrl);
          if (scriptResponse.ok) {
            const scriptContent = await scriptResponse.text();
            totalSize += scriptContent.length;
          }
        } catch (error) {
          console.warn(`Failed to fetch script: ${scriptUrl}`, error.message);
        }
      }

      console.log(`Total JavaScript bundle size: ${Math.round(totalSize / 1024)} KB`);

      // Bundle size should be under 300KB per constitution
      const MAX_BUNDLE_SIZE = 300 * 1024; // 300KB
      expect(totalSize).toBeLessThan(MAX_BUNDLE_SIZE);
    }, TIMEOUT * 2); // Allow more time for fetching multiple scripts
  });

  describe('API Connectivity', () => {
    it('should be able to reach backend API', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    }, TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should serve custom 404 page for non-existent routes', async () => {
      const response = await fetch(`${BASE_URL}/non-existent-route-12345`);

      // SPA should return 200 with index.html (client-side routing)
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('<div id="root">');
    }, TIMEOUT);
  });
});
