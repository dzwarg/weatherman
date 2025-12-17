# Weather Service Interface Contract

**Date**: 2025-12-16
**Feature**: 001-voice-weather-clothing
**Component**: `src/services/weatherService.js`

## Overview

This document defines the interface contract for the `weatherService` module, which abstracts OpenWeatherMap API integration and provides caching, error handling, and data transformation for the Weatherman application.

---

## Service Interface

### `weatherService`

Main service object exported from `src/services/weatherService.js`.

**Methods**:
- `getCurrentWeather(location)`: Get current weather for a location
- `getForecast(location, days)`: Get multi-day forecast
- `clearCache()`: Manually clear weather cache
- `getCacheStatus(location)`: Check cache freshness for location

---

## Method Specifications

### `getCurrentWeather(location)`

Retrieves current weather conditions for a given location. Implements 1-hour caching strategy per constitution.

**Parameters**:
- `location` (object, required):
  - `lat` (number, required): Latitude
  - `lon` (number, required): Longitude

**Returns**: Promise<WeatherData>
- Resolves with `WeatherData` object (see data-model.md)
- Rejects with `WeatherServiceError` on failure

**Behavior**:
1. Check IndexedDB cache for location (`lat,lon` key)
2. If cache fresh (< 1 hour old): Return cached data immediately
3. If cache stale or missing: Make API call to OpenWeatherMap
4. On API success: Update cache, return data
5. On API failure: Return stale cache if available (with staleness indicator)
6. On API failure with no cache: Throw `WeatherServiceError`

**Caching Strategy**:
- **Key**: `"${lat},${lon}"` (e.g., "42.3601,-71.0589")
- **Expiry**: 1 hour from fetch time
- **Staleness acceptable**: Yes, if network unavailable
- **Max cache entries**: 10 locations (auto-purge oldest)

**Timeout**: 5 seconds (per FR-015)

**Example**:
```javascript
const location = { lat: 42.3601, lon: -71.0589 };
const weather = await weatherService.getCurrentWeather(location);
// Returns: WeatherData object with current conditions and forecast
```

**Error Handling**:
```javascript
try {
  const weather = await weatherService.getCurrentWeather(location);
} catch (error) {
  if (error instanceof WeatherServiceError) {
    // Handle specific error types
    switch (error.code) {
      case 'TIMEOUT':
        // API timeout (> 5 seconds)
        break;
      case 'NETWORK_ERROR':
        // Network unavailable, no cache
        break;
      case 'API_ERROR':
        // API returned error (400, 401, 429, 500)
        break;
      case 'INVALID_LOCATION':
        // Invalid lat/lon parameters
        break;
    }
  }
}
```

---

### `getForecast(location, days)`

Retrieves multi-day weather forecast for a location.

**Parameters**:
- `location` (object, required):
  - `lat` (number, required): Latitude
  - `lon` (number, required): Longitude
- `days` (number, optional): Number of forecast days (default: 5, max: 8)

**Returns**: Promise<WeatherData>
- Resolves with `WeatherData` object including `dailyForecast` array
- Rejects with `WeatherServiceError` on failure

**Behavior**:
- Same caching strategy as `getCurrentWeather()`
- Returns daily forecast array with requested number of days
- Defaults to 5-day forecast if `days` not specified

**Example**:
```javascript
const location = { lat: 42.3601, lon: -71.0589 };
const forecast = await weatherService.getForecast(location, 7);
// Returns: WeatherData with 7-day dailyForecast array
```

---

### `clearCache()`

Manually clears all weather data from IndexedDB cache.

**Parameters**: None

**Returns**: Promise<void>
- Resolves when cache cleared successfully
- Rejects on IndexedDB error

**Use Cases**:
- User requests fresh data
- Cache corruption detected
- Testing/debugging

**Example**:
```javascript
await weatherService.clearCache();
// All cached weather data removed from IndexedDB
```

---

### `getCacheStatus(location)`

Checks cache freshness for a specific location without making API call.

**Parameters**:
- `location` (object, required):
  - `lat` (number, required): Latitude
  - `lon` (number, required): Longitude

**Returns**: Promise<CacheStatus>
- Resolves with cache status object:
  ```javascript
  {
    exists: boolean,          // Cache entry exists
    fresh: boolean,           // Cache is < 1 hour old
    age: number,              // Age in milliseconds
    fetchedAt: string,        // ISO 8601 timestamp
    expiresAt: string         // ISO 8601 timestamp
  }
  ```

**Example**:
```javascript
const location = { lat: 42.3601, lon: -71.0589 };
const status = await weatherService.getCacheStatus(location);

if (status.fresh) {
  console.log('Cache is fresh, no API call needed');
} else if (status.exists) {
  console.log(`Cache is ${status.age}ms old (stale)`);
} else {
  console.log('No cache for this location');
}
```

---

## Error Types

### `WeatherServiceError`

Custom error class for weather service failures.

**Properties**:
- `name` (string): "WeatherServiceError"
- `message` (string): Human-readable error message
- `code` (string): Error code (see below)
- `details` (object, optional): Additional error context

**Error Codes**:

