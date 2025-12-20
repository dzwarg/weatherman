/**
 * Tests for RecommendationDisplay component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecommendationDisplay } from './RecommendationDisplay';

describe('RecommendationDisplay', () => {
  const mockRecommendation = {
    recommendations: {
      outerwear: ['Light jacket', 'Windbreaker'],
      baseLayers: ['T-shirt', 'Long pants'],
      accessories: ['Sunglasses', 'Hat'],
      footwear: ['Sneakers'],
    },
    weatherData: {
      temperature: 65,
      feelsLike: 63,
      conditions: 'Partly cloudy',
      precipitationProbability: 20,
      windSpeed: 12,
    },
    spokenResponse: 'It\'s nice outside! Wear a light jacket and comfortable clothes.',
    confidence: 0.85,
  };

  describe('rendering', () => {
    it('should render nothing when no recommendation provided', () => {
      const { container } = render(<RecommendationDisplay recommendation={null} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render title', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText('Your Clothing Recommendation')).toBeInTheDocument();
    });
  });

  describe('weather display', () => {
    it('should display temperature', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/65°F/)).toBeInTheDocument();
    });

    it('should display feels like temperature when different', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/feels like 63°F/)).toBeInTheDocument();
    });

    it('should not display feels like when same as temperature', () => {
      const recommendation = {
        ...mockRecommendation,
        weatherData: {
          ...mockRecommendation.weatherData,
          feelsLike: 65,
        },
      };

      render(<RecommendationDisplay recommendation={recommendation} />);

      const weatherText = screen.getByText(/65°F/);
      expect(weatherText.textContent).not.toContain('feels like');
    });

    it('should display conditions', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/Partly cloudy/i)).toBeInTheDocument();
    });

    it('should display precipitation probability when greater than 0', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/20% chance of rain/)).toBeInTheDocument();
    });

    it('should not display precipitation when 0', () => {
      const recommendation = {
        ...mockRecommendation,
        weatherData: {
          ...mockRecommendation.weatherData,
          precipitationProbability: 0,
        },
      };

      render(<RecommendationDisplay recommendation={recommendation} />);

      expect(screen.queryByText(/chance of rain/)).not.toBeInTheDocument();
    });

    it('should display wind speed when greater than 10 mph', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/12 mph wind/)).toBeInTheDocument();
    });

    it('should not display wind when 10 mph or less', () => {
      const recommendation = {
        ...mockRecommendation,
        weatherData: {
          ...mockRecommendation.weatherData,
          windSpeed: 8,
        },
      };

      render(<RecommendationDisplay recommendation={recommendation} />);

      expect(screen.queryByText(/mph wind/)).not.toBeInTheDocument();
    });
  });

  describe('clothing categories', () => {
    it('should display outerwear category', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/Outerwear/)).toBeInTheDocument();
      expect(screen.getByText('Light jacket')).toBeInTheDocument();
      expect(screen.getByText('Windbreaker')).toBeInTheDocument();
    });

    it('should display base layers category', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/Base Layers/)).toBeInTheDocument();
      expect(screen.getByText('T-shirt')).toBeInTheDocument();
      expect(screen.getByText('Long pants')).toBeInTheDocument();
    });

    it('should display accessories category', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/Accessories/)).toBeInTheDocument();
      expect(screen.getByText('Sunglasses')).toBeInTheDocument();
      expect(screen.getByText('Hat')).toBeInTheDocument();
    });

    it('should display footwear category', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/Footwear/)).toBeInTheDocument();
      expect(screen.getByText('Sneakers')).toBeInTheDocument();
    });

    it('should not display categories with no items', () => {
      const recommendation = {
        ...mockRecommendation,
        recommendations: {
          outerwear: ['Jacket'],
          baseLayers: [],
          accessories: [],
          footwear: [],
        },
      };

      render(<RecommendationDisplay recommendation={recommendation} />);

      expect(screen.getByText(/Outerwear/)).toBeInTheDocument();
      expect(screen.queryByText(/Base Layers/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Accessories/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Footwear/)).not.toBeInTheDocument();
    });

    it('should display category icons', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      // Icons are rendered with category names
      expect(screen.getByText(/🧥.*Outerwear/)).toBeInTheDocument();
      expect(screen.getByText(/👕.*Base Layers/)).toBeInTheDocument();
      expect(screen.getByText(/🧤.*Accessories/)).toBeInTheDocument();
      expect(screen.getByText(/👟.*Footwear/)).toBeInTheDocument();
    });
  });

  describe('special notes', () => {
    it('should display special notes when provided', () => {
      const recommendation = {
        ...mockRecommendation,
        recommendations: {
          ...mockRecommendation.recommendations,
          specialNotes: ['UV index is high, use sunscreen', 'Bring an umbrella just in case'],
        },
      };

      render(<RecommendationDisplay recommendation={recommendation} />);

      expect(screen.getByText(/Important Notes/)).toBeInTheDocument();
      expect(screen.getByText('UV index is high, use sunscreen')).toBeInTheDocument();
      expect(screen.getByText('Bring an umbrella just in case')).toBeInTheDocument();
    });

    it('should not display notes section when no notes', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.queryByText(/Important Notes/)).not.toBeInTheDocument();
    });

    it('should not display notes section when notes array is empty', () => {
      const recommendation = {
        ...mockRecommendation,
        recommendations: {
          ...mockRecommendation.recommendations,
          specialNotes: [],
        },
      };

      render(<RecommendationDisplay recommendation={recommendation} />);

      expect(screen.queryByText(/Important Notes/)).not.toBeInTheDocument();
    });
  });

  describe('spoken response', () => {
    it('should display spoken response', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/What I would say:/)).toBeInTheDocument();
      expect(
        screen.getByText(/It's nice outside! Wear a light jacket and comfortable clothes./)
      ).toBeInTheDocument();
    });

    it('should display confidence', () => {
      render(<RecommendationDisplay recommendation={mockRecommendation} />);

      expect(screen.getByText(/Confidence: 85%/)).toBeInTheDocument();
    });

    it('should display different confidence levels', () => {
      const lowConfidence = {
        ...mockRecommendation,
        confidence: 0.55,
      };

      render(<RecommendationDisplay recommendation={lowConfidence} />);

      expect(screen.getByText(/Confidence: 55%/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle recommendation with minimal data', () => {
      const minimalRecommendation = {
        recommendations: {
          outerwear: ['Jacket'],
        },
        weatherData: {
          temperature: 50,
          feelsLike: 50,
          conditions: 'Clear',
          precipitationProbability: 0,
          windSpeed: 5,
        },
        spokenResponse: 'Simple response',
        confidence: 0.9,
      };

      render(<RecommendationDisplay recommendation={minimalRecommendation} />);

      expect(screen.getByText('Your Clothing Recommendation')).toBeInTheDocument();
      expect(screen.getByText('Jacket')).toBeInTheDocument();
      expect(screen.getByText(/Simple response/)).toBeInTheDocument();
    });

    it('should handle high confidence', () => {
      const highConfidence = {
        ...mockRecommendation,
        confidence: 0.95,
      };

      render(<RecommendationDisplay recommendation={highConfidence} />);

      expect(screen.getByText(/Confidence: 95%/)).toBeInTheDocument();
    });

    it('should handle medium confidence', () => {
      const mediumConfidence = {
        ...mockRecommendation,
        confidence: 0.7,
      };

      render(<RecommendationDisplay recommendation={mediumConfidence} />);

      expect(screen.getByText(/Confidence: 70%/)).toBeInTheDocument();
    });

    it('should handle low confidence', () => {
      const lowConfidence = {
        ...mockRecommendation,
        confidence: 0.5,
      };

      render(<RecommendationDisplay recommendation={lowConfidence} />);

      expect(screen.getByText(/Confidence: 50%/)).toBeInTheDocument();
    });
  });
});
