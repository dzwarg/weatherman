/**
 * Voice Service
 * Web Speech API wrapper for voice recognition and synthesis
 */

import { VOICE_CONFIG, WAKE_PHRASE } from '../utils/constants.js';
import { containsWakePhrase } from '../utils/voiceUtils.js';

class VoiceService {
  constructor() {
    // Check browser support
    this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.SpeechSynthesis = window.speechSynthesis;
    this.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.isRestarting = false;

    // Event handlers
    this.onWakeWordDetected = null;
    this.onResult = null;
    this.onError = null;
    this.onEnd = null;
  }

  /**
   * Check if browser supports speech recognition
   * @returns {boolean} True if supported
   */
  isSupported() {
    return !!(this.SpeechRecognition && this.SpeechSynthesis);
  }

  /**
   * Initialize speech recognition
   * @returns {Object} Recognition instance
   */
  initRecognition() {
    if (!this.SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const recognition = new this.SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = VOICE_CONFIG.LANGUAGE;
    recognition.maxAlternatives = 1;

    return recognition;
  }

  /**
   * Start listening for wake word
   * @param {Function} onWakeWordDetected - Callback when wake word detected
   * @param {Function} onError - Error callback
   */
  startWakeWordDetection(onWakeWordDetected, onError) {
    if (!this.isSupported()) {
      if (onError) {
        onError(new Error('Speech recognition not supported'));
      }
      return;
    }

    if (this.isListening) {
      console.warn('Already listening for wake word');
      return;
    }

    this.recognition = this.initRecognition();
    this.onWakeWordDetected = onWakeWordDetected;
    this.onError = onError;

    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;

      // Check for wake phrase
      if (containsWakePhrase(transcript)) {
        console.log('Wake word detected:', transcript);
        if (this.onWakeWordDetected) {
          this.onWakeWordDetected(transcript);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Wake word detection error:', event.error);

      // Handle microphone permission errors
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        const message =
          event.error === 'not-allowed'
            ? 'Microphone access was denied. Please enable it in your browser settings.'
            : 'I need permission to use your microphone. Please allow microphone access.';

        this.speak(message, { rate: 0.9, pitch: 1.1 });
      }

      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      // Restart if still should be listening
      if (this.isListening && !this.isRestarting) {
        this.isRestarting = true;
        // Add delay to ensure recognition has fully stopped
        setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch {
              // Silently skip restart errors - user can manually restart
              console.log('Recognition restart skipped, please restart manually');
              this.isListening = false;
            }
          }
          this.isRestarting = false;
        }, 300);
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('Started listening for wake phrase:', WAKE_PHRASE);
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Start listening for full query after wake word
   * @param {Function} onResult - Callback with final result
   * @param {Function} onError - Error callback
   */
  startListening(onResult, onError) {
    if (!this.isSupported()) {
      if (onError) {
        onError(new Error('Speech recognition not supported'));
      }
      return;
    }

    // Stop wake word detection
    if (this.recognition && this.isListening) {
      this.stopListening();
    }

    this.recognition = this.initRecognition();
    this.recognition.continuous = false; // Stop after one result
    this.recognition.interimResults = false; // Only final results
    this.onResult = onResult;
    this.onError = onError;

    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];

      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence;

        console.log('Voice query received:', transcript, 'confidence:', confidence);

        if (this.onResult) {
          this.onResult({
            transcript,
            confidence,
            isFinal: true,
          });
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      // Provide spoken guidance for common errors
      const errorMessages = {
        'no-speech': "I didn't hear anything. Please try saying the wake phrase again.",
        'audio-capture': 'I need permission to use your microphone. Please allow microphone access.',
        'not-allowed': 'Microphone access was denied. Please enable it in your browser settings.',
        'network': "I'm having trouble with the network. Please check your connection.",
        'aborted': 'Speech recognition was stopped. You can try again.',
      };

      const spokenMessage = errorMessages[event.error] ||
        "I'm having trouble understanding. Please try again.";

      // Speak the error message
      this.speak(spokenMessage, { rate: 0.9, pitch: 1.1 });

      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('Started listening for query');
    } catch (error) {
      console.error('Failed to start listening:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        console.log('Stopped listening');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }

  /**
   * Speak text with child-friendly voice parameters
   * @param {string} text - Text to speak
   * @param {Object} options - Voice options (rate, pitch, volume)
   * @returns {Promise<void>}
   */
  speak(text, options = {}) {
    console.log('[Speech] speak() called with text:', text);

    if (!this.SpeechSynthesis || !this.SpeechSynthesisUtterance) {
      console.error('Speech synthesis not supported');
      return Promise.reject(new Error('Speech synthesis not supported'));
    }

    return new Promise((resolve, reject) => {
      // Ensure voices are loaded (they load asynchronously in some browsers)
      const voices = this.SpeechSynthesis.getVoices();
      if (voices.length === 0) {
        console.log('[Speech] Voices not loaded yet, waiting...');
        // Wait for voices to load
        this.SpeechSynthesis.onvoiceschanged = () => {
          console.log('[Speech] Voices loaded, proceeding...');
          this._speakWithCancellation(text, options, resolve, reject);
        };
        // Also try after a timeout in case event doesn't fire
        setTimeout(() => {
          if (this.SpeechSynthesis.getVoices().length === 0) {
            console.warn('[Speech] No voices loaded after waiting, trying anyway...');
          }
          this._speakWithCancellation(text, options, resolve, reject);
        }, 100);
        return;
      }

      this._speakWithCancellation(text, options, resolve, reject);
    });
  }

  /**
   * Handle speech cancellation if needed
   * @private
   */
  _speakWithCancellation(text, options, resolve, reject) {
    // Cancel any ongoing speech and wait for it to complete
    if (this.SpeechSynthesis.speaking || this.isSpeaking) {
      console.log('[Speech] Canceling previous speech, waiting for it to stop...');
      this.SpeechSynthesis.cancel();

      // Wait for cancellation to complete before starting new speech
      setTimeout(() => {
        this._startSpeech(text, options, resolve, reject);
      }, 200);
      return;
    }

    this._startSpeech(text, options, resolve, reject);
  }

  /**
   * Internal method to start speech synthesis
   * @private
   */
  _startSpeech(text, options, resolve, reject) {
    console.log('[Speech] Creating utterance');
    const utterance = new this.SpeechSynthesisUtterance(text);

    // Apply child-friendly voice parameters
    utterance.rate = options.rate || VOICE_CONFIG.RATE;
    utterance.pitch = options.pitch || VOICE_CONFIG.PITCH;
    utterance.volume = options.volume || VOICE_CONFIG.VOLUME;
    utterance.lang = VOICE_CONFIG.LANGUAGE;

    // Explicitly select a voice (important for some browsers)
    const voices = this.SpeechSynthesis.getVoices();
    console.log('[Speech] Available voices:', voices.length);

    if (voices.length > 0) {
      // Prefer English voices
      const englishVoice = voices.find(v => v.lang.startsWith('en-'));
      if (englishVoice) {
        utterance.voice = englishVoice;
        console.log('[Speech] Selected voice:', englishVoice.name);
      } else {
        utterance.voice = voices[0];
        console.log('[Speech] Selected default voice:', voices[0].name);
      }
    } else {
      console.warn('[Speech] No voices available! Speech may not work.');
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      console.log('[Speech] ✓ onstart - Audio is playing');
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      console.log('[Speech] ✓ onend - Audio finished');
      resolve();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;

      // Ignore interrupted/canceled errors - these are expected when canceling previous speech
      if (event.error === 'interrupted' || event.error === 'canceled') {
        console.log('[Speech] Speech canceled:', event.error);
        resolve(); // Resolve instead of reject for expected cancellations
        return;
      }

      console.error('[Speech] Speech synthesis error:', event.error);
      reject(event.error);
    };

    try {
      console.log('[Speech] Calling SpeechSynthesis.speak()');
      console.log('[Speech] Speech synthesis state:', {
        speaking: this.SpeechSynthesis.speaking,
        pending: this.SpeechSynthesis.pending,
        paused: this.SpeechSynthesis.paused
      });

      this.SpeechSynthesis.speak(utterance);
      console.log('[Speech] speak() called successfully');

      // Check if speech actually starts within a reasonable time
      let didStart = false;
      const startCheckTimeout = setTimeout(() => {
        if (!didStart) {
          console.log('[Speech] Speech did not start immediately, force-starting...');
          this.SpeechSynthesis.pause();
          this.SpeechSynthesis.resume();
        }
      }, 500); // Reduced from 1000ms to 500ms for faster start

      // Override onstart to track if it fires
      const originalOnStart = utterance.onstart;
      utterance.onstart = () => {
        didStart = true;
        clearTimeout(startCheckTimeout);
        if (originalOnStart) originalOnStart.call(utterance);
      };
    } catch (error) {
      console.error('[Speech] Error calling speak():', error);
      this.isSpeaking = false;
      reject(error);
    }
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.SpeechSynthesis && this.isSpeaking) {
      this.SpeechSynthesis.cancel();
      this.isSpeaking = false;
      console.log('Stopped speaking');
    }
  }

  /**
   * Get available voices
   * @returns {Array} Available voices
   */
  getVoices() {
    if (this.SpeechSynthesis) {
      return this.SpeechSynthesis.getVoices();
    }
    return [];
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopListening();
    this.stopSpeaking();
  }
}

export default new VoiceService();
