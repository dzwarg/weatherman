/**
 * useProfile Hook
 * Manages user profile selection
 */

import { useState, useEffect, useCallback } from 'react';
import profileService from '../services/profileService.js';

export function useProfile() {
  const [activeProfile, setActiveProfile] = useState(null);
  const [allProfiles] = useState(profileService.getAllProfiles());
  const [loading, setLoading] = useState(true);

  /**
   * Load active profile on mount
   */
  useEffect(() => {
    const profile = profileService.getActiveProfile();
    setActiveProfile(profile);
    setLoading(false);
  }, []);

  /**
   * Select a profile
   * @param {string} profileId - Profile ID to select
   */
  const selectProfile = useCallback((profileId) => {
    try {
      const profile = profileService.setActiveProfile(profileId);
      setActiveProfile(profile);
    } catch (error) {
      console.error('Error selecting profile:', error);
    }
  }, []);

  /**
   * Clear active profile
   */
  const clearProfile = useCallback(() => {
    profileService.clearActiveProfile();
    setActiveProfile(null);
  }, []);

  return {
    activeProfile,
    allProfiles,
    loading,
    hasProfile: !!activeProfile,
    selectProfile,
    clearProfile,
  };
}
