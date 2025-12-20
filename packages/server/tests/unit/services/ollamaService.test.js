import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateClothingAdvice, checkHealth, buildPrompt } from '../../../src/services/ollamaService.js';

// Mock axios
vi.mock('axios');

describe('ollamaService', () => {
  let mockAxios;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAxios = await import('axios');
  });

  describe('generateClothingAdvice', () => {
    const mockRequest = {
      profile: {
        id: '4-girl',
        age: 4,
        gender: 'girl',
      },
      weather: {
        temperature: 35,
        feelsLike: 28,
        conditions: 'Rain',
        precipitationProbability: 80,
        windSpeed: 12,
        uvIndex: 2,
      },
      prompt: 'What should I wear to the playground?',
      timeframe: 'morning',
    };

    it('should call Ollama API with correct parameters', async () => {
      const mockResponse = {
        model: 'mistral:latest',
        created_at: '2025-12-20T00:00:00.000Z',
        response: 'Base layers: Thermal shirt\nOuterwear: Warm coat\nSpoken: Wear a warm coat!',
        done: true,
      };

      mockAxios.default.post.mockResolvedValue({ data: mockResponse });

      const result = await generateClothingAdvice(mockRequest);

      expect(mockAxios.default.post).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          model: expect.any(String),
          prompt: expect.any(String),
          stream: false,
        }),
        expect.objectContaining({
          timeout: expect.any(Number),
        })
      );

      expect(result).toEqual(mockResponse.response);
    });

    it('should include profile information in prompt', async () => {
      const mockResponse = {
        response: 'Recommendations here',
        done: true,
      };

      mockAxios.default.post.mockResolvedValue({ data: mockResponse });

      await generateClothingAdvice(mockRequest);

      const callArgs = mockAxios.default.post.mock.calls[0][1];
      expect(callArgs.prompt).toContain('4');
      expect(callArgs.prompt).toContain('girl');
    });

    it('should include weather information in prompt', async () => {
      const mockResponse = {
        response: 'Recommendations here',
        done: true,
      };

      mockAxios.default.post.mockResolvedValue({ data: mockResponse });

      await generateClothingAdvice(mockRequest);

      const callArgs = mockAxios.default.post.mock.calls[0][1];
      expect(callArgs.prompt).toContain('35');
      expect(callArgs.prompt).toContain('Rain');
    });

    it('should include voice prompt context', async () => {
      const mockResponse = {
        response: 'Recommendations here',
        done: true,
      };

      mockAxios.default.post.mockResolvedValue({ data: mockResponse });

      await generateClothingAdvice(mockRequest);

      const callArgs = mockAxios.default.post.mock.calls[0][1];
      expect(callArgs.prompt).toContain('playground');
    });

    it('should handle API timeout', async () => {
      mockAxios.default.post.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      });

      await expect(generateClothingAdvice(mockRequest)).rejects.toThrow();
    });

    it('should handle API connection errors', async () => {
      mockAxios.default.post.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      await expect(generateClothingAdvice(mockRequest)).rejects.toThrow();
    });

    it('should handle malformed API response', async () => {
      mockAxios.default.post.mockResolvedValue({
        data: { error: 'Invalid model' },
      });

      await expect(generateClothingAdvice(mockRequest)).rejects.toThrow();
    });

    it('should use configured model from environment', async () => {
      const mockResponse = {
        response: 'Recommendations here',
        done: true,
      };

      mockAxios.default.post.mockResolvedValue({ data: mockResponse });

      await generateClothingAdvice(mockRequest);

      const callArgs = mockAxios.default.post.mock.calls[0][1];
      expect(callArgs.model).toBeDefined();
      expect(typeof callArgs.model).toBe('string');
    });
  });

  describe('checkHealth', () => {
    it('should return true when Ollama is reachable', async () => {
      mockAxios.default.get.mockResolvedValue({ status: 200 });

      const isHealthy = await checkHealth();

      expect(isHealthy).toBe(true);
      expect(mockAxios.default.get).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({
          timeout: expect.any(Number),
        })
      );
    });

    it('should return false when Ollama is unreachable', async () => {
      mockAxios.default.get.mockRejectedValue(new Error('Connection refused'));

      const isHealthy = await checkHealth();

      expect(isHealthy).toBe(false);
    });

    it('should return false on timeout', async () => {
      mockAxios.default.get.mockRejectedValue({
        code: 'ECONNABORTED',
      });

      const isHealthy = await checkHealth();

      expect(isHealthy).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockAxios.default.get.mockRejectedValue({
        code: 'ENOTFOUND',
      });

      const isHealthy = await checkHealth();

      expect(isHealthy).toBe(false);
    });
  });

  describe('buildPrompt', () => {
    const mockRequest = {
      profile: {
        id: '7-boy',
        age: 7,
        gender: 'boy',
      },
      weather: {
        temperature: 45,
        feelsLike: 42,
        conditions: 'Cloudy',
        precipitationProbability: 30,
        windSpeed: 8,
        uvIndex: 4,
      },
      prompt: 'going to school',
      timeframe: 'morning',
    };

    it('should build structured prompt with all details', () => {
      const prompt = buildPrompt(mockRequest);

      expect(prompt).toContain('7');
      expect(prompt).toContain('boy');
      expect(prompt).toContain('45');
      expect(prompt).toContain('Cloudy');
      expect(prompt).toContain('school');
      expect(prompt).toContain('morning');
    });

    it('should use age-appropriate language', () => {
      const youngRequest = {
        ...mockRequest,
        profile: { ...mockRequest.profile, age: 4 },
      };

      const prompt = buildPrompt(youngRequest);

      expect(prompt).toMatch(/simple|easy|fun|cozy/i);
    });

    it('should include gender-appropriate style', () => {
      const girlRequest = {
        ...mockRequest,
        profile: { ...mockRequest.profile, gender: 'girl' },
      };

      const prompt = buildPrompt(girlRequest);

      expect(prompt).toContain('girl');
    });

    it('should handle missing optional fields', () => {
      const minimalRequest = {
        profile: mockRequest.profile,
        weather: {
          temperature: 50,
          conditions: 'Sunny',
        },
      };

      const prompt = buildPrompt(minimalRequest);

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include output format instructions', () => {
      const prompt = buildPrompt(mockRequest);

      expect(prompt).toMatch(/Base layers|Outerwear|Bottoms|Accessories|Footwear|Spoken/i);
    });
  });
});
