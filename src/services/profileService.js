/**
 * Profile Service
 * Manages user profile operations
 */

import storageService from './storageService.js';
import { UserProfile, PREDEFINED_PROFILES } from '../models/UserProfile.js';
import { STORAGE_KEYS } from '../utils/constants.js';

class ProfileService {
  /**
   * Get active user profile
   * @returns {UserProfile|null} Active profile or null
   */
  getActiveProfile() {
    const profileData = storageService.get(STORAGE_KEYS.SELECTED_PROFILE);
    if (!profileData) {
      return null;
    }

    try {
      return UserProfile.fromJSON(profileData);
    } catch (error) {
      console.error('Error parsing stored profile:', error);
      return null;
    }
  }

  /**
   * Set active user profile
   * @param {string} profileId - Profile ID to activate
   * @returns {UserProfile} Activated profile
   */
  setActiveProfile(profileId) {
    const profileData = PREDEFINED_PROFILES.find((p) => p.id === profileId);
    if (!profileData) {
      throw new Error(`Profile with ID "${profileId}" not found`);
    }

    const profile = new UserProfile({
      ...profileData,
      lastSelected: new Date().toISOString(),
    });

    storageService.set(STORAGE_KEYS.SELECTED_PROFILE, profile.toJSON());
    return profile;
  }

  /**
   * Get all available profiles
   * @returns {UserProfile[]} Array of all profiles
   */
  getAllProfiles() {
    return PREDEFINED_PROFILES.map((profileData) => new UserProfile(profileData));
  }

  /**
   * Clear active profile
   * @returns {boolean} Success status
   */
  clearActiveProfile() {
    return storageService.remove(STORAGE_KEYS.SELECTED_PROFILE);
  }

  /**
   * Check if a profile is currently active
   * @returns {boolean} True if a profile is active
   */
  hasActiveProfile() {
    return this.getActiveProfile() !== null;
  }
}

export default new ProfileService();
