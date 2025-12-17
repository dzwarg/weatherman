# Voice Commands Guide

This guide explains how to use voice commands with Weatherman, including the wake phrase, supported queries, and troubleshooting tips.

## Overview

Weatherman uses the Web Speech API for voice recognition and synthesis. The system is designed to be child-friendly with simple, natural language commands and clear spoken responses.

## Wake Phrase

To activate Weatherman, say the wake phrase:

**"Good morning weatherbot"**

### Wake Phrase Behavior

- **Continuous listening**: Weatherman listens continuously for the wake phrase
- **Case-insensitive**: Works with any capitalization
- **Partial matches**: Recognizes variations like "good morning weather bot"
- **Visual feedback**: The wake word detector shows when it's actively listening

### Wake Phrase Variations

The following phrases will activate Weatherman:

```
✅ "Good morning weatherbot"
✅ "good morning weatherbot"
✅ "Good morning, weatherbot"
✅ "Hey, good morning weatherbot"
```

## Supported Queries

Once the wake phrase is detected, Weatherman will listen for your question. Here are the types of queries it understands:

### Clothing Advice Queries

These queries ask what to wear:

```
"What should I wear today?"
"What do I need to wear?"
"Should I wear a jacket?"
"Do I need a coat?"
"What clothes should I put on?"
```

### Weather Check Queries

These queries ask about current weather:

```
"What's the weather?"
"How's the weather today?"
"Is it cold outside?"
"Is it going to rain?"
"What's the temperature?"
```

### Location Queries (Future)

These queries specify a different location:

```
"What's the weather in Boston?" (planned feature)
"Do I need a jacket in New York?" (planned feature)
```

## Query Processing Flow

1. **Wake word detected** → System stops listening for wake phrase
2. **Starts listening for query** → Visual feedback shows "Listening..."
3. **Processes query** → Shows "Processing..." while fetching weather
4. **Generates recommendation** → Shows "Speaking..." while providing answer
5. **Returns to idle** → Resumes listening for wake phrase

## Voice Response Examples

### Clothing Advice Response

**Query**: "What should I wear today?"

**Response** (spoken):
```
Good morning! It's chilly today, 45 degrees but feels like 42.
The weather is partly cloudy. You should wear a long-sleeve
shirt and a light jacket. For your feet, wear sneakers. Don't
forget a hat! Have a great day!
```

### Weather Check Response

**Query**: "Is it going to rain?"

**Response** (spoken):
```
Good morning! It's nice today, 72 degrees. The weather is clear.
There's a 20% chance of rain, so you probably won't need rain
gear. Have a great day!
```

### Extreme Weather Response

**Query**: "What should I wear?"

**Response** (spoken - if temperature is below 0°F):
```
Important safety message: The weather is extremely cold today.
It might be safer to stay indoors if possible. Heavy winter coat,
warm layers underneath, insulated snow boots, warm hat that
covers ears, insulated gloves, scarf to cover face.
```

## Out-of-Scope Queries

Weatherman is focused on weather and clothing. If you ask about something else, it will politely redirect:

**Query**: "What's 2 + 2?"

**Response**:
```
"I'm your weather and clothing helper! I can tell you what to
wear based on the weather. Try asking 'What should I wear today?'"
```

### Out-of-Scope Examples

```
❌ "Tell me a joke"
❌ "What's the capital of France?"
❌ "Play music"
❌ "Set a timer"
```

## Profile-Based Responses

The spoken response adapts to the selected profile's age and complexity level:

### 4-Year-Old Profile

- **Simple words**: "coat" instead of "outerwear"
- **Basic concepts**: Temperature in simple terms (cold, warm, hot)
- **Short sentences**: Brief, easy to understand
- **Encouragement**: Extra friendly tone

**Example**:
```
"It's cold today! You need a warm coat and boots. Don't forget
your mittens! Have fun!"
```

### 7-Year-Old Profile

- **Moderate vocabulary**: Mix of simple and specific terms
- **More detail**: Includes feels-like temperature
- **Layering concepts**: Explains why certain items are needed

**Example**:
```
"It's chilly today, 45 degrees but feels like 40. You should
wear a long-sleeve shirt with a jacket on top. Wear your
sneakers and bring a hat. Have a great day!"
```

