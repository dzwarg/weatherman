/**
 * Recommendation Service
 * Generates clothing recommendations based on weather and profile
 */

import { ClothingRecommendation } from '../models/ClothingRecommendation.js';
import { generateClothingRecommendations } from '../utils/clothingRules.js';

// Import mock data for development/testing
import mock4yoGirlColdRainy from '../mocks/ai/4yo-girl-cold-rainy.json';
import mock7yoBoyModerate from '../mocks/ai/7yo-boy-moderate.json';
import mock10yoBoyHotSunny from '../mocks/ai/10yo-boy-hot-sunny.json';

class RecommendationService {
  /**
   * Get mock Ollama response based on profile and weather
   * @param {Object} weatherData - Weather data snapshot
   * @param {Object} profile - User profile
   * @returns {Object|null} Mock recommendation or null
   */
  getMockAIResponse(weatherData, profile) {
    // Check if mock mode is enabled
    if (import.meta.env.VITE_USE_MOCK_AI !== 'true') {
      return null;
    }

    const temp = weatherData.current.temperature;
    const conditions = weatherData.current.conditions.toLowerCase();
    const isRainy = conditions.includes('rain') || weatherData.current.precipitationProbability > 60;

    // Match profile and weather to appropriate mock
    if (profile.id === '4yo-girl' && temp < 40 && isRainy) {
      return mock4yoGirlColdRainy;
    }

    if (profile.id === '7yo-boy' && temp >= 40 && temp <= 70) {
      return mock7yoBoyModerate;
    }

    if (profile.id === '10yo-boy' && temp > 70) {
      return mock10yoBoyHotSunny;
    }

    // Default: return first available mock for matching profile
    if (profile.id === '4yo-girl') return mock4yoGirlColdRainy;
    if (profile.id === '7yo-boy') return mock7yoBoyModerate;
    if (profile.id === '10yo-boy') return mock10yoBoyHotSunny;

    return null;
  }

  /**
   * Generate clothing recommendation
   * @param {Object} weatherData - Weather data snapshot
   * @param {Object} profile - User profile
   * @returns {ClothingRecommendation} Clothing recommendation
   */
  generateRecommendation(weatherData, profile) {
    // Check for mock Ollama response
    const mockResponse = this.getMockAIResponse(weatherData, profile);
    if (mockResponse) {
      return new ClothingRecommendation(mockResponse);
    }
    // Extract relevant weather info
    const weatherSnapshot = {
      temperature: weatherData.current.temperature,
      feelsLike: weatherData.current.feelsLike,
      conditions: weatherData.current.conditions,
      precipitationProbability: weatherData.current.precipitationProbability,
      windSpeed: weatherData.current.windSpeed,
      uvIndex: weatherData.current.uvIndex,
    };

    // Check for extreme weather conditions
    const extremeWeather = this.detectExtremeWeather(weatherSnapshot);
    if (extremeWeather) {
      return this.generateExtremeWeatherRecommendation(
        weatherSnapshot,
        extremeWeather,
        profile
      );
    }

    // Generate recommendations using clothing rules
    const recommendations = generateClothingRecommendations(weatherSnapshot, profile);

    // Handle conflicting weather conditions (e.g., sun and rain)
    this.handleConflictingConditions(weatherSnapshot, recommendations);

    // Generate spoken response
    const spokenResponse = this.generateSpokenResponse(
      weatherSnapshot,
      recommendations,
      profile
    );

    // Calculate confidence based on weather data quality
    const confidence = this.calculateConfidence(weatherData);

    // Create recommendation object
    return new ClothingRecommendation({
      profileId: profile.id,
      weatherData: weatherSnapshot,
      recommendations,
      spokenResponse,
      confidence,
    });
  }

