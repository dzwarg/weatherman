/**
 * Tests for voiceService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import voiceService from './voiceService';

describe('voiceService', () => {
  beforeEach(() => {
    // Reset the service state
    voiceService.isListening = false;
    voiceService.isSpeaking = false;
    voiceService.recognition = null;
    voiceService.onWakeWordDetected = null;
    voiceService.onResult = null;
    voiceService.onError = null;
    voiceService.onEnd = null;

    // Clear any existing mock calls
    vi.clearAllMocks();
  });

  afterEach(() => {
    voiceService.cleanup();
  });

  describe('isSupported', () => {
    it('should return true when speech APIs are available', () => {
      expect(voiceService.isSupported()).toBe(true);
    });

    it('should return false when SpeechRecognition is not available', () => {
      const originalRecognition = voiceService.SpeechRecognition;
      voiceService.SpeechRecognition = null;

      expect(voiceService.isSupported()).toBe(false);

      voiceService.SpeechRecognition = originalRecognition;
    });
  });

  describe('initRecognition', () => {
    it('should initialize recognition with correct settings', () => {
      const recognition = voiceService.initRecognition();

      expect(recognition).toBeDefined();
      expect(recognition.continuous).toBe(true);
      expect(recognition.interimResults).toBe(true);
      expect(recognition.lang).toBe('en-US');
      expect(recognition.maxAlternatives).toBe(1);
    });

    it('should throw error when SpeechRecognition not supported', () => {
      const originalRecognition = voiceService.SpeechRecognition;
      voiceService.SpeechRecognition = null;

      expect(() => voiceService.initRecognition()).toThrow('Speech recognition not supported');

      voiceService.SpeechRecognition = originalRecognition;
    });
  });

  describe('startWakeWordDetection', () => {
    it('should start listening for wake word', () => {
      const onWakeWordDetected = vi.fn();
      const onError = vi.fn();

      voiceService.startWakeWordDetection(onWakeWordDetected, onError);

      expect(voiceService.isListening).toBe(true);
      expect(voiceService.recognition).not.toBeNull();
    });

    it('should detect wake phrase in transcript', () => {
      const onWakeWordDetected = vi.fn();
      const onError = vi.fn();

      voiceService.startWakeWordDetection(onWakeWordDetected, onError);

      // Simulate recognition result with wake phrase
      const mockEvent = {
        results: [
          [{ transcript: 'good morning weatherbot what should I wear', confidence: 0.9 }]
        ]
      };

      voiceService.recognition.onresult(mockEvent);

      expect(onWakeWordDetected).toHaveBeenCalledWith('good morning weatherbot what should I wear');
    });

    it('should not trigger callback for non-wake-word transcript', () => {
      const onWakeWordDetected = vi.fn();
      const onError = vi.fn();

      voiceService.startWakeWordDetection(onWakeWordDetected, onError);

      const mockEvent = {
        results: [
          [{ transcript: 'hello there', confidence: 0.9 }]
        ]
      };

      voiceService.recognition.onresult(mockEvent);

      expect(onWakeWordDetected).not.toHaveBeenCalled();
    });

    it('should handle recognition errors', () => {
      const onWakeWordDetected = vi.fn();
      const onError = vi.fn();

      voiceService.startWakeWordDetection(onWakeWordDetected, onError);

      const mockError = { error: 'no-speech' };
      voiceService.recognition.onerror(mockError);

      expect(onError).toHaveBeenCalledWith('no-speech');
    });

    it('should not start if already listening', () => {
      const onWakeWordDetected = vi.fn();
      const onError = vi.fn();

      voiceService.startWakeWordDetection(onWakeWordDetected, onError);
      const firstRecognition = voiceService.recognition;

      voiceService.startWakeWordDetection(onWakeWordDetected, onError);
      const secondRecognition = voiceService.recognition;

      expect(firstRecognition).toBe(secondRecognition);
    });

    it('should handle not-supported browser', () => {
      const originalRecognition = voiceService.SpeechRecognition;
      voiceService.SpeechRecognition = null;

      const onWakeWordDetected = vi.fn();
      const onError = vi.fn();

      voiceService.startWakeWordDetection(onWakeWordDetected, onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(voiceService.isListening).toBe(false);

      voiceService.SpeechRecognition = originalRecognition;
    });
  });

  describe('startListening', () => {
    it('should start listening for query', () => {
      const onResult = vi.fn();
      const onError = vi.fn();

      voiceService.startListening(onResult, onError);

      expect(voiceService.isListening).toBe(true);
      expect(voiceService.recognition).not.toBeNull();
      expect(voiceService.recognition.continuous).toBe(false);
      expect(voiceService.recognition.interimResults).toBe(false);
    });

    it('should handle final result', () => {
      const onResult = vi.fn();
      const onError = vi.fn();

      voiceService.startListening(onResult, onError);

      const mockEvent = {
        results: [
          [{ transcript: 'what should I wear today', confidence: 0.95, isFinal: true }]
        ]
      };
      mockEvent.results[0].isFinal = true;

      voiceService.recognition.onresult(mockEvent);

      expect(onResult).toHaveBeenCalledWith({
        transcript: 'what should I wear today',
        confidence: 0.95,
        isFinal: true,
      });
    });

    it('should handle errors', () => {
      const onResult = vi.fn();
      const onError = vi.fn();

      voiceService.startListening(onResult, onError);

      const mockError = { error: 'network' };
      voiceService.recognition.onerror(mockError);

      expect(onError).toHaveBeenCalledWith('network');
    });

    it('should stop wake word detection when starting query listening', () => {
      // First start wake word detection
      voiceService.startWakeWordDetection(vi.fn(), vi.fn());
      expect(voiceService.isListening).toBe(true);

      // Then start query listening
      voiceService.startListening(vi.fn(), vi.fn());

      // Should have stopped and restarted
      expect(voiceService.isListening).toBe(true);
    });

    it('should handle not-supported browser', () => {
      const originalRecognition = voiceService.SpeechRecognition;
      voiceService.SpeechRecognition = null;

      const onResult = vi.fn();
      const onError = vi.fn();

      voiceService.startListening(onResult, onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));

      voiceService.SpeechRecognition = originalRecognition;
    });
  });

  describe('stopListening', () => {
    it('should stop recognition', () => {
      voiceService.startWakeWordDetection(vi.fn(), vi.fn());
      expect(voiceService.isListening).toBe(true);

      voiceService.stopListening();

      expect(voiceService.isListening).toBe(false);
    });

    it('should handle when not listening', () => {
      expect(() => voiceService.stopListening()).not.toThrow();
    });
  });

  describe('speak', () => {
    it('should speak text with default options', async () => {
      let capturedUtterance;
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        capturedUtterance = utterance;
      };

      const promise = voiceService.speak('Hello world');

      // Trigger onstart
      capturedUtterance.onstart();
      expect(voiceService.isSpeaking).toBe(true);

      // Trigger onend
      capturedUtterance.onend();
      await promise;

      expect(voiceService.isSpeaking).toBe(false);

      window.speechSynthesis.speak = originalSpeak;
    });

    it('should use custom voice options', async () => {
      let capturedUtterance;
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        capturedUtterance = utterance;
      };

      const options = { rate: 1.2, pitch: 1.5, volume: 0.8 };
      const promise = voiceService.speak('Test', options);

      expect(capturedUtterance.rate).toBe(1.2);
      expect(capturedUtterance.pitch).toBe(1.5);
      expect(capturedUtterance.volume).toBe(0.8);

      capturedUtterance.onend();
      await promise;

      window.speechSynthesis.speak = originalSpeak;
    });

    it('should cancel ongoing speech before starting new', async () => {
      let cancelCalled = false;
      const originalCancel = window.speechSynthesis.cancel;
      window.speechSynthesis.cancel = () => {
        cancelCalled = true;
      };

      let capturedUtterance;
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        capturedUtterance = utterance;
      };

      const promise1 = voiceService.speak('First');
      const promise2 = voiceService.speak('Second');

      expect(cancelCalled).toBe(true);

      capturedUtterance.onend();
      await promise2;

      window.speechSynthesis.cancel = originalCancel;
      window.speechSynthesis.speak = originalSpeak;
    });

    it('should reject on synthesis error', async () => {
      let capturedUtterance;
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        capturedUtterance = utterance;
      };

      const promise = voiceService.speak('Test');

      capturedUtterance.onerror({ error: 'synthesis-failed' });

      await expect(promise).rejects.toBe('synthesis-failed');
      expect(voiceService.isSpeaking).toBe(false);

      window.speechSynthesis.speak = originalSpeak;
    });

    it('should handle not-supported browser', async () => {
      const originalSynthesis = voiceService.SpeechSynthesis;
      voiceService.SpeechSynthesis = null;

      await expect(voiceService.speak('Test')).rejects.toThrow('Speech synthesis not supported');

      voiceService.SpeechSynthesis = originalSynthesis;
    });
  });

  describe('stopSpeaking', () => {
    it('should stop speaking', async () => {
      let capturedUtterance;
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        capturedUtterance = utterance;
      };

      let cancelCalled = false;
      const originalCancel = window.speechSynthesis.cancel;
      window.speechSynthesis.cancel = () => {
        cancelCalled = true;
      };

      const promise = voiceService.speak('Hello');

      capturedUtterance.onstart();
      expect(voiceService.isSpeaking).toBe(true);

      voiceService.stopSpeaking();

      expect(voiceService.isSpeaking).toBe(false);
      expect(cancelCalled).toBe(true);

      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.cancel = originalCancel;
    });

    it('should handle when not speaking', () => {
      expect(() => voiceService.stopSpeaking()).not.toThrow();
    });
  });

  describe('getVoices', () => {
    it('should return available voices', () => {
      const voices = voiceService.getVoices();
      expect(Array.isArray(voices)).toBe(true);
    });

    it('should return empty array when not supported', () => {
      const originalSynthesis = voiceService.SpeechSynthesis;
      voiceService.SpeechSynthesis = null;

      const voices = voiceService.getVoices();
      expect(voices).toEqual([]);

      voiceService.SpeechSynthesis = originalSynthesis;
    });
  });

  describe('cleanup', () => {
    it('should stop listening and speaking', async () => {
      let capturedUtterance;
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        capturedUtterance = utterance;
      };

      voiceService.startWakeWordDetection(vi.fn(), vi.fn());
      const promise = voiceService.speak('Test');

      capturedUtterance.onstart();

      expect(voiceService.isListening).toBe(true);
      expect(voiceService.isSpeaking).toBe(true);

      voiceService.cleanup();

      expect(voiceService.isListening).toBe(false);
      expect(voiceService.isSpeaking).toBe(false);

      window.speechSynthesis.speak = originalSpeak;
    });
  });
});