| Code | Description | Recovery Strategy |
|------|-------------|-------------------|
| `TIMEOUT` | API call exceeded 5-second timeout | Use stale cache if available, else show error |
| `NETWORK_ERROR` | Network unavailable (offline) | Use stale cache if available, else show error |
| `API_ERROR` | OpenWeatherMap API returned error | Check `details.statusCode` for specifics |
| `INVALID_LOCATION` | Invalid lat/lon parameters | Validate input, prompt user |
| `CACHE_ERROR` | IndexedDB read/write failure | Retry or fall back to memory cache |
| `PARSE_ERROR` | Failed to parse API response | Log error, use stale cache if available |

**Example**:
```javascript
class WeatherServiceError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'WeatherServiceError';
    this.code = code;
    this.details = details;
  }
}

// Usage
throw new WeatherServiceError(
  'API request timed out after 5 seconds',
  'TIMEOUT',
  { location: { lat, lon } }
);
```

---

## Data Transformation

### OpenWeatherMap Response → WeatherData

The service transforms OpenWeatherMap API responses into the app's `WeatherData` model (see data-model.md).

**Key Transformations**:
1. **Timestamps**: Convert Unix timestamps to ISO 8601 strings
2. **Temperature**: Already in °F (units=imperial parameter)
3. **Precipitation**: Convert probability from 0-1 to 0-100 percentage
4. **Conditions**: Map weather ID to human-readable condition string
5. **Icons**: Preserve icon codes for UI rendering
6. **Location name**: Reverse geocode lat/lon to city name (cache result)

**Condition Mapping**:
```javascript
const conditionMap = {
  // Thunderstorm group (2xx)
  200-299: 'Thunderstorm',

  // Drizzle group (3xx)
  300-399: 'Drizzle',

  // Rain group (5xx)
  500-599: 'Rain',

  // Snow group (6xx)
  600-699: 'Snow',

  // Atmosphere group (7xx)
  700-799: 'Fog',

  // Clear (800)
  800: 'Clear',

  // Clouds group (80x)
  801-804: 'Cloudy'
};
```

---

## Configuration

### Environment Variables

Required in `.env` file:
```
VITE_OPENWEATHER_API_KEY=your_api_key_here
VITE_OPENWEATHER_TIMEOUT=5000
VITE_WEATHER_CACHE_DURATION=3600000
```

### Constants

Defined in `src/utils/constants.js`:
```javascript
export const WEATHER_CONFIG = {
  API_URL: 'https://api.openweathermap.org/data/3.0/onecall',
  TIMEOUT_MS: 5000,
  CACHE_DURATION_MS: 3600000,  // 1 hour
  MAX_CACHE_ENTRIES: 10,
  UNITS: 'imperial',            // Fahrenheit
  EXCLUDE: 'minutely',          // Don't need minute-by-minute
  LANGUAGE: 'en'
};
```

---

## Testing Contract

### Unit Tests (Vitest)

Test file: `tests/unit/services/weatherService.test.js`

**Required test cases**:
1. **Cache hit (fresh)**:
   - Given: Fresh cache exists (< 1 hour)
   - When: `getCurrentWeather()` called
   - Then: Return cached data, no API call made

2. **Cache miss**:
   - Given: No cache for location
   - When: `getCurrentWeather()` called
   - Then: Make API call, cache result, return data

3. **Cache stale with network**:
   - Given: Stale cache (> 1 hour), network available
   - When: `getCurrentWeather()` called
   - Then: Make API call, update cache, return fresh data

4. **Cache stale without network**:
   - Given: Stale cache, network unavailable
   - When: `getCurrentWeather()` called
   - Then: Return stale cache with staleness indicator

5. **API timeout**:
   - Given: API call takes > 5 seconds
   - When: `getCurrentWeather()` called
   - Then: Timeout, throw `WeatherServiceError` with code `TIMEOUT`

6. **API error (401)**:
   - Given: Invalid API key
   - When: `getCurrentWeather()` called
   - Then: Throw `WeatherServiceError` with code `API_ERROR`, details include status 401

7. **Invalid location**:
   - Given: lat = 999 (invalid)
   - When: `getCurrentWeather()` called
   - Then: Throw `WeatherServiceError` with code `INVALID_LOCATION`

8. **Cache purge (max entries)**:
   - Given: 10 cached locations (max)
   - When: Request 11th location
   - Then: Purge oldest entry, cache new location

### Integration Tests

Test file: `tests/integration/weather-workflow.test.js`

**Required test cases**:
1. **Full weather fetch flow**: Profile selected → voice query → weather fetched → recommendation generated
2. **Offline behavior**: Network unavailable → stale cache used → staleness displayed
3. **Cache persistence**: Fetch weather → close app → reopen → cache still available

---

## Performance Requirements

- **Cache read**: < 50ms (IndexedDB)
- **Cache write**: < 100ms (IndexedDB, async)
- **API call (success)**: < 2 seconds typical, < 5 seconds timeout
- **Total response time**: < 10 seconds (including recommendation generation)

---

## Dependencies

- **External**: OpenWeatherMap One Call API 3.0 (see `openweathermap-api.yaml`)
- **Internal**:
  - `src/services/cacheService.js`: IndexedDB abstraction
  - `src/services/storageService.js`: LocalStorage/SessionStorage utilities
  - `src/utils/weatherUtils.js`: Data transformation helpers
  - `src/utils/constants.js`: Configuration constants

---

## Next Steps

With API contracts defined, proceed to:
1. Generate quickstart documentation
2. Implement `weatherService.js` following this contract
3. Write unit tests per testing contract
4. Integrate with recommendation service