  /**
   * Generate child-friendly spoken response
   * @param {Object} weather - Weather snapshot
   * @param {Object} recommendations - Clothing recommendations
   * @param {Object} profile - User profile
   * @returns {string} Spoken response text
   */
  generateSpokenResponse(weather, recommendations, _profile) {
    const parts = [];

    // Greeting
    parts.push('Good morning!');

    // Weather summary with child-friendly language
    const tempDescription = this.getTemperatureDescription(weather.temperature);
    parts.push(
      `It's ${tempDescription} today, ${weather.temperature} degrees${
        weather.feelsLike !== weather.temperature
          ? ` but feels like ${weather.feelsLike}`
          : ''
      }.`
    );

    // Weather conditions
    if (weather.conditions) {
      parts.push(`The weather is ${weather.conditions.toLowerCase()}.`);
    }

    // Main recommendations
    const mainItems = [];

    if (recommendations.outerwear.length > 0) {
      mainItems.push(this.formatList(recommendations.outerwear));
    }

    if (recommendations.baseLayers.length > 0) {
      mainItems.push(this.formatList(recommendations.baseLayers));
    }

    if (mainItems.length > 0) {
      parts.push(`You should wear ${mainItems.join(', and ')}.`);
    }

    // Footwear
    if (recommendations.footwear.length > 0) {
      parts.push(`For your feet, wear ${this.formatList(recommendations.footwear)}.`);
    }

    // Accessories
    if (recommendations.accessories.length > 0) {
      const accessoryList = this.formatList(recommendations.accessories);
      parts.push(`Don't forget ${accessoryList}!`);
    }

    // Special notes
    if (recommendations.specialNotes.length > 0) {
      parts.push(...recommendations.specialNotes);
    }

    // Encouragement
    parts.push('Have a great day!');

    return parts.join(' ');
  }

  /**
   * Get child-friendly temperature description
   * @param {number} temperature - Temperature in Fahrenheit
   * @returns {string} Description
   */
  getTemperatureDescription(temperature) {
    if (temperature < 32) return 'very cold';
    if (temperature < 45) return 'cold';
    if (temperature < 60) return 'chilly';
    if (temperature < 70) return 'nice';
    if (temperature < 80) return 'warm';
    if (temperature < 90) return 'hot';
    return 'very hot';
  }

  /**
   * Format list of items with proper grammar
   * @param {Array<string>} items - List of items
   * @returns {string} Formatted string
   */
  formatList(items) {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;

    const allButLast = items.slice(0, -1).join(', ');
    const last = items[items.length - 1];
    return `${allButLast}, and ${last}`;
  }

  /**
   * Calculate confidence score
   * @param {Object} weatherData - Weather data
   * @returns {number} Confidence (0-1)
   */
  calculateConfidence(weatherData) {
    let confidence = 1.0;

    // Reduce confidence if data is stale
    if (weatherData._isStale) {
      confidence -= 0.2;
    }

    // Reduce confidence if essential data is missing
    if (!weatherData.current.temperature) {
      confidence -= 0.3;
    }

    if (weatherData.current.precipitationProbability === undefined) {
      confidence -= 0.1;
    }

    if (weatherData.current.windSpeed === undefined) {
      confidence -= 0.1;
    }

    return Math.max(0.5, Math.min(1.0, confidence));
  }

  /**
   * Get recommendation for specific time of day
   * @param {Object} weatherData - Weather data with hourly forecast
   * @param {Object} profile - User profile
   * @param {string} timeOfDay - 'morning', 'afternoon', or 'evening'
   * @returns {ClothingRecommendation} Recommendation
   */
  getRecommendationForTime(weatherData, profile, _timeOfDay = 'morning') {
    // For now, use current weather
    // TODO: Use hourly forecast for specific times
    return this.generateRecommendation(weatherData, profile);
  }

  /**
   * Get recommendation for specific date
   * @param {Object} weatherData - Weather data with daily forecast
   * @param {Object} profile - User profile
   * @param {string} date - ISO date string (YYYY-MM-DD)
   * @returns {ClothingRecommendation} Recommendation
   */
  getRecommendationForDate(weatherData, profile, date) {
    const today = new Date().toISOString().split('T')[0];

    if (date === today) {
      return this.generateRecommendation(weatherData, profile);
    }

    // Find matching day in forecast
    const forecastDay = weatherData.dailyForecast.find((day) => day.date === date);

    if (!forecastDay) {
      throw new Error(`No forecast data available for ${date}`);
    }

    // Use forecast day's data
    const weatherSnapshot = {
      temperature: forecastDay.temperatureHigh,
      feelsLike: forecastDay.temperatureHigh,
      conditions: forecastDay.conditions,
      precipitationProbability: forecastDay.precipitationProbability,
      windSpeed: forecastDay.windSpeed,
      uvIndex: forecastDay.uvIndex,
    };

    const recommendations = generateClothingRecommendations(weatherSnapshot, profile);
    const spokenResponse = this.generateSpokenResponse(weatherSnapshot, recommendations, profile);
    const confidence = 0.8; // Lower confidence for future forecasts

    return new ClothingRecommendation({
      profileId: profile.id,
      weatherData: weatherSnapshot,
      recommendations,
      spokenResponse,
      confidence,
    });
  }

