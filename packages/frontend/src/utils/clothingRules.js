/**
 * Clothing Rules Utility
 * Temperature-based and weather-condition-based recommendation logic
 */

import {
  TEMPERATURE_RANGES,
  PRECIPITATION_THRESHOLDS,
  WIND_THRESHOLDS,
  UV_THRESHOLDS,
} from './constants.js';

/**
 * Get base clothing recommendations based on temperature
 * @param {number} temperature - Temperature in Fahrenheit
 * @param {string} vocabularyStyle - 'girl-typical' or 'boy-typical'
 * @param {string} complexityLevel - 'simple', 'moderate', or 'complex'
 * @returns {Object} Base recommendations
 */
export function getTemperatureBasedClothing(temperature, vocabularyStyle, complexityLevel) {
  const isGirl = vocabularyStyle === 'girl-typical';
  const isSimple = complexityLevel === 'simple';

  if (temperature < TEMPERATURE_RANGES.COLD) {
    // Below 32°F: Heavy layers
    return {
      outerwear: ['Heavy winter coat'],
      baseLayers: isGirl
        ? ['Warm long sleeve shirt', isSimple ? 'Pull-on leggings' : 'Leggings', 'Warm socks']
        : ['Warm long sleeve shirt', isSimple ? 'Pull-on sweatpants' : 'Sweatpants', 'Warm socks'],
      accessories: ['Hat', isSimple ? 'Mittens' : 'Gloves', 'Scarf'],
      footwear: isSimple ? ['Boots with easy fasteners'] : ['Winter boots'],
      specialNotes: ["It's very cold today, dress warmly!"],
    };
  } else if (temperature < TEMPERATURE_RANGES.COOL) {
    // 32-45°F: Medium coat
    return {
      outerwear: ['Winter jacket'],
      baseLayers: isGirl
        ? ['Long sleeve shirt', isSimple ? 'Pull-on pants' : 'Pants']
        : ['Long sleeve shirt', isSimple ? 'Pull-on pants' : 'Jeans'],
      accessories: ['Hat', 'Gloves (optional)'],
      footwear: isSimple ? ['Sneakers with velcro'] : ['Sneakers'],
      specialNotes: ["It's chilly outside, wear your jacket!"],
    };
  } else if (temperature < TEMPERATURE_RANGES.MILD) {
    // 45-60°F: Light jacket
    return {
      outerwear: ['Light jacket or hoodie'],
      baseLayers: isGirl
        ? ['Long sleeve shirt or short sleeves with cardigan', isSimple ? 'Pull-on pants' : 'Pants or skirt']
        : ['Long sleeve shirt or short sleeve with hoodie', isSimple ? 'Pull-on pants' : 'Jeans or khakis'],
      accessories: [],
      footwear: isSimple ? ['Sneakers with velcro'] : ['Sneakers'],
      specialNotes: ["It's cool today, you might want a light jacket."],
    };
  } else if (temperature < TEMPERATURE_RANGES.WARM) {
    // 60-75°F: Comfortable
    return {
      outerwear: [],
      baseLayers: isGirl
        ? ['Short or long sleeve shirt', isSimple ? 'Pull-on pants' : 'Pants, skirt, or leggings']
        : ['T-shirt or polo shirt', isSimple ? 'Pull-on shorts' : 'Shorts or pants'],
      accessories: [],
      footwear: isSimple ? ['Sneakers or slip-on shoes'] : ['Sneakers or sandals'],
      specialNotes: ["The weather is nice today!"],
    };
  } else if (temperature < TEMPERATURE_RANGES.HOT) {
    // 75-85°F: Warm
    return {
      outerwear: [],
      baseLayers: isGirl
        ? ['Light t-shirt or tank top', isSimple ? 'Pull-on shorts' : 'Shorts, skirt, or sundress']
        : ['Light t-shirt', isSimple ? 'Pull-on shorts' : 'Shorts'],
      accessories: [],
      footwear: isSimple ? ['Sandals with easy straps'] : ['Sandals or sneakers'],
      specialNotes: ["It's warm today, wear something light!"],
    };
  } else {
    // Above 85°F: Very hot
    return {
      outerwear: [],
      baseLayers: isGirl
        ? ['Light, breathable t-shirt or tank top', isSimple ? 'Pull-on shorts' : 'Shorts or sundress']
        : ['Light, breathable t-shirt', isSimple ? 'Pull-on shorts' : 'Shorts'],
      accessories: ['Sun hat'],
      footwear: isSimple ? ['Sandals with easy straps'] : ['Sandals'],
      specialNotes: ["It's very hot today, stay cool and hydrated!"],
    };
  }
}

