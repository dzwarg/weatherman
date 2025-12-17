# Data Model: Voice-Activated Weather Clothing Advisor

**Date**: 2025-12-16
**Feature**: 001-voice-weather-clothing
**Spec Reference**: [spec.md](./spec.md)

## Overview

This document defines the data entities, their attributes, relationships, validation rules, and storage mechanisms for the Weatherman application. All entities are client-side only (no backend database).

---

## Entity Definitions

### 1. UserProfile

Represents a child's profile for personalized clothing recommendations.

**Attributes**:
- `id` (string, required): Unique identifier (one of: `"4-girl"`, `"7-boy"`, `"10-boy"`)
- `age` (number, required): Child's age (4, 7, or 10)
- `gender` (string, required): Child's gender (`"girl"` or `"boy"`)
- `complexityLevel` (string, required): Clothing complexity (`"simple"`, `"moderate"`, `"complex"`)
- `vocabularyStyle` (string, required): Wardrobe terminology style (`"girl-typical"`, `"boy-typical"`)
- `displayName` (string, required): Human-readable profile name
- `createdAt` (ISO 8601 string): Profile creation timestamp
- `lastSelected` (ISO 8601 string, optional): Last time this profile was active

**Validation Rules**:
- `id` must be one of the three predefined values
- `age` must be exactly 4, 7, or 10
- `gender` must be exactly `"girl"` or `"boy"`
- `complexityLevel` derived from age:
  - Age 4: `"simple"` (pull-on clothes, no buttons/zippers)
  - Age 7: `"moderate"` (some fasteners, simple layers)
  - Age 10: `"complex"` (all clothing types)
- `vocabularyStyle` matches gender

**Storage**: LocalStorage (key: `weatherbot:selectedProfile`)

**Example**:
```json
{
  "id": "4-girl",
  "age": 4,
  "gender": "girl",
  "complexityLevel": "simple",
  "vocabularyStyle": "girl-typical",
  "displayName": "4 year old girl",
  "createdAt": "2025-12-16T10:00:00.000Z",
  "lastSelected": "2025-12-16T14:30:00.000Z"
}
```

**Relationships**:
- One-to-many with `ClothingRecommendation` (one profile generates multiple recommendations over time)
- No relationship with `WeatherData` (indirect via recommendations)

---

### 2. WeatherData

Current and forecast weather conditions for a location.

**Attributes**:
- `location` (object, required):
  - `lat` (number): Latitude
  - `lon` (number): Longitude
  - `name` (string): City/location name (e.g., "Boston, MA")
  - `timezone` (string): IANA timezone (e.g., "America/New_York")

- `current` (object, required):
  - `timestamp` (ISO 8601 string): Observation time
  - `temperature` (number): Temperature in °F
  - `feelsLike` (number): "Feels like" temperature in °F
  - `conditions` (string): Weather condition (e.g., "Clear", "Rain", "Snow", "Cloudy")
  - `precipitationProbability` (number): Percentage (0-100)
  - `windSpeed` (number): mph
  - `windGust` (number, optional): mph
  - `humidity` (number): Percentage (0-100)
  - `uvIndex` (number): 0-11+ scale
  - `icon` (string): Weather icon code

- `hourlyForecast` (array of objects, optional):
  - Same structure as `current` but for hourly predictions (next 48 hours)

- `dailyForecast` (array of objects, required):
  - `date` (ISO 8601 string): Forecast date
  - `temperatureHigh` (number): High temperature in °F
  - `temperatureLow` (number): Low temperature in °F
  - `conditions` (string): Weather condition summary
  - `precipitationProbability` (number): Percentage (0-100)
  - `windSpeed` (number): Average mph
  - `uvIndex` (number): 0-11+ scale
  - `icon` (string): Weather icon code

- `alerts` (array of objects, optional):
  - `title` (string): Alert title
  - `description` (string): Alert details
  - `severity` (string): "extreme", "severe", "moderate", "minor"
  - `start` (ISO 8601 string): Alert start time
  - `end` (ISO 8601 string): Alert end time

- `fetchedAt` (ISO 8601 string, required): When data was retrieved
- `cacheExpiry` (ISO 8601 string, required): When cache should be invalidated (fetchedAt + 1 hour)

