import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { registerServiceWorker } from './registerServiceWorker.js';

// Basic styles
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #ffffff;
    color: #333;
  }

  #root {
    min-height: 100vh;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Log initialization
console.log('🌤️ Weatherman PWA initializing...');
console.log('📦 Services available:', {
  storageService: 'LocalStorage/SessionStorage wrapper',
  cacheService: 'IndexedDB weather cache',
  profileService: 'User profile management',
  weatherService: 'OpenWeatherMap API integration',
});

// Register service worker
if (import.meta.env.PROD) {
  registerServiceWorker();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Report Web Vitals for performance monitoring
import('./utils/reportWebVitals.js').then(({ reportWebVitals, handleMetric }) => {
  reportWebVitals(handleMetric);
}).catch(() => {
  // Silently fail if Web Vitals not available
});
