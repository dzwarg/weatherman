/**
 * Tests for useOfflineStatus hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineStatus } from './useOfflineStatus';

describe('useOfflineStatus', () => {
  let onlineCallback;
  let offlineCallback;

  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Capture event listeners
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = vi.fn((event, callback) => {
      if (event === 'online') onlineCallback = callback;
      if (event === 'offline') offlineCallback = callback;
      originalAddEventListener.call(window, event, callback);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with online status', () => {
      const { result } = renderHook(() => useOfflineStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });

    it('should initialize with offline status when navigator is offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useOfflineStatus());

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });
  });

  describe('status changes', () => {
    it('should update to offline when connection is lost', () => {
      const { result } = renderHook(() => useOfflineStatus());

      expect(result.current.isOnline).toBe(true);

      // Simulate offline event
      act(() => {
        offlineCallback();
      });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });

    it('should update to online when connection is restored', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useOfflineStatus());

      expect(result.current.isOnline).toBe(false);

      // Simulate online event
      act(() => {
        onlineCallback();
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });

    it('should toggle between online and offline multiple times', () => {
      const { result } = renderHook(() => useOfflineStatus());

      // Go offline
      act(() => {
        offlineCallback();
      });
      expect(result.current.isOnline).toBe(false);

      // Go online
      act(() => {
        onlineCallback();
      });
      expect(result.current.isOnline).toBe(true);

      // Go offline again
      act(() => {
        offlineCallback();
      });
      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useOfflineStatus());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});
