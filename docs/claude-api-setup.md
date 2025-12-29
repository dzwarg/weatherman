# Claude API Setup Guide

This guide explains how to set up Claude API (Anthropic) for AI-powered clothing recommendations in Weatherman.

## Overview

Claude API is an optional enhancement to Weatherman that provides LLM-powered clothing recommendations. The application includes:

- **Rule-Based Fallback**: Works without Claude API using intelligent clothing rules
- **AI Integration Ready**: Architecture prepared for Claude API when configured
- **Graceful Degradation**: Automatically falls back to rules if API unavailable

## Why Claude API?

- **No Local Hardware Required**: Cloud-based API eliminates local setup complexity
- **Reliable Performance**: Consistent response times and availability
- **Powerful AI**: Claude 3.5 Sonnet provides high-quality, contextual recommendations
- **Simple Setup**: Just need an API key, no model downloads or local services

## Prerequisites

- Weatherman server and frontend installed
- Anthropic API account (free tier available)
- API key from https://console.anthropic.com/

## Getting Started

### 1. Create Anthropic Account

1. Visit https://console.anthropic.com/
2. Sign up for an account (free tier includes $5 credit)
3. Verify your email address

### 2. Generate API Key

1. Log in to https://console.anthropic.com/
2. Navigate to "API Keys" section
3. Click "Create Key"
4. Give it a name (e.g., "Weatherman Development")
5. Copy the API key (starts with `sk-ant-api03-...`)

**⚠️ Important**: Store your API key securely - you won't be able to see it again!

### 3. Configure Server

Add your API key to `packages/server/.env`:

```env
# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-your_actual_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

**Note**: The model parameter is optional and defaults to `claude-3-5-sonnet-20241022`

### 4. Verify Configuration

Check the health endpoint to verify Claude API is configured:

```bash
curl http://localhost:3000/api/health
```

**Expected with Claude API configured:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-29T10:00:00.000Z",
  "services": {
    "weatherApi": "connected",
    "claude": "connected"
  }
}
```

**Expected without Claude API:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-29T10:00:00.000Z",
  "services": {
    "weatherApi": "connected",
    "claude": "unavailable"
  }
}
```

## Testing with Weatherman

### 1. Start Services

```bash
# From weatherman root directory
npm run dev
```

This starts both frontend and server. The server will automatically detect your Claude API key.

### 2. Test Recommendation API

```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "id": "7yo-boy",
      "age": 7,
      "gender": "boy"
    },
    "weather": {
      "temperature": 45,
      "feelsLike": 42,
      "conditions": "Cloudy",
      "precipitationProbability": 20,
      "windSpeed": 10,
      "uvIndex": 2
    },
    "prompt": "What should I wear to school?"
  }'
```

**Response with Claude API:**
```json
{
  "id": "rec-1735476000000-a1b2c3d4",
  "profileId": "7yo-boy",
  "source": "claude",
  "confidence": 0.95,
  "recommendations": {
    "baseLayers": ["Long-sleeve shirt"],
    "outerwear": ["Light jacket"],
    "bottoms": ["Jeans"],
    "accessories": ["Light hat"],
    "footwear": ["Sneakers"]
  },
  "spokenResponse": "It's pretty chilly today! You'll want to wear a jacket over your shirt.",
  "createdAt": "2025-12-29T10:00:00.000Z",
  "processingTime": 1250
}
```

Notice `"source": "claude"` and `"confidence": 0.95` indicating AI-powered recommendations.

## Model Options

### Recommended: Claude 3.5 Sonnet (Default)

```env
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

**Pros:**
- Balanced speed and quality
- Great for conversational recommendations
- Age-appropriate language
- Fast response times (1-3 seconds)

### Alternative: Claude 3 Haiku (Faster)

```env
CLAUDE_MODEL=claude-3-haiku-20240307
```

**Pros:**
- Fastest responses (~500ms-1s)
- Lower cost per request
- Still very capable

**Cons:**
- Slightly less nuanced recommendations

### Alternative: Claude 3 Opus (Highest Quality)

```env
CLAUDE_MODEL=claude-3-opus-20240229
```

**Pros:**
- Most detailed and thoughtful recommendations
- Best context understanding

**Cons:**
- Slower responses (3-5 seconds)
- Higher cost per request

## API Usage & Costs

### Free Tier

Anthropic provides $5 in free credits for new accounts:
- ~10,000-15,000 recommendations with Claude 3.5 Sonnet
- ~30,000-40,000 recommendations with Claude 3 Haiku

### Pricing (as of 2025)

**Claude 3.5 Sonnet:**
- Input: $3 per million tokens (~$0.003 per recommendation)
- Output: $15 per million tokens (~$0.005 per recommendation)

**Claude 3 Haiku:**
- Input: $0.25 per million tokens
- Output: $1.25 per million tokens

### Managing Costs

