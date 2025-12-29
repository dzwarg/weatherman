/**
 * Home Page
 * Main application page with voice interaction and recommendations
 */

import { useState, useEffect } from 'react';
import { ProfileSelector } from '../components/profile/ProfileSelector.jsx';
import { WakeWordDetector } from '../components/voice/WakeWordDetector.jsx';
import { VoiceFeedback } from '../components/voice/VoiceFeedback.jsx';
import { RecommendationDisplay } from '../components/recommendation/RecommendationDisplay.jsx';
import { useProfile } from '../hooks/useProfile.js';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition.js';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';
import { useWeather } from '../hooks/useWeather.js';
import { useOfflineStatus } from '../hooks/useOfflineStatus.js';
import recommendationService from '../services/recommendationService.js';
import apiClient from '../services/apiClient.js';
import { isQueryInScope, getOutOfScopeMessage } from '../utils/voiceUtils.js';

export function Home() {
  const { activeProfile, allProfiles, selectProfile } = useProfile();
  const {
    isListening,
    isWaitingForWakeWord,
    error: voiceError,
    lastQuery,
    startWakeWordDetection,
    stopListening,
    clearQuery,
  } = useVoiceRecognition();
  const { speak } = useSpeechSynthesis();
  const { weather, fetchWeather } = useWeather();
  const { isOnline } = useOfflineStatus();
  const [recommendation, setRecommendation] = useState(null);
  const [voiceState, setVoiceState] = useState('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: 'Your Location',
          });
        },
        (error) => {
          // Provide user-friendly error messages
          const errorMessages = {
            1: 'Location permission was denied. Please enable location access to get weather for your area.',
            2: 'Unable to determine your location. Please try again.',
            3: 'Location request timed out. Please try again.',
          };

          const message =
            errorMessages[error.code] || 'Unable to get your location. Please try again.';
          reject(new Error(message));
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  // Process voice query
  useEffect(() => {
    if (!lastQuery || !activeProfile) return;

    const processQuery = async () => {
      // Check if query is in scope
      if (!isQueryInScope(lastQuery.rawTranscript)) {
        setVoiceState('speaking');
        const message = getOutOfScopeMessage();
        await speak(message);
        setVoiceState('idle');
        clearQuery();
        return;
      }

      try {
        setVoiceState('processing');
        setFeedbackMessage('Getting weather data...');

        // Get location
        const location = await getCurrentLocation();

        // Fetch weather
        setFeedbackMessage('Getting weather data...');
        const weatherData = await fetchWeather(location);

        setFeedbackMessage('Generating recommendation...');

        // Generate recommendation from server API
        let rec;
        try {
          // Try to get recommendation from server (Claude API or rules)
          const apiResponse = await apiClient.getRecommendations(
            activeProfile,
            weatherData.current,
            lastQuery.rawTranscript
          );
          rec = apiResponse;
        } catch (apiError) {
          console.warn('Server API failed, using local fallback:', apiError);
          // Fallback to local recommendation service if API fails
          rec = recommendationService.generateRecommendation(weatherData, activeProfile);
        }
        setRecommendation(rec);

        // Speak recommendation
        setVoiceState('speaking');
        setFeedbackMessage('Speaking recommendation...');
        await speak(rec.spokenResponse);

        setVoiceState('idle');
        setFeedbackMessage('');
      } catch (error) {
        console.error('Error processing query:', error);
        setVoiceState('error');
        setFeedbackMessage(error.message || 'Something went wrong');

        // Speak error message
        await speak("Sorry, I couldn't get the weather information. Please try again.");

        setTimeout(() => {
          setVoiceState('idle');
          setFeedbackMessage('');
        }, 3000);
      } finally {
        clearQuery();
      }
    };

    processQuery();
  }, [lastQuery, activeProfile, fetchWeather, speak, clearQuery]);

  // Update voice state based on listening status
  useEffect(() => {
    if (isListening) {
      setVoiceState('listening');
      setFeedbackMessage('Listening for your question...');
    } else if (isWaitingForWakeWord) {
      setVoiceState('idle');
      setFeedbackMessage('');
    }
  }, [isListening, isWaitingForWakeWord]);

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px',
    },
    title: {
      margin: '0 0 8px 0',
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#333',
    },
    subtitle: {
      margin: 0,
      fontSize: '18px',
      color: '#666',
    },
    offlineBanner: {
      padding: '12px 24px',
      marginBottom: '20px',
      borderRadius: '8px',
      backgroundColor: '#FFF3E0',
      border: '2px solid #FF9800',
      textAlign: 'center',
      color: '#E65100',
      fontWeight: 'bold',
    },
    section: {
      marginBottom: '32px',
    },
    card: {
      padding: '24px',
      borderRadius: '16px',
      backgroundColor: '#fff',
      border: '2px solid #E0E0E0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🌤️ Weatherman</h1>
        <p style={styles.subtitle}>Voice-Activated Weather Clothing Advisor</p>
      </header>

      {!isOnline && (
        <div style={styles.offlineBanner}>
          📵 You&apos;re offline - showing cached data
        </div>
      )}

      <div style={styles.section}>
        <ProfileSelector
          profiles={allProfiles}
          activeProfile={activeProfile}
          onSelectProfile={selectProfile}
        />
      </div>

      {activeProfile && (
        <>
          <div style={styles.section}>
            <div style={styles.card}>
              <WakeWordDetector
                isWaitingForWakeWord={isWaitingForWakeWord}
                isListening={isListening}
                onStart={startWakeWordDetection}
                onStop={stopListening}
              />
            </div>
          </div>

          {(isListening || voiceState !== 'idle' || voiceError) && (
            <div style={styles.section}>
              <VoiceFeedback
                state={voiceState}
                message={feedbackMessage}
                error={voiceError}
              />
            </div>
          )}

          {recommendation && (
            <div style={styles.section}>
              <RecommendationDisplay
                recommendation={recommendation}
                weather={weather}
              />
            </div>
          )}
        </>
      )}

      {!activeProfile && (
        <div style={styles.section}>
          <div style={styles.card}>
            <p style={{ textAlign: 'center', fontSize: '18px', color: '#666', margin: 0 }}>
              👆 Please select a profile above to get started!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
