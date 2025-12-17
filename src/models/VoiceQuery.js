/**
 * VoiceQuery Model
 * Parsed voice input from the child
 */

export class VoiceQuery {
  constructor({
    id = crypto.randomUUID(),
    rawTranscript,
    parsedIntent,
    entities = {},
    profileId = null,
    recognitionConfidence,
    timestamp = new Date().toISOString(),
    responseTime = null,
  }) {
    this.id = id;
    this.rawTranscript = rawTranscript;
    this.parsedIntent = parsedIntent;
    this.entities = entities;
    this.profileId = profileId;
    this.recognitionConfidence = recognitionConfidence;
    this.timestamp = timestamp;
    this.responseTime = responseTime;

    this.validate();
  }

  validate() {
    if (!this.rawTranscript || this.rawTranscript.trim().length === 0) {
      throw new Error('Raw transcript cannot be empty');
    }

    const validIntents = ['clothing_advice', 'weather_check', 'location_query'];
    if (!validIntents.includes(this.parsedIntent)) {
      throw new Error(`Invalid intent. Must be one of: ${validIntents.join(', ')}`);
    }

    if (this.recognitionConfidence < 0 || this.recognitionConfidence > 1) {
      throw new Error('Recognition confidence must be between 0.0 and 1.0');
    }

    if (this.responseTime !== null && this.responseTime > 10000) {
      console.warn(`Response time ${this.responseTime}ms exceeds 10 second target`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      rawTranscript: this.rawTranscript,
      parsedIntent: this.parsedIntent,
      entities: this.entities,
      profileId: this.profileId,
      recognitionConfidence: this.recognitionConfidence,
      timestamp: this.timestamp,
      responseTime: this.responseTime,
    };
  }

  static fromJSON(json) {
    return new VoiceQuery(json);
  }
}
