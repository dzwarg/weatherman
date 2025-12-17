/**
 * Tests for VoiceFeedback component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceFeedback } from './VoiceFeedback';

describe('VoiceFeedback', () => {
  describe('state rendering', () => {
    it('should render idle state', () => {
      render(<VoiceFeedback state="idle" />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('😴')).toBeInTheDocument();
    });

    it('should render listening state', () => {
      render(<VoiceFeedback state="listening" />);

      expect(screen.getByText('Listening...')).toBeInTheDocument();
      expect(screen.getByText('🎙️')).toBeInTheDocument();
    });

    it('should render processing state', () => {
      render(<VoiceFeedback state="processing" />);

      expect(screen.getByText('Thinking...')).toBeInTheDocument();
      expect(screen.getByText('🤔')).toBeInTheDocument();
    });

    it('should render speaking state', () => {
      render(<VoiceFeedback state="speaking" />);

      expect(screen.getByText('Speaking...')).toBeInTheDocument();
      expect(screen.getByText('🗣️')).toBeInTheDocument();
    });

    it('should render error state', () => {
      render(<VoiceFeedback state="error" />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('should default to idle for unknown state', () => {
      render(<VoiceFeedback state="unknown" />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('😴')).toBeInTheDocument();
    });
  });

  describe('message display', () => {
    it('should display message when provided', () => {
      render(<VoiceFeedback state="listening" message="Say something..." />);

      expect(screen.getByText('Say something...')).toBeInTheDocument();
    });

    it('should not display message when not provided', () => {
      const { container } = render(<VoiceFeedback state="listening" />);

      const messages = container.querySelectorAll('p');
      expect(messages).toHaveLength(0);
    });

    it('should display custom message', () => {
      render(<VoiceFeedback state="processing" message="Processing your request..." />);

      expect(screen.getByText('Processing your request...')).toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('should display error when provided', () => {
      render(<VoiceFeedback state="error" error="Voice recognition failed" />);

      expect(screen.getByText('Voice recognition failed')).toBeInTheDocument();
    });

    it('should display error with state', () => {
      render(
        <VoiceFeedback
          state="error"
          error="Microphone not available"
        />
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Microphone not available')).toBeInTheDocument();
    });

    it('should not display error when not provided', () => {
      const { container } = render(<VoiceFeedback state="error" />);

      const errorElements = Array.from(container.querySelectorAll('p')).filter(
        (el) => el.style.color === 'rgb(244, 67, 54)'
      );
      expect(errorElements).toHaveLength(0);
    });
  });

  describe('message and error together', () => {
    it('should display both message and error', () => {
      render(
        <VoiceFeedback
          state="error"
          message="Something went wrong"
          error="Network connection lost"
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Network connection lost')).toBeInTheDocument();
    });
  });

  describe('visual states', () => {
    it('should have correct background for idle state', () => {
      const { container } = render(<VoiceFeedback state="idle" />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({ backgroundColor: '#F5F5F5' });
    });

    it('should have correct background for listening state', () => {
      const { container } = render(<VoiceFeedback state="listening" />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({ backgroundColor: '#E8F5E9' });
    });

    it('should have correct background for processing state', () => {
      const { container } = render(<VoiceFeedback state="processing" />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({ backgroundColor: '#FFF3E0' });
    });

    it('should have correct background for speaking state', () => {
      const { container } = render(<VoiceFeedback state="speaking" />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({ backgroundColor: '#E3F2FD' });
    });

    it('should have correct background for error state', () => {
      const { container } = render(<VoiceFeedback state="error" />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({ backgroundColor: '#FFEBEE' });
    });
  });

  describe('animation', () => {
    it('should include animation styles for listening state', () => {
      const { container } = render(<VoiceFeedback state="listening" />);
      const style = container.querySelector('style');

      expect(style?.textContent).toContain('@keyframes bounce');
    });

    it('should include animation styles for processing state', () => {
      const { container } = render(<VoiceFeedback state="processing" />);
      const style = container.querySelector('style');

      expect(style?.textContent).toContain('@keyframes bounce');
    });
  });
});
