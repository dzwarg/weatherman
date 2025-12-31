# Troubleshooting Guide

This guide helps resolve common issues with Weatherman, including voice recognition, API errors, permissions, and more.

## Table of Contents

- [Voice Recognition Issues](#voice-recognition-issues)
- [Microphone Permission Issues](#microphone-permission-issues)
- [Location Permission Issues](#location-permission-issues)
- [Weather API Errors](#weather-api-errors)
- [PWA Installation Issues](#pwa-installation-issues)
- [Offline Mode Issues](#offline-mode-issues)
- [Performance Issues](#performance-issues)
- [Browser Compatibility](#browser-compatibility)

## Voice Recognition Issues

### Wake Word Not Detected

**Problem**: Saying "Good morning weatherbot" doesn't activate the system

**Solutions**:

1. **Check microphone permissions**:
   - Browser should prompt for microphone access
   - Look for microphone icon in address bar
   - Click and allow microphone access

2. **Verify HTTPS connection**:
   ```
   ❌ http://localhost:5173 - Voice won't work
   ✅ https://localhost:5173 - Voice will work
   ```

3. **Try speaking more clearly**:
   - Reduce background noise
   - Speak at normal pace
   - Try saying "Good morning, weatherbot" with a pause

4. **Check browser support**:
   - Chrome/Edge 90+: ✅ Fully supported
   - Safari 14.1+: ✅ Supported
   - Firefox: ❌ Not supported (no SpeechRecognition API)

5. **Reload the page**:
   ```bash
   Ctrl/Cmd + Shift + R  # Hard reload
   ```

### Voice Query Not Recognized

**Problem**: Wake word works but query isn't understood

**Solutions**:

1. **Wait for "Listening..." indicator** before speaking

2. **Use supported phrases**:
   ```
   ✅ "What should I wear today?"
   ✅ "Do I need a jacket?"
   ✅ "What's the weather?"
   ❌ "Mumble mumble"
   ```

3. **Check confidence level**:
   - System requires >50% confidence
   - If speech is unclear, try again

4. **Verify microphone quality**:
   - Test with other voice apps
   - Check microphone settings
   - Use headset mic for better quality

### Voice Response Not Speaking

**Problem**: Recommendations show but no voice output

**Solutions**:

1. **Check system volume**:
   - System volume > 0
   - Browser tab not muted

2. **Enable speech synthesis**:
   - Some browsers require user interaction first
   - Try clicking anywhere on page first

3. **Check browser permissions**:
   - Speech synthesis may need permission in some browsers

4. **Try different voice**:
   - Go to browser settings → Speech/Voice
   - Select different text-to-speech voice

## Microphone Permission Issues

### Permission Denied Error

**Problem**: Browser blocked microphone access

**Chrome/Edge Solutions**:

1. **Click microphone icon** in address bar
2. **Select "Always allow"**
3. **Reload page**

Or manually:

```
1. Navigate to chrome://settings/content/microphone
2. Add https://localhost:5173 to Allow list
3. Reload Weatherman
```

**Safari Solutions**:

```
1. Safari → Preferences → Websites → Microphone
2. Find Weatherman in list
3. Change to "Allow"
4. Reload page
```

**macOS System Permission** (if still not working):

```
1. System Preferences → Security & Privacy → Privacy
2. Select "Microphone" from left sidebar
3. Check box next to your browser
4. Restart browser
```

### Microphone Not Found

**Problem**: "No microphone detected" error

**Solutions**:

1. **Check hardware**:
   - Microphone plugged in?
   - Correct input device selected?
   - Test with other apps

2. **Check system settings**:
   - macOS: System Preferences → Sound → Input
   - Windows: Settings → System → Sound → Input
   - Linux: Settings → Sound → Input

3. **Restart browser** to detect new devices

## Location Permission Issues

### Location Access Denied

**Problem**: Can't get current location for weather

**Solutions**:

1. **Grant location permission**:
   - Browser prompts for permission
   - Click "Allow" when prompted

2. **Manually enable** (if blocked):

   **Chrome/Edge**:
   ```
   1. Click location icon in address bar
   2. Select "Always allow location access"
   3. Reload page
   ```

   **Safari**:
   ```
   1. Safari → Preferences → Websites → Location Services
   2. Find Weatherman
   3. Change to "Allow"
   4. Reload page
   ```

3. **Check system location services**:

   **macOS**:
   ```
   System Preferences → Security & Privacy → Privacy → Location Services
   - Enable Location Services
   - Allow browser access
   ```

   **Windows**:
   ```
   Settings → Privacy → Location
   - Turn on location access
   - Allow apps to access location
   ```

### Location Timeout

**Problem**: "Location request timed out"

**Solutions**:

1. **Check GPS/Wi-Fi**:
   - Enable Wi-Fi for better accuracy
   - May take longer on first request

2. **Increase timeout** (developer):
   ```javascript
   // In Home.jsx, getCurrentLocation()
   timeout: 10000,  // Increase to 10 seconds
   ```

3. **Use cached location**:
   - Browser caches location for 5 minutes
   - Subsequent requests are faster

## Weather API Errors

### API Key Invalid

**Problem**: "Invalid API key" error

**Solutions**:

1. **Check `.env` file**:
   ```env
   VITE_OPENWEATHER_API_KEY=your_actual_key_here
   ```

2. **Verify API key**:
   - Log in to [OpenWeatherMap](https://home.openweathermap.org/api_keys)
   - Confirm key is active
   - May take 2 hours to activate after creation

3. **Restart dev server**:
   ```bash
   # Environment variables only loaded on start
   npm run dev
   ```

### API Request Timeout

**Problem**: "Request timed out" after 5 seconds

**Solutions**:

1. **Check internet connection**:
   - Verify network is active
   - Try accessing api.openweathermap.org

2. **Increase timeout** (optional):
   ```env
   VITE_OPENWEATHER_TIMEOUT=10000  # 10 seconds
   ```

3. **Use cached data**:
   - System automatically falls back to stale cache
   - Shows "Using cached data" message

### Rate Limit Exceeded

**Problem**: "Too many requests" error

**Solutions**:

1. **Wait 1 hour**:
   - Free tier: 1000 calls/day, 60 calls/minute
   - Cache reduces API calls

2. **Check cache settings**:
   ```env
   VITE_WEATHER_CACHE_DURATION=3600000  # 1 hour cache
   ```

3. **Upgrade plan**:
   - [OpenWeatherMap pricing](https://openweathermap.org/price)

### Network Error

**Problem**: "Network error" when fetching weather

**Solutions**:

1. **Check CORS** (if self-hosted API proxy):
   - API must allow cross-origin requests
   - Or use server-side proxy

2. **Verify API endpoint**:
   ```javascript
   // In weatherService.js
   https://api.openweathermap.org/data/3.0/onecall
   ```

3. **Check firewall/antivirus**:
   - May block API requests
   - Whitelist api.openweathermap.org

## PWA Installation Issues

### "Install App" Not Showing

**Problem**: No install prompt appears

**Solutions**:

1. **Check PWA criteria** (all must be met):
   - ✅ HTTPS connection
   - ✅ Valid manifest.webmanifest
   - ✅ Service Worker registered
   - ✅ Icons present (192×192, 512×512)
   - ✅ User has not dismissed prompt recently

2. **Run Lighthouse audit**:
   ```bash
   npm run build
   npm run preview
   npm run lighthouse
   ```
   - Should score 100/100 on PWA category

3. **Manual installation**:

   **Chrome/Edge**:
   ```
   Menu (⋮) → Install Weatherman...
   ```

   **Safari (iOS)**:
   ```
   Share → Add to Home Screen
   ```

### Service Worker Not Updating

**Problem**: Old version of app is cached

**Solutions**:

1. **Hard reload**:
   ```
   Ctrl/Cmd + Shift + R
   ```

2. **Clear service worker**:
   ```
   1. Open DevTools (F12)
   2. Application tab → Service Workers
   3. Click "Unregister"
   4. Reload page
   ```

3. **Clear all caches**:
   ```
   1. DevTools → Application → Storage
   2. Click "Clear site data"
   3. Reload page
   ```

## Offline Mode Issues

### Offline Mode Not Working

**Problem**: Shows error when offline instead of cached data

**Solutions**:

1. **Fetch data while online first**:
   - Cache is only populated after successful fetch
   - Use app online at least once

2. **Check cache status**:
   ```javascript
   // In DevTools console
   const cacheService = await import('./src/services/cacheService.js');
   const cached = await cacheService.default.get(lat, lon);
   console.log('Cached data:', cached);
   ```

3. **Verify Service Worker**:
   ```
   1. DevTools → Application → Service Workers
   2. Should show "activated and is running"
   ```

### Stale Data Shown

**Problem**: Weather data seems outdated

**Solutions**:

1. **Check cache expiry**:
   - Data cached for 1 hour by default
   - Shows "stale" badge if >1 hour old

2. **Force refresh**:
   - Go online
   - Reload page
   - New data will be fetched

3. **Clear cache**:
   ```javascript
   // In DevTools console
   const cacheService = await import('./src/services/cacheService.js');
   await cacheService.default.clear();
   location.reload();
   ```

## Performance Issues

### Slow Page Load

**Problem**: App takes long to load initially

**Solutions**:

1. **Check bundle size**:
   ```bash
   npm run build
   # Should be < 200KB gzipped
   ```

2. **Enable compression** (if self-hosting):
   - Use gzip or brotli compression
   - Should be automatic with most hosting

3. **Check network speed**:
   - Slow connection affects initial load
   - PWA caches for faster subsequent loads

### High Memory Usage

**Problem**: Browser tab using lots of memory

**Solutions**:

1. **Check for memory leaks**:
   - Voice recognition listeners may not be cleaned up
   - Reload page to clear

2. **Limit cache size**:
   ```javascript
   // cacheService.js already limits to 10 entries
   const MAX_CACHE_ENTRIES = 10;
   ```

3. **Close unused tabs/apps**

## Browser Compatibility

### Feature Not Working in Browser

**Browser Support Matrix**:

| Feature | Chrome 90+ | Safari 14.1+ | Firefox | Edge 90+ |
|---------|-----------|--------------|---------|----------|
| Voice Recognition | ✅ | ✅ | ❌ | ✅ |
| Voice Synthesis | ✅ | ✅ | ✅ | ✅ |
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| Geolocation | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |

**Recommended Browsers**:
- **Chrome 90+** (best support)
- **Edge 90+** (best support)
- **Safari 14.1+** (good support, no custom wake phrases)

**Not Recommended**:
- **Firefox** (no SpeechRecognition API)
- **Internet Explorer** (not supported)

## Getting More Help

If your issue isn't listed here:

1. **Check browser console** (F12):
   - Look for error messages
   - Share full error text when reporting

2. **Search existing issues**:
   - [GitHub Issues](https://github.com/your-org/weatherman/issues)

3. **Open a new issue**:
   - Include browser version
   - Include steps to reproduce
   - Include console errors
   - Include screenshots if applicable

4. **Debug mode** (for developers):
   ```javascript
   // Set in browser console
   localStorage.setItem('weatherbot:debug', 'true');
   location.reload();
   ```

---

For more information, see:
- [Voice Commands Guide](./voice-commands.md)
- [Technical Details](./technical-details.md)
- [Contributing Guide](../CONTRIBUTING.md)
