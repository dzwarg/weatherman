#!/usr/bin/env node

/**
 * Mock API server for E2E testing
 * Provides mock responses for weather and recommendations endpoints
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock weather data
const mockWeatherData = {
  temperature: 72,
  feelsLike: 70,
  condition: 'Clear',
  description: 'clear sky',
  humidity: 45,
  windSpeed: 8,
  precipitation: 0,
  location: 'Boston, MA',
  timestamp: new Date().toISOString()
};

// Mock recommendations data
const mockRecommendations = {
  baseLayers: [
    { item: 'Cotton t-shirt', reason: 'Comfortable for mild weather' }
  ],
  outerwear: [
    { item: 'Light jacket', reason: 'Good for slight chill' }
  ],
  bottoms: [
    { item: 'Jeans', reason: 'Versatile for current temperature' }
  ],
  accessories: [
    { item: 'Sunglasses', reason: 'Clear sunny conditions' }
  ],
  footwear: [
    { item: 'Sneakers', reason: 'Comfortable for dry weather' }
  ],
  summary: 'Perfect weather for light layers. A t-shirt with a light jacket should keep you comfortable.',
  profile: {
    id: '7yo-boy',
    age: 7,
    gender: 'boy'
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      weatherAPI: 'available',
      claudeAPI: 'available'
    }
  });
});

// Weather endpoint - current weather
app.post('/api/weather/current', (req, res) => {
  const { lat, lon } = req.body;

  // Validate input
  if (!lat || !lon) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Missing required parameters: lat, lon'
      }
    });
  }

  // Return mock weather data
  res.json({
    weather: {
      ...mockWeatherData,
      coordinates: { lat, lon }
    }
  });
});

// Recommendations endpoint
app.post('/api/recommendations', (req, res) => {
  const { weather, profile } = req.body;

  // Validate input
  if (!weather || !profile) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Missing required parameters: weather, profile'
      }
    });
  }

  // Validate profile ID
  const validProfiles = ['4yo-girl', '7yo-boy', '10yo-boy'];
  if (!validProfiles.includes(profile.id)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PROFILE',
        message: `Profile ID must be one of: ${validProfiles.join(', ')}`
      }
    });
  }

  // Return mock recommendations
  res.json({
    recommendations: {
      ...mockRecommendations,
      profile: profile
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  Mock API server running at http://localhost:${PORT}/`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Endpoints: /api/weather/current, /api/recommendations\n`);
});
