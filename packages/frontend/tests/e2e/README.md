# End-to-End Tests

This directory contains Playwright-based E2E tests for the Weatherman application.

## Prerequisites

- Node.js 22+
- HTTPS certificates (localhost-key.pem, localhost-cert.pem in project root)
- Both frontend and backend servers available

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e --workspace=@weatherman/frontend

# Run with UI mode (interactive)
npm run test:e2e:ui --workspace=@weatherman/frontend

# Run in debug mode
npm run test:e2e:debug --workspace=@weatherman/frontend

# From root (both packages)
npm run test:e2e --workspace=@weatherman/frontend
```

## Test Structure

### voice-workflow.test.js

Tests the complete voice interaction workflow:

1. **Profile Selection** - User selects age/gender profile
2. **Wake Word Detection** - "Good morning weatherbot" triggers listening
3. **Voice Query** - User asks "What should I wear today?"
4. **Server Integration** - API calls to weather and recommendations endpoints
5. **Recommendation Display** - Clothing suggestions shown with weather data
6. **Voice Output** - Spoken response plays back to user

Also includes:
- Profile switching and persistence
- Offline handling
- Permission errors
- API timeout handling
- Keyboard navigation
- ARIA accessibility

## Configuration

See `playwright.config.js` for:
- Test directory and file patterns
- Timeout settings
- Browser configuration
- Web server startup
- Screenshot/video recording

## Notes

- Tests require HTTPS for voice recognition APIs
- Self-signed certificates are automatically accepted
- Both frontend (port 5173) and backend (port 3000) start automatically
- Tests simulate voice input through JavaScript injection
- Geolocation is mocked to Boston, MA

## Troubleshooting

**Certificate errors**: Ensure localhost-key.pem and localhost-cert.pem exist in project root

**Port conflicts**: Stop any existing dev servers before running tests

**Timeout errors**: Increase timeout in playwright.config.js or individual tests

**Browser not found**: Run `npx playwright install chromium --with-deps`
