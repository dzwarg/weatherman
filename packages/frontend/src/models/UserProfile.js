/**
 * UserProfile Model
 * Represents a child's profile for personalized clothing recommendations
 */

export class UserProfile {
  constructor({
    id,
    age,
    gender,
    complexityLevel,
    vocabularyStyle,
    displayName,
    createdAt = new Date().toISOString(),
    lastSelected = null,
  }) {
    this.id = id;
    this.age = age;
    this.gender = gender;
    this.complexityLevel = complexityLevel;
    this.vocabularyStyle = vocabularyStyle;
    this.displayName = displayName;
    this.createdAt = createdAt;
    this.lastSelected = lastSelected;

    this.validate();
  }

  validate() {
    const validIds = ['4yo-girl', '7yo-boy', '10yo-boy'];
    if (!validIds.includes(this.id)) {
      throw new Error(`Invalid profile ID. Must be one of: ${validIds.join(', ')}`);
    }

    const validAges = [4, 7, 10];
    if (!validAges.includes(this.age)) {
      throw new Error(`Invalid age. Must be one of: ${validAges.join(', ')}`);
    }

    const validGenders = ['girl', 'boy'];
    if (!validGenders.includes(this.gender)) {
      throw new Error(`Invalid gender. Must be one of: ${validGenders.join(', ')}`);
    }

    const validComplexity = ['simple', 'moderate', 'complex'];
    if (!validComplexity.includes(this.complexityLevel)) {
      throw new Error(`Invalid complexity level. Must be one of: ${validComplexity.join(', ')}`);
    }

    // Validate complexity level matches age
    const expectedComplexity = this.age === 4 ? 'simple' : this.age === 7 ? 'moderate' : 'complex';
    if (this.complexityLevel !== expectedComplexity) {
      throw new Error(`Complexity level "${this.complexityLevel}" doesn't match age ${this.age}`);
    }

    const validVocabulary = ['girl-typical', 'boy-typical'];
    if (!validVocabulary.includes(this.vocabularyStyle)) {
      throw new Error(`Invalid vocabulary style. Must be one of: ${validVocabulary.join(', ')}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      age: this.age,
      gender: this.gender,
      complexityLevel: this.complexityLevel,
      vocabularyStyle: this.vocabularyStyle,
      displayName: this.displayName,
      createdAt: this.createdAt,
      lastSelected: this.lastSelected,
    };
  }

  static fromJSON(json) {
    return new UserProfile(json);
  }
}

// Predefined profiles (IDs match server format)
export const PREDEFINED_PROFILES = [
  {
    id: '4yo-girl',
    age: 4,
    gender: 'girl',
    complexityLevel: 'simple',
    vocabularyStyle: 'girl-typical',
    displayName: '4 year old girl',
  },
  {
    id: '7yo-boy',
    age: 7,
    gender: 'boy',
    complexityLevel: 'moderate',
    vocabularyStyle: 'boy-typical',
    displayName: '7 year old boy',
  },
  {
    id: '10yo-boy',
    age: 10,
    gender: 'boy',
    complexityLevel: 'complex',
    vocabularyStyle: 'boy-typical',
    displayName: '10 year old boy',
  },
];
