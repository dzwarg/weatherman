# Ollama Setup Guide

This guide explains how to set up Ollama for AI-powered clothing recommendations in Weatherman.

## Overview

Ollama is an optional enhancement to Weatherman that provides LLM-powered clothing recommendations. The application includes:

- **Rule-Based Fallback**: Works without Ollama using intelligent clothing rules
- **AI Integration Ready**: Architecture prepared for Ollama when installed
- **Graceful Degradation**: Automatically falls back to rules if Ollama unavailable

## Current Status

**Note**: Ollama integration is planned but not yet fully implemented. The server has:
- ✅ Rule-based recommendation engine (fully functional)
- ✅ Service architecture for Ollama integration
- ⏳ Ollama API connection (pending implementation)
- ⏳ Prompt engineering for clothing recommendations

## Prerequisites

- Weatherman server and frontend installed
- At least 8GB of RAM available
- 4-7GB of disk space for models
- macOS, Linux, or Windows

## Installation

### macOS

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Or using Homebrew
brew install ollama

# Start Ollama service
ollama serve
```

### Linux

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service (manual)
ollama serve

# Or as a systemd service
sudo systemctl start ollama
sudo systemctl enable ollama
```

### Windows

1. Download Ollama installer from https://ollama.com/download
2. Run the installer
3. Ollama will start automatically as a Windows service

## Model Selection

Weatherman recommends using smaller, faster models for quick recommendations:

### Recommended: Llama 3.2 (3B)

```bash
# Pull the model (3GB)
ollama pull llama3.2:3b

# Test the model
ollama run llama3.2:3b "What should a 7-year-old wear when it's 45 degrees and rainy?"
```

**Pros:**
- Fast inference (~1-2 seconds)
- Low memory usage (4GB RAM)
- Good at simple recommendation tasks
- Works well for child-appropriate language

### Alternative: Llama 3.1 (8B)

```bash
# Pull the model (4.7GB)
ollama pull llama3.1:8b

# Test the model
ollama run llama3.1:8b "Recommend clothing for a 4-year-old girl in sunny 75-degree weather"
```

**Pros:**
- More detailed recommendations
- Better context understanding
- More nuanced language

**Cons:**
- Slower inference (~2-4 seconds)
- Higher memory usage (8GB RAM)

### Other Options

```bash
# Mistral 7B - Good alternative
ollama pull mistral:7b

# Gemma 2B - Fastest option
ollama pull gemma:2b
```

## Configuration

### Server Environment Variables

Add to `packages/server/.env`:

```env
# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT=10000
```

### Verify Ollama Connection

```bash
# Check if Ollama is running
curl http://localhost:11434/api/health

# Should return: {"status":"ok"}

# Test model inference
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Say hello",
  "stream": false
}'
```

## Testing with Weatherman

### 1. Start Services

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Weatherman (from root directory)
cd /path/to/weatherman
npm run dev
```

### 2. Test Recommendation API

```bash
# Test recommendations endpoint
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
      "humidity": 65,
      "windSpeed": 10,
      "uvIndex": 2,
      "conditions": "cloudy",
      "precipitation": 20
    },
    "voicePrompt": "What should I wear to school?"
  }'
```

### 3. Check Health Endpoint

```bash
curl http://localhost:3000/api/health
```

**Expected with Ollama running:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T10:00:00.000Z",
  "services": {
    "weatherApi": "connected",
    "ollama": "connected"
  }
}
```

**Expected without Ollama:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T10:00:00.000Z",
  "services": {
    "weatherApi": "connected",
    "ollama": "unavailable"
  }
}
```

## Troubleshooting

### Ollama Not Starting

**Check if Ollama is running:**
```bash
ps aux | grep ollama
```

**Check Ollama logs:**
```bash
# macOS/Linux
tail -f ~/.ollama/logs/server.log

# Or check systemd logs (Linux)
sudo journalctl -u ollama -f
```

**Restart Ollama:**
```bash
# Kill existing process
pkill ollama

# Start again
ollama serve
```

### Model Not Found

```bash
# List installed models
ollama list

# Pull the model again
ollama pull llama3.2:3b
```

### Connection Refused

**Check Ollama port:**
```bash
lsof -i :11434
```

**Check firewall settings** (if running on separate machine)

**Verify Ollama API URL** in `.env` file

### Slow Response Times

- **Use smaller model**: Switch from 8B to 3B model
- **Increase timeout**: Adjust `OLLAMA_TIMEOUT` in `.env`
- **Check system resources**: Ensure sufficient RAM available
- **Close other applications**: Free up memory

### Out of Memory

```bash
# Check memory usage
free -h  # Linux
vm_stat  # macOS
```

**Solutions:**
- Use smaller model (gemma:2b or llama3.2:3b)
- Close other memory-intensive applications
- Increase swap space (Linux)
- Consider cloud-hosted Ollama instance

## Performance Tuning

### Optimal Model Settings

```env
# Fast responses (1-2s)
OLLAMA_MODEL=gemma:2b

# Balanced (2-3s)
OLLAMA_MODEL=llama3.2:3b

# Quality (3-5s)
OLLAMA_MODEL=llama3.1:8b
```

### Prompt Optimization

When implementing Ollama prompts, follow these guidelines:

1. **Keep prompts concise** (< 200 tokens)
2. **Use structured output format** (JSON recommended)
3. **Include clear constraints** (child-appropriate language, safety-first)
4. **Specify response length** (brief recommendations preferred)

### Caching Strategies

Future enhancements:
- Cache recommendations for common weather + profile combinations
- Implement server-side Redis cache
- Cache model responses for 30 minutes

## Production Considerations

### Hosting Options

**Option 1: Co-located with Server**
- Deploy Ollama on same machine as Express server
- Pros: Low latency, simple setup
- Cons: Requires more powerful server (8GB+ RAM)

**Option 2: Separate Service**
- Deploy Ollama on dedicated machine/container
- Update `OLLAMA_API_URL` to point to remote instance
- Pros: Scalable, isolates resource usage
- Cons: Network latency, additional infrastructure

**Option 3: Cloud-Hosted**
- Use managed Ollama service (if available)
- Pros: No infrastructure management
- Cons: Cost, vendor lock-in

### Security

- **Never expose Ollama API publicly**: Use internal network only
- **Validate all prompts**: Sanitize user input before sending to LLM
- **Rate limit**: Prevent abuse of AI endpoint
- **Monitor usage**: Track API calls and costs

### Monitoring

```bash
# Monitor Ollama resource usage
htop
# or
docker stats ollama  # if using Docker

# Monitor API response times
# Check server logs for OLLAMA_API_TIMEOUT errors
```

## Rollback to Rule-Based

If Ollama causes issues, simply stop the Ollama service:

```bash
# Stop Ollama
pkill ollama

# or
sudo systemctl stop ollama
```

The Weatherman server will automatically detect Ollama unavailability and fall back to rule-based recommendations. No code changes required.

## Future Enhancements

Planned Ollama integration features:

1. **Smart Prompt Analysis**: Extract context from voice transcripts
2. **Personalization**: Learn from user feedback over time
3. **Multi-turn Conversations**: Follow-up questions about outfits
4. **Activity-Aware**: Tailor recommendations to specific activities (school, sports, etc.)
5. **Weather Insights**: Natural language weather explanations for children

## Support

For Ollama-specific issues:
- Official Documentation: https://ollama.com/docs
- GitHub Issues: https://github.com/ollama/ollama/issues

For Weatherman integration issues:
- Check server logs: `packages/server/` output
- Review health endpoint: `GET /api/health`
- Test rule-based fallback works without Ollama
