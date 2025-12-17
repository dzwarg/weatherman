# 🌤️ Weatherman

Voice-activated weather clothing advisor PWA for children ages 4-10.

## Overview

Weatherman is a Progressive Web App that helps children (and parents) quickly decide what to wear based on current weather conditions. Using voice commands and child-friendly language, it provides personalized clothing recommendations based on temperature, precipitation, wind, and UV index.

### Key Features

- **Voice-First Interaction**: Wake word detection ("Good morning weatherbot") and natural voice commands
- **Profile-Based Recommendations**: Three predefined child profiles with age-appropriate vocabulary
- **Child-Friendly Design**: Simple, visual interface with emojis and clear feedback
- **PWA Capabilities**: Works offline, installable on mobile/desktop
- **Smart Caching**: Weather data cached for 1 hour with stale fallback
- **Error Recovery**: Spoken guidance for permission errors and edge cases

## Quick Start

### Prerequisites

- **Node.js**: 22+
- **Yarn**: 1.22+
- **OpenWeatherMap API Key**: [Sign up](https://openweathermap.org/api) for One Call API 3.0 (paid subscription required)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd weatherman

# Install dependencies
yarn install

# Configure environment variables
cp .env.example .env
# Edit .env and add your VITE_OPENWEATHER_API_KEY

# Start development server
yarn dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_OPENWEATHER_API_KEY=your_api_key_here
VITE_OPENWEATHER_TIMEOUT=5000
VITE_WEATHER_CACHE_DURATION=3600000
```

### HTTPS for Voice Features

Voice recognition and geolocation require HTTPS. For development:

1. Set `https: true` in `vite.config.js`
2. Accept the self-signed certificate in your browser
3. Or use a tool like [mkcert](https://github.com/FiloSottile/mkcert) for local certificates

## Available Commands

```bash
# Development
yarn dev                  # Start dev server (http://localhost:5173)
yarn preview              # Preview production build

# Build
yarn build                # Build for production
yarn generate-icons       # Generate PWA icons from SVG (requires sharp)

# Testing
yarn test                 # Run tests once
yarn test:watch           # Run tests in watch mode
yarn test:coverage        # Run tests with coverage report

# Code Quality
yarn lint                 # Lint code
yarn lint:fix             # Lint and auto-fix issues

# PWA Audit
yarn lighthouse           # Run Lighthouse PWA audit (requires build running)
```

## Usage

### Voice Commands

1. **Wake the assistant**: Say "Good morning weatherbot"
2. **Ask your question**:
   - "What should I wear today?"
   - "Do I need a jacket?"
   - "Will it rain?"

### Profile Selection

Select a profile before using voice commands:
- **4-year-old girl**: Simple clothing terms, basic fasteners
- **7-year-old boy**: Moderate complexity, more options
- **10-year-old boy**: Complex recommendations, detailed weather info

### Offline Mode

Weatherman works offline with cached weather data. When offline:
- Shows last fetched weather recommendations
- Profile selection still works
- Voice commands work with cached data
- Banner indicates offline status

## Project Structure

```
weatherman/
├── public/
│   ├── icons/           # PWA icons and favicon
│   └── offline.html     # Offline fallback page
├── src/
│   ├── components/      # React components
│   │   ├── profile/     # Profile selection UI
│   │   ├── recommendation/  # Recommendation display
│   │   └── voice/       # Voice interaction UI
│   ├── hooks/           # Custom React hooks
│   ├── models/          # Data models
│   ├── pages/           # Application pages
│   ├── services/        # Core services (weather, voice, cache)
│   └── utils/           # Utility functions
├── specs/               # Feature specifications
└── tests/               # Test setup and utilities
```

## Technology Stack

- **Framework**: React 18.3+ with Vite 5.4+
- **PWA**: vite-plugin-pwa with Workbox
- **Voice**: Web Speech API (SpeechRecognition, SpeechSynthesis)
- **Weather API**: OpenWeatherMap One Call API 3.0
- **Storage**: IndexedDB (weather cache), LocalStorage (profiles)
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint with React plugins

## Browser Support

### Required Features
- **Web Speech API**: Chrome, Edge, Safari 14.1+
- **Geolocation API**: All modern browsers
- **Service Workers**: All modern browsers
- **IndexedDB**: All modern browsers

### Recommended
- Chrome 90+ (desktop and mobile)
- Safari 14.1+ (iOS and macOS)
- Edge 90+

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Commit message conventions
- GPG signing requirements
- Branching strategy
- Code review process

## Documentation

- [Voice Commands](./docs/voice-commands.md) - Detailed voice interaction guide
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions
- [Technical Details](./docs/technical-details.md) - Architecture and design decisions
- [Product Details](./docs/product-details.md) - Feature specifications

## License

[License information to be added]

## Support

For issues, questions, or contributions, please [open an issue](https://github.com/your-org/weatherman/issues).

---

🌤️ Built with ❤️ for helping kids dress appropriately for the weather
