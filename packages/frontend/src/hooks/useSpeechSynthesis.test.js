/**
 * Tests for useSpeechSynthesis hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import voiceService from '../services/voiceService';

vi.mock('../services/voiceService');

describe('useSpeechSynthesis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    voiceService.isSupported.mockReturnValue(true);
    voiceService.speak.mockResolvedValue();
    voiceService.stopSpeaking.mockImplementation(() => {});
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isSupported).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.queue).toEqual([]);
    });

    it('should detect when speech synthesis is not supported', () => {
      voiceService.isSupported.mockReturnValue(false);

      const { result } = renderHook(() => useSpeechSynthesis());

      expect(result.current.isSupported).toBe(false);
    });
  });

  describe('speak', () => {
    it('should speak text successfully', async () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.speak('Hello world');
      });

      expect(voiceService.speak).toHaveBeenCalledWith('Hello world', {});
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle empty text', async () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.speak('');
      });

      expect(voiceService.speak).not.toHaveBeenCalled();
    });

    it('should set isSpeaking to true during speech', async () => {
      let resolveSpeak;
      voiceService.speak.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveSpeak = resolve;
        });
      });

      const { result } = renderHook(() => useSpeechSynthesis());

      act(() => {
        result.current.speak('Hello');
      });

      await waitFor(() => {
        expect(result.current.isSpeaking).toBe(true);
      });

      await act(async () => {
        resolveSpeak();
      });

      await waitFor(() => {
        expect(result.current.isSpeaking).toBe(false);
      });
    });

    it('should handle speech errors', async () => {
      voiceService.speak.mockRejectedValue(new Error('Speech failed'));

      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.speak('Hello');
      });

      expect(result.current.error).toBe('Speech failed');
      expect(result.current.isSpeaking).toBe(false);
    });

    it('should pass options to voiceService', async () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      const options = { rate: 1.5, pitch: 1.2 };

      await act(async () => {
        await result.current.speak('Hello', options);
      });

      expect(voiceService.speak).toHaveBeenCalledWith('Hello', options);
    });
  });

  describe('stop', () => {
    it('should stop speaking and clear queue', async () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      // Add items to queue
      act(() => {
        result.current.addToQueue('Item 1');
        result.current.addToQueue('Item 2');
      });

      expect(result.current.queue).toHaveLength(2);

      // Stop
      act(() => {
        result.current.stop();
      });

      expect(voiceService.stopSpeaking).toHaveBeenCalled();
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.queue).toEqual([]);
    });
  });

  describe('queue management', () => {
    it('should add items to queue', () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      act(() => {
        result.current.addToQueue('First item');
        result.current.addToQueue('Second item');
        result.current.addToQueue('Third item');
      });

      expect(result.current.queue).toEqual(['First item', 'Second item', 'Third item']);
    });

    it('should process queue in order', async () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      act(() => {
        result.current.addToQueue('First');
        result.current.addToQueue('Second');
      });

      await act(async () => {
        await result.current.processQueue();
      });

      expect(voiceService.speak).toHaveBeenCalledTimes(2);
      expect(voiceService.speak).toHaveBeenNthCalledWith(1, 'First', {});
      expect(voiceService.speak).toHaveBeenNthCalledWith(2, 'Second', {});
      expect(result.current.queue).toEqual([]);
    });

    it('should not process empty queue', async () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.processQueue();
      });

      expect(voiceService.speak).not.toHaveBeenCalled();
    });

    it('should clear queue after processing', async () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      act(() => {
        result.current.addToQueue('Item 1');
        result.current.addToQueue('Item 2');
      });

      expect(result.current.queue).toHaveLength(2);

      await act(async () => {
        await result.current.processQueue();
      });

      expect(result.current.queue).toEqual([]);
    });
  });

  describe('error clearing', () => {
    it('should clear error when speaking again', async () => {
      voiceService.speak.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useSpeechSynthesis());

      // First speak fails
      await act(async () => {
        await result.current.speak('Hello');
      });
      expect(result.current.error).toBe('First error');

      // Second speak succeeds
      voiceService.speak.mockResolvedValueOnce();
      await act(async () => {
        await result.current.speak('World');
      });

      expect(result.current.error).toBeNull();
    });
  });
});
