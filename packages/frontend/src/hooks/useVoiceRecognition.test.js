/**
 * Tests for useVoiceRecognition hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecognition } from './useVoiceRecognition';
import voiceService from '../services/voiceService';
import { parseVoiceQuery } from '../utils/voiceUtils';

vi.mock('../services/voiceService');
vi.mock('../utils/voiceUtils');

describe('useVoiceRecognition', () => {
  let wakeWordCallback;
  let wakeWordErrorCallback;
  let listeningCallback;
  let listeningErrorCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    voiceService.isSupported.mockReturnValue(true);
    voiceService.cleanup.mockImplementation(() => {});
    voiceService.stopListening.mockImplementation(() => {});

    voiceService.startWakeWordDetection.mockImplementation((onSuccess, onError) => {
      wakeWordCallback = onSuccess;
      wakeWordErrorCallback = onError;
    });

    voiceService.startListening.mockImplementation((onSuccess, onError) => {
      listeningCallback = onSuccess;
      listeningErrorCallback = onError;
    });

    parseVoiceQuery.mockReturnValue({
      rawTranscript: 'test query',
      parsedIntent: 'clothing_advice',
      recognitionConfidence: 0.9,
      entities: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.isListening).toBe(false);
      expect(result.current.isWaitingForWakeWord).toBe(false);
      expect(result.current.isSupported).toBe(true);
      expect(result.current.voiceError).toBeNull();
      expect(result.current.lastQuery).toBeNull();
    });

    it('should detect when voice recognition is not supported', () => {
      voiceService.isSupported.mockReturnValue(false);

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.isSupported).toBe(false);
    });

    it('sets not-supported error on mount when speech APIs unavailable', () => {
      voiceService.isSupported.mockReturnValue(false);

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.voiceError).toEqual({ code: 'not-supported', isPermanent: true });
    });
  });

  describe('startWakeWordDetection', () => {
    it('should start wake word detection', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      expect(result.current.isWaitingForWakeWord).toBe(true);
      expect(result.current.voiceError).toBeNull();
      expect(voiceService.startWakeWordDetection).toHaveBeenCalled();
    });

    it('should handle unsupported browser', () => {
      voiceService.isSupported.mockReturnValue(false);

      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      expect(result.current.voiceError).toEqual({ code: 'not-supported', isPermanent: true });
      expect(result.current.isWaitingForWakeWord).toBe(false);
    });

    it('should transition to listening after wake word detected', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      expect(result.current.isWaitingForWakeWord).toBe(true);

      act(() => {
        wakeWordCallback();
      });

      expect(result.current.isWaitingForWakeWord).toBe(false);
      expect(result.current.isListening).toBe(true);
      expect(voiceService.startListening).toHaveBeenCalled();
    });

    it('should parse query after listening completes', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordCallback();
      });

      act(() => {
        listeningCallback({ transcript: 'what should I wear', confidence: 0.9 });
      });

      expect(parseVoiceQuery).toHaveBeenCalledWith('what should I wear', 0.9);
      expect(result.current.lastQuery).toBeDefined();
      expect(result.current.isListening).toBe(false);
    });

    it('should restart wake word detection after query', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordCallback();
      });

      act(() => {
        listeningCallback({ transcript: 'test', confidence: 0.9 });
      });

      act(() => {
        vi.advanceTimersByTime(15000);
      });

      expect(voiceService.startWakeWordDetection).toHaveBeenCalledTimes(2);
    });

    it('should handle wake word detection errors', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback('not-allowed');
      });

      expect(result.current.voiceError).toEqual({ code: 'not-allowed', isPermanent: false });
      expect(result.current.isWaitingForWakeWord).toBe(false);
    });

    it('should handle listening errors', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordCallback();
      });

      act(() => {
        listeningErrorCallback('network');
      });

      expect(result.current.voiceError).toEqual({ code: 'network', isPermanent: false });
      expect(result.current.isListening).toBe(false);
    });
  });

  describe('startManualListening', () => {
    it('should start manual listening without wake word', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startManualListening();
      });

      expect(result.current.isListening).toBe(true);
      expect(result.current.voiceError).toBeNull();
      expect(voiceService.startListening).toHaveBeenCalled();
    });

    it('should handle unsupported browser for manual listening', () => {
      voiceService.isSupported.mockReturnValue(false);

      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startManualListening();
      });

      expect(result.current.voiceError).toEqual({ code: 'not-supported', isPermanent: true });
      expect(result.current.isListening).toBe(false);
    });

    it('should parse query after manual listening completes', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startManualListening();
      });

      act(() => {
        listeningCallback({ transcript: 'manual query', confidence: 0.85 });
      });

      expect(parseVoiceQuery).toHaveBeenCalledWith('manual query', 0.85);
      expect(result.current.lastQuery).toBeDefined();
      expect(result.current.isListening).toBe(false);
    });

    it('should handle manual listening errors', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startManualListening();
      });

      act(() => {
        listeningErrorCallback('audio-capture');
      });

      expect(result.current.voiceError).toEqual({ code: 'audio-capture', isPermanent: false });
      expect(result.current.isListening).toBe(false);
    });
  });

  describe('stopListening', () => {
    it('should stop all voice recognition', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        result.current.stopListening();
      });

      expect(voiceService.stopListening).toHaveBeenCalled();
      expect(result.current.isListening).toBe(false);
      expect(result.current.isWaitingForWakeWord).toBe(false);
    });

    it('should stop during active listening', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startManualListening();
      });

      expect(result.current.isListening).toBe(true);

      act(() => {
        result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
    });
  });

  describe('clearQuery', () => {
    it('should clear last query', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startManualListening();
      });

      act(() => {
        listeningCallback({ transcript: 'test', confidence: 0.9 });
      });

      expect(result.current.lastQuery).not.toBeNull();

      act(() => {
        result.current.clearQuery();
      });

      expect(result.current.lastQuery).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear voiceError state', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback('network');
      });

      expect(result.current.voiceError).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.voiceError).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useVoiceRecognition());

      unmount();

      expect(voiceService.cleanup).toHaveBeenCalled();
    });
  });

  describe('structured error state', () => {
    it('sets voiceError.code for service error codes', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback('no-speech');
      });

      expect(result.current.voiceError?.code).toBe('no-speech');
      expect(result.current.voiceError?.isPermanent).toBe(false);
    });

    it('first not-allowed error is isPermanent: false', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback('not-allowed');
      });

      expect(result.current.voiceError).toEqual({ code: 'not-allowed', isPermanent: false });
    });

    it('consecutive not-allowed errors set isPermanent: true', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback('not-allowed');
      });

      act(() => {
        result.current.clearError();
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback('not-allowed');
      });

      expect(result.current.voiceError).toEqual({ code: 'not-allowed', isPermanent: true });
    });

    it('clears voiceError on new startWakeWordDetection', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback('network');
      });

      expect(result.current.voiceError).not.toBeNull();

      act(() => {
        result.current.startWakeWordDetection();
      });

      expect(result.current.voiceError).toBeNull();
    });

    it('ignores aborted errors silently', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback('aborted');
      });

      expect(result.current.voiceError).toBeNull();
    });
  });

  describe('background recovery (visibilitychange / pageshow)', () => {
    it('resumes wake word detection 800ms after returning from background', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      expect(voiceService.startWakeWordDetection).toHaveBeenCalledTimes(1);

      // Simulate going to background then returning
      act(() => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Should not restart immediately
      expect(voiceService.startWakeWordDetection).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(800);
      });

      expect(voiceService.startWakeWordDetection).toHaveBeenCalledTimes(2);
    });

    it('does not resume if not waiting for wake word', () => {
      renderHook(() => useVoiceRecognition());

      // Do NOT start wake word detection
      act(() => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        vi.advanceTimersByTime(800);
      });

      expect(voiceService.startWakeWordDetection).not.toHaveBeenCalled();
    });

    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const { unmount } = renderHook(() => useVoiceRecognition());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });
});
