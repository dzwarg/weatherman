# Developer Quickstart: Voice-Activated Weather Clothing Advisor

**Feature**: 001-voice-weather-clothing
**Last Updated**: 2025-12-16

## Welcome!

This guide gets you up and running with the Weatherman PWA development environment. Follow these steps to start building the voice-activated weather clothing advisor.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 22+** ([download](https://nodejs.org/))
  ```bash
  node --version  # Should show v22.x.x or higher
  ```

- **npm package manager** (version 10+ included with Node.js 22+)
  ```bash
  npm --version  # Should show 10.x.x or higher
  ```

- **GPG for commit signing** ([guide](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key))
  ```bash
  gpg --version  # Verify GPG is installed
  git config --global commit.gpgsign true  # Enable signing
  ```

- **HTTPS-capable local server** (Vite dev server includes this)

- **OpenWeatherMap API Key** ([sign up](https://openweathermap.org/api))
  - Subscribe to "One Call by Call" for One Call API 3.0
  - Free tier: 1,000 calls/day (sufficient for personal/family use)
  - Requires credit card on file, but only charged for usage beyond 1,000 calls/day (€0.14 per 100 calls)
  - Estimated family usage with 1-hour caching: ~20-50 calls/day (well under free limit)

---

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/weatherman.git
cd weatherman

# Checkout the feature branch
git checkout 001-voice-weather-clothing

# Install dependencies
npm install
```

### 2. Configure Environment

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
VITE_OPENWEATHER_API_KEY=your_api_key_here
VITE_OPENWEATHER_TIMEOUT=5000
VITE_WEATHER_CACHE_DURATION=3600000
```

**Security Note**: Never commit `.env` to version control. It's already in `.gitignore`.

### 3. Verify Setup

```bash
# Run tests
npm test

# Check linting
npm run lint

# Build for production
npm run build
```

All commands should pass with no errors.

---

## Development Workflow

### Starting Dev Server

```bash
npm run dev
```

- Opens browser at `https://localhost:5173` (HTTPS required for voice/location APIs)
- Hot module reload (HMR) enabled
- Service Worker disabled in dev mode (prevents caching issues)

### Project Structure

```
src/
├── components/       # React components
│   ├── voice/       # Voice interaction UI
│   ├── profile/     # Profile selection
│   ├── weather/     # Weather display
│   └── recommendation/  # Clothing recommendations
├── services/        # Business logic
│   ├── weatherService.js    # Weather API integration
│   ├── voiceService.js      # Web Speech API wrapper
│   ├── profileService.js    # Profile management
│   └── recommendationService.js  # Clothing logic
├── hooks/           # Custom React hooks
├── models/          # Data models
├── utils/           # Utility functions
├── pages/           # Page components
└── App.jsx          # Root component
```

### Key Files to Start With

1. **`src/services/weatherService.js`**:
   - Integrates with OpenWeatherMap API
   - Implements caching strategy
   - See `specs/001-voice-weather-clothing/contracts/weather-service-interface.md`

2. **`src/services/voiceService.js`**:
   - Wraps Web Speech API
   - Handles wake word detection
   - Manages speech recognition and synthesis

3. **`src/components/voice/WakeWordDetector.jsx`**:
   - Listens for "good morning weatherbot"
   - Triggers voice input capture

4. **`src/services/recommendationService.js`**:
   - Core clothing recommendation logic
   - Profile-based customization
   - Weather condition mapping

---

## Development Commands

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/services/weatherService.test.js
```

**Coverage Target**: 80%+ (constitutional requirement)

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

**Zero errors required** before committing (constitutional requirement).

### Building

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run build -- --analyze
```

**Bundle Target**: < 300KB minified + gzipped (constitutional requirement).

### PWA Development

```bash
# Test Service Worker locally
npm run build && npm run preview

# Check PWA manifest
open http://localhost:4173/manifest.json

# Run Lighthouse audit
npm run lighthouse
```

**Lighthouse Target**: PWA score 100/100 (constitutional requirement).

---

## Making Changes

### 1. Understand the Spec

Read these documents before coding:

- **Specification**: `specs/001-voice-weather-clothing/spec.md`
- **Implementation Plan**: `specs/001-voice-weather-clothing/plan.md`
- **Data Model**: `specs/001-voice-weather-clothing/data-model.md`
- **API Contracts**: `specs/001-voice-weather-clothing/contracts/`
- **Constitution**: `.specify/memory/constitution.md`

### 2. Create Task Branch

Tasks will be created via `/speckit.tasks` command. Branch naming convention:

```bash
git checkout -b spec/001/task/1-implement-weather-service
```

Format: `spec/<spec-number>/task/<task-number>-short-description`

### 3. Write Tests First (TDD)

```bash
# Create test file
touch tests/unit/services/weatherService.test.js

# Write failing tests
npm run test:watch

# Implement code to pass tests
# Refactor and repeat
```

### 4. Implement Feature

Follow these principles:

- **Voice-first**: Every feature accessible via voice
- **Offline-capable**: Works without network (stale data acceptable)
- **Child-friendly**: Simple language, large touch targets, clear feedback
- **Privacy-first**: No data leaves device except weather API calls

### 5. Manual Testing Checklist

Before committing, test:

- [ ] Voice wake word detection ("good morning weatherbot")
- [ ] Voice recognition accuracy
- [ ] Speech synthesis quality (rate: 0.9, pitch: 1.1)
- [ ] Profile selection persistence
- [ ] Weather API integration
- [ ] Offline behavior (cache fallback)
- [ ] Mobile responsiveness
- [ ] PWA installation
- [ ] HTTPS requirement

### 6. Commit Changes

```bash
# Stage specific files only
git add src/services/weatherService.js tests/unit/services/weatherService.test.js

# Run quality checks
npm test && npm run lint && npm run build

# Commit with GPG signature and conventional format
git commit -m "feat(weather): implement OpenWeatherMap integration

- Add weatherService with caching strategy
- Implement 5-second timeout requirement
- Add stale cache fallback for offline mode
- Include unit tests with 85% coverage

Closes #42"

# Verify GPG signature
git log --show-signature -1
```

**Commit Format**: `<type>(<scope>): <subject>`

**Valid types**: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert

**Scopes**: weather, voice, profile, recommendation, pwa

---

## Testing Voice Features

### Browser Requirements

Voice features require:

- **Chrome/Edge**: Full support (recommended)
- **Safari 14.1+**: Supported but less reliable
- **Firefox**: Limited support (not recommended for development)

### Voice API Testing

```javascript
// Test wake word detection
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  if (transcript.toLowerCase().includes('good morning weatherbot')) {
    console.log('Wake word detected!');
  }
};
recognition.start();

// Test speech synthesis
const utterance = new SpeechSynthesisUtterance('Hello from Weatherbot!');
utterance.rate = 0.9;  // Child-friendly speed
utterance.pitch = 1.1; // Slightly higher pitch
speechSynthesis.speak(utterance);
```

### Microphone Permissions

First time running the app, browser will prompt for microphone access. Click "Allow".

To reset permissions (for testing):
- Chrome: `chrome://settings/content/microphone`
- Safari: Safari > Settings > Websites > Microphone

---

## Troubleshooting

### Issue: "API key invalid"

**Solution**: Verify `.env` file has correct `VITE_OPENWEATHER_API_KEY` and restart dev server.

### Issue: "Voice recognition not working"

**Solution**:
1. Check browser console for errors
2. Verify HTTPS (required for microphone access)
3. Ensure microphone permissions granted
4. Try Chrome/Edge (best support)

### Issue: "Service Worker not updating"

**Solution**:
```bash
# Clear Service Worker cache
# Chrome: DevTools > Application > Service Workers > Unregister
# Then hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
```

### Issue: "Tests failing with IndexedDB errors"

**Solution**: Vitest uses jsdom which doesn't support IndexedDB natively. Mock IndexedDB in tests:

```javascript
import 'fake-indexeddb/auto';
```

### Issue: "Bundle size too large"

**Solution**:
```bash
# Analyze bundle
npm run build -- --analyze

# Check for large dependencies
npm explain <package-name>

# Consider code splitting
```

---

## Additional Resources

### Documentation

- **Feature Spec**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Research**: [research.md](./research.md)
- **API Contracts**: [contracts/](./contracts/)

### External References

- **OpenWeatherMap API**: https://openweathermap.org/api/one-call-3
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **PWA Guide**: https://web.dev/progressive-web-apps/
- **Seeds Design System**: https://seeds.sproutsocial.com/
- **Vitest Docs**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react

### Getting Help

- **Check Spec**: Most questions answered in `spec.md` or `plan.md`
- **Read Constitution**: `.specify/memory/constitution.md` has all requirements
- **Review Contracts**: `contracts/` folder has API and service interfaces
- **Ask Team**: [Team communication channel]

---

## Next Steps

1. **Read the Specification**: Start with `spec.md` to understand requirements
2. **Review Technical Plan**: Read `plan.md` for architecture decisions
3. **Study Data Model**: Familiarize yourself with `data-model.md` entities
4. **Run Dev Server**: `npm run dev` and explore the app structure
5. **Pick a Task**: Tasks will be in `tasks.md` (created via `/speckit.tasks`)
6. **Write Tests**: Start with TDD approach
7. **Implement Feature**: Follow constitution requirements
8. **Submit PR**: Conventional commits, GPG signed, all checks passing

Welcome to the Weatherman team! 🌤️👕

---

**Questions?** Check the constitution (`.specify/memory/constitution.md`) or spec files first. Most answers are documented.
