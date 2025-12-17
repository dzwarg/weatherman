/**
 * useSpeechSynthesis Hook
 * Manages speech synthesis state and queue
 */

import { useState, useCallback } from 'react';
import voiceService from '../services/voiceService.js';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);

  /**
   * Speak text
   * @param {string} text - Text to speak
   * @param {Object} options - Voice options
   * @returns {Promise<void>}
   */
  const speak = useCallback(async (text, options = {}) => {
    if (!text) {
      return;
    }

    setIsSpeaking(true);
    setError(null);

    try {
      await voiceService.speak(text, options);
      setIsSpeaking(false);
    } catch (err) {
      setError(err.message || 'Speech synthesis error');
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Stop speaking
   */
  const stop = useCallback(() => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    setQueue([]);
  }, []);

  /**
   * Add text to queue
   * @param {string} text - Text to add
   */
  const addToQueue = useCallback((text) => {
    setQueue((prev) => [...prev, text]);
  }, []);

  /**
   * Process queue (speak all items in order)
   */
  const processQueue = useCallback(async () => {
    if (queue.length === 0) {
      return;
    }

    for (const text of queue) {
      await speak(text);
    }

    setQueue([]);
  }, [queue, speak]);

  return {
    isSpeaking,
    isSupported: voiceService.isSupported(),
    error,
    queue,
    speak,
    stop,
    addToQueue,
    processQueue,
  };
}