**Validation Rules**:
- `temperature`, `feelsLike` must be between -100°F and 150°F
- `precipitationProbability` must be between 0 and 100
- `windSpeed` must be >= 0
- `humidity` must be between 0 and 100
- `uvIndex` must be >= 0
- `dailyForecast` must include at least today + next 4 days (5 total)
- `fetchedAt` must be in the past
- `cacheExpiry` must be after `fetchedAt`

**Storage**: IndexedDB (database: `weatherbot`, store: `weatherCache`, key: `"lat,lon"`)

**Cache Strategy**:
- **Network First with Fallback**: Attempt API call first
- **1-hour expiry**: Use cached data if less than 1 hour old
- **Stale data acceptable**: If network fails, use any cached data regardless of age (display staleness indicator)
- **Update frequency**: Refresh every 30 minutes when online and in-use

**Example**:
```json
{
  "location": {
    "lat": 42.3601,
    "lon": -71.0589,
    "name": "Boston, MA",
    "timezone": "America/New_York"
  },
  "current": {
    "timestamp": "2025-12-16T15:00:00.000Z",
    "temperature": 38,
    "feelsLike": 32,
    "conditions": "Partly Cloudy",
    "precipitationProbability": 20,
    "windSpeed": 12,
    "windGust": 18,
    "humidity": 65,
    "uvIndex": 2,
    "icon": "02d"
  },
  "dailyForecast": [
    {
      "date": "2025-12-16",
      "temperatureHigh": 42,
      "temperatureLow": 28,
      "conditions": "Partly Cloudy",
      "precipitationProbability": 20,
      "windSpeed": 10,
      "uvIndex": 2,
      "icon": "02d"
    }
    // ... 4 more days
  ],
  "fetchedAt": "2025-12-16T15:00:00.000Z",
  "cacheExpiry": "2025-12-16T16:00:00.000Z"
}
```

**Relationships**:
- One-to-many with `ClothingRecommendation` (weather data generates recommendations)
- One-to-many with `VoiceQuery` (queries trigger weather fetches)

---

### 3. ClothingRecommendation

Clothing suggestions based on weather and user profile.

**Attributes**:
- `id` (string, required): Unique identifier (UUID)
- `profileId` (string, required): Reference to `UserProfile.id`
- `weatherData` (object, required): Snapshot of weather conditions used
  - `temperature` (number): °F
  - `feelsLike` (number): °F
  - `conditions` (string): Weather description
  - `precipitationProbability` (number): 0-100
  - `windSpeed` (number): mph
- `recommendations` (object, required):
  - `outerwear` (array of strings): Coat, jacket, etc.
  - `baseLayers` (array of strings): Shirt, pants, dress, etc.
  - `accessories` (array of strings): Hat, gloves, scarf, umbrella, etc.
  - `footwear` (array of strings): Boots, sneakers, sandals, etc.
  - `specialNotes` (array of strings): Additional guidance (e.g., "Bring a light jacket for later")
- `spokenResponse` (string, required): Full text of what was spoken to user
- `confidence` (number, required): Confidence score 0.0-1.0
- `createdAt` (ISO 8601 string, required): When recommendation was generated
- `feedbackProvided` (boolean, optional): Whether user gave feedback (future enhancement)

**Validation Rules**:
- `profileId` must match existing profile
- `temperature` must be between -100°F and 150°F
- `precipitationProbability` must be between 0 and 100
- `confidence` must be between 0.0 and 1.0
- At least one recommendation category must have items
- `spokenResponse` must not be empty

**Storage**: Not persisted (generated on-demand, ephemeral)

**Recommendation Logic Rules**:

**Temperature-based**:
- Below 32°F: Heavy coat, hat, gloves, warm layers
- 32-45°F: Medium coat, optional hat/gloves
- 45-60°F: Light jacket or sweater
- 60-75°F: Long sleeves optional
- 75-85°F: Short sleeves, shorts
- Above 85°F: Light, breathable clothing, sunscreen

**Precipitation-based**:
- > 60% chance: Raincoat, umbrella, waterproof shoes
- 30-60% chance: Bring rain gear just in case
- < 30% chance: No rain gear needed

**Wind-based**:
- > 20 mph: Windbreaker, secure hat
- 10-20 mph: Consider light wind protection
- < 10 mph: No special wind considerations

**Profile-based adjustments**:
- **4-year-old (simple complexity)**:
  - Avoid: Buttons, zippers, laces
  - Prefer: Pull-on pants, elastic waists, velcro shoes
  - Language: "Your easy-on pants", "slip-on shoes"

