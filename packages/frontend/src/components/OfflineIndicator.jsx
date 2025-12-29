/**
 * Offline Indicator Component
 * Shows when the server API is unavailable
 */

import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const [serverStatus, setServerStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache',
        });

        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
      }

      setLastCheck(new Date());
    };

    // Check immediately
    checkServerHealth();

    // Check every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  if (serverStatus === 'online') {
    return null; // Don't show anything when online
  }

  const styles = {
    banner: {
      padding: '12px 24px',
      marginBottom: '20px',
      borderRadius: '8px',
      backgroundColor: '#FFF3E0',
      border: '2px solid #FF9800',
      textAlign: 'center',
      color: '#E65100',
      fontWeight: 'bold',
    },
    checking: {
      backgroundColor: '#E3F2FD',
      border: '2px solid #2196F3',
      color: '#0D47A1',
    },
    details: {
      fontSize: '14px',
      fontWeight: 'normal',
      marginTop: '4px',
    },
  };

  return (
    <div
      style={{
        ...styles.banner,
        ...(serverStatus === 'checking' ? styles.checking : {}),
      }}
    >
      {serverStatus === 'checking' ? (
        <>
          <div>🔄 Checking server connection...</div>
        </>
      ) : (
        <>
          <div>⚠️ Server Unavailable</div>
          <div style={styles.details}>
            Using local recommendations. Server features temporarily offline.
            {lastCheck && (
              <> Last checked: {lastCheck.toLocaleTimeString()}</>
            )}
          </div>
        </>
      )}
    </div>
  );
}
