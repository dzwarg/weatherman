# Testing Instructions for Tasks T084-T086

This document provides manual testing instructions for the remaining frontend integration tasks.

## Prerequisites

1. **Start the servers**:
   ```bash
   # From project root
   npm run dev
   ```

   This will start:
   - Frontend: https://localhost:5174
   - Server: http://localhost:3000

2. **Verify servers are running**:
   ```bash
   curl http://localhost:3000/api/health
   ```

## T084: Test Recommendations End-to-End with Mocks

**Goal**: Verify that different profiles receive different recommendations.

### Automated Test (Recommended)

```bash
# Run the test script
./test-recommendations.sh
```

This script will:
- Test all three profiles (4yo girl, 7yo boy, 10yo boy)
- Verify each gets appropriate recommendations
- Check that responses include correct profile IDs
- Validate source and confidence values

### Manual Test

1. **Open browser to** https://localhost:5174
2. **Open DevTools** (F12) → Network tab
3. **Select profile**: 7yo boy
4. **Click "Start Listening"** and say: "What should I wear to school?"
5. **Check Network tab** for `/api/recommendations` request
6. **Verify response**:
   ```json
   {
     "profileId": "7yo-boy",
     "source": "claude" or "rules",
     "recommendations": { ... },
     "spokenResponse": "...",
     "confidence": 0.85-0.95
   }
   ```
7. **Repeat for other profiles** (4yo girl, 10yo boy)
8. **Verify different recommendations** for each profile

**Expected Results**:
- ✅ Each profile receives different recommendations
- ✅ Source is either "claude" (with API key) or "rules" (without)
- ✅ Recommendations are age-appropriate
- ✅ Spoken response is child-friendly

---

## T085: Test Recommendations with Claude API

**Goal**: Verify Claude API integration works with real API key.

### Check Claude API Status

```bash
curl http://localhost:3000/api/health | jq '.services.claude'
```

**Expected**: `"connected"` if API key configured, `"unavailable"` otherwise

### Test with Claude API

**Prerequisite**: `ANTHROPIC_API_KEY` must be set in `packages/server/.env`

1. **Verify API key is configured**:
   ```bash
   grep ANTHROPIC_API_KEY packages/server/.env
   ```

2. **Restart server** to pick up environment variables:
   ```bash
   npm run dev:server
   ```

3. **Test recommendation request**:
   ```bash
   curl -X POST http://localhost:3000/api/recommendations \
     -H "Content-Type: application/json" \
     -d '{
       "profile": {"id": "7yo-boy", "age": 7, "gender": "boy"},
       "weather": {
         "temperature": 45,
         "feelsLike": 42,
         "conditions": "Cloudy",
         "precipitationProbability": 20,
         "windSpeed": 10,
         "uvIndex": 2
       },
       "voicePrompt": "What should I wear to the playground?"
     }' | jq '.'
   ```

4. **Verify response has**:
   ```json
   {
     "source": "claude",
     "confidence": 0.95,
     ...
   }
   ```

**Expected Results**:
- ✅ `source: "claude"` (not "rules")
- ✅ Higher confidence (typically 0.95 vs 0.85)
- ✅ Contextual recommendations based on voice prompt
- ✅ Response time < 5 seconds

### Check Claude API Metrics

1. Visit https://console.anthropic.com/
2. Navigate to Usage section
3. Verify API calls are being logged
4. Check token usage and costs

---

## T086: Test Fallback Behavior

**Goal**: Verify system gracefully falls back to rule-based recommendations when Claude API is unavailable.

### Test Fallback (No API Key)

1. **Comment out API key** in `packages/server/.env`:
   ```bash
   # ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

2. **Restart server**:
   ```bash
   npm run dev:server
   ```

3. **Check health endpoint**:
   ```bash
   curl http://localhost:3000/api/health | jq '.services.claude'
   ```
   **Expected**: `"unavailable"`

4. **Make recommendation request** (same as T085 step 3)

5. **Verify fallback response**:
   ```json
   {
     "source": "rules",
     "confidence": 0.85,
     ...
   }
   ```

**Expected Results**:
- ✅ System continues to work without Claude API
- ✅ `source: "rules"` instead of "claude"
- ✅ Slightly lower confidence (0.85 vs 0.95)
- ✅ Recommendations still appropriate for weather/profile
- ✅ No errors or crashes
- ✅ Faster response time (< 100ms)

### Test Fallback (API Error)

To simulate Claude API errors:

1. **Set invalid API key** in `packages/server/.env`:
   ```bash
   ANTHROPIC_API_KEY=invalid-key
   ```

2. **Restart server** and make recommendation request

3. **Verify graceful fallback**:
   - Server should log warning about Claude API error
   - Response should use `source: "rules"`
   - No error message shown to user

---

## Common Issues & Troubleshooting

### Issue: "Server not responding"

**Solution**:
```bash
# Check if server is running
lsof -ti:3000

# If not running, start it
npm run dev:server
```

### Issue: "CORS error"

**Solution**:
- Clear browser cache (Ctrl+Shift+R)
- Check Vite proxy configuration in `packages/frontend/vite.config.js`
- Verify server CORS middleware allows frontend origin

### Issue: "Claude API: unavailable"

**Possible Causes**:
1. No API key configured → Add `ANTHROPIC_API_KEY` to `.env`
2. Invalid API key → Verify key at console.anthropic.com
3. Server not restarted → Restart after changing `.env`

### Issue: "Service Worker caching old responses"

**Solution**:
```bash
# In browser DevTools (Application tab)
1. Clear all caches
2. Unregister service workers
3. Hard refresh (Ctrl+Shift+R)
```

---

## Test Completion Checklist

- [ ] **T084**: Tested all three profiles, each gets different recommendations
- [ ] **T085**: Verified Claude API works with real API key (`source: "claude"`)
- [ ] **T086**: Verified graceful fallback to rules when API unavailable (`source: "rules"`)

Once all three tests pass, proceed to **T087: Run full test suite**.

---

## Next Steps

After completing T084-T086, run the full test suite:

```bash
# Run all tests (frontend + server)
npm run test

# Expected: All tests passing
# Server: 141 tests
# Frontend: All existing tests
```

See `STATUS.md` for current implementation status and remaining tasks.