1. **Use Haiku for development**: Faster and cheaper
2. **Cache common requests**: Enable caching in production
3. **Monitor usage**: Check console.anthropic.com dashboard
4. **Set usage alerts**: Configure spending limits
5. **Fallback works**: App gracefully uses rules when API unavailable

## Troubleshooting

### "Claude API key not configured"

**Problem**: API key not found in environment variables

**Solution**:
```bash
# Check .env file exists
cat packages/server/.env | grep ANTHROPIC_API_KEY

# Verify key is set
echo $ANTHROPIC_API_KEY  # (if using environment variables)

# Restart server after adding key
npm run dev:server
```

### Health Check Shows "claude": "unavailable"

**Possible Causes**:
1. API key not set or invalid
2. API key format incorrect (should start with `sk-ant-api03-`)
3. Environment variables not loaded

**Solution**:
```bash
# Test API key directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hi"}]
  }'

# If this works, check server logs for errors
npm run dev:server
```

### API Rate Limit Errors

**Error**: `429: Rate limit exceeded`

**Solutions**:
1. **Wait and retry**: Rate limits reset after 60 seconds
2. **Upgrade plan**: Visit console.anthropic.com for paid tiers
3. **Use fallback**: App automatically uses rules when rate limited
4. **Implement caching**: Cache common weather + profile combinations

### Invalid Model Error

**Error**: `model not found`

**Solution**: Check model name in `.env`:
```env
# Correct format
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Common mistakes
CLAUDE_MODEL=claude-3.5-sonnet  # ❌ Missing date
CLAUDE_MODEL=sonnet  # ❌ Missing prefix
```

### Slow Response Times

**Expected Times**:
- Claude 3 Haiku: 500ms-1s
- Claude 3.5 Sonnet: 1-3s
- Claude 3 Opus: 3-5s

**If slower**:
1. Check network connectivity
2. Switch to Haiku model
3. Verify API status at https://status.anthropic.com/
4. Check server logs for timeout errors

## Security Best Practices

### Protecting Your API Key

**✅ DO:**
- Store key in `.env` file (not committed to git)
- Use environment variables in production
- Rotate keys periodically
- Set spending limits in console

**❌ DON'T:**
- Commit `.env` to git
- Expose key in frontend code
- Share key in screenshots/logs
- Use production key in development

### Production Deployment

```bash
# Set environment variable on server
export ANTHROPIC_API_KEY=sk-ant-api03-production-key-here

# Or use your platform's secrets management
# Heroku: heroku config:set ANTHROPIC_API_KEY=...
# Vercel: Add to environment variables in dashboard
# Docker: Use secrets or environment files
```

### Rate Limiting

Server includes automatic rate limiting:
- Weather API: 100 requests per 15 minutes
- Recommendations API: 500 requests per 15 minutes

This protects your API key from abuse.

## Development vs Production

### Development Setup

```env
# .env.development
ANTHROPIC_API_KEY=sk-ant-api03-dev-key-here
CLAUDE_MODEL=claude-3-haiku-20240307  # Faster, cheaper
```

### Production Setup

```env
# .env.production
ANTHROPIC_API_KEY=sk-ant-api03-prod-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022  # Better quality
```

## Monitoring

### Check Usage

1. Visit https://console.anthropic.com/
2. Go to "Usage" section
3. View API call statistics and costs

### Server Logs

Monitor server logs for Claude API issues:

```bash
npm run dev:server

# Look for:
# ✓ "Claude API: connected"
# ✗ "Claude API error: ..."
```

### Response Source

Check API responses to see which source was used:

```json
{
  "source": "claude",     // ✓ AI-powered
  "source": "rules",      // ℹ️ Fallback used
  "confidence": 0.95      // Higher = AI, Lower = rules
}
```

## Rollback to Rule-Based

If Claude API causes issues, simply remove or comment out the API key:

```env
# Claude API Configuration (disabled)
# ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

The server will automatically detect missing API key and use rule-based recommendations. No code changes required.

## Advanced Configuration

### Custom Timeout

```env
# Increase timeout for slower connections (milliseconds)
# Note: Adjust in constants.js
```

### Caching Strategy

Future enhancement: Cache Claude API responses for common scenarios to reduce costs and improve speed.

## Support

**Claude API Issues:**
- Documentation: https://docs.anthropic.com/
- Status Page: https://status.anthropic.com/
- Support: support@anthropic.com

**Weatherman Integration:**
- Check server logs for errors
- Review health endpoint: `GET /api/health`
- Verify rule-based fallback works
- GitHub Issues: [your repo]/issues

## Migration from Ollama

If you previously used Ollama:

1. Remove Ollama environment variables from `.env`:
   ```env
   # Remove these:
   # OLLAMA_BASE_URL=...
   # OLLAMA_MODEL=...
   ```

2. Add Claude API key:
   ```env
   # Add this:
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```

3. Restart server:
   ```bash
   npm run dev:server
   ```

The migration is complete - all code changes are already in place!
