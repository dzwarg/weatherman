import { describe, it, expect } from 'vitest';
import { parseOllamaResponse, extractRecommendations, extractSpokenResponse } from '../../../src/utils/ollamaResponseParser.js';

describe('ollamaResponseParser', () => {
  describe('parseOllamaResponse', () => {
    it('should parse structured Ollama response', () => {
      const ollamaOutput = `
Base layers: Long-sleeve thermal shirt
Outerwear: Warm winter coat with hood
Bottoms: Jeans or thick leggings
Accessories: Warm hat, gloves
Footwear: Winter boots

Spoken: It's cold and rainy today! You'll need your warm coat, a hat, and gloves to stay cozy!
      `.trim();

      const result = parseOllamaResponse(ollamaOutput);

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('spokenResponse');
      expect(result.recommendations).toHaveProperty('baseLayers');
      expect(result.recommendations).toHaveProperty('outerwear');
      expect(result.recommendations).toHaveProperty('bottoms');
      expect(result.recommendations).toHaveProperty('accessories');
      expect(result.recommendations).toHaveProperty('footwear');
    });

    it('should handle freeform text response', () => {
      const ollamaOutput = "It's cold today so you should wear a warm coat, hat, and gloves!";
      const result = parseOllamaResponse(ollamaOutput);

      expect(result).toHaveProperty('spokenResponse');
      expect(result.spokenResponse).toBe(ollamaOutput);
      expect(result.recommendations).toBeDefined();
    });

    it('should extract clothing items from natural language', () => {
      const ollamaOutput = `
You should wear:
- A long-sleeve shirt for warmth
- Your favorite warm coat because it's cold
- Thick pants to keep your legs warm
- Don't forget your hat and gloves!
- Wear your rain boots since it might rain
      `.trim();

      const result = parseOllamaResponse(ollamaOutput);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.baseLayers).toBeDefined();
      expect(result.recommendations.outerwear).toBeDefined();
      expect(result.recommendations.accessories).toBeDefined();
      expect(result.recommendations.footwear).toBeDefined();
    });

    it('should handle malformed response gracefully', () => {
      const ollamaOutput = 'Invalid response format';
      const result = parseOllamaResponse(ollamaOutput);

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('spokenResponse');
      expect(result.spokenResponse).toBe(ollamaOutput);
    });

    it('should handle empty response', () => {
      const result = parseOllamaResponse('');

      expect(result.recommendations).toBeDefined();
      expect(result.spokenResponse).toBeDefined();
    });
  });

  describe('extractRecommendations', () => {
    it('should extract clothing categories from structured text', () => {
      const text = `
Base layers: Thermal shirt
Outerwear: Winter coat
Bottoms: Jeans
Accessories: Hat, gloves, scarf
Footwear: Boots
      `.trim();

      const recommendations = extractRecommendations(text);

      expect(recommendations.baseLayers).toContain('Thermal shirt');
      expect(recommendations.outerwear).toContain('Winter coat');
      expect(recommendations.bottoms).toContain('Jeans');
      expect(recommendations.accessories).toContain('Hat');
      expect(recommendations.footwear).toContain('Boots');
    });

    it('should handle multiple items in one category', () => {
      const text = 'Accessories: Hat, gloves, scarf, warm socks';
      const recommendations = extractRecommendations(text);

      expect(recommendations.accessories).toBeInstanceOf(Array);
      expect(recommendations.accessories.length).toBeGreaterThan(1);
    });

    it('should handle natural language without labels', () => {
      const text = 'Wear a coat, hat, and gloves';
      const recommendations = extractRecommendations(text);

      expect(recommendations).toHaveProperty('outerwear');
      expect(recommendations).toHaveProperty('accessories');
    });

    it('should return empty structure for empty text', () => {
      const recommendations = extractRecommendations('');

      expect(recommendations).toHaveProperty('baseLayers');
      expect(recommendations).toHaveProperty('outerwear');
      expect(recommendations).toHaveProperty('bottoms');
      expect(recommendations).toHaveProperty('accessories');
      expect(recommendations).toHaveProperty('footwear');
    });
  });

  describe('extractSpokenResponse', () => {
    it('should extract spoken section from response', () => {
      const text = `
Base layers: Shirt
Outerwear: Coat

Spoken: It's cold today, so wear your warm coat!
      `.trim();

      const spoken = extractSpokenResponse(text);

      expect(spoken).toBe("It's cold today, so wear your warm coat!");
    });

    it('should extract text after "spoken:" marker', () => {
      const text = 'Some text here. Spoken: This is the spoken part.';
      const spoken = extractSpokenResponse(text);

      expect(spoken).toBe('This is the spoken part.');
    });

    it('should return full text if no spoken marker', () => {
      const text = 'Wear a coat today!';
      const spoken = extractSpokenResponse(text);

      expect(spoken).toBe('Wear a coat today!');
    });

    it('should handle empty text', () => {
      const spoken = extractSpokenResponse('');

      expect(spoken).toBe('');
    });

    it('should be case insensitive for marker', () => {
      const text = 'SPOKEN: This is spoken';
      const spoken = extractSpokenResponse(text);

      expect(spoken).toBe('This is spoken');
    });
  });
});
