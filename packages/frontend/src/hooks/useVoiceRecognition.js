/**
 * useVoiceRecognition Hook
 * Manages voice recognition state and wake word detection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import voiceService from '../services/voiceService.js';
import { parseVoiceQuery } from '../utils/voiceUtils.js';

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isWaitingForWakeWord, setIsWaitingForWakeWord] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [lastQuery, setLastQuery] = useState(null);
  const notAllowedCountRef = useRef(0);
  const isWaitingRef = useRef(false);

  const clearError = useCallback(() => {
    setVoiceError(null);
  }, []);

  const handleServiceError = useCallback((errorCode) => {
    if (errorCode === 'not-allowed') {
      notAllowedCountRef.current += 1;
      setVoiceError({
        code: 'not-allowed',
        isPermanent: notAllowedCountRef.current > 1,
      });
    } else if (errorCode === 'aborted') {
      // Ignore aborted — expected during normal stop/restart cycles
    } else {
      notAllowedCountRef.current = 0;
      setVoiceError({ code: errorCode, isPermanent: false });
    }
  }, []);

  /**
   * Start wake word detection
   */
  const startWakeWordDetection = useCallback(() => {
    if (!voiceService.isSupported()) {
      setVoiceError({ code: 'not-supported', isPermanent: true });
      return;
    }

    setIsWaitingForWakeWord(true);
    isWaitingRef.current = true;
    setVoiceError(null);

    voiceService.startWakeWordDetection(
      () => {
        // Wake word detected — reset consecutive error count on success
        notAllowedCountRef.current = 0;
        setIsWaitingForWakeWord(false);
        isWaitingRef.current = false;
        setIsListening(true);

        voiceService.startListening(
          (result) => {
            const parsed = parseVoiceQuery(result.transcript, result.confidence);
            setLastQuery(parsed);

            // Stop listening to free up the microphone for speech synthesis
            voiceService.stopListening();
            setIsListening(false);

            // Restart wake word detection after delay for speech synthesis to finish
            setTimeout(() => {
              startWakeWordDetection();
            }, 15000);
          },
          (err) => {
            handleServiceError(err.message || err);
            voiceService.stopListening();
            setIsListening(false);
          }
        );
      },
      (err) => {
        handleServiceError(err.message || err);
        setIsWaitingForWakeWord(false);
        isWaitingRef.current = false;
      }
    );
  }, [handleServiceError]);

  /**
   * Stop all voice recognition
   */
  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
    setIsWaitingForWakeWord(false);
    isWaitingRef.current = false;
  }, []);

  /**
   * Manually trigger listening (skip wake word)
   */
  const startManualListening = useCallback(() => {
    if (!voiceService.isSupported()) {
      setVoiceError({ code: 'not-supported', isPermanent: true });
      return;
    }

    setIsListening(true);
    setVoiceError(null);

    voiceService.startListening(
      (result) => {
        const parsed = parseVoiceQuery(result.transcript, result.confidence);
        setLastQuery(parsed);
        setIsListening(false);
      },
      (err) => {
        handleServiceError(err.message || err);
        setIsListening(false);
      }
    );
  }, [handleServiceError]);

  /**
   * Clear last query
   */
  const clearQuery = useCallback(() => {
    setLastQuery(null);
  }, []);

  /**
   * Show not-supported error on mount if speech APIs unavailable
   */
  useEffect(() => {
    if (!voiceService.isSupported()) {
      setVoiceError({ code: 'not-supported', isPermanent: true });
    }
  }, []);

  /**
   * Auto-resume wake word detection when returning from background (iOS)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isWaitingRef.current) {
        setTimeout(() => {
          if (isWaitingRef.current) {
            startWakeWordDetection();
          }
        }, 800);
      }
    };

    const handlePageShow = (e) => {
      if (e.persisted && isWaitingRef.current) {
        setTimeout(() => {
          if (isWaitingRef.current) {
            startWakeWordDetection();
          }
        }, 800);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [startWakeWordDetection]);

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
    voiceError,
    clearError,
    lastQuery,
    startWakeWordDetection,
    stopListening,
    startManualListening,
    clearQuery,
  };
}
