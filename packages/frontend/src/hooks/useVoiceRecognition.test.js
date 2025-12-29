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
      expect(result.current.error).toBeNull();
      expect(result.current.lastQuery).toBeNull();
    });

    it('should detect when voice recognition is not supported', () => {
      voiceService.isSupported.mockReturnValue(false);

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.isSupported).toBe(false);
    });
  });

  describe('startWakeWordDetection', () => {
    it('should start wake word detection', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      expect(result.current.isWaitingForWakeWord).toBe(true);
      expect(result.current.error).toBeNull();
      expect(voiceService.startWakeWordDetection).toHaveBeenCalled();
    });

    it('should handle unsupported browser', () => {
      voiceService.isSupported.mockReturnValue(false);

      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      expect(result.current.error).toBe('Voice recognition is not supported in this browser');
      expect(result.current.isWaitingForWakeWord).toBe(false);
    });

    it('should transition to listening after wake word detected', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      expect(result.current.isWaitingForWakeWord).toBe(true);

      // Simulate wake word detection
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

      // Wake word detected
      act(() => {
        wakeWordCallback();
      });

      // Query recognized
      act(() => {
        listeningCallback({ transcript: 'what should I wear', confidence: 0.9 });
      });

      expect(parseVoiceQuery).toHaveBeenCalledWith('what should I wear', 0.9);
      expect(result.current.lastQuery).toBeDefined();
      expect(result.current.isListening).toBe(false);
    });

    it('should restart wake word detection after query', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      const _startWakeWordSpy = vi.spyOn(result.current, 'startWakeWordDetection');

      act(() => {
        result.current.startWakeWordDetection();
      });

      // Wake word detected
      act(() => {
        wakeWordCallback();
      });

      // Query recognized
      act(() => {
        listeningCallback({ transcript: 'test', confidence: 0.9 });
      });

      // Advance timer
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Note: The callback is stored, so we check if startWakeWordDetection was called
      expect(voiceService.startWakeWordDetection).toHaveBeenCalledTimes(2);
    });

    it('should handle wake word detection errors', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback(new Error('Wake word error'));
      });

      expect(result.current.error).toBe('Wake word error');
      expect(result.current.isWaitingForWakeWord).toBe(false);
    });

    it('should handle listening errors', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      // Wake word detected
      act(() => {
        wakeWordCallback();
      });

      // Listening error
      act(() => {
        listeningErrorCallback(new Error('Recognition error'));
      });

      expect(result.current.error).toBe('Recognition error');
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
      expect(result.current.error).toBeNull();
      expect(voiceService.startListening).toHaveBeenCalled();
    });

    it('should handle unsupported browser for manual listening', () => {
      voiceService.isSupported.mockReturnValue(false);

      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startManualListening();
      });

      expect(result.current.error).toBe('Voice recognition is not supported in this browser');
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
        listeningErrorCallback(new Error('Manual error'));
      });

      expect(result.current.error).toBe('Manual error');
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

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useVoiceRecognition());

      unmount();

      expect(voiceService.cleanup).toHaveBeenCalled();
    });
  });

  describe('error messages', () => {
    it('should use default error message when error has no message', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startWakeWordDetection();
      });

      act(() => {
        wakeWordErrorCallback(new Error());
      });

      expect(result.current.error).toBe('Wake word detection error');
    });

    it('should clear error on successful operation', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startManualListening();
      });

      act(() => {
        listeningErrorCallback(new Error('Error'));
      });

      expect(result.current.error).toBe('Error');

      // Start again successfully
      act(() => {
        result.current.startManualListening();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
