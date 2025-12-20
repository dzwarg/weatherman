/**
 * WakeWordDetector Component
 * Visual indicator for wake word listening state
 */

import { WAKE_PHRASE } from '../../utils/constants.js';

export function WakeWordDetector({ isWaitingForWakeWord, isListening, onStart, onStop }) {
  const getStatus = () => {
    if (isListening) return 'listening';
    if (isWaitingForWakeWord) return 'waiting';
    return 'idle';
  };

  const status = getStatus();

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      padding: '30px',
      borderRadius: '16px',
      backgroundColor: status === 'waiting' ? '#E3F2FD' : status === 'listening' ? '#E8F5E9' : '#F5F5F5',
      border: `3px solid ${status === 'waiting' ? '#2196F3' : status === 'listening' ? '#4CAF50' : '#BDBDBD'}`,
      transition: 'all 0.3s ease',
    },
    indicator: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: status === 'waiting' ? '#2196F3' : status === 'listening' ? '#4CAF50' : '#9E9E9E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px',
      animation: status !== 'idle' ? 'pulse 2s infinite' : 'none',
    },
    text: {
      textAlign: 'center',
      color: '#333',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '0 0 8px 0',
    },
    subtitle: {
      fontSize: '16px',
      color: '#666',
      margin: '0',
    },
    wakePhrase: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2196F3',
      marginTop: '8px',
    },
    button: {
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: 'bold',
      color: 'white',
      backgroundColor: status === 'idle' ? '#4CAF50' : '#F44336',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
  };

  const getIcon = () => {
    if (isListening) return '🎙️';
    if (isWaitingForWakeWord) return '👂';
    return '😴';
  };

  const getTitle = () => {
    if (isListening) return 'Listening...';
    if (isWaitingForWakeWord) return 'Waiting for wake phrase';
    return 'Voice Assistant Ready';
  };

  const getSubtitle = () => {
    if (isListening) return 'Speak your question now';
    if (isWaitingForWakeWord) return `Say "${WAKE_PHRASE}" to start`;
    return 'Click start to begin';
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          button:hover {
            transform: scale(1.05);
          }
          button:active {
            transform: scale(0.95);
          }
        `}
      </style>

      <div style={styles.indicator}>{getIcon()}</div>

      <div style={styles.text}>
        <h2 style={styles.title}>{getTitle()}</h2>
        <p style={styles.subtitle}>{getSubtitle()}</p>
        {isWaitingForWakeWord && (
          <p style={styles.wakePhrase}>&quot;{WAKE_PHRASE}&quot;</p>
        )}
      </div>

      <button
        style={styles.button}
        onClick={status === 'idle' ? onStart : onStop}
      >
        {status === 'idle' ? 'Start Listening' : 'Stop'}
      </button>
    </div>
  );
}
