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

## Monorepo Structure

This project uses npm workspaces to manage a monorepo with separate frontend and server packages:

```
weatherman/
├── packages/
│   ├── frontend/          # React PWA (client-side application)
│   └── server/            # Express API server (weather proxy & recommendations)
├── package.json           # Root workspace configuration
└── specs/                 # Feature specifications and documentation
```

### Packages

- **`@weatherman/frontend`**: React-based Progressive Web App with voice interaction
  - Location: `packages/frontend/`
  - Port: `https://localhost:5173` (dev)
  - See [packages/frontend/README.md](./packages/frontend/README.md) for details

- **`@weatherman/server`**: Express.js API server for weather proxying and recommendations
  - Location: `packages/server/`
  - Port: `http://localhost:3000` (dev)
  - See [packages/server/README.md](./packages/server/README.md) for details

### Why Monorepo?

1. **Security**: Weather API keys stored server-side, not exposed in frontend bundle
2. **Rate Limiting**: Centralized control over external API calls
3. **Shared Types**: Common data models between frontend and server (future enhancement)
4. **Unified Development**: Single repository for full-stack development
5. **Independent Deployment**: Frontend and server can be deployed separately

## Quick Start

### Prerequisites

- **Node.js**: 22+
- **npm**: 10+ (comes with Node.js)
- **OpenWeatherMap API Key**: [Sign up](https://openweathermap.org/api) for free tier or One Call API 3.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd weatherman

# Install all workspace dependencies
npm install

# Configure server environment variables
cd packages/server
cp .env.example .env
# Edit .env and add your WEATHER_API_KEY

# Configure frontend environment variables (if needed)
cd ../frontend
cp .env.example .env.development
# Defaults should work for local development

# Return to root
cd ../..

# Start both frontend and server together
npm run dev
```

### Environment Variables

**Server** (`packages/server/.env`):
```env
PORT=3000
WEATHER_API_KEY=your_openweathermap_api_key_here
WEATHER_API_URL=https://api.openweathermap.org/data/2.5
NODE_ENV=development
```

**Frontend** (`packages/frontend/.env.development`):
```env
VITE_USE_MOCK_OLLAMA=true
VITE_API_BASE_URL=/api
```

### HTTPS for Voice Features

Voice recognition and geolocation require HTTPS. For development:

1. Set `https: true` in `vite.config.js`
2. Accept the self-signed certificate in your browser
3. Or use a tool like [mkcert](https://github.com/FiloSottile/mkcert) for local certificates

## Available Commands

### Root-Level Commands (Monorepo)

```bash
# Development
npm run dev                     # Start both frontend and server concurrently
npm run dev:frontend            # Start only frontend (https://localhost:5173)
npm run dev:server              # Start only server (http://localhost:3000)

# Testing
npm test                        # Run tests in all packages
npm run test --workspace=@weatherman/frontend    # Run frontend tests only
npm run test --workspace=@weatherman/server      # Run server tests only

# Build
npm run build                   # Build all packages
npm run build --workspace=@weatherman/frontend   # Build frontend only
npm run build --workspace=@weatherman/server     # Build server only (if applicable)
```

### Package-Specific Commands

**Frontend** (`cd packages/frontend`):
```bash
npm run dev                # Start dev server (https://localhost:5173)
npm run build              # Build for production
npm run preview            # Preview production build
npm test                   # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run lint               # Lint code
npm run lint:fix           # Lint and auto-fix
npm run generate-icons     # Generate PWA icons from SVG
```

**Server** (`cd packages/server`):
```bash
npm run dev                # Start dev server (http://localhost:3000)
npm test                   # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:coverage      # Run tests with coverage report
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

## Development Workflow

### Local Development

1. **Start both services together** (recommended):
   ```bash
   npm run dev
   ```
   - Frontend: https://localhost:5173
   - Server: http://localhost:3000
   - Vite proxy routes `/api/*` requests to server

2. **Start services independently**:
   ```bash
   # Terminal 1: Start server
   npm run dev:server

   # Terminal 2: Start frontend
   npm run dev:frontend
   ```

3. **Make changes**:
   - Frontend changes hot-reload automatically
   - Server restarts on file changes (if using nodemon)
   - Changes to one package don't require rebuilding the other

### Testing Workflow

#### Run All Tests

```bash
# From root directory
npm test
```

This runs tests in both packages sequentially.

#### Test Individual Packages

```bash
# Frontend tests only
npm test --workspace=@weatherman/frontend

# Server tests only
npm test --workspace=@weatherman/server

# Or navigate to package directory
cd packages/server
npm test
```

#### Test-Driven Development (TDD)

The server follows strict TDD:

1. **Write test first**:
   ```bash
   cd packages/server
   # Create test file in tests/unit/ or tests/integration/
   npm test -- path/to/test.test.js
   ```

2. **Verify test fails** (red)

3. **Implement feature** to make test pass (green)

4. **Refactor** as needed

5. **Run full test suite**:
   ```bash
   npm test
   ```

6. **Check coverage**:
   ```bash
   npm run test:coverage
   ```

#### Test Types

**Frontend:**
- Component tests (React Testing Library)
- Hook tests
- Service tests (mocked APIs)
- Integration tests

**Server:**
- Unit tests (validators, services, utilities)
- Integration tests (full request/response cycle)
- Middleware tests
- Coverage target: 80%+

### Common Development Tasks

#### Adding a New API Endpoint

1. Navigate to server package
2. Write tests first (TDD approach)
3. Create validator, service, controller
4. Add route definition
5. Integrate into server.js
6. Verify tests pass
7. Update server README with endpoint documentation

#### Updating Frontend to Use New Endpoint

1. Create/update service in `packages/frontend/src/services/`
2. Add TypeScript types (if using TS)
3. Update components to use service
4. Write component tests
5. Test end-to-end with running server

#### Debugging

**Frontend:**
- Browser DevTools
- React DevTools extension
- Console logs in `packages/frontend/src/`

**Server:**
- Check terminal logs (request logger active)
- Use Node debugger: `node --inspect src/server.js`
- Check error responses in browser Network tab

**API Testing:**
```bash
# Test server health
curl http://localhost:3000/api/health

# Test weather endpoint
curl -X POST http://localhost:3000/api/weather/current \
  -H "Content-Type: application/json" \
  -d '{"lat": 42.3601, "lon": -71.0589, "units": "imperial"}'
```

### Workspace Management

```bash
# Install dependency in specific package
npm install <package-name> --workspace=@weatherman/server

# Run script in specific package
npm run build --workspace=@weatherman/frontend

# List all workspaces
npm ls --all --workspace
```

## Project Structure

```
weatherman/
├── packages/
│   ├── frontend/                    # React PWA (@weatherman/frontend)
│   │   ├── public/
│   │   │   ├── icons/              # PWA icons and favicon
│   │   │   └── offline.html        # Offline fallback page
│   │   ├── src/
│   │   │   ├── components/         # React components
│   │   │   │   ├── profile/        # Profile selection UI
│   │   │   │   ├── recommendation/ # Recommendation display
│   │   │   │   └── voice/          # Voice interaction UI
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── mocks/              # Mock data for development
│   │   │   ├── models/             # Data models
│   │   │   ├── pages/              # Application pages
│   │   │   ├── services/           # API client and cache services
│   │   │   └── utils/              # Utility functions
│   │   ├── tests/                  # Frontend test suite
│   │   ├── package.json            # Frontend dependencies
│   │   └── vite.config.js          # Vite configuration with proxy
│   │
│   └── server/                      # Express API (@weatherman/server)
│       ├── src/
│       │   ├── config/             # Environment and constants
│       │   ├── controllers/        # Request handlers
│       │   ├── middleware/         # Express middleware
│       │   ├── routes/             # API route definitions
│       │   ├── services/           # Business logic
│       │   ├── utils/              # Helper functions
│       │   ├── validators/         # Request validation
│       │   └── server.js           # Express app entry point
│       ├── tests/                  # Server test suite
│       │   ├── unit/               # Unit tests
│       │   ├── integration/        # Integration tests
│       │   └── helpers/            # Test utilities
│       └── package.json            # Server dependencies
│
├── specs/                           # Feature specifications
├── docs/                            # Documentation
├── package.json                     # Root workspace configuration
└── README.md                        # This file
```

## Technology Stack

### Frontend
- **Framework**: React 18.3+ with Vite 5.4+
- **PWA**: vite-plugin-pwa with Workbox
- **Voice**: Web Speech API (SpeechRecognition, SpeechSynthesis)
- **Storage**: IndexedDB (weather cache), LocalStorage (profiles)
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint with React plugins

### Server
- **Runtime**: Node.js 22+
- **Framework**: Express.js 4.18+
- **Security**: Helmet, CORS
- **Rate Limiting**: express-rate-limit
- **HTTP Client**: axios
- **Testing**: Vitest + Supertest
- **Weather API**: OpenWeatherMap API (proxied)

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
