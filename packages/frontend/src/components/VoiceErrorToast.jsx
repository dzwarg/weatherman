/**
 * VoiceErrorToast
 * Auto-dismissing toast for voice service errors.
 * Renders null when no error is present.
 */

import { useEffect } from 'react';

const DISMISS_DELAY_MS = 5000;

const ERROR_MESSAGES = {
  'not-allowed': {
    session: 'Please allow microphone access to use voice.',
    permanent: 'Microphone blocked. Go to Settings › Safari › Microphone to allow access.',
  },
  'audio-capture': 'I need your microphone. Please allow access and try again.',
  'no-speech': "I didn't hear anything. Try saying the wake phrase again.",
  'network': 'Check your internet connection and try again.',
  'no-voices': "Voice playback isn't available on this device right now.",
  'not-supported': 'Voice is not supported in this browser. Try Safari or Chrome.',
};

function getMessage(error) {
  if (!error) return null;
  if (error.code === 'not-allowed') {
    return error.isPermanent
      ? ERROR_MESSAGES['not-allowed'].permanent
      : ERROR_MESSAGES['not-allowed'].session;
  }
  return ERROR_MESSAGES[error.code] || 'Something went wrong with voice. Please try again.';
}

const styles = {
  toast: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#323232',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    lineHeight: '1.4',
    maxWidth: '90vw',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: 9999,
    textAlign: 'center',
  },
};

export function VoiceErrorToast({ error, onDismiss }) {
  const message = getMessage(error);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, DISMISS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div role="alert" aria-live="assertive" style={styles.toast}>
      {message}
    </div>
  );
}
