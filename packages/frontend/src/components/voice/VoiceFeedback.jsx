/**
 * VoiceFeedback Component
 * Visual feedback for voice interaction states
 */

export function VoiceFeedback({ state, message, error }) {
  const states = {
    idle: { icon: '😴', color: '#9E9E9E', bg: '#F5F5F5', text: 'Ready' },
    listening: { icon: '🎙️', color: '#4CAF50', bg: '#E8F5E9', text: 'Listening...' },
    processing: { icon: '🤔', color: '#FF9800', bg: '#FFF3E0', text: 'Thinking...' },
    speaking: { icon: '🗣️', color: '#2196F3', bg: '#E3F2FD', text: 'Speaking...' },
    error: { icon: '❌', color: '#F44336', bg: '#FFEBEE', text: 'Error' },
  };

  const currentState = states[state] || states.idle;

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 24px',
      borderRadius: '12px',
      backgroundColor: currentState.bg,
      border: `2px solid ${currentState.color}`,
      transition: 'all 0.3s ease',
    },
    icon: {
      fontSize: '32px',
      animation: state === 'listening' || state === 'processing' ? 'bounce 1s infinite' : 'none',
    },
    content: {
      flex: 1,
    },
    title: {
      margin: '0 0 4px 0',
      fontSize: '18px',
      fontWeight: 'bold',
      color: currentState.color,
    },
    message: {
      margin: 0,
      fontSize: '14px',
      color: '#666',
    },
    error: {
      margin: 0,
      fontSize: '14px',
      color: '#F44336',
      fontWeight: '500',
    },
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>

      <div style={styles.icon}>{currentState.icon}</div>

      <div style={styles.content}>
        <h3 style={styles.title}>{currentState.text}</h3>
        {message && <p style={styles.message}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
