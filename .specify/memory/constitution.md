# Weatherman Constitution

## Core Principles

### I. Voice-First Interaction (NON-NEGOTIABLE)
Voice commands are the primary interface for all user interactions. Every feature must:
- Support hands-free voice activation and control
- Use Web Speech API (SpeechRecognition for input, SpeechSynthesis for output)
- Provide clear voice feedback for all actions
- Maintain child-friendly voice parameters (rate: 0.9, pitch: 1.1)
- Fall back to keyboard/touch input when voice is unavailable
- Never store or transmit voice recordings (process in-browser only)

**Voice Command Examples:**
- "What should I wear today?"
- "Show me outfits for [day]"
- "What's the weather like [tomorrow/this weekend]?"

### II. Progressive Web App Architecture (NON-NEGOTIABLE)
Every feature must be offline-capable and mobile-optimized:
- Service Workers with versioned caching strategies required
- Cache First for static assets (app shell, images)
- Network First with fallback for API data (weather)
- Manifest.json with all required PWA fields
- HTTPS required in all environments (dev and production)
- Lighthouse PWA score must be 100/100
- Home screen installation capability maintained

**Caching Requirements:**
- App shell cache: 30 days
- Weather API cache: 1 hour
- Images cache: 7 days
- User data: No expiry (localStorage/IndexedDB)

### III. Spec-Driven Development (NON-NEGOTIABLE)
Every code change requires specification and task tracking:
- Branch naming: `spec/<number>/task/<number>-short-description`
- Specifications must exist at `./specs/<number>/spec.md`
- Tasks must be documented in `./specs/<number>/tasks.md`
- No branch creation without valid spec and task references
- Pull requests must reference spec and task numbers
- Acceptance criteria must be defined before implementation

**Branch Examples:**
- `spec/1/task/3-weather-api-integration`
- `spec/2/task/7-voice-command-parser`

### IV. Quality-First Development (NON-NEGOTIABLE)
All changes must pass quality gates before commit:
- Unit tests must pass (0 failures, 80%+ coverage)
- ESLint must pass (0 errors)
- Build must succeed (`npm run build`)
- Manual testing completed for voice and offline features
- No `console.log` in production code
- No unused variables or imports

**Quality Commands:**
```bash
npm test          # Must pass
npm run lint      # Must pass
npm run build     # Must succeed
```

