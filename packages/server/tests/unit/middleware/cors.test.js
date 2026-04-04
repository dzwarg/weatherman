import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('CORS Middleware', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  describe('isOriginAllowed', () => {
    it('should allow exact match', async () => {
      const { isOriginAllowed } = await import('../../../src/middleware/cors.js');
      expect(isOriginAllowed('https://foo.com', ['https://foo.com'])).toBe(true);
    });

    it('should reject non-matching origin', async () => {
      const { isOriginAllowed } = await import('../../../src/middleware/cors.js');
      expect(isOriginAllowed('https://foo.com', ['https://bar.com'])).toBe(false);
    });

    it('should support wildcard in domain', async () => {
      const { isOriginAllowed } = await import('../../../src/middleware/cors.js');
      expect(
        isOriginAllowed('https://main.example.com', ['https://*.example.com'])
      ).toBe(true);
      expect(
        isOriginAllowed('https://feature-abc.example.com', ['https://*.example.com'])
      ).toBe(true);
    });

    it('should reject wildcard mismatch', async () => {
      const { isOriginAllowed } = await import('../../../src/middleware/cors.js');
      expect(
        isOriginAllowed('https://example.com', ['https://*.example.com'])
      ).toBe(false);
    });

    it('should match multiple allowed origins', async () => {
      const { isOriginAllowed } = await import('../../../src/middleware/cors.js');
      const allowed = ['https://foo.com', 'https://*.bar.com'];
      expect(isOriginAllowed('https://foo.com', allowed)).toBe(true);
      expect(isOriginAllowed('https://test.bar.com', allowed)).toBe(true);
      expect(isOriginAllowed('https://other.com', allowed)).toBe(false);
    });
  });

  describe('getAllowedOrigins', () => {
    it('should return localhost origins in development', async () => {
      process.env.NODE_ENV = 'development';
      vi.resetModules();
      const { getAllowedOrigins } = await import('../../../src/middleware/cors.js');
      const origins = getAllowedOrigins();
      expect(origins).toContain('http://localhost:5173');
      expect(origins).toContain('https://localhost:5173');
    });

    it('should parse comma-separated origins in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://foo.com,https://bar.com';
      vi.resetModules();
      const { getAllowedOrigins } = await import('../../../src/middleware/cors.js');
      const origins = getAllowedOrigins();
      expect(origins).toEqual(['https://foo.com', 'https://bar.com']);
    });

    it('should use FRONTEND_URL as fallback', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = '';
      process.env.FRONTEND_URL = 'https://myapp.netlify.app';
      vi.resetModules();
      const { getAllowedOrigins } = await import('../../../src/middleware/cors.js');
      const origins = getAllowedOrigins();
      expect(origins).toEqual(['https://myapp.netlify.app']);
    });
  });
});