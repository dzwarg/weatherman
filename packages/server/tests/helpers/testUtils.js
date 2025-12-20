/**
 * Test utility functions
 */

import { vi } from 'vitest';

/**
 * Mock axios module for HTTP requests
 */
export const mockAxios = () => {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn().mockReturnThis(),
  };
};

/**
 * Mock Express request object
 */
export const mockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  };
};

/**
 * Mock Express response object
 */
export const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock Express next function
 */
export const mockNext = () => vi.fn();

/**
 * Wait for a promise to resolve/reject
 */
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