### V. Signed & Conventional Commits (NON-NEGOTIABLE)
Every commit must be GPG signed and follow conventional format:
- GPG signing required: `git config commit.gpgsign true`
- Conventional format: `<type>(<scope>): <subject>`
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`
- Subject: imperative mood, lowercase, no period, max 72 chars
- Scope: component name or feature area (weather, voice, outfit, pwa)

**Commit Examples:**
```
feat(weather): add UV index display
fix(voice): prevent duplicate speech recognition
docs(readme): update installation instructions
test(outfit): add unit tests for recommendation engine
```

### VI. Child-Friendly & Family-Focused
All features must be appropriate for children (ages 4-10):
- Simple, clear language in all UI text
- Voice feedback at appropriate speed and pitch
- Age-appropriate outfit recommendations per profile:
  - 4 y/o girl
  - 7 y/o boy
  - 10 y/o boy
- Visual feedback for all voice interactions
- No complex navigation or hidden features
- Quick morning routine optimization (< 3 second load)

### VII. Privacy & Security First
User privacy and security are paramount:
- Microphone access only during active voice input
- Voice data processed in-browser (never transmitted)
- No voice recordings saved
- Location used only for weather API calls
- User profiles stored locally (localStorage/IndexedDB)
- API keys in environment variables only (never in code)
- HTTPS required (Service Workers, geolocation, microphone)
- Content Security Policy enforced

## Technology Stack Requirements

### Mandatory Technologies
- **Frontend Framework**: React 22+
- **Build Tool**: Vite 5+ with PWA plugin
- **Design System**: Racine (Seeds by Sprout Social)
  - URL: https://seeds.sproutsocial.com/
- **Package Manager**: npm 10+ (included with Node.js 22+)
- **Node Version**: 22+
- **Language**: JavaScript with HTML5 and CSS3
- **Voice API**: Web Speech API (native browser)
- **Offline**: Service Workers with Cache API
- **Testing**: Vitest + Testing Library

### Prohibited Technologies
- No server-side voice processing services
- No third-party analytics or tracking
- No authentication services (profiles are local only)
- No database servers (IndexedDB/localStorage only)

### Weather API Requirements
- Provider: OpenWeatherMap (or equivalent)
- Endpoints: Current Weather, 5-Day Forecast, One Call API
- Data points: Temperature, precipitation, wind, humidity, UV index
- Update frequency: 30 minutes when online
- Cache duration: 1 hour
- Fallback: Display stale data with timestamp when offline

## Development Workflow Requirements

### Branch Creation Process
1. Sync with main: `git pull origin main`
2. Verify spec exists: `./specs/<number>/spec.md`
3. Verify task exists: `./specs/<number>/tasks.md`
4. Create branch: `git checkout -b spec/X/task/Y-description`

### Pre-Commit Checklist
- [ ] Unit tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual voice testing completed
- [ ] Offline functionality verified
- [ ] Documentation updated (if needed)

### Commit Process
```bash
git add [specific files]
npm test && npm run lint && npm run build  # Verify quality
git commit -m "type(scope): subject"   # GPG signed
git log --show-signature -1            # Verify signature
```

### Pull Request Requirements
- Title follows conventional commit format
- Description includes:
  - Spec reference
  - Task reference
  - List of changes
  - Testing evidence
  - Screenshots/GIFs for UI changes
- All automated checks pass
- Code review completed
- Approved before merge

### Code Review Focus Areas
- Voice interaction UX and clarity
- Offline functionality maintained
- Child-appropriate content and language
- Privacy and security compliance
- Performance impact (< 3s load time)
- Accessibility (ARIA labels, screen readers)
- Mobile responsiveness

## Performance Standards

### Load Time Requirements
- First Contentful Paint: < 1.5 seconds
- Time to Interactive: < 3 seconds on 3G
- Voice command response: < 500ms
- Weather data fetch: < 2 seconds

### Bundle Size Limits
- Total bundle (minified + gzipped): < 300KB
- Initial JavaScript: < 150KB
- CSS: < 50KB
- Images optimized (WebP preferred)

### Caching Efficiency
- Static assets: 95%+ cache hit rate
- Weather API: 70%+ cache hit rate (1-hour freshness)
- App shell: 100% cache hit rate after first load

## Accessibility Requirements

### Voice Accessibility
- Visual feedback for all voice states (listening, processing, speaking)
- Keyboard alternatives for all voice commands
- Screen reader support for all UI elements
- ARIA labels on all interactive elements

### WCAG 2.2 Compliance
- Level AA minimum required
- Color contrast ratios met
- Focus indicators visible
- Touch targets: 44×44px minimum

## Governance

### Constitution Authority
- This constitution supersedes all other development practices
- All code reviews must verify constitutional compliance
- Spec and task references are mandatory (no exceptions)
- Quality gates cannot be bypassed
- GPG signing cannot be disabled

### Amendment Process
1. Propose amendment with justification
2. Document impact on existing code
3. Team review and approval required
4. Update this constitution (version increment)
5. Communicate changes to all contributors
6. Migration plan for breaking changes

### Violation Handling
- Missing spec/task reference: PR rejected
- Failed quality checks: Fix required before review
- Unsigned commits: PR rejected, rebase required
- Voice/PWA regression: Immediate fix required
- Privacy/security violation: PR rejected, audit required

### Documentation Requirements
- Product requirements: `./docs/product-details.md`
- Technical architecture: `./docs/technical-details.md`
- Development workflow: `./docs/workflow.md`
- Specifications: `./specs/<number>/spec.md`
- Tasks: `./specs/<number>/tasks.md`
- AI guidance: `./CLAUDE.md`

### Enforcement
All pull requests must include:
- [ ] Valid spec and task references in branch name
- [ ] All quality checks passing
- [ ] GPG signed commits with conventional format
- [ ] Voice and offline features tested
- [ ] Documentation updated
- [ ] Privacy/security reviewed
- [ ] Performance benchmarks met

**Version**: 1.0.0 | **Ratified**: 2025-12-16 | **Last Amended**: 2025-12-16
