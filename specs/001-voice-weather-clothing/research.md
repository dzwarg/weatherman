# Research: Voice-Activated Weather Clothing Advisor

**Date**: 2025-12-16
**Feature**: 001-voice-weather-clothing
**Status**: Complete

## Overview

This document captures research findings for technical decisions required to implement the Voice-Activated Weather Clothing Advisor PWA. All NEEDS CLARIFICATION items from the Technical Context have been investigated and resolved.

---

## 1. Weather API Provider Selection

### Decision
**OpenWeatherMap One Call API 3.0** (1,000 free calls/day, credit card required for "One Call by Call" subscription)

### Rationale
- **Comprehensive data**: Provides all required data points (current conditions, hourly/daily forecasts, temperature, precipitation, wind, humidity, UV index) in a single API call
- **Geolocation support**: Accepts lat/lon coordinates, perfect for device location services
- **8-day forecast**: Exceeds FR-005 requirement for multi-day forecasts (provides 8 days vs 5-day minimum)
- **Reliable service**: Industry-standard with 99.9% uptime SLA
- **Free tier sufficient**: 1,000 calls/day included at no cost, ideal for personal/family use with 1-hour caching strategy (estimated ~20-50 calls/day for family)
- **Pay-as-you-go**: Only charged €0.14 per 100 calls beyond 1,000/day limit (no upfront monthly fee)
- **Simple authentication**: API key-based (no OAuth complexity)
- **Response time**: Typically < 1 second (well within 5-second timeout requirement)
- **Credit card requirement**: Subscription requires credit card on file but charges only for usage exceeding free tier

### Free Tier Alternative (No Credit Card)

If credit card requirement is a blocker, **OpenWeatherMap Free APIs** (Current Weather + 5 Day Forecast) are available:

**Pros**:
- Truly free, no credit card required
- 60 calls/minute rate limit
- Current weather + 5-day/3-hour forecast

**Cons**:
- **Missing UV index** (required by spec for sunscreen recommendations)
- Requires 2 API calls instead of 1 (current + forecast)
- Only 5-day forecast (vs 8-day in One Call API 3.0)
- Only 3-hour intervals (vs hourly + daily in One Call API 3.0)
- No national weather alerts

**Verdict**: Would require spec modifications to remove UV-based recommendations or integrate additional UV index API

### Alternatives Considered

