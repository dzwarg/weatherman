/**
 * Prompt Analysis Service
 * Extracts context and keywords from voice prompts for personalized clothing recommendations
 */

// Common stop words to filter out
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
  'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'want',
]);

// Context keywords for different activities
const CONTEXT_KEYWORDS = {
  school: ['school', 'class', 'classroom', 'bus', 'teacher', 'homework', 'study'],
  outdoor: ['outside', 'park', 'playground', 'garden', 'yard', 'nature', 'trail', 'hike'],
  sports: [
    'soccer', 'football', 'basketball', 'baseball', 'practice', 'game', 'sport',
    'tennis', 'hockey', 'volleyball', 'running', 'exercise', 'gym',
  ],
  indoor: ['inside', 'indoors', 'home', 'house', 'room', 'building'],
  party: ['party', 'birthday', 'celebration', 'event', 'gathering', 'friend'],
};

/**
 * Analyze a voice prompt to extract keywords and context
 * @param {string} prompt - The voice prompt to analyze
 * @returns {Object} Analysis result with keywords and context
 */
export function analyzePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return {
      keywords: [],
      context: 'general',
    };
  }

  // Extract keywords
  const keywords = extractKeywords(prompt);

  // Determine context
  const context = determineContext(keywords);

  return {
    keywords,
    context,
  };
}

/**
 * Extract relevant keywords from text
 * @param {string} text - Text to extract keywords from
 * @returns {Array<string>} Array of keywords
 */
export function extractKeywords(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Convert to lowercase and split into words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 0);

  // Filter out stop words and return unique keywords
  const keywords = words.filter((word) => !STOP_WORDS.has(word));

  // Return unique keywords
  return [...new Set(keywords)];
}

/**
 * Extract timeframe from prompt
 * @param {string} prompt - The voice prompt
 * @returns {string} Timeframe: 'morning', 'afternoon', 'evening', or 'today'
 */
export function extractTimeframe(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return 'today';
  }

  const lowerPrompt = prompt.toLowerCase();

  // Check for explicit timeframe mentions
  if (lowerPrompt.includes('morning')) {
    return 'morning';
  }

  if (lowerPrompt.includes('afternoon')) {
    return 'afternoon';
  }

  if (lowerPrompt.includes('evening') || lowerPrompt.includes('tonight') || lowerPrompt.includes('night')) {
    return 'evening';
  }

  // Check for "now" or "right now" - determine current time
  if (lowerPrompt.includes('now') || lowerPrompt.includes('right now')) {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  // Default to "today"
  return 'today';
}

/**
 * Determine context from keywords
 * @param {Array<string>} keywords - Extracted keywords
 * @returns {string} Context category
 */
function determineContext(keywords) {
  if (!keywords || keywords.length === 0) {
    return 'general';
  }

  // Check each context category for matches
  for (const [context, contextKeywords] of Object.entries(CONTEXT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (contextKeywords.includes(keyword)) {
        return context;
      }
    }
  }

  return 'general';
}

export default {
  analyzePrompt,
  extractKeywords,
  extractTimeframe,
};