/**
 * Add precipitation-based recommendations
 * @param {Object} recommendations - Base recommendations object
 * @param {number} precipitationProbability - Percentage (0-100)
 * @param {boolean} isSimple - Whether to use simple fasteners
 * @returns {Object} Updated recommendations
 */
export function addPrecipitationRecommendations(recommendations, precipitationProbability, isSimple) {
  if (precipitationProbability > PRECIPITATION_THRESHOLDS.MODERATE) {
    // > 60%: Definitely bring rain gear
    recommendations.outerwear.unshift(isSimple ? 'Raincoat (easy-on)' : 'Raincoat');
    recommendations.accessories.push('Umbrella');
    recommendations.footwear = [isSimple ? 'Rain boots (easy-on)' : 'Rain boots or waterproof shoes'];
    recommendations.specialNotes.push("It's going to rain, so wear your raincoat and boots!");
  } else if (precipitationProbability > PRECIPITATION_THRESHOLDS.LOW) {
    // 30-60%: Might rain
    recommendations.specialNotes.push('There might be rain, bring an umbrella just in case.');
    recommendations.accessories.push('Umbrella (just in case)');
  }

  return recommendations;
}

/**
 * Add wind-based recommendations
 * @param {Object} recommendations - Base recommendations object
 * @param {number} windSpeed - Wind speed in mph
 * @param {number} temperature - Temperature in Fahrenheit
 * @param {boolean} isSimple - Whether to use simple fasteners
 * @returns {Object} Updated recommendations
 */
export function addWindRecommendations(recommendations, windSpeed, temperature, isSimple) {
  if (windSpeed > WIND_THRESHOLDS.MODERATE) {
    // > 20 mph: Strong wind
    if (temperature < TEMPERATURE_RANGES.MILD) {
      recommendations.accessories.push('Secure hat', isSimple ? 'Mittens' : 'Gloves');
      recommendations.specialNotes.push("It's windy and cold, make sure your hat won't blow away!");
    } else {
      recommendations.specialNotes.push("It's windy today, secure your hat!");
    }

    if (!recommendations.outerwear.some((item) => item.toLowerCase().includes('windbreaker'))) {
      recommendations.outerwear.push('Windbreaker (if you have one)');
    }
  } else if (windSpeed > WIND_THRESHOLDS.LIGHT) {
    // 10-20 mph: Moderate wind
    if (temperature < TEMPERATURE_RANGES.MILD) {
      recommendations.specialNotes.push("It's a bit windy, wear an extra layer.");
    }
  }

  return recommendations;
}

/**
 * Add UV/sun protection recommendations
 * @param {Object} recommendations - Base recommendations object
 * @param {number} uvIndex - UV index (0-11+)
 * @returns {Object} Updated recommendations
 */
export function addSunProtectionRecommendations(recommendations, uvIndex) {
  if (uvIndex >= UV_THRESHOLDS.HIGH) {
    // UV 6+: High sun protection needed
    recommendations.accessories.push('Sunglasses', 'Sun hat');
    recommendations.specialNotes.push('The sun is strong today, wear sunscreen and a hat!');
  } else if (uvIndex >= UV_THRESHOLDS.MODERATE) {
    // UV 3-5: Moderate sun protection
    recommendations.specialNotes.push('Apply sunscreen if you\'ll be outside for a while.');
  }

  return recommendations;
}

/**
 * Generate complete clothing recommendations
 * @param {Object} weatherData - Weather data snapshot
 * @param {Object} profile - User profile
 * @returns {Object} Complete recommendations
 */
export function generateClothingRecommendations(weatherData, profile) {
  const { temperature, precipitationProbability, windSpeed, uvIndex } = weatherData;
  const { vocabularyStyle, complexityLevel } = profile;
  const isSimple = complexityLevel === 'simple';

  // Start with temperature-based recommendations
  let recommendations = getTemperatureBasedClothing(temperature, vocabularyStyle, complexityLevel);

  // Add precipitation recommendations
  if (precipitationProbability) {
    recommendations = addPrecipitationRecommendations(
      recommendations,
      precipitationProbability,
      isSimple
    );
  }

  // Add wind recommendations
  if (windSpeed) {
    recommendations = addWindRecommendations(recommendations, windSpeed, temperature, isSimple);
  }

  // Add UV protection recommendations
  if (uvIndex !== undefined) {
    recommendations = addSunProtectionRecommendations(recommendations, uvIndex);
  }

  return recommendations;
}