### 10-Year-Old Profile

- **Complex terms**: Technical weather vocabulary
- **Detailed explanation**: Wind speed, UV index, precipitation
- **Reasoning**: Explains why recommendations are made

**Example**:
```
"The temperature is 45°F with a feels-like temperature of 40°F
due to 15 mph winds. Conditions are partly cloudy with a 30%
chance of rain. I recommend layering: start with a long-sleeve
base layer, add a sweater, and wear a windbreaker jacket.
Include a hat to protect from wind chill and consider an
umbrella since rain is possible. Have a great day!"
```

## Special Conditions

### High Precipitation

When chance of rain is > 60%:

```
"There's a high chance of rain today! Make sure to bring your
raincoat, umbrella, and rain boots."
```

### Strong Winds

When wind speed is > 20 mph:

```
"It's very windy today! Wear a windbreaker jacket and make sure
your hat is secure."
```

### High UV Index

When UV index is > 6:

```
"The sun is very strong today! Don't forget sunscreen, a hat,
and sunglasses to protect yourself."
```

### Conflicting Conditions

When weather conditions conflict (sunny but rain expected):

```
"It looks sunny now, but rain is likely later! Bring an umbrella
just in case, even though it looks nice right now."
```

## Error Messages

### No Speech Detected

If Weatherman doesn't hear anything:

```
"I didn't hear anything. Please try saying the wake phrase again."
```

### Microphone Permission Denied

If microphone access is blocked:

```
"I need permission to use your microphone. Please allow
microphone access in your browser settings."
```

### Network Error

If unable to fetch weather data:

```
"I'm having trouble getting the weather information right now.
Please check your internet connection and try again."
```

### Location Permission Denied

If location access is blocked:

```
"I need your location to get the weather. Please enable location
access in your browser settings."
```

## Tips for Best Results

### For Parents

1. **Practice the wake phrase** with your child first
2. **Speak clearly** but naturally - no need to shout
3. **Minimize background noise** for better recognition
4. **Use HTTPS** - voice features require secure connection
5. **Grant permissions** - allow microphone and location access

### For Children

1. **Say the wake phrase clearly**: "Good morning weatherbot"
2. **Wait for the listening indicator** before asking your question
3. **Speak naturally** - no need to speak slowly
4. **Ask simple questions** like "What should I wear?"
5. **Listen to the full response** before asking again

### Environment Setup

- **Quiet space**: Reduce background noise (TV, music)
- **Good microphone**: Built-in laptop/phone mic usually works fine
- **Stable internet**: Required for initial weather fetch
- **Modern browser**: Chrome, Edge, or Safari 14.1+

## Technical Details

### Voice Recognition

- **Engine**: Web Speech API (SpeechRecognition)
- **Language**: English (en-US)
- **Continuous**: Wake word detection runs continuously
- **Interim results**: Enabled for better responsiveness
- **Confidence threshold**: 0.5 minimum for query processing

### Voice Synthesis

- **Engine**: Web Speech API (SpeechSynthesis)
- **Voice**: System default (can be customized in browser)
- **Rate**: 0.9 (slightly slower for clarity)
- **Pitch**: 1.1 (slightly higher for child-friendly tone)
- **Volume**: 1.0 (maximum)

### Browser Support

| Browser | Wake Word | Speech Recognition | Speech Synthesis |
|---------|-----------|-------------------|------------------|
| Chrome 90+ | ✅ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ |
| Safari 14.1+ | ✅ | ✅ | ✅ |
| Firefox | ❌ | ❌ | ✅ |

**Note**: Firefox does not support SpeechRecognition as of 2024.

## Troubleshooting

See [troubleshooting.md](./troubleshooting.md) for detailed solutions to common voice-related issues.

## Future Enhancements

Planned voice features:

- [ ] Custom wake phrase selection
- [ ] Multi-day forecast queries ("What about tomorrow?")
- [ ] Location-specific queries ("Weather in Boston?")
- [ ] Time-specific queries ("What for this afternoon?")
- [ ] Voice-based profile switching
- [ ] Multiple language support

---

For more help, see the [Troubleshooting Guide](./troubleshooting.md) or [open an issue](https://github.com/your-org/weatherman/issues).
