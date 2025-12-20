/**
 * Recommendation request validator
 */

import { USER_PROFILES } from '../config/constants.js';

export function validateRecommendationRequest(request) {
  const errors = [];

  // Validate profile
  if (!request.profile) {
    errors.push('Profile is required');
  } else {
    if (!request.profile.id) {
      errors.push('Profile ID is required');
    } else {
      const validProfileIds = USER_PROFILES.map(p => p.id);
      if (!validProfileIds.includes(request.profile.id)) {
        errors.push(`Profile ID must be one of: ${validProfileIds.join(', ')}`);
      }
    }

    if (request.profile.age === undefined || request.profile.age === null) {
      errors.push('Profile age is required');
    } else if (typeof request.profile.age !== 'number') {
      errors.push('Profile age must be a number');
    }

    if (!request.profile.gender) {
      errors.push('Profile gender is required');
    } else if (!['girl', 'boy'].includes(request.profile.gender)) {
      errors.push('Profile gender must be either "girl" or "boy"');
    }
  }

  // Validate weather
  if (!request.weather) {
    errors.push('Weather data is required');
  } else {
    if (request.weather.temperature === undefined || request.weather.temperature === null) {
      errors.push('Weather temperature is required');
    } else if (typeof request.weather.temperature !== 'number') {
      errors.push('Weather temperature must be a number');
    } else if (request.weather.temperature < -100 || request.weather.temperature > 150) {
      errors.push('Weather temperature must be between -100 and 150');
    }

    if (!request.weather.conditions) {
      errors.push('Weather conditions are required');
    }
  }

  // Validate prompt (optional)
  if (request.prompt !== undefined && request.prompt !== null) {
    if (typeof request.prompt !== 'string') {
      errors.push('Prompt must be a string');
    } else if (request.prompt.length > 500) {
      errors.push('Prompt must be 500 characters or less');
    }
  }

  // Validate timeframe (optional)
  if (request.timeframe !== undefined) {
    const validTimeframes = ['morning', 'afternoon', 'evening', 'today'];
    if (!validTimeframes.includes(request.timeframe)) {
      errors.push(`Timeframe must be one of: ${validTimeframes.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export default validateRecommendationRequest;
