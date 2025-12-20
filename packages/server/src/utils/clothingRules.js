/**
 * Clothing recommendation rules (fallback when Ollama unavailable)
 * Provides rule-based recommendations based on weather conditions
 */

/**
 * Get clothing recommendations based on profile and weather
 * @param {Object} request - Request containing profile and weather data
 * @returns {Object} Recommendation response
 */
export function getClothingRecommendations(request) {
  const { profile, weather } = request;
  const { temperature, conditions, precipitationProbability, uvIndex } = weather;

  const recommendations = {
    baseLayers: [],
    outerwear: [],
    bottoms: [],
    accessories: [],
    footwear: [],
  };

  // Temperature-based recommendations
  if (temperature < 40) {
    // Cold weather
    recommendations.baseLayers.push({
      item: 'Long-sleeve shirt or thermal',
      reason: 'To stay warm',
    });
    recommendations.outerwear.push({
      item: 'Warm winter coat',
      reason: "It's very cold outside",
    });
    recommendations.bottoms.push({
      item: profile.age <= 5 ? 'Pull-on pants or leggings' : 'Warm pants or jeans',
      reason: 'To keep your legs warm',
    });
    recommendations.accessories.push({
      item: 'Warm hat',
      reason: 'To keep your head warm',
    });
    recommendations.accessories.push({
      item: profile.age <= 5 ? 'Mittens' : 'Gloves',
      reason: 'To keep your hands warm',
    });
    recommendations.footwear.push({
      item: 'Warm boots',
      reason: 'To keep your feet warm',
    });
  } else if (temperature < 60) {
    // Cool weather
    recommendations.baseLayers.push({
      item: 'Long-sleeve shirt',
      reason: 'For comfort',
    });
    recommendations.outerwear.push({
      item: 'Light jacket or hoodie',
      reason: 'In case it gets cooler',
    });
    recommendations.bottoms.push({
      item: profile.gender === 'girl' ? 'Pants or leggings' : 'Pants or jeans',
      reason: 'Good for playing',
    });
    recommendations.footwear.push({
      item: 'Sneakers or closed-toe shoes',
      reason: 'Good for running around',
    });
  } else if (temperature < 75) {
    // Moderate weather
    recommendations.baseLayers.push({
      item: 'T-shirt',
      reason: "It's nice outside",
    });
    recommendations.bottoms.push({
      item: profile.gender === 'girl' ? 'Shorts, skirt, or capris' : 'Shorts or light pants',
      reason: 'Comfortable for the weather',
    });
    recommendations.footwear.push({
      item: 'Sneakers',
      reason: 'Perfect for playing',
    });
  } else {
    // Hot weather
    recommendations.baseLayers.push({
      item: 'Light t-shirt or tank top',
      reason: 'To stay cool',
    });
    recommendations.bottoms.push({
      item: 'Shorts',
      reason: "It's hot outside",
    });
    recommendations.footwear.push({
      item: 'Sandals or breathable sneakers',
      reason: 'To keep your feet cool',
    });
  }

  // Precipitation-based recommendations
  if (precipitationProbability > 50 || conditions?.toLowerCase().includes('rain')) {
    recommendations.outerwear.push({
      item: 'Raincoat or poncho',
      reason: 'To stay dry',
    });
    recommendations.accessories.push({
      item: 'Umbrella',
      reason: 'Protection from rain',
    });
    recommendations.footwear = [{
      item: 'Rain boots',
      reason: 'To keep your feet dry',
    }];
  }

  // UV-based recommendations
  if (uvIndex > 6) {
    recommendations.accessories.push({
      item: 'Sunglasses',
      reason: 'Protect your eyes from the sun',
    });
    recommendations.accessories.push({
      item: 'Hat with brim',
      reason: 'Sun protection',
    });
    recommendations.accessories.push({
      item: 'Sunscreen',
      reason: `The UV index is ${uvIndex} - sun protection is important!`,
    });
  } else if (uvIndex > 3) {
    recommendations.accessories.push({
      item: 'Sunscreen',
      reason: 'Some sun protection recommended',
    });
  }

  // Generate spoken response
  const spokenResponse = generateSpokenResponse(recommendations, weather, profile);

  return {
    id: `rule-based-${Date.now()}`,
    profileId: profile.id,
    weatherData: weather,
    recommendations,
    spokenResponse,
    confidence: 0.85, // Rule-based has slightly lower confidence
    createdAt: new Date().toISOString(),
    feedbackProvided: false,
  };
}

/**
 * Generate natural language spoken response
 */
function generateSpokenResponse(recommendations, weather, profile) {
  const parts = [];

  // Weather description
  if (weather.temperature < 40) {
    parts.push("It's cold outside!");
  } else if (weather.temperature < 60) {
    parts.push("It's a bit cool today.");
  } else if (weather.temperature < 75) {
    parts.push("It's a nice day!");
  } else {
    parts.push("It's hot today!");
  }

  // Main clothing items
  const mainItems = [];
  if (recommendations.baseLayers[0]) {
    mainItems.push(recommendations.baseLayers[0].item.toLowerCase());
  }
  if (recommendations.bottoms[0]) {
    mainItems.push(recommendations.bottoms[0].item.toLowerCase());
  }
  if (recommendations.footwear[0]) {
    mainItems.push(recommendations.footwear[0].item.toLowerCase());
  }

  if (mainItems.length > 0) {
    parts.push(`Wear ${mainItems.join(', ')}.`);
  }

  // Important accessories
  const importantAccessories = recommendations.accessories
    .filter(acc =>
      acc.item.toLowerCase().includes('umbrella') ||
      acc.item.toLowerCase().includes('sunscreen') ||
      acc.item.toLowerCase().includes('hat')
    )
    .map(acc => acc.item.toLowerCase());

  if (importantAccessories.length > 0) {
    parts.push(`Don't forget ${importantAccessories.join(', ')}!`);
  }

  return parts.join(' ');
}

export default { getClothingRecommendations };
