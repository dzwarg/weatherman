# Weatherman - Technical Details

## Architecture Overview

Weatherman is built as a Progressive Web Application (PWA) using modern web technologies to provide a responsive, offline-capable, voice-activated experience for outfit recommendations based on weather data.

### Technology Stack

- **Frontend Framework**: React 22+
- **Build Tool**: Vite 5+
- **Design System**: Racine (Seeds Design System by Sprout Social)
  - URL: https://seeds.sproutsocial.com/
- **Language**: JavaScript/TypeScript with HTML5 and CSS3
- **Voice Interface**: Web Speech API
  - SpeechRecognition API for voice input
  - SpeechSynthesis API for voice feedback
- **Offline Support**: Service Workers with Cache API
- **State Management**: React Context API / Redux Toolkit (TBD)
- **Data Fetching**: Native Fetch API with offline fallback

## Progressive Web App Implementation

### PWA Core Components

#### 1. Web App Manifest (`manifest.json`)

```json
{
  "name": "Weatherman - Outfit Recommendations",
  "short_name": "Weatherman",
  "description": "Voice-activated outfit recommendations based on weather",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196F3",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### 2. Service Worker Strategy

The application implements a **Network First, Cache Fallback** strategy for weather API calls and a **Cache First** strategy for static assets.

**Key Service Worker Features:**
- Runtime caching for weather API responses
- Precaching of application shell (HTML, CSS, JS bundles)
- Background sync for failed requests
- Periodic background sync for weather data updates
- Cache versioning and cleanup

**Caching Strategies by Resource Type:**

| Resource Type | Strategy | Cache Name | Max Age |
|--------------|----------|------------|---------|
| App Shell (HTML/CSS/JS) | Cache First | static-v1 | 30 days |
| Weather API Data | Network First | weather-api-v1 | 1 hour |
| Images/Icons | Cache First | images-v1 | 7 days |
| User Profiles | Cache First | user-data-v1 | No expiry |
| Outfit Data | Cache First | outfits-v1 | 30 days |

#### 3. Offline Detection & Handling

```javascript
// Online/Offline Event Listeners
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// Network Information API (when available)
if ('connection' in navigator) {
  navigator.connection.addEventListener('change', handleConnectionChange);
}
```

**Offline Capabilities:**
- Display cached weather data with timestamp
- Access previously loaded outfit recommendations
- Queue voice commands for processing when online
- Visual indicators for offline status
- Graceful degradation of features

## Web Speech API Integration

### Speech Recognition (Voice Input)

The application uses the Web Speech API's SpeechRecognition interface for voice command processing.

**Implementation Details:**

```javascript
// Browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Configuration
recognition.continuous = false; // Stop after single utterance
recognition.interimResults = false; // Only final results
recognition.maxAlternatives = 1;
recognition.lang = 'en-US';
```

**Supported Voice Commands:**
- "What should I wear today?"
- "Show me outfits for [day]"
- "What's the weather like [tomorrow/this weekend]?"
- "Switch profile to [child name]"
- "Show me rain gear"
- "What should I bring outside?"

**Voice Command Processing Pipeline:**
1. Voice activation trigger (wake word: "Good morning")
2. Audio capture via microphone
3. Speech-to-text conversion
4. Natural language processing (intent recognition)
5. Command execution
6. Voice feedback via Speech Synthesis

### Speech Synthesis (Voice Output)

```javascript
const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance();

// Configuration for child-friendly voice
utterance.rate = 0.9; // Slightly slower for clarity
utterance.pitch = 1.1; // Slightly higher pitch
utterance.volume = 1.0;
```

**Voice Feedback Examples:**
- "Good morning! It's 65 degrees and sunny today."
- "I recommend wearing a t-shirt and shorts, and don't forget sunscreen!"
- "It might rain later, so bring an umbrella."

### Permissions & Privacy

**Required Permissions:**
- Microphone access (for speech recognition)
- Geolocation (for local weather data)
- Notifications (optional, for weather alerts)

**Privacy Considerations:**
- Voice data is processed in-browser (no server-side transmission)
- User profiles stored locally (localStorage/IndexedDB)
- Location data used only for weather API calls
- No voice recordings are saved

## Development Environment

### Prerequisites

- Node.js 22+ and yarn
- Modern browser with PWA support (Chrome, Edge, Safari, Firefox)
- HTTPS localhost setup (required for Service Workers and microphone access)

### Project Setup

```bash
# Initialize project
yarn create vite@latest weatherman -- --template react

