/**
 * ClothingRecommendation Model
 * Clothing suggestions based on weather and user profile
 */

export class ClothingRecommendation {
  constructor({
    id = crypto.randomUUID(),
    profileId,
    weatherData,
    recommendations,
    spokenResponse,
    confidence,
    createdAt = new Date().toISOString(),
    feedbackProvided = false,
  }) {
    this.id = id;
    this.profileId = profileId;
    this.weatherData = weatherData;
    this.recommendations = recommendations;
    this.spokenResponse = spokenResponse;
    this.confidence = confidence;
    this.createdAt = createdAt;
    this.feedbackProvided = feedbackProvided;

    this.validate();
  }

  validate() {
    if (!this.profileId) {
      throw new Error('Profile ID is required');
    }

    if (!this.weatherData || !this.weatherData.temperature) {
      throw new Error('Weather data with temperature is required');
    }

    if (this.weatherData.temperature < -100 || this.weatherData.temperature > 150) {
      throw new Error('Temperature must be between -100°F and 150°F');
    }

    if (this.weatherData.precipitationProbability !== undefined &&
        (this.weatherData.precipitationProbability < 0 || this.weatherData.precipitationProbability > 100)) {
      throw new Error('Precipitation probability must be between 0 and 100');
    }

    if (this.confidence < 0 || this.confidence > 1) {
      throw new Error('Confidence must be between 0.0 and 1.0');
    }

    if (!this.spokenResponse || this.spokenResponse.trim().length === 0) {
      throw new Error('Spoken response cannot be empty');
    }

    if (!this.recommendations) {
      throw new Error('Recommendations object is required');
    }

    // Validate at least one recommendation category has items
    const hasRecommendations = Object.values(this.recommendations).some(
      (category) => Array.isArray(category) && category.length > 0
    );

    if (!hasRecommendations) {
      throw new Error('At least one recommendation category must have items');
    }
  }

  toJSON() {
    return {
      id: this.id,
      profileId: this.profileId,
      weatherData: this.weatherData,
      recommendations: this.recommendations,
      spokenResponse: this.spokenResponse,
      confidence: this.confidence,
      createdAt: this.createdAt,
      feedbackProvided: this.feedbackProvided,
    };
  }

  static fromJSON(json) {
    return new ClothingRecommendation(json);
  }
}