**Weather.gov API (National Weather Service - FREE)**
- **Pros**: Free, no API key required, official US government data
- **Cons**:
  - US-only coverage (requirement doesn't specify geography, but limiting)
  - Complex response format (requires multiple endpoints)
  - No UV index in standard responses
  - Less reliable than commercial services
  - Documentation less comprehensive
- **Rejected because**: Complexity of multiple endpoint calls and missing UV data would require additional work

**WeatherAPI.com (Freemium model)**
- **Pros**: Free tier includes 1M calls/month, comprehensive data
- **Cons**:
  - Requires credit card even for free tier
  - Commercial service with potential future pricing changes
  - Less established than OpenWeatherMap
- **Rejected because**: OpenWeatherMap is more widely adopted and documented

**Tomorrow.io (formerly Climacell)**
- **Pros**: Modern API, excellent documentation, real-time weather
- **Cons**:
  - More expensive ($50/month for similar usage)
  - Overkill for this use case (designed for enterprise)
  - Newer service with shorter track record
- **Rejected because**: Higher cost without significant benefit for our use case

### Implementation Notes
- **Endpoint**: `https://api.openweathermap.org/data/3.0/onecall`
- **Required parameters**: `lat`, `lon`, `appid`, `units=imperial`, `exclude=minutely`
- **Response caching**: 1 hour (per constitution)
- **Fallback**: Display stale cached data when API unavailable
- **API Key storage**: Environment variable `VITE_OPENWEATHER_API_KEY`

---

## 2. E2E Testing Framework for Voice Interactions

### Decision
**Playwright** with custom voice interaction mocking

### Rationale
- **Modern and maintained**: Active development, Microsoft-backed
- **Multi-browser support**: Chrome, Firefox, Safari (important for Web Speech API compatibility testing)
- **Strong mobile testing**: Can simulate mobile devices (key for PWA testing)
- **Network interception**: Can mock weather API responses
- **Fast execution**: Headless mode with parallel test execution
- **Better debugging**: Built-in trace viewer, screenshot on failure
- **Voice API mocking strategy**:
  - Web Speech API cannot be automated directly in E2E tests
  - Mock `SpeechRecognition` and `SpeechSynthesis` APIs
  - Create custom Playwright fixtures for voice simulation
  - Test voice state transitions and UI feedback, not actual speech processing

### Alternatives Considered

**Cypress**
- **Pros**: Popular, great developer experience, time-travel debugging
- **Cons**:
  - Runs in-browser (harder to mock Web Speech API cleanly)
  - Single-browser testing in open-source version
  - Slower than Playwright for our use case
  - Less robust mobile testing
- **Rejected because**: Playwright offers better cross-browser and mobile testing for PWA requirements

**Puppeteer**
- **Pros**: Chrome DevTools Protocol access, lightweight
- **Cons**:
  - Chrome-only (can't test Safari/Firefox)
  - Less developer-friendly API than Playwright
  - No built-in assertion library
- **Rejected because**: Multi-browser support is critical for PWA

### Implementation Notes
- **Test structure**:
  ```javascript
  // Mock voice APIs globally
  await page.addInitScript(() => {
    window.SpeechRecognition = class MockSpeechRecognition { ... };
    window.SpeechSynthesis = class MockSpeechSynthesis { ... };
  });
  ```
- **Voice workflow testing**: Simulate wake word detection → query recognition → recommendation display → speech synthesis
- **Focus areas**:
  - Profile selection persistence
  - Offline mode behavior
  - Weather API failure handling
  - Voice state transitions (idle → listening → processing → speaking)

---

## 3. Seeds/Racine Design System Integration

### Decision
**Racine (Seeds by Sprout Social) with manual component imports and CSS customization**

### Rationale
- **Constitutional requirement**: Mandated by Weatherman Constitution (non-negotiable)
- **Component library**: Provides Button, Card, Icon, and other UI primitives
- **Accessibility built-in**: WCAG 2.2 Level AA compliant components
- **CSS Variables**: Themeable with CSS custom properties (matches PWA approach)
- **React-based**: Native React components, no framework adapter needed
- **Documentation**: Well-documented at https://seeds.sproutsocial.com/

### Integration Strategy

1. **Package Installation**:
   ```bash
   yarn add @sproutsocial/racine @sproutsocial/seeds-react
   ```

2. **Import Approach**:
   - Use named imports for specific components (tree-shaking friendly)
   - Import Seeds CSS tokens globally in `main.jsx`
   - Extend with custom CSS for child-specific styling

3. **Custom Theming**:
   - Override CSS variables for child-friendly aesthetics
   - Larger touch targets (44×44px minimum per constitution)
   - Brighter colors suitable for children
   - Larger fonts for readability

4. **Component Usage**:
   ```jsx
   import { Button, Card, Icon } from '@sproutsocial/seeds-react';
   import '@sproutsocial/seeds-tokens/dist/css/variables.css';
   ```

### Challenges & Solutions

**Challenge**: Seeds/Racine design system is corporate-focused, not child-focused
- **Solution**: Use base components but apply custom CSS overrides for child-friendly aesthetics
- **Child-specific customizations**:
  - Rounded corners (more playful)
  - Bright, primary colors
  - Large, simple icons
  - Generous spacing for touch targets

**Challenge**: Voice interaction visual feedback not part of standard design system
- **Solution**: Create custom components (`VoiceFeedback.jsx`) using Seeds primitives
- **Visual states to build**:
  - Idle (gray, subtle icon)
  - Listening (pulsing blue animation)
  - Processing (spinner)
  - Speaking (animated waveform)
  - Error (red with clear icon)

**Challenge**: Profile selection cards need custom design
- **Solution**: Use Seeds `Card` component as base, add custom profile-specific styling
- **Profile card features**:
  - Large, clear profile image/icon
  - Age and gender prominently displayed
  - Simple selection state (border highlight)

### Implementation Notes
- **CSS file structure**:
  ```
  src/
  ├── styles/
  │   ├── seeds-overrides.css   # Custom theme variables
  │   ├── child-theme.css        # Child-specific styles
  │   └── voice-feedback.css     # Custom voice UI animations
  ```

- **Custom CSS Variables**:
  ```css
  :root {
    --weatherbot-primary: #4A90E2;      /* Child-friendly blue */
    --weatherbot-success: #7ED321;      /* Bright green */
    --weatherbot-warning: #F5A623;      /* Warm orange */
    --weatherbot-error: #D0021B;        /* Clear red */
    --weatherbot-border-radius: 12px;   /* Rounded corners */
    --weatherbot-spacing-lg: 24px;      /* Generous spacing */
  }
  ```

---

## Summary of Resolved Decisions

| Technical Decision | Resolved Choice | Justification |
|--------------------|-----------------|---------------|
| Weather API Provider | OpenWeatherMap One Call API 3.0 | Comprehensive data, reliable, well-documented, single endpoint |
| E2E Testing Framework | Playwright with voice API mocking | Multi-browser support, mobile testing, better for PWA |
| Design System Integration | Racine/Seeds with custom child-friendly overrides | Constitutional requirement, accessible, React-native, customizable |

---

## Next Steps (Phase 1)

With research complete, proceed to Phase 1:
1. Generate `data-model.md` (entity definitions from spec)
2. Create API contracts in `contracts/` (weather API integration)
3. Generate `quickstart.md` (developer onboarding)
4. Update agent context with chosen technologies

All NEEDS CLARIFICATION items from Technical Context have been resolved and are ready for implementation planning.
