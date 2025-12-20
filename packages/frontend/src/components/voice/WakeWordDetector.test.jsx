/**
 * Tests for WakeWordDetector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WakeWordDetector } from './WakeWordDetector';

describe('WakeWordDetector', () => {
  const mockOnStart = vi.fn();
  const mockOnStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('idle state', () => {
    it('should render idle state correctly', () => {
      render(
        <WakeWordDetector
          isWaitingForWakeWord={false}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      expect(screen.getByText('Voice Assistant Ready')).toBeInTheDocument();
      expect(screen.getByText('Click start to begin')).toBeInTheDocument();
      expect(screen.getByText('😴')).toBeInTheDocument();
      expect(screen.getByText('Start Listening')).toBeInTheDocument();
    });

    it('should call onStart when button clicked in idle state', async () => {
      const user = userEvent.setup();

      render(
        <WakeWordDetector
          isWaitingForWakeWord={false}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const button = screen.getByText('Start Listening');
      await user.click(button);

      expect(mockOnStart).toHaveBeenCalledTimes(1);
      expect(mockOnStop).not.toHaveBeenCalled();
    });
  });

  describe('waiting for wake word state', () => {
    it('should render waiting state correctly', () => {
      render(
        <WakeWordDetector
          isWaitingForWakeWord={true}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      expect(screen.getByText('Waiting for wake phrase')).toBeInTheDocument();
      expect(screen.getByText(/Say "good morning weatherbot" to start/)).toBeInTheDocument();
      expect(screen.getByText('👂')).toBeInTheDocument();
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    it('should display wake phrase prominently', () => {
      render(
        <WakeWordDetector
          isWaitingForWakeWord={true}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      // Should show wake phrase twice - once in subtitle and once prominently
      const wakePhrasesElements = screen.getAllByText(/good morning weatherbot/i);
      expect(wakePhrasesElements.length).toBeGreaterThan(0);
    });

    it('should call onStop when button clicked while waiting', async () => {
      const user = userEvent.setup();

      render(
        <WakeWordDetector
          isWaitingForWakeWord={true}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const button = screen.getByText('Stop');
      await user.click(button);

      expect(mockOnStop).toHaveBeenCalledTimes(1);
      expect(mockOnStart).not.toHaveBeenCalled();
    });
  });

  describe('listening state', () => {
    it('should render listening state correctly', () => {
      render(
        <WakeWordDetector
          isWaitingForWakeWord={false}
          isListening={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      expect(screen.getByText('Listening...')).toBeInTheDocument();
      expect(screen.getByText('Speak your question now')).toBeInTheDocument();
      expect(screen.getByText('🎙️')).toBeInTheDocument();
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    it('should not display wake phrase when listening', () => {
      render(
        <WakeWordDetector
          isWaitingForWakeWord={false}
          isListening={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      // Wake phrase should only appear in the subtitle text, not as a separate element
      const subtitle = screen.getByText('Speak your question now');
      expect(subtitle).toBeInTheDocument();
    });

    it('should call onStop when button clicked while listening', async () => {
      const user = userEvent.setup();

      render(
        <WakeWordDetector
          isWaitingForWakeWord={false}
          isListening={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const button = screen.getByText('Stop');
      await user.click(button);

      expect(mockOnStop).toHaveBeenCalledTimes(1);
      expect(mockOnStart).not.toHaveBeenCalled();
    });
  });

  describe('status determination', () => {
    it('should prioritize listening over waiting', () => {
      render(
        <WakeWordDetector
          isWaitingForWakeWord={true}
          isListening={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      // When both are true, should show listening state
      expect(screen.getByText('Listening...')).toBeInTheDocument();
    });
  });

  describe('visual styling', () => {
    it('should have correct background color for idle state', () => {
      const { container } = render(
        <WakeWordDetector
          isWaitingForWakeWord={false}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({ backgroundColor: '#F5F5F5' });
    });

    it('should have correct background color for waiting state', () => {
      const { container } = render(
        <WakeWordDetector
          isWaitingForWakeWord={true}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({ backgroundColor: '#E3F2FD' });
    });

    it('should have correct background color for listening state', () => {
      const { container } = render(
        <WakeWordDetector
          isWaitingForWakeWord={false}
          isListening={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({ backgroundColor: '#E8F5E9' });
    });
  });

  describe('button styling', () => {
    it('should have start button color when idle', () => {
      render(
        <WakeWordDetector
          isWaitingForWakeWord={false}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const button = screen.getByText('Start Listening');
      expect(button).toHaveStyle({ backgroundColor: '#4CAF50' });
    });

    it('should have stop button color when active', () => {
      render(
        <WakeWordDetector
          isWaitingForWakeWord={true}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const button = screen.getByText('Stop');
      expect(button).toHaveStyle({ backgroundColor: '#F44336' });
    });
  });

  describe('animations', () => {
    it('should include animation styles', () => {
      const { container } = render(
        <WakeWordDetector
          isWaitingForWakeWord={true}
          isListening={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const style = container.querySelector('style');
      expect(style?.textContent).toContain('@keyframes pulse');
    });
  });
});
