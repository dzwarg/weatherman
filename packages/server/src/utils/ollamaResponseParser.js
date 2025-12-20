/**
 * Ollama Response Parser
 * Parses free-text LLM output into structured clothing recommendation format
 */

/**
 * Parse Ollama response into structured format
 * @param {string} ollamaOutput - Raw text output from Ollama
 * @returns {Object} Structured recommendations and spoken response
 */
export function parseOllamaResponse(ollamaOutput) {
  if (!ollamaOutput || typeof ollamaOutput !== 'string') {
    return {
      recommendations: {
        baseLayers: [],
        outerwear: [],
        bottoms: [],
        accessories: [],
        footwear: [],
      },
      spokenResponse: '',
    };
  }

  // Try to extract structured recommendations
  const recommendations = extractRecommendations(ollamaOutput);

  // Try to extract spoken response
  const spokenResponse = extractSpokenResponse(ollamaOutput);

  return {
    recommendations,
    spokenResponse,
  };
}

/**
 * Extract clothing recommendations from text
 * @param {string} text - Text containing clothing recommendations
 * @returns {Object} Structured recommendations by category
 */
export function extractRecommendations(text) {
  const recommendations = {
    baseLayers: [],
    outerwear: [],
    bottoms: [],
    accessories: [],
    footwear: [],
  };

  if (!text) {
    return recommendations;
  }

  // Patterns for structured format (e.g., "Base layers: thermal shirt")
  const structuredPatterns = {
    baseLayers: /Base\s+layers?:\s*(.+?)(?:\n|$)/i,
    outerwear: /Outerwear:\s*(.+?)(?:\n|$)/i,
    bottoms: /Bottoms?:\s*(.+?)(?:\n|$)/i,
    accessories: /Accessories:\s*(.+?)(?:\n|$)/i,
    footwear: /Footwear:\s*(.+?)(?:\n|$)/i,
  };

  // Try to extract structured format first
  let hasStructuredFormat = false;
  for (const [category, pattern] of Object.entries(structuredPatterns)) {
    const match = text.match(pattern);
    if (match) {
      hasStructuredFormat = true;
      const items = match[1]
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      recommendations[category] = items;
    }
  }

  // If structured format found, return it
  if (hasStructuredFormat) {
    return recommendations;
  }

  // Otherwise, try to extract from natural language
  extractFromNaturalLanguage(text, recommendations);

  return recommendations;
}

/**
 * Extract clothing items from natural language text
 * @param {string} text - Natural language text
 * @param {Object} recommendations - Recommendations object to populate
 */
function extractFromNaturalLanguage(text, recommendations) {
  const lowerText = text.toLowerCase();

  // Keywords for each category
  const categoryKeywords = {
    baseLayers: [
      'shirt', 'thermal', 'undershirt', 't-shirt', 'tee', 'long-sleeve', 'short-sleeve',
      'base layer', 'layer',
    ],
    outerwear: [
      'coat', 'jacket', 'hoodie', 'sweatshirt', 'sweater', 'cardigan', 'vest',
      'windbreaker', 'raincoat', 'poncho',
    ],
    bottoms: [
      'pants', 'jeans', 'shorts', 'skirt', 'leggings', 'trousers', 'sweatpants',
      'joggers',
    ],
    accessories: [
      'hat', 'cap', 'beanie', 'gloves', 'mittens', 'scarf', 'sunglasses', 'umbrella',
      'backpack', 'bag', 'socks',
    ],
    footwear: [
      'shoes', 'boots', 'sneakers', 'sandals', 'rain boots', 'winter boots',
      'snow boots', 'slippers',
    ],
  };

  // Extract sentences
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);

  // Search for clothing items in each sentence
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerSentence.includes(keyword)) {
          // Extract context around the keyword (up to 50 chars before and after)
          const index = lowerSentence.indexOf(keyword);
          const start = Math.max(0, index - 50);
          const end = Math.min(lowerSentence.length, index + keyword.length + 50);
          const context = sentence.substring(start, end).trim();

          // Add to recommendations if not already there
          if (!recommendations[category].some((item) => item.toLowerCase().includes(keyword))) {
            recommendations[category].push(context);
          }
          break; // Only add one item per sentence per category
        }
      }
    }
  }

  // Clean up recommendations - limit to 2-3 items per category
  for (const category of Object.keys(recommendations)) {
    if (recommendations[category].length > 3) {
      recommendations[category] = recommendations[category].slice(0, 3);
    }
  }
}

/**
 * Extract spoken response from Ollama output
 * @param {string} text - Ollama output text
 * @returns {string} Spoken response
 */
export function extractSpokenResponse(text) {
  if (!text) {
    return '';
  }

  // Look for explicit "Spoken:" section
  const spokenMatch = text.match(/Spoken:\s*(.+?)(?:\n\n|$)/is);
  if (spokenMatch) {
    return spokenMatch[1].trim();
  }

  // If no explicit spoken section, try to find a conversational paragraph
  // Look for paragraphs that sound like they're talking to a child
  const paragraphs = text.split('\n\n').map((p) => p.trim()).filter((p) => p.length > 0);

  for (const paragraph of paragraphs) {
    // Skip if it looks like a structured format
    if (paragraph.match(/^(Base layers?|Outerwear|Bottoms?|Accessories|Footwear):/i)) {
      continue;
    }

    // If it's conversational (contains "you" or "your"), use it
    if (paragraph.toLowerCase().includes('you') || paragraph.toLowerCase().includes('your')) {
      return paragraph;
    }
  }

  // Fallback: use the entire text if it's reasonably short
  if (text.length < 500) {
    return text.trim();
  }

  // If all else fails, use the first paragraph
  return paragraphs[0] || text.trim();
}

export default {
  parseOllamaResponse,
  extractRecommendations,
  extractSpokenResponse,
};
