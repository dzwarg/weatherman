/**
 * Integration tests for useProfile hook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfile } from './useProfile';

describe('useProfile hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with no active profile', () => {
    const { result } = renderHook(() => useProfile());

    expect(result.current.activeProfile).toBeNull();
    expect(result.current.hasProfile).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should return all predefined profiles', () => {
    const { result } = renderHook(() => useProfile());

    expect(result.current.allProfiles).toHaveLength(3);
    expect(result.current.allProfiles[0].age).toBe(4);
    expect(result.current.allProfiles[1].age).toBe(7);
    expect(result.current.allProfiles[2].age).toBe(10);
  });

  it('should select a profile', () => {
    const { result } = renderHook(() => useProfile());

    act(() => {
      result.current.selectProfile('7yo-boy');
    });

    expect(result.current.activeProfile).not.toBeNull();
    expect(result.current.activeProfile.id).toBe('7yo-boy');
    expect(result.current.activeProfile.age).toBe(7);
    expect(result.current.hasProfile).toBe(true);
  });

  it('should persist selected profile to localStorage', () => {
    const { result } = renderHook(() => useProfile());

    act(() => {
      result.current.selectProfile('4yo-girl');
    });

    // Create new hook instance to verify persistence
    const { result: result2 } = renderHook(() => useProfile());

    expect(result2.current.activeProfile).not.toBeNull();
    expect(result2.current.activeProfile.id).toBe('4yo-girl');
  });

  it('should clear active profile', () => {
    const { result } = renderHook(() => useProfile());

    act(() => {
      result.current.selectProfile('10yo-boy');
    });

    expect(result.current.activeProfile).not.toBeNull();

    act(() => {
      result.current.clearProfile();
    });

    expect(result.current.activeProfile).toBeNull();
    expect(result.current.hasProfile).toBe(false);
  });

  it('should handle invalid profile ID', () => {
    const { result } = renderHook(() => useProfile());

    act(() => {
      result.current.selectProfile('invalid-id');
    });

    expect(result.current.activeProfile).toBeNull();
  });

  it('should restore profile from localStorage on mount', () => {
    // Manually set profile in localStorage with proper JSON (full profile object)
    const profileData = {
      id: '7yo-boy',
      age: 7,
      gender: 'boy',
      complexityLevel: 'moderate',
      vocabularyStyle: 'boy-typical',
      displayName: '7 year old boy',
      createdAt: new Date().toISOString(),
      lastSelected: new Date().toISOString(),
    };
    localStorage.setItem('weatherbot:selectedProfile', JSON.stringify(profileData));

    const { result } = renderHook(() => useProfile());

    expect(result.current.activeProfile).not.toBeNull();
    expect(result.current.activeProfile.id).toBe('7yo-boy');
  });

  it('should handle corrupted localStorage data', () => {
    // Set invalid data in localStorage
    localStorage.setItem('weatherbot:selectedProfile', 'not-a-valid-profile');

    const { result } = renderHook(() => useProfile());

    expect(result.current.activeProfile).toBeNull();
  });
});