# Install dependencies
yarn install

# Install Racine Design System
yarn install @sproutsocial/seeds-react @sproutsocial/seeds-design-tokens

# Install additional dependencies
yarn install workbox-window idb # PWA utilities
yarn install react-router-dom # Routing
yarn install @testing-library/react vitest # Testing
```

### Project Structure

```
weatherman/
├── public/
│   ├── manifest.json
│   ├── robots.txt
│   ├── icons/
│   └── sw.js (generated by Vite PWA plugin)
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── components/
│   │   ├── VoiceInput.jsx
│   │   ├── WeatherDisplay.jsx
│   │   ├── OutfitRecommendations.jsx
│   │   ├── ProfileSelector.jsx
│   │   └── OfflineIndicator.jsx
│   ├── hooks/
│   │   ├── useSpeechRecognition.js
│   │   ├── useSpeechSynthesis.js
│   │   ├── useWeatherData.js
│   │   ├── useOfflineStatus.js
│   │   └── useServiceWorker.js
│   ├── services/
│   │   ├── weatherAPI.js
│   │   ├── outfitEngine.js
│   │   ├── speechProcessor.js
│   │   └── cacheManager.js
│   ├── utils/
│   │   ├── commandParser.js
│   │   ├── dateHelpers.js
│   │   └── storageHelpers.js
│   ├── contexts/
│   │   ├── UserContext.jsx
│   │   └── WeatherContext.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── sw.js (Service Worker source)
├── docs/
│   ├── product-details.md
│   └── technical-details.md
├── vite.config.js
├── package.json
└── README.md
```

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'robots.txt'],
      manifest: {
        // manifest.json content
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    https: true, // Required for Service Workers in development
    port: 3000,
  },
});
```

## Racine Design System Integration

### Installation & Setup

```javascript
// main.jsx
import '@sproutsocial/seeds-design-tokens/css/tokens.css';
import '@sproutsocial/seeds-react/dist/seeds.css';
```

### Key Components from Racine

- **Button**: Voice activation button, action buttons
- **Card**: Weather cards, outfit recommendation cards
- **Icon**: Weather icons, accessory icons, status indicators
- **Typography**: Headings, body text, labels
- **Avatar**: User profile selection
- **Badge**: Weather alerts, notification indicators
- **Modal**: Permission requests, error messages
- **Toast**: Status notifications, offline indicators

### Customization

```css
/* Custom CSS variables for child-friendly theme */
:root {
  --color-primary: #2196F3; /* Bright blue */
  --color-secondary: #FFC107; /* Sunny yellow */
  --color-accent: #FF6B6B; /* Warm red */
  --font-family-base: 'Inter', -apple-system, sans-serif;
  --border-radius-card: 16px; /* Rounded corners for friendliness */
}
```

## Weather API Integration

### Recommended Provider: OpenWeatherMap

**Endpoints Used:**
- Current Weather: `https://api.openweathermap.org/data/2.5/weather`
- 5-Day Forecast: `https://api.openweathermap.org/data/2.5/forecast`
- One Call API 3.0: `https://api.openweathermap.org/data/3.0/onecall`

**Data Points Retrieved:**
- Temperature (current, high, low, feels-like)
- Weather condition (clear, cloudy, rain, snow, etc.)
- Precipitation probability and amount
- Wind speed and direction
- Humidity percentage
- UV index
- Sunrise/sunset times

### Geolocation

```javascript
// Request user location
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    fetchWeatherData(latitude, longitude);
  },
  (error) => {
    // Fallback to default location or prompt user
  }
);
```

### Caching Strategy

- **Fresh Data**: Fetch new data every 30 minutes when online
- **Stale Data**: Display cached data with timestamp when offline
- **Background Sync**: Update cache when connection is restored
- **Expiration**: Remove data older than 24 hours

## Outfit Recommendation Engine

### Decision Logic

The outfit engine uses a rule-based system that considers:

**Temperature Ranges:**
- 85°F+: Light, breathable clothing (t-shirts, shorts, sundresses)
- 70-84°F: Comfortable casual wear (t-shirts, light pants/skirts)
- 60-69°F: Light layers (long sleeves, light jacket)
- 50-59°F: Moderate layers (sweater, jeans, jacket)
- 40-49°F: Warm layers (hoodie, jacket, long pants)
- Below 40°F: Heavy layers (coat, gloves, hat, scarf)

