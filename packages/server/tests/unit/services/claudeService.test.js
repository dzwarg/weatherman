import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateClothingAdvice, checkHealth, buildPrompt } from '../../../src/services/claudeService.js';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    })),
  };
});

// Mock config
vi.mock('../../../src/config/env.js', () => ({
  config: {
    anthropicApiKey: 'test-api-key',
    claudeModel: 'claude-3-5-sonnet-20241022',
  },
}));

describe('claudeService', () => {
  let Anthropic;
  let mockCreate;

  beforeEach(async () => {
    vi.clearAllMocks();
    Anthropic = (await import('@anthropic-ai/sdk')).default;
    const instance = new Anthropic();
    mockCreate = instance.messages.create;
  });

  describe('generateClothingAdvice', () => {
    const mockRequest = {
      profile: {
        id: '4yo-girl',
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

    it('should call Claude API with correct parameters and return JSON', async () => {
      const mockJsonResponse = {
        recommendations: {
          baseLayers: ['Thermal shirt'],
          outerwear: ['Warm coat'],
          bottoms: ['Pants'],
          accessories: ['Hat'],
          footwear: ['Boots']
        },
        spokenResponse: 'Wear a warm coat!'
      };

      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockJsonResponse),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await generateClothingAdvice(mockRequest);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          max_tokens: expect.any(Number),
          temperature: expect.any(Number),
          system: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              text: expect.any(String),
              cache_control: expect.objectContaining({ type: 'ephemeral' }),
            }),
          ]),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.any(String),
            }),
          ]),
        })
      );

      expect(result).toEqual(mockJsonResponse);
      expect(result.recommendations).toBeDefined();
      expect(result.spokenResponse).toBeDefined();
    });

    it('should include profile information in prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: JSON.stringify({ recommendations: {}, spokenResponse: 'test' }) }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await generateClothingAdvice(mockRequest);

      const callArgs = mockCreate.mock.calls[0][0];
      const systemText = callArgs.system[0].text;
      expect(systemText).toContain('4');
      expect(systemText).toContain('girl');
    });

    it('should include weather information in prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: JSON.stringify({ recommendations: {}, spokenResponse: 'test' }) }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await generateClothingAdvice(mockRequest);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('35');
      expect(callArgs.messages[0].content).toContain('Rain');
    });

    it('should include voice prompt context', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: JSON.stringify({ recommendations: {}, spokenResponse: 'test' }) }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await generateClothingAdvice(mockRequest);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('playground');
    });

    it('should handle missing optional fields', async () => {
      const minimalRequest = {
        profile: {
          id: '4yo-girl',
          age: 4,
          gender: 'girl',
        },
        weather: {
          temperature: 35,
          conditions: 'Rain',
        },
      };

      const mockJsonResponse = { recommendations: {}, spokenResponse: 'test' };
      const mockResponse = {
        content: [{ type: 'text', text: JSON.stringify(mockJsonResponse) }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await generateClothingAdvice(minimalRequest);

      expect(result).toEqual(mockJsonResponse);
    });

    it('should throw error when no text content in response', async () => {
      const mockResponse = {
        content: [{ type: 'image', source: {} }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(generateClothingAdvice(mockRequest)).rejects.toThrow(
        'No text content in Claude API response'
      );
    });

    it('should throw error when response has no content', async () => {
      const mockResponse = {
        content: [],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(generateClothingAdvice(mockRequest)).rejects.toThrow(
        'Invalid response from Claude API'
      );
    });

    it('should handle API errors', async () => {
      const apiError = new Error('API rate limit exceeded');
      apiError.status = 429;

      mockCreate.mockRejectedValue(apiError);

      await expect(generateClothingAdvice(mockRequest)).rejects.toThrow('API rate limit exceeded');
    });
  });

  describe('checkHealth', () => {
    it('should return true when API key is configured', async () => {
      const result = await checkHealth();
      expect(result).toBe(true);
    });
  });

  describe('buildPrompt', () => {
    const mockRequest = {
      profile: {
        id: '4yo-girl',
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
      prompt: 'What should I wear to school?',
      timeframe: 'morning',
    };

    it('should return object with system and userMessage', () => {
      const result = buildPrompt(mockRequest);

      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('userMessage');
      expect(typeof result.system).toBe('string');
      expect(typeof result.userMessage).toBe('string');
    });

    it('should include age-appropriate language style in system', () => {
      const result = buildPrompt(mockRequest);
      expect(result.system).toContain('4');
      expect(result.system).toContain('girl');
      expect(result.system).toContain('simple, fun, and easy to understand');
    });

    it('should include weather data in user message', () => {
      const result = buildPrompt(mockRequest);
      expect(result.userMessage).toContain('35');
      expect(result.userMessage).toContain('28');
      expect(result.userMessage).toContain('Rain');
      expect(result.userMessage).toContain('80');
    });

    it('should include user prompt context', () => {
      const result = buildPrompt(mockRequest);
      expect(result.userMessage).toContain('school');
    });

    it('should include timeframe', () => {
      const result = buildPrompt(mockRequest);
      expect(result.userMessage).toContain('morning');
    });

    it('should handle different age groups', () => {
      const olderChild = {
        ...mockRequest,
        profile: { id: '10yo-boy', age: 10, gender: 'boy' },
      };

      const result = buildPrompt(olderChild);
      expect(result.system).toContain('10');
      expect(result.system).toContain('boy');
      expect(result.system).toContain('straightforward');
    });

    it('should include JSON format instructions', () => {
      const result = buildPrompt(mockRequest);
      expect(result.userMessage).toContain('JSON');
      expect(result.userMessage).toContain('baseLayers');
      expect(result.userMessage).toContain('outerwear');
      expect(result.userMessage).toContain('bottoms');
      expect(result.userMessage).toContain('accessories');
      expect(result.userMessage).toContain('footwear');
      expect(result.userMessage).toContain('spokenResponse');
    });
  });
});
