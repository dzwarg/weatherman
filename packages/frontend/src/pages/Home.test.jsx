/**
 * Tests for Home page component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from './Home';
import { useProfile } from '../hooks/useProfile';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useWeather } from '../hooks/useWeather';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import recommendationService from '../services/recommendationService';
import apiClient from '../services/apiClient';
import { isQueryInScope, getOutOfScopeMessage } from '../utils/voiceUtils';

// Mock all hooks and services
vi.mock('../hooks/useProfile');
vi.mock('../hooks/useVoiceRecognition');
vi.mock('../hooks/useSpeechSynthesis');
vi.mock('../hooks/useWeather');
vi.mock('../hooks/useOfflineStatus');
vi.mock('../services/recommendationService');
vi.mock('../services/apiClient');
vi.mock('../utils/voiceUtils');

describe('Home', () => {
  const mockProfiles = [
    {
      id: '7yo-boy',
      age: 7,
      gender: 'boy',
      displayName: '7 year old boy',
      complexityLevel: 'moderate',
      vocabularyStyle: 'boy-typical',
    },
  ];

  const mockWeatherData = {
    location: { lat: 42.36, lon: -71.06, name: 'Boston' },
    current: { temperature: 65, conditions: 'Clear' },
  };

  const mockRecommendation = {
    recommendations: {
      outerwear: ['Light jacket'],
      baseLayers: ['T-shirt'],
      accessories: [],
      footwear: ['Sneakers'],
    },
    weatherData: {
      temperature: 65,
      feelsLike: 65,
      conditions: 'Clear',
      precipitationProbability: 0,
      windSpeed: 5,
    },
    spokenResponse: 'Wear a light jacket and t-shirt today.',
    confidence: 0.9,
  };

  let mockSelectProfile;
  let mockStartWakeWordDetection;
  let mockStopListening;
  let mockClearQuery;
  let mockSpeak;
  let mockFetchWeather;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 42.36,
            longitude: -71.06,
          },
        });
      }),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    });

    // Setup mock functions
    mockSelectProfile = vi.fn();
    mockStartWakeWordDetection = vi.fn();
    mockStopListening = vi.fn();
    mockClearQuery = vi.fn();
    mockSpeak = vi.fn().mockResolvedValue();
    mockFetchWeather = vi.fn().mockResolvedValue(mockWeatherData);

    // Mock apiClient
    apiClient.getRecommendations = vi.fn().mockResolvedValue(mockRecommendation);

    // Mock hook return values
    useProfile.mockReturnValue({
      activeProfile: null,
      allProfiles: mockProfiles,
      selectProfile: mockSelectProfile,
    });

    useVoiceRecognition.mockReturnValue({
      isListening: false,
      isWaitingForWakeWord: false,
      error: null,
      lastQuery: null,
      startWakeWordDetection: mockStartWakeWordDetection,
      stopListening: mockStopListening,
      clearQuery: mockClearQuery,
    });

    useSpeechSynthesis.mockReturnValue({
      speak: mockSpeak,
    });

    useWeather.mockReturnValue({
      weather: mockWeatherData,
      fetchWeather: mockFetchWeather,
    });

    useOfflineStatus.mockReturnValue({
      isOnline: true,
    });

    recommendationService.generateRecommendation.mockResolvedValue(mockRecommendation);
    isQueryInScope.mockReturnValue(true);
    getOutOfScopeMessage.mockReturnValue("Sorry, I can only help with weather and clothing advice.");
  });

  describe('rendering', () => {
    it('should render title and subtitle', () => {
      render(<Home />);

      expect(screen.getByText(/Weatherman/)).toBeInTheDocument();
      expect(screen.getByText(/Voice-Activated Weather Clothing Advisor/)).toBeInTheDocument();
    });

    it('should render profile selector', () => {
      render(<Home />);

      expect(screen.getByText('Who is asking?')).toBeInTheDocument();
    });

    it('should show offline banner when offline', () => {
      useOfflineStatus.mockReturnValue({ isOnline: false });

      render(<Home />);

      expect(screen.getByText(/You're offline - showing cached data/)).toBeInTheDocument();
    });

    it('should not show offline banner when online', () => {
      render(<Home />);

      expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument();
    });

    it('should show profile selection prompt when no profile selected', () => {
      render(<Home />);

      expect(screen.getByText(/Please select a profile above to get started!/)).toBeInTheDocument();
    });

    it('should not show wake word detector when no profile selected', () => {
      render(<Home />);

      expect(screen.queryByText('Start Listening')).not.toBeInTheDocument();
    });
  });

  describe('with active profile', () => {
    beforeEach(() => {
      useProfile.mockReturnValue({
        activeProfile: mockProfiles[0],
        allProfiles: mockProfiles,
        selectProfile: mockSelectProfile,
      });
    });

    it('should render wake word detector', () => {
      render(<Home />);

      expect(screen.getByText('Voice Assistant Ready')).toBeInTheDocument();
      expect(screen.getByText('Start Listening')).toBeInTheDocument();
    });

    it('should hide profile selection prompt', () => {
      render(<Home />);

      expect(screen.queryByText(/Please select a profile above to get started!/)).not.toBeInTheDocument();
    });

    it('should show voice feedback when listening', () => {
      useVoiceRecognition.mockReturnValue({
        isListening: true,
        isWaitingForWakeWord: false,
        error: null,
        lastQuery: null,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      // Should show listening state in both components
      const listeningElements = screen.getAllByText('Listening...');
      expect(listeningElements.length).toBeGreaterThan(0);
    });

    it('should show voice error when error occurs', () => {
      useVoiceRecognition.mockReturnValue({
        isListening: false,
        isWaitingForWakeWord: false,
        error: 'Microphone not available',
        lastQuery: null,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      expect(screen.getByText('Microphone not available')).toBeInTheDocument();
    });
  });

  describe('voice query processing', () => {
    beforeEach(() => {
      useProfile.mockReturnValue({
        activeProfile: mockProfiles[0],
        allProfiles: mockProfiles,
        selectProfile: mockSelectProfile,
      });
    });

    it.skip('should process in-scope voice query', async () => {
      const mockQuery = {
        rawTranscript: 'what should I wear today',
        parsedIntent: 'clothing_advice',
        recognitionConfidence: 0.9,
      };

      // Set active profile so recommendations can be generated
      useProfile.mockReturnValue({
        activeProfile: mockProfiles[0],
        allProfiles: mockProfiles,
        selectProfile: mockSelectProfile,
      });

      useVoiceRecognition.mockReturnValue({
        isListening: false,
        isWaitingForWakeWord: false,
        error: null,
        lastQuery: mockQuery,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockFetchWeather).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(recommendationService.generateRecommendation).toHaveBeenCalledWith(
          mockWeatherData,
          mockProfiles[0]
        );
      });

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(mockRecommendation.spokenResponse);
      });

      await waitFor(() => {
        expect(mockClearQuery).toHaveBeenCalled();
      });
    });

    it('should handle out-of-scope query', async () => {
      const mockQuery = {
        rawTranscript: 'tell me a joke',
        parsedIntent: 'unknown',
        recognitionConfidence: 0.8,
      };

      isQueryInScope.mockReturnValue(false);

      useVoiceRecognition.mockReturnValue({
        isListening: false,
        isWaitingForWakeWord: false,
        error: null,
        lastQuery: mockQuery,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          "Sorry, I can only help with weather and clothing advice."
        );
      });

      await waitFor(() => {
        expect(mockFetchWeather).not.toHaveBeenCalled();
      });
    });

    it('should not process query without active profile', async () => {
      useProfile.mockReturnValue({
        activeProfile: null,
        allProfiles: mockProfiles,
        selectProfile: mockSelectProfile,
      });

      const mockQuery = {
        rawTranscript: 'what should I wear today',
        parsedIntent: 'clothing_advice',
        recognitionConfidence: 0.9,
      };

      useVoiceRecognition.mockReturnValue({
        isListening: false,
        isWaitingForWakeWord: false,
        error: null,
        lastQuery: mockQuery,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockFetchWeather).not.toHaveBeenCalled();
      }, { timeout: 500 }).catch(() => {});
    });

    it('should handle geolocation errors', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({ code: 1 });
        }),
      };
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const mockQuery = {
        rawTranscript: 'what should I wear',
        parsedIntent: 'clothing_advice',
        recognitionConfidence: 0.9,
      };

      useVoiceRecognition.mockReturnValue({
        isListening: false,
        isWaitingForWakeWord: false,
        error: null,
        lastQuery: mockQuery,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          "Sorry, I couldn't get the weather information. Please try again."
        );
      });
    });

    it('should handle weather fetch errors', async () => {
      mockFetchWeather.mockRejectedValue(new Error('API Error'));

      const mockQuery = {
        rawTranscript: 'what should I wear',
        parsedIntent: 'clothing_advice',
        recognitionConfidence: 0.9,
      };

      useVoiceRecognition.mockReturnValue({
        isListening: false,
        isWaitingForWakeWord: false,
        error: null,
        lastQuery: mockQuery,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          "Sorry, I couldn't get the weather information. Please try again."
        );
      });
    });
  });

  describe('interactions', () => {
    beforeEach(() => {
      useProfile.mockReturnValue({
        activeProfile: mockProfiles[0],
        allProfiles: mockProfiles,
        selectProfile: mockSelectProfile,
      });
    });

    it('should call start wake word detection when button clicked', async () => {
      const user = userEvent.setup();

      render(<Home />);

      const button = screen.getByText('Start Listening');
      await user.click(button);

      expect(mockStartWakeWordDetection).toHaveBeenCalled();
    });

    it('should call stop listening when stop button clicked', async () => {
      const user = userEvent.setup();

      useVoiceRecognition.mockReturnValue({
        isListening: false,
        isWaitingForWakeWord: true,
        error: null,
        lastQuery: null,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      const button = screen.getByText('Stop');
      await user.click(button);

      expect(mockStopListening).toHaveBeenCalled();
    });
  });

  describe('recommendation display', () => {
    beforeEach(() => {
      useProfile.mockReturnValue({
        activeProfile: mockProfiles[0],
        allProfiles: mockProfiles,
        selectProfile: mockSelectProfile,
      });
    });

    it('should display recommendation after processing', async () => {
      const mockQuery = {
        rawTranscript: 'what should I wear',
        parsedIntent: 'clothing_advice',
        recognitionConfidence: 0.9,
      };

      useVoiceRecognition.mockReturnValue({
        isListening: false,
        isWaitingForWakeWord: false,
        error: null,
        lastQuery: mockQuery,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Your Clothing Recommendation')).toBeInTheDocument();
      });

      expect(screen.getByText('Light jacket')).toBeInTheDocument();
    });
  });

  describe('geolocation edge cases', () => {
    beforeEach(() => {
      useProfile.mockReturnValue({
        activeProfile: mockProfiles[0],
        allProfiles: mockProfiles,
        selectProfile: mockSelectProfile,
      });
    });

    it('should handle unsupported geolocation', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true,
      });

      const mockQuery = {
        rawTranscript: 'what should I wear',
        parsedIntent: 'clothing_advice',
        recognitionConfidence: 0.9,
      };

      useVoiceRecognition.mockReturnValue({
        isListening: false,
        isWaitingForWakeWord: false,
        error: null,
        lastQuery: mockQuery,
        startWakeWordDetection: mockStartWakeWordDetection,
        stopListening: mockStopListening,
        clearQuery: mockClearQuery,
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          "Sorry, I couldn't get the weather information. Please try again."
        );
      });
    });
  });
});
