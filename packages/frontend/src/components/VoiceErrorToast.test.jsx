import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { VoiceErrorToast } from './VoiceErrorToast.jsx';

describe('VoiceErrorToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when error is null', () => {
    const { container } = render(<VoiceErrorToast error={null} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the not-allowed session message', () => {
    render(<VoiceErrorToast error={{ code: 'not-allowed', isPermanent: false }} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Please allow microphone access');
  });

  it('renders the not-allowed permanent message with Settings guidance', () => {
    render(<VoiceErrorToast error={{ code: 'not-allowed', isPermanent: true }} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Settings');
  });

  it('renders the audio-capture message', () => {
    render(<VoiceErrorToast error={{ code: 'audio-capture', isPermanent: false }} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('microphone');
  });

  it('renders the no-speech message', () => {
    render(<VoiceErrorToast error={{ code: 'no-speech', isPermanent: false }} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent("didn't hear");
  });

  it('renders the no-voices message', () => {
    render(<VoiceErrorToast error={{ code: 'no-voices', isPermanent: false }} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Voice playback');
  });

  it('renders the not-supported message', () => {
    render(<VoiceErrorToast error={{ code: 'not-supported', isPermanent: true }} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('not supported');
  });

  it('auto-dismisses after 5 seconds', () => {
    const onDismiss = vi.fn();
    render(<VoiceErrorToast error={{ code: 'no-speech', isPermanent: false }} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss before 5 seconds', () => {
    const onDismiss = vi.fn();
    render(<VoiceErrorToast error={{ code: 'no-speech', isPermanent: false }} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(4999);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('cancels the timer when error clears before 5s', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <VoiceErrorToast error={{ code: 'no-speech', isPermanent: false }} onDismiss={onDismiss} />
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    rerender(<VoiceErrorToast error={null} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
