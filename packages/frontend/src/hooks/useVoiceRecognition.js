/**
 * useVoiceRecognition Hook
 * Manages voice recognition state and wake word detection
 */

import { useState, useEffect, useCallback } from 'react';
import voiceService from '../services/voiceService.js';
import { parseVoiceQuery } from '../utils/voiceUtils.js';

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isWaitingForWakeWord, setIsWaitingForWakeWord] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState(null);

  /**
   * Start wake word detection
   */
  const startWakeWordDetection = useCallback(() => {
    if (!voiceService.isSupported()) {
      setError('Voice recognition is not supported in this browser');
      return;
    }

    setIsWaitingForWakeWord(true);
    setError(null);

    voiceService.startWakeWordDetection(
      () => {
        // Wake word detected - now listen for full query
        setIsWaitingForWakeWord(false);
        setIsListening(true);

        voiceService.startListening(
          (result) => {
            const parsed = parseVoiceQuery(result.transcript, result.confidence);
            setLastQuery(parsed);

            // IMPORTANT: Stop listening to free up the microphone for speech synthesis
            voiceService.stopListening();
            setIsListening(false);

            // Restart wake word detection after longer delay
            // This gives time for speech synthesis to play the response
            setTimeout(() => {
              startWakeWordDetection();
            }, 15000); // 15 seconds should be enough for most responses
          },
          (err) => {
            setError(err.message || 'Voice recognition error');
            voiceService.stopListening();
            setIsListening(false);
          }
        );
      },
      (err) => {
        setError(err.message || 'Wake word detection error');
        setIsWaitingForWakeWord(false);
      }
    );
  }, []);

  /**
   * Stop all voice recognition
   */
  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
    setIsWaitingForWakeWord(false);
  }, []);

  /**
   * Manually trigger listening (skip wake word)
   */
  const startManualListening = useCallback(() => {
    if (!voiceService.isSupported()) {
      setError('Voice recognition is not supported in this browser');
      return;
    }

    setIsListening(true);
    setError(null);

    voiceService.startListening(
      (result) => {
        const parsed = parseVoiceQuery(result.transcript, result.confidence);
        setLastQuery(parsed);
        setIsListening(false);
      },
      (err) => {
        setError(err.message || 'Voice recognition error');
        setIsListening(false);
      }
    );
  }, []);

  /**
   * Clear last query
   */
  const clearQuery = useCallback(() => {
    setLastQuery(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      voiceService.cleanup();
    };
  }, []);

  return {
    isListening,
    isWaitingForWakeWord,
    isSupported: voiceService.isSupported(),
    error,
    lastQuery,
    startWakeWordDetection,
    stopListening,
    startManualListening,
    clearQuery,
  };
}