- **7-year-old (moderate complexity)**:
  - Allow: Simple buttons, basic zippers
  - Prefer: Mix of simple and moderate items
  - Language: More varied vocabulary

- **10-year-old (complex complexity)**:
  - Allow: All clothing types
  - Vocabulary: Full range of terms

- **Gender-typical vocabulary**:
  - **Girl**: Dress, skirt, leggings, tights, sundress, cardigan, headband
  - **Boy**: Polo shirt, khakis, cargo shorts, hoodie, baseball cap

**Example**:
```json
{
  "id": "rec-123e4567-e89b-12d3-a456-426614174000",
  "profileId": "4-girl",
  "weatherData": {
    "temperature": 38,
    "feelsLike": 32,
    "conditions": "Partly Cloudy",
    "precipitationProbability": 20,
    "windSpeed": 12
  },
  "recommendations": {
    "outerwear": ["Warm coat"],
    "baseLayers": ["Long sleeve shirt", "Pull-on leggings"],
    "accessories": ["Hat", "Mittens"],
    "footwear": ["Boots"],
    "specialNotes": ["It's chilly today, so wear your warm coat!"]
  },
  "spokenResponse": "Good morning! It's cold outside today, 38 degrees but feels like 32. You should wear your warm coat, a long sleeve shirt, pull-on leggings, and boots. Don't forget your hat and mittens!",
  "confidence": 0.95,
  "createdAt": "2025-12-16T07:30:00.000Z"
}
```

**Relationships**:
- Many-to-one with `UserProfile` (recommendation belongs to one profile)
- Many-to-one with `WeatherData` (recommendation based on one weather snapshot)
- One-to-one with `VoiceQuery` (each query generates one recommendation)

---

### 4. VoiceQuery

Parsed voice input from the child.

**Attributes**:
- `id` (string, required): Unique identifier (UUID)
- `rawTranscript` (string, required): Full voice input text
- `parsedIntent` (string, required): Detected intent (`"clothing_advice"`, `"weather_check"`, `"location_query"`)
- `entities` (object, required):
  - `timeReference` (string, optional): `"today"`, `"tomorrow"`, `"this_afternoon"`, etc.
  - `location` (string, optional): City/location name if specified
  - `followUp` (boolean): Whether this is a follow-up question
- `profileId` (string, optional): Active profile at time of query
- `recognitionConfidence` (number, required): 0.0-1.0 from speech recognition API
- `timestamp` (ISO 8601 string, required): When query was received
- `responseTime` (number, optional): Milliseconds to generate response

**Validation Rules**:
- `rawTranscript` must not be empty
- `parsedIntent` must be one of valid intents
- `recognitionConfidence` must be between 0.0 and 1.0
- `responseTime` should be < 10000ms (10 seconds per SC-001)

**Storage**: Not persisted (ephemeral, processed immediately)

**Intent Detection Rules**:
- **clothing_advice**: Keywords "wear", "clothing", "clothes", "outfit", "dress"
- **weather_check**: Keywords "weather", "temperature", "forecast", "rain", "sunny"
- **location_query**: Contains city/state names or "in [location]"

**Entity Extraction**:
- **Time references**: "today", "tomorrow", "this week", "morning", "afternoon", "evening"
- **Locations**: Named entity recognition for cities/states
- **Follow-ups**: Lacks wake phrase, assumes context from previous query

**Example**:
```json
{
  "id": "query-123e4567-e89b-12d3-a456-426614174000",
  "rawTranscript": "Good morning weatherbot, what should I wear today?",
  "parsedIntent": "clothing_advice",
  "entities": {
    "timeReference": "today",
    "location": null,
    "followUp": false
  },
  "profileId": "4-girl",
  "recognitionConfidence": 0.92,
  "timestamp": "2025-12-16T07:30:00.000Z",
  "responseTime": 2500
}
```

**Relationships**:
- Many-to-one with `UserProfile` (query from one profile)
- One-to-one with `WeatherData` fetch (query triggers weather retrieval)
- One-to-one with `ClothingRecommendation` (query generates one recommendation)

---

### 5. Location

Geographic area for weather data retrieval.

**Attributes**:
- `lat` (number, required): Latitude (-90 to 90)
- `lon` (number, required): Longitude (-180 to 180)
- `name` (string, required): Display name (e.g., "Boston, MA")
- `source` (string, required): How location was obtained (`"device"`, `"user_specified"`)
- `accuracy` (number, optional): Meters (if from device geolocation)
- `lastUpdated` (ISO 8601 string, required): When location was last determined
- `timezone` (string, required): IANA timezone