**Precipitation:**
- Rain: Raincoat, umbrella, waterproof shoes
- Snow: Snow jacket, boots, gloves, hat
- No precipitation: Standard recommendations

**Wind:**
- 15+ mph: Windbreaker or wind-resistant jacket
- Below 15 mph: Standard recommendations

**UV Index:**
- 6+: Sunscreen, hat, sunglasses recommended
- 3-5: Sunscreen recommended
- 0-2: No additional sun protection needed

### Personalization by Profile

Each user profile (4 y/o girl, 7 y/o boy, 10 y/o boy) has customized:
- Clothing preferences
- Color schemes
- Age-appropriate accessories
- Activity considerations

## Security Considerations

### HTTPS Requirement

- Service Workers require HTTPS in production
- Geolocation API requires secure context
- MediaDevices (microphone) requires secure context

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self';
           connect-src 'self' https://api.openweathermap.org;
           img-src 'self' data: https:;
           style-src 'self' 'unsafe-inline';">
```

### Data Storage

- User profiles: localStorage (non-sensitive data)
- Weather cache: Cache API via Service Worker
- Voice data: Not stored (processed in real-time)
- API keys: Environment variables (never in source code)

## Build & Deployment

### Development

```bash
yarn run dev  # Start development server with HTTPS
```

### Build for Production

```bash
yarn run build  # Creates optimized production build in dist/
```

### Deployment Checklist

- [ ] Generate all required icon sizes
- [ ] Configure manifest.json with correct URLs
- [ ] Set up HTTPS certificate
- [ ] Configure environment variables (API keys)
- [ ] Test Service Worker registration
- [ ] Test offline functionality
- [ ] Test voice commands on target devices
- [ ] Validate PWA with Lighthouse
- [ ] Test installation on iOS and Android
- [ ] Configure caching headers on server

### Recommended Hosting

- **Vercel**: Automatic HTTPS, edge caching, PWA support
- **Netlify**: Easy deployment, built-in CDN, HTTPS
- **Firebase Hosting**: Google infrastructure, PWA-optimized
- **GitHub Pages**: Free hosting with custom domain support

### Performance Targets

- **Lighthouse PWA Score**: 100/100
- **Time to Interactive**: < 3 seconds on 3G
- **First Contentful Paint**: < 1.5 seconds
- **Bundle Size**: < 300KB (minified + gzipped)
- **Voice Command Response**: < 500ms

## Browser Compatibility

### Minimum Requirements

- Chrome/Edge 90+
- Safari 14.5+
- Firefox 88+
- Samsung Internet 14+

### Feature Detection

```javascript
// Service Worker
if ('serviceWorker' in navigator) { /* register SW */ }

// Speech Recognition
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) { /* enable voice */ }

// Geolocation
if ('geolocation' in navigator) { /* request location */ }

// Web App Install
if ('beforeinstallprompt' in window) { /* show install prompt */ }
```

### Polyfills/Fallbacks

- **No Service Worker**: Disable offline features, show warning
- **No Speech API**: Show keyboard input as fallback
- **No Geolocation**: Manual location entry
- **Older Browsers**: Basic HTML/CSS version without PWA features

## Testing Strategy

### Unit Tests

- Voice command parsing
- Outfit recommendation logic
- Weather data transformation
- Cache management utilities

### Integration Tests

- Weather API integration
- Service Worker caching
- Voice recognition flow
- Profile switching

### End-to-End Tests

- Complete user flow from voice input to outfit display
- Offline mode functionality
- Installation process
- Cross-browser compatibility

### Tools

- **Vitest**: Unit and integration tests
- **Testing Library**: Component testing
- **Playwright**: E2E tests
- **Lighthouse CI**: PWA and performance audits

## Future Enhancements

- **Wake Word Detection**: "Hey Weatherman" for hands-free activation
- **Push Notifications**: Weather alerts and daily outfit reminders
- **Machine Learning**: Personalized outfit preferences based on usage
- **Calendar Integration**: Outfit suggestions for scheduled events
- **Wardrobe Management**: Track and organize clothing items
- **Multiple Languages**: Internationalization support
- **Accessibility**: Enhanced screen reader support, voice-only mode
- **Social Features**: Share outfit ideas with family members