  /**
   * Detect extreme weather conditions
   * @param {Object} weather - Weather snapshot
   * @returns {string|null} Type of extreme weather or null
   */
  detectExtremeWeather(weather) {
    const { temperature, windSpeed, conditions } = weather;

    // Extreme cold
    if (temperature < 0) {
      return 'extreme-cold';
    }

    // Extreme heat
    if (temperature > 100) {
      return 'extreme-heat';
    }

    // Dangerous wind
    if (windSpeed > 45) {
      return 'high-winds';
    }

    // Severe storms
    const severeConditions = [
      'thunderstorm',
      'hurricane',
      'tornado',
      'severe',
      'blizzard',
      'ice storm',
    ];

    const conditionsLower = conditions.toLowerCase();
    if (severeConditions.some((condition) => conditionsLower.includes(condition))) {
      return 'severe-storm';
    }

    return null;
  }

  /**
   * Generate extreme weather recommendation
   * @param {Object} weather - Weather snapshot
   * @param {string} extremeType - Type of extreme weather
   * @param {Object} profile - User profile
   * @returns {ClothingRecommendation} Safety-focused recommendation
   */
  generateExtremeWeatherRecommendation(weather, extremeType, profile) {
    const recommendations = {
      outerwear: [],
      baseLayers: [],
      accessories: [],
      footwear: [],
      specialNotes: [],
    };

    const safetyMessages = {
      'extreme-cold': {
        message:
          'The weather is extremely cold today. It might be safer to stay indoors if possible.',
        items: [
          'Heavy winter coat',
          'Warm layers underneath',
          'Insulated snow boots',
          'Warm hat that covers ears',
          'Insulated gloves',
          'Scarf to cover face',
        ],
      },
      'extreme-heat': {
        message:
          'The weather is very hot today. Try to stay indoors during the hottest part of the day.',
        items: [
          'Light, breathable clothing',
          'Wide-brimmed hat',
          'Sunglasses',
          'Sunscreen',
          'Plenty of water',
        ],
      },
      'high-winds': {
        message: 'Very strong winds today. Be careful outside and hold on to hats!',
        items: ['Secure jacket with zipper', 'No loose clothing', 'Sturdy shoes'],
      },
      'severe-storm': {
        message: 'There is severe weather today. It is safest to stay indoors.',
        items: ['Stay inside', 'Emergency kit ready', 'Follow weather alerts'],
      },
    };

    const safety = safetyMessages[extremeType];
    recommendations.specialNotes.push(safety.message);

    const spokenResponse = `Important safety message: ${safety.message} ${safety.items.join(', ')}.`;

    return new ClothingRecommendation({
      profileId: profile.id,
      weatherData: weather,
      recommendations,
      spokenResponse,
      confidence: 1.0,
    });
  }

  /**
   * Handle conflicting weather conditions
   * @param {Object} weather - Weather snapshot
   * @param {Object} recommendations - Clothing recommendations to modify
   */
  handleConflictingConditions(weather, recommendations) {
    const { temperature, precipitationProbability, conditions } = weather;

    // Check for mixed conditions: sunny but high chance of rain
    const isSunny = conditions.toLowerCase().includes('clear') ||
                    conditions.toLowerCase().includes('sunny');
    const willRain = precipitationProbability > 50;

    if (isSunny && willRain) {
      recommendations.specialNotes.push(
        'The weather might change! It looks sunny now but rain is likely later.'
      );

      // Add layered approach
      if (!recommendations.accessories.includes('Umbrella')) {
        recommendations.accessories.push('Umbrella');
      }
    }

    // Warm but windy
    if (temperature > 70 && weather.windSpeed > 15) {
      recommendations.specialNotes.push(
        'It\'s warm but windy. You might want a light jacket that\'s easy to take off.'
      );
    }

    // Cold but sunny (UV protection still needed)
    if (temperature < 50 && weather.uvIndex > 5) {
      if (!recommendations.accessories.includes('Sunglasses')) {
        recommendations.accessories.push('Sunglasses');
      }
      recommendations.specialNotes.push(
        'Even though it\'s cold, the sun is strong. Protect your eyes!'
      );
    }
  }
}

export default new RecommendationService();