**Validation Rules**:
- `lat` must be between -90 and 90
- `lon` must be between -180 and 180
- `name` must not be empty
- `source` must be `"device"` or `"user_specified"`
- `accuracy` only applicable if `source === "device"`

**Storage**: SessionStorage (key: `weatherbot:currentLocation`) - cleared on app close

**Location Detection Logic**:
1. **Device location (default)**: Use browser geolocation API
2. **User-specified**: Parse location from voice query (e.g., "weather in Boston")
3. **Fallback**: Prompt user to enable location or specify manually

**Example**:
```json
{
  "lat": 42.3601,
  "lon": -71.0589,
  "name": "Boston, MA",
  "source": "device",
  "accuracy": 50,
  "lastUpdated": "2025-12-16T07:00:00.000Z",
  "timezone": "America/New_York"
}
```

**Relationships**:
- One-to-many with `WeatherData` (one location can have multiple weather snapshots over time)
- One-to-many with `VoiceQuery` (queries may specify different locations)

---

## State Transitions

### UserProfile States
1. **Unselected**: No profile active (default state on first app load)
2. **Selected**: Profile chosen, persisted in localStorage
3. **Active**: Currently being used for recommendations
4. **Changed**: User switches to different profile

**Transition Rules**:
- Unselected → Selected: User taps profile card
- Selected → Active: App loads with profile in localStorage
- Active → Changed: User selects different profile
- Changed → Active: New profile becomes active

### WeatherData States
1. **Stale**: Expired cache (> 1 hour old)
2. **Fresh**: Recently fetched (< 1 hour old)
3. **Fetching**: API call in progress
4. **Error**: API call failed
5. **Unavailable**: No cached data and API failed

**Transition Rules**:
- Fresh → Stale: After 1 hour
- Stale/Unavailable → Fetching: User makes query
- Fetching → Fresh: API success
- Fetching → Error: API failure (timeout or HTTP error)
- Error → Unavailable: No fallback cache available
- Error → Stale: Fallback to expired cache

### VoiceQuery Processing States
1. **Listening**: Wake word detected, capturing input
2. **Processing**: Transcript received, parsing intent
3. **Fetching**: Retrieving weather data
4. **Generating**: Creating recommendation
5. **Speaking**: Outputting response via speech synthesis
6. **Complete**: Response delivered

**Transition Rules**:
- Listening → Processing: Speech recognition complete
- Processing → Fetching: Intent parsed, weather needed
- Fetching → Generating: Weather data received
- Generating → Speaking: Recommendation created
- Speaking → Complete: Speech synthesis finished

---

## Indexing Strategy

### LocalStorage Keys
- `weatherbot:selectedProfile`: Currently active profile (UserProfile object)
- `weatherbot:appPreferences`: App-level settings (future: voice speed, theme)

### IndexedDB Schema
**Database**: `weatherbot`
**Version**: 1

**Object Stores**:
1. **weatherCache**
   - **Key**: `lat,lon` (string, e.g., "42.3601,-71.0589")
   - **Indexes**:
     - `fetchedAt`: For finding oldest entries to purge
     - `cacheExpiry`: For checking staleness
   - **Max entries**: 10 (auto-purge oldest)

### SessionStorage Keys
- `weatherbot:currentLocation`: Active location (Location object)
- `weatherbot:voiceState`: Current voice interaction state

---

## Data Retention

- **UserProfile**: Indefinite (until user changes or clears app data)
- **WeatherData**: 1 hour fresh, indefinite stale (as fallback)
- **VoiceQuery**: Not persisted (ephemeral)
- **ClothingRecommendation**: Not persisted (ephemeral)
- **Location**: Session-scoped (cleared on app close)

---

## Privacy Considerations

- **No voice recording**: Voice audio never stored or transmitted
- **No personal data**: Profiles are age/gender only, no names or identifiable info
- **Local-only storage**: All data stored on device, nothing sent to servers except weather API calls
- **Weather API**: Only sends lat/lon coordinates, no user identification
- **No analytics**: No tracking, no third-party services

---

## Next Steps

With data model defined, proceed to:
1. Generate API contracts for weather service integration
2. Create quickstart documentation for developers
3. Begin implementation with data model as reference
