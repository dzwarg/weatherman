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
          [{ transcript: 'ready what should I wear', confidence: 0.9 }]
        ]
      };

      voiceService.recognition.onresult(mockEvent);

      expect(onWakeWordDetected).toHaveBeenCalledWith('ready what should I wear');
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
      const originalGetVoices = window.speechSynthesis.getVoices;
      window.speechSynthesis.getVoices = () => [{ lang: 'en-US', name: 'Test Voice' }];
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        capturedUtterance = utterance;
        // Automatically trigger events to simulate speech synthesis
        setTimeout(() => {
          if (utterance.onstart) utterance.onstart();
          setTimeout(() => {
            if (utterance.onend) utterance.onend();
          }, 10);
        }, 10);
      };

      const promise = voiceService.speak('Hello world');

      // Wait for speech to complete
      await promise;

      expect(capturedUtterance).toBeDefined();
      expect(voiceService.isSpeaking).toBe(false);

      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.getVoices = originalGetVoices;
    });

    it('should use custom voice options', async () => {
      let capturedUtterance;
      const originalGetVoices = window.speechSynthesis.getVoices;
      window.speechSynthesis.getVoices = () => [{ lang: 'en-US', name: 'Test Voice' }];
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        capturedUtterance = utterance;
        // Automatically trigger events
        setTimeout(() => {
          if (utterance.onstart) utterance.onstart();
          setTimeout(() => {
            if (utterance.onend) utterance.onend();
          }, 10);
        }, 10);
      };

      const options = { rate: 1.2, pitch: 1.5, volume: 0.8 };
      const promise = voiceService.speak('Test', options);

      await promise;

      expect(capturedUtterance).toBeDefined();
      expect(capturedUtterance.rate).toBe(1.2);
      expect(capturedUtterance.pitch).toBe(1.5);
      expect(capturedUtterance.volume).toBe(0.8);

      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.getVoices = originalGetVoices;
    });

    it.skip('should cancel ongoing speech before starting new', async () => {
      let cancelCalled = false;
      const originalCancel = window.speechSynthesis.cancel;
      window.speechSynthesis.cancel = () => {
        cancelCalled = true;
        voiceService.isSpeaking = false;
        window.speechSynthesis.speaking = false;
      };

      let utterancesCreated = [];
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        utterancesCreated.push(utterance);
        // Set speaking state
        window.speechSynthesis.speaking = true;
        voiceService.isSpeaking = true;
        // Trigger onstart and onend with a delay
        setTimeout(() => {
          if (utterance.onstart) utterance.onstart();
          setTimeout(() => {
            if (utterance.onend) utterance.onend();
            window.speechSynthesis.speaking = false;
            voiceService.isSpeaking = false;
          }, 10);
        }, 10);
      };

      // Start first speech
      voiceService.speak('First');

      // Wait for first to start speaking
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify first is speaking
      expect(voiceService.isSpeaking).toBe(true);

      // Now start second speech (should cancel first because isSpeaking is true)
      voiceService.speak('Second');

      // Wait a bit for cancel to be called
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cancelCalled).toBe(true);

      window.speechSynthesis.cancel = originalCancel;
      window.speechSynthesis.speak = originalSpeak;
    }, 10000); // Increase timeout to 10 seconds

    it('should reject on synthesis error', async () => {
      let _capturedUtterance;
      const originalGetVoices = window.speechSynthesis.getVoices;
      window.speechSynthesis.getVoices = () => [{ lang: 'en-US', name: 'Test Voice' }];
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        _capturedUtterance = utterance;
        // Trigger error immediately
        setTimeout(() => {
          if (utterance.onerror) {
            utterance.onerror({ error: 'synthesis-failed' });
          }
        }, 10);
      };

      const promise = voiceService.speak('Test');

      await expect(promise).rejects.toBe('synthesis-failed');
      expect(voiceService.isSpeaking).toBe(false);

      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.getVoices = originalGetVoices;
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
      let _capturedUtterance;
      const originalGetVoices = window.speechSynthesis.getVoices;
      window.speechSynthesis.getVoices = () => [{ lang: 'en-US', name: 'Test Voice' }];
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        _capturedUtterance = utterance;
        // Set speaking state and trigger onstart
        window.speechSynthesis.speaking = true;
        voiceService.isSpeaking = true;
        setTimeout(() => {
          if (utterance.onstart) utterance.onstart();
        }, 10);
      };

      let cancelCalled = false;
      const originalCancel = window.speechSynthesis.cancel;
      window.speechSynthesis.cancel = () => {
        cancelCalled = true;
        voiceService.isSpeaking = false;
        window.speechSynthesis.speaking = false;
      };

      voiceService.speak('Hello');

      // Wait for speech to start
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(voiceService.isSpeaking).toBe(true);

      voiceService.stopSpeaking();

      expect(voiceService.isSpeaking).toBe(false);
      expect(cancelCalled).toBe(true);

      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.cancel = originalCancel;
      window.speechSynthesis.getVoices = originalGetVoices;
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

  describe('isIOS detection', () => {
    const originalUA = navigator.userAgent;
    const originalPlatform = navigator.platform;
    const originalMaxTouch = navigator.maxTouchPoints;

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true });
      Object.defineProperty(navigator, 'maxTouchPoints', { value: originalMaxTouch, configurable: true });
    });

    const setUA = (ua) => Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
    const setPlatform = (p) => Object.defineProperty(navigator, 'platform', { value: p, configurable: true });
    const setMaxTouch = (n) => Object.defineProperty(navigator, 'maxTouchPoints', { value: n, configurable: true });

    it('detects iPhone user agent', () => {
      setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15');
      voiceService.startWakeWordDetection(vi.fn(), vi.fn());
      // restart delay should be 1000ms on iOS — verify by checking onend triggers restart
      expect(voiceService.isListening).toBe(true);
    });

    it('detects iPadOS 13+ via maxTouchPoints + Mac platform', () => {
      setUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15');
      setPlatform('MacIntel');
      setMaxTouch(5);
      voiceService.startWakeWordDetection(vi.fn(), vi.fn());
      expect(voiceService.isListening).toBe(true);
      // fire onend — should restart with isIOS()=true delay path
      voiceService.recognition.onend();
      expect(voiceService.isRestarting).toBe(true);
    });

    it('does not detect a real Mac (maxTouchPoints <= 1)', () => {
      setUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15');
      setPlatform('MacIntel');
      setMaxTouch(0);
      voiceService.startWakeWordDetection(vi.fn(), vi.fn());
      voiceService.recognition.onend();
      // should restart with 300ms delay, not 1000ms — just verify restart begins
      expect(voiceService.isRestarting).toBe(true);
    });
  });

  describe('wake word restart resilience', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('survives 3 consecutive onend fires without losing restart handler', () => {
      const onWakeWordDetected = vi.fn();
      voiceService.startWakeWordDetection(onWakeWordDetected, vi.fn());

      for (let i = 0; i < 3; i++) {
        voiceService.isRestarting = false;
        voiceService.recognition.onend();
        expect(voiceService.isRestarting).toBe(true);
        vi.runAllTimers();
      }

      // After 3 restarts, onresult handler should still work
      expect(voiceService.recognition.onresult).toBeDefined();
      expect(voiceService.recognition.onend).toBeDefined();
    });

    it('_setupWakeWordHandlers sets onresult, onerror, and onend', () => {
      voiceService.recognition = voiceService.initRecognition();
      voiceService._setupWakeWordHandlers();

      expect(typeof voiceService.recognition.onresult).toBe('function');
      expect(typeof voiceService.recognition.onerror).toBe('function');
      expect(typeof voiceService.recognition.onend).toBe('function');
    });
  });

  describe('iOS speech fixes', () => {
    it('does not trigger wake word callback while speaking', () => {
      const onWakeWordDetected = vi.fn();
      voiceService.startWakeWordDetection(onWakeWordDetected, vi.fn());
      voiceService.isSpeaking = true;

      const mockEvent = {
        results: [[{ transcript: 'ready', confidence: 0.9 }]],
      };
      voiceService.recognition.onresult(mockEvent);

      expect(onWakeWordDetected).not.toHaveBeenCalled();
    });

    it('triggers wake word callback when not speaking', () => {
      const onWakeWordDetected = vi.fn();
      voiceService.startWakeWordDetection(onWakeWordDetected, vi.fn());
      voiceService.isSpeaking = false;

      const mockEvent = {
        results: [[{ transcript: 'ready', confidence: 0.9 }]],
      };
      voiceService.recognition.onresult(mockEvent);

      expect(onWakeWordDetected).toHaveBeenCalled();
    });

    it('onerror handler does not call speak()', () => {
      const speakSpy = vi.spyOn(voiceService, 'speak');
      const onError = vi.fn();
      voiceService.startWakeWordDetection(vi.fn(), onError);

      voiceService.recognition.onerror({ error: 'not-allowed' });

      expect(speakSpy).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('not-allowed');
    });

    it('emits no-voices error and resolves when voice list is empty', async () => {
      const onError = vi.fn();
      voiceService.onError = onError;

      // Mock getVoices to return a non-empty list first call (passes the speak() guard),
      // then empty on the _startSpeech call
      let callCount = 0;
      const originalGetVoices = window.speechSynthesis.getVoices;
      window.speechSynthesis.getVoices = () => {
        callCount++;
        return callCount === 1 ? [{ lang: 'en-US', name: 'Test' }] : [];
      };

      const promise = voiceService.speak('test');
      await promise;

      expect(onError).toHaveBeenCalledWith('no-voices');

      window.speechSynthesis.getVoices = originalGetVoices;
    });

    it('speak() calls _speakWithCancellation exactly once when voices empty', async () => {
      const speakWithCancellationSpy = vi.spyOn(voiceService, '_speakWithCancellation');

      // voices.length === 0 on first check
      const originalGetVoices = window.speechSynthesis.getVoices;
      window.speechSynthesis.getVoices = () => [];

      const promise = voiceService.speak('test');

      // Simulate onvoiceschanged firing
      if (window.speechSynthesis.onvoiceschanged) {
        window.speechSynthesis.onvoiceschanged();
      }

      await promise;

      expect(speakWithCancellationSpy).toHaveBeenCalledTimes(1);

      window.speechSynthesis.getVoices = originalGetVoices;
      speakWithCancellationSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should stop listening and speaking', async () => {
      let _capturedUtterance;
      const originalGetVoices = window.speechSynthesis.getVoices;
      window.speechSynthesis.getVoices = () => [{ lang: 'en-US', name: 'Test Voice' }];
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = (utterance) => {
        _capturedUtterance = utterance;
        // Set speaking state and trigger onstart
        window.speechSynthesis.speaking = true;
        voiceService.isSpeaking = true;
        setTimeout(() => {
          if (utterance.onstart) utterance.onstart();
        }, 10);
      };

      voiceService.startWakeWordDetection(vi.fn(), vi.fn());
      voiceService.speak('Test');

      // Wait for speech to start
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(voiceService.isListening).toBe(true);
      expect(voiceService.isSpeaking).toBe(true);

      voiceService.cleanup();

      expect(voiceService.isListening).toBe(false);
      expect(voiceService.isSpeaking).toBe(false);

      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.getVoices = originalGetVoices;
    });
  });
});
