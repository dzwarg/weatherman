# Spec Change 001: Migration from Ollama to Claude API

**Date**: 2025-12-29
**Status**: ✅ APPROVED & IMPLEMENTED
**Impact**: Technical implementation change - No user-facing feature changes
**Related**: spec.md, tasks.md, MIGRATION-COMPLETE.md

## Summary

Changed the AI service provider from local Ollama to cloud-based Claude API (Anthropic) for clothing recommendation generation. This is a **technical implementation change only** - all user stories, acceptance criteria, and functional requirements remain unchanged.

## Rationale

**Problem**: Local Ollama requires significant hardware resources (8GB+ RAM, GPU recommended) which is not available on all development machines.

**Solution**: Use Claude API which:
- Requires no local hardware/setup (cloud-based)
- Provides reliable, consistent performance
- Uses industry-leading AI (Claude 3.5 Sonnet)
- Has simple setup (just API key)
- Maintains graceful fallback to rule-based recommendations

## What Changed

### Technical Implementation

| Aspect | Before (Ollama) | After (Claude API) |
|--------|----------------|-------------------|
| **Service** | Local Ollama server (http://localhost:11434) | Cloud Anthropic API (https://api.anthropic.com) |
| **SDK** | axios for HTTP calls | @anthropic-ai/sdk (official) |
| **Setup** | Install Ollama, download model, run service | Get API key from console.anthropic.com |
| **Model** | llama2, mistral, etc. (local) | claude-3-5-sonnet-20241022 (cloud) |
| **Cost** | Free (local compute) | ~$0.008 per recommendation |
| **Hardware** | 8GB+ RAM required | No local requirements |
| **Environment Variables** | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` |
| **Configuration File** | `OLLAMA_SETTINGS` in constants.js | `CLAUDE_SETTINGS` in constants.js |
| **Service File** | `ollamaService.js` | `claudeService.js` |
| **Response Format** | Streaming text | Messages API with structured content |
| **Health Check** | HTTP GET to Ollama endpoint | API key presence check |

### Files Modified

**Server (packages/server/):**
- ✅ `package.json` - Replaced axios with @anthropic-ai/sdk
- ✅ `src/config/env.js` - Added anthropicApiKey, claudeModel
- ✅ `src/config/constants.js` - Replaced OLLAMA_SETTINGS with CLAUDE_SETTINGS
- ✅ `src/services/claudeService.js` - NEW (replaced ollamaService.js)
- ✅ `src/services/recommendationService.js` - Updated to use claudeService
- ✅ `src/server.js` - Updated health check for Claude API
- ✅ `.env.example` - Updated environment variables

**Tests (packages/server/tests/):**
- ✅ `unit/services/claudeService.test.js` - NEW (complete rewrite)
- ✅ `unit/services/recommendationService.test.js` - Updated mocks
- ✅ `integration/recommendations.test.js` - Updated assertions

**Documentation:**
- ✅ `docs/claude-api-setup.md` - NEW (replaced ollama-setup.md)
- ✅ `specs/002-monorepo-server/MIGRATION-COMPLETE.md` - Migration summary

**Frontend (packages/frontend/):**
- ✅ `src/mocks/ollama/` → `src/mocks/ai/` - Renamed directory
- ✅ `.env.development` - VITE_USE_MOCK_OLLAMA → VITE_USE_MOCK_AI
- ✅ `src/services/recommendationService.js` - Updated mock check

### Files NOT Changed

These remain service-agnostic:
- ✅ `src/utils/ollamaResponseParser.js` - Parser still works (handles text → structured format)
- ✅ API contracts and response formats - No breaking changes
- ✅ Frontend API calls - Server abstracts AI implementation
- ✅ User stories and acceptance criteria - No functional changes

## What Stayed the Same

### User-Facing Behavior (NO CHANGES)

1. **User Stories**: All three user stories remain identical
2. **Acceptance Criteria**: All scenarios pass unchanged
3. **API Contracts**: Request/response formats identical
4. **Fallback System**: Still gracefully falls back to rules
5. **Response Format**:
   ```json
   {
     "id": "rec-...",
     "profileId": "7yo-boy",
     "source": "claude",  // Was "ollama"
     "confidence": 0.95,
     "recommendations": { ... },
     "spokenResponse": "...",
     "createdAt": "...",
     "processingTime": 1250
   }
   ```
   Only `source` field changed from `"ollama"` to `"claude"`

### Functional Requirements (NO CHANGES)

All FR-001 through FR-022 remain valid and implemented:
- ✅ FR-007: Server provides recommendation endpoint
- ✅ FR-008: Frontend sends profile, weather, prompt
- ✅ FR-009-013: Age-appropriate, gender-specific, weather-aware recommendations
- ✅ FR-014: Analyzes voice prompt for context
- ✅ FR-015: Handles missing prompts gracefully

The implementation detail (Ollama vs Claude) was never specified in functional requirements.

## Updated Requirements

### Technical Requirements (Updated)

- **TR-004**: ~~Ollama~~ **Claude API** service MUST have unit tests with mocked responses to verify prompt generation and response parsing ✅
- **TR-008**: End-to-end test MUST verify complete workflow: voice input → frontend → server → ~~Ollama~~ **Claude API**/fallback → response → voice output
- **TR-009**: Tests MUST verify graceful fallback when ~~Ollama~~ **Claude API** service is unavailable ✅

### Non-Functional Requirements (Updated)

- **NFR-005**: ~~Ollama~~ **Claude API** service timeout MUST be 30 seconds (increased from Ollama's typical faster responses) ✅
- **NFR-010**: Documentation MUST include ~~Ollama~~ **Claude API** setup instructions for getting API key ✅

## Migration Tasks Completed

All migration work tracked in `MIGRATION-CLAUDE-API.md`:

### Phase 1: Dependencies ✅
- T1-T6: Install @anthropic-ai/sdk, update package.json

### Phase 2: Implementation ✅
- T7-T12: Create claudeService.js, update recommendationService.js

### Phase 3: Tests ✅
- T13-T18: Rewrite all tests to mock Anthropic SDK
- All 141 tests passing

### Phase 4: Documentation ✅
- T19-T24: Create claude-api-setup.md, update .env files

### Phase 5: Frontend Updates ✅
- T25-T30: Rename mocks, update environment variables

### Phase 6: Validation ✅
- Health check working
- Fallback system verified
- Migration complete document created

## Testing & Verification

### Tests Updated
- ✅ All 141 tests passing (0 failures)
- ✅ Unit tests: Mock Anthropic SDK properly
- ✅ Integration tests: Verify API contracts unchanged
- ✅ Fallback tests: Verify rules work when API unavailable

### Manual Verification
- ✅ Server starts without API key (fallback works)
- ✅ Health endpoint shows Claude status
- ✅ No breaking changes to API contracts
- ✅ Frontend remains functional with mocks

### Production Verification Needed
- ⏳ End-to-end test with real Claude API key
- ⏳ Frontend integration test calling server API
- ⏳ Voice workflow test with Claude recommendations

## Breaking Changes

### For Developers

**Environment Variables (Breaking):**
```env
# REMOVED (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# ADDED (Claude API)
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

**Setup Process (Breaking):**
- Before: Install Ollama → Download model → Start service
- After: Get API key from console.anthropic.com → Add to .env

**Dependencies (Breaking):**
- Removed: axios (for Ollama HTTP calls)
- Added: @anthropic-ai/sdk

### For Users

**No breaking changes** - Application works identically with either:
1. Claude API configured (AI-powered recommendations)
2. No API key (rule-based recommendations)

## Rollback Plan

If Claude API causes issues:

1. **Keep current code** - Just remove API key:
   ```env
   # Comment out in .env
   # ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
   System automatically falls back to rules

2. **Full rollback** - Revert commits:
   ```bash
   git revert fecdff4 3a59076 8f7ea45 00b3a11 8b394b2
   git checkout backup-pre-claude-migration  # If created
   ```

## Benefits of Change

### Before (Ollama)
- ❌ Required 8GB+ RAM, GPU recommended
- ❌ Complex setup (install, configure, models)
- ❌ Couldn't run on available hardware
- ✅ Free (no API costs)
- ✅ Complete privacy (local execution)

### After (Claude API)
- ✅ No hardware requirements
- ✅ Simple setup (just API key)
- ✅ Works on any machine
- ✅ Reliable cloud infrastructure
- ✅ Better AI quality (Claude 3.5 Sonnet)
- ⚠️ API costs (~$0.008 per recommendation)
- ⚠️ Requires internet connection

## Cost Considerations

### Free Tier
- $5 credit for new accounts
- ~625 recommendations at $0.008 each

### Pricing (as of 2025)
- **Claude 3.5 Sonnet**: ~$0.008 per recommendation
- **Claude 3 Haiku**: ~$0.002 per recommendation (faster, cheaper)

### Mitigation
- Graceful fallback to free rule-based system
- Optional caching for high-traffic scenarios
- Can use Haiku model for development ($0.002/rec)

## Documentation Updates

All documentation updated to reflect Claude API:
- ✅ `docs/claude-api-setup.md` - Complete setup guide
- ✅ `specs/002-monorepo-server/MIGRATION-COMPLETE.md` - Migration summary
- ✅ `packages/server/.env.example` - Updated variables
- ⏳ `specs/002-monorepo-server/spec.md` - Update Ollama references
- ⏳ `specs/002-monorepo-server/tasks.md` - Update task descriptions

## Next Steps

1. ✅ Complete migration implementation
2. ✅ Update all tests
3. ✅ Create migration documentation
4. ⏳ **Update spec.md to replace Ollama with Claude API**
5. ⏳ **Update tasks.md to reflect Claude implementation**
6. ⏳ **Complete frontend integration (T079-T087)**
7. ⏳ Test with real API key end-to-end
8. ⏳ Deploy and monitor API usage

## Approval

**Approved by**: User (2025-12-29)
**Reason**: Original approach (Ollama) not feasible on available hardware
**Impact**: Technical change only - no user-facing changes
**Status**: Implementation complete, documentation in progress

---

**Note**: This spec change maintains all original user stories, acceptance criteria, and functional requirements. Only the technical implementation of the AI service provider changed from local Ollama to cloud Claude API.
