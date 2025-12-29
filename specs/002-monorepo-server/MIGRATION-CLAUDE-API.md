# Migration Plan: Ollama → Claude API (Anthropic)

**Date**: 2025-12-29
**Status**: Planning
**Impact**: Replaces local Ollama service with Claude API for clothing recommendations

## Overview

This document outlines the migration from local Ollama service to Claude API (Anthropic) for generating clothing recommendations. This change simplifies deployment by removing the need for local LLM hosting while providing more reliable and powerful AI capabilities.

## Motivation

- Cannot find an Ollama model that runs on available hardware
- Cloud-based API eliminates local setup complexity
- Claude API provides consistent, reliable performance
- Anthropic SDK provides TypeScript support with excellent DX

## What Changes

### Services to Modify

1. **`packages/server/src/services/ollamaService.js`**
   - Rename to: `claudeService.js`
   - Replace Ollama API calls with Claude API calls using `@anthropic-ai/sdk`
   - Update prompt format to Claude's message API format
   - Keep similar interface for backwards compatibility

2. **`packages/server/src/services/recommendationService.js`**
   - Update imports from `ollamaService` to `claudeService`
   - Update caching variable names (ollama → claude)
   - Keep fallback logic intact

3. **`packages/server/src/config/constants.js`**
   - Replace `OLLAMA_SETTINGS` with `CLAUDE_SETTINGS`
   - Update model name to Claude model (e.g., `claude-3-5-sonnet-20241022`)
   - Keep timeout and token limits

4. **`packages/server/src/config/env.js`**
   - Add `ANTHROPIC_API_KEY` validation
   - Remove `OLLAMA_BASE_URL` and `OLLAMA_MODEL`
   - Add `CLAUDE_MODEL` (optional, with default)

5. **`packages/server/src/server.js`**
   - Update health check from Ollama to Claude API
   - Check API key presence instead of localhost connection

### Tests to Update

**Unit Tests**:
- `tests/unit/services/ollamaService.test.js` → `claudeService.test.js`
- `tests/unit/services/recommendationService.test.js` (update mocks)

**Integration Tests**:
- `tests/integration/recommendations.test.js` (update health check expectations)

### Configuration Files

1. **`packages/server/.env.example`**
   - Replace Ollama variables with Claude variables
   - Add example: `ANTHROPIC_API_KEY=sk-ant-...`
   - Add optional: `CLAUDE_MODEL=claude-3-5-sonnet-20241022`

2. **`packages/server/package.json`**
   - Add dependency: `@anthropic-ai/sdk`
   - Remove any Ollama-specific dependencies

### Documentation

1. **`packages/server/README.md`**
   - Replace Ollama setup instructions with Claude API setup
   - Update environment variables section
   - Add link to Anthropic API key creation

2. **`docs/ollama-setup.md`**
   - Rename to: `claude-api-setup.md`
   - Replace content with Claude API setup instructions
   - Add instructions for getting API key from console.anthropic.com

3. **`specs/002-monorepo-server/spec.md`**
   - Update all "Ollama" references to "Claude API"
   - Update testing requirements
   - Update assumptions

4. **`specs/002-monorepo-server/tasks.md`**
   - Update all Ollama task descriptions
   - Rename tasks mentioning Ollama
   - Update implementation details

### Frontend Changes

1. **`packages/frontend/.env.development`**
   - `VITE_USE_MOCK_OLLAMA` → `VITE_USE_MOCK_AI` or `VITE_USE_MOCK_CLAUDE`
   - Update documentation comments

2. **Mock files** (keep as-is, they're service-agnostic)
   - `packages/frontend/src/mocks/ollama/` → consider renaming to `packages/frontend/src/mocks/ai/`

## Migration Tasks

### Phase 1: Update Dependencies and Configuration

- [ ] **M001** [P] Install `@anthropic-ai/sdk` in server package
- [ ] **M002** [P] Update `.env.example` with Claude API variables
- [ ] **M003** [P] Update `packages/server/src/config/constants.js` to replace `OLLAMA_SETTINGS` with `CLAUDE_SETTINGS`
- [ ] **M004** [P] Update `packages/server/src/config/env.js` to validate `ANTHROPIC_API_KEY` instead of Ollama variables
- [ ] **M005** Create `.env` with actual `ANTHROPIC_API_KEY` (not committed)

### Phase 2: Implement Claude Service

- [ ] **M006** Rename `ollamaService.js` to `claudeService.js` using `git mv`
- [ ] **M007** Rewrite `claudeService.js` to use Anthropic SDK:
  - Replace axios calls with Anthropic client
  - Update `generateClothingAdvice()` to use Messages API
  - Update `checkHealth()` to validate API key availability
  - Keep `buildPrompt()` logic but adapt to Claude's message format
- [ ] **M008** Update `recommendationService.js` to import `claudeService` instead of `ollamaService`
- [ ] **M009** Update cache variable names in `recommendationService.js` (ollama → claude)
- [ ] **M010** Update health endpoint in `server.js` to check Claude API instead of Ollama

### Phase 3: Update Tests

- [ ] **M011** Rename `ollamaService.test.js` to `claudeService.test.js` using `git mv`
- [ ] **M012** Update `claudeService.test.js` to mock Anthropic SDK instead of axios
- [ ] **M013** Update `recommendationService.test.js` to import and mock `claudeService`
- [ ] **M014** Update integration tests in `recommendations.test.js` for Claude health checks
- [ ] **M015** Run all tests and verify 142 tests still pass

### Phase 4: Update Documentation

- [ ] **M016** [P] Rename `docs/ollama-setup.md` to `docs/claude-api-setup.md` using `git mv`
- [ ] **M017** [P] Rewrite `docs/claude-api-setup.md` with Claude API setup instructions
- [ ] **M018** [P] Update `packages/server/README.md` with Claude API configuration
- [ ] **M019** [P] Update root `README.md` to mention Claude API instead of Ollama
- [ ] **M020** [P] Update `specs/002-monorepo-server/spec.md` - replace all Ollama references
- [ ] **M021** Update `specs/002-monorepo-server/tasks.md` - update task descriptions

### Phase 5: Frontend Updates (Optional Improvements)

- [ ] **M022** [P] Rename frontend mock directory: `packages/frontend/src/mocks/ollama/` → `packages/frontend/src/mocks/ai/`
- [ ] **M023** [P] Update environment variable: `VITE_USE_MOCK_OLLAMA` → `VITE_USE_MOCK_AI`
- [ ] **M024** Update frontend recommendation service to use new env variable name

### Phase 6: Validation

- [ ] **M025** Test health endpoint returns Claude API status
- [ ] **M026** Test recommendation generation with real Claude API key
- [ ] **M027** Test fallback to rules when API key is missing
- [ ] **M028** Test error handling for API rate limits
- [ ] **M029** Test all 142 server tests pass
- [ ] **M030** Run full application end-to-end with Claude API

## Implementation Details

### Claude API Integration

**Current Ollama approach**:
```javascript
const response = await axios.post(
  `${OLLAMA_BASE_URL}/api/generate`,
  {
    model: OLLAMA_MODEL,
    prompt: promptText,
    stream: false,
  }
);
return response.data.response;
```

**New Claude API approach**:
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: promptText
    }
  ],
});

return message.content[0].text;
```

### Prompt Format Changes

**Ollama**: Single string prompt with system context embedded
**Claude**: Message array with explicit system message support

We'll adapt the `buildPrompt()` function to return an object with:
- `system`: System context (role description, language style)
- `messages`: User message array with weather/context

### Health Check Changes

**Ollama**: Check if `http://localhost:11434/api/tags` responds
**Claude**: Check if `ANTHROPIC_API_KEY` is set and valid format

We can optionally make a minimal API call to verify the key works, or just check presence.

### Error Handling

Claude API errors will be different from Ollama:
- Rate limit errors (429)
- Invalid API key (401)
- Token limit exceeded (400)
- Service unavailable (503)

Update error handling to properly map Claude API errors to user-friendly messages.

## Environment Variables

### Before (Ollama)
```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:latest
```

### After (Claude API)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022  # optional, with default
```

## Testing Strategy

1. **Keep existing test structure** - tests verify behavior, not implementation
2. **Update mocks** - mock Anthropic SDK instead of axios/Ollama
3. **Verify all 142 tests pass** after migration
4. **Add new test** for API key validation
5. **Manual testing** with real Claude API key

## Backward Compatibility

**Not maintaining backward compatibility** - this is a breaking change requiring:
- New environment variables
- New npm dependencies
- Updated configuration

All users will need to:
1. Get a Claude API key from console.anthropic.com
2. Update their `.env` file
3. Run `npm install` to get new dependencies

## Rollback Plan

If migration fails:
1. Git history preserves all Ollama code
2. Can revert commits to restore Ollama implementation
3. Tests ensure functionality remains intact

## Success Criteria

✅ All 142 server tests pass
✅ Recommendations generate successfully with Claude API
✅ Fallback to rules works when API unavailable
✅ Health endpoint reports Claude API status correctly
✅ Documentation accurately reflects Claude API setup
✅ Frontend integration works unchanged (service layer abstraction successful)

## Timeline Estimate

- Phase 1 (Dependencies): 15 minutes
- Phase 2 (Implementation): 45-60 minutes
- Phase 3 (Tests): 30-45 minutes
- Phase 4 (Documentation): 30 minutes
- Phase 5 (Frontend): 15 minutes (optional)
- Phase 6 (Validation): 20 minutes

**Total**: ~3 hours

## Risk Assessment

**Low Risk**:
- Well-defined interface between recommendation service and AI service
- Comprehensive test coverage ensures no regressions
- Fallback logic provides resilience

**Potential Issues**:
- Claude API rate limits different from local Ollama
- Response format might require parser adjustments
- API costs vs. free local Ollama

**Mitigation**:
- Monitor API usage and add rate limiting if needed
- Test parser thoroughly with various Claude responses
- Fallback to rules ensures system always works

## Next Steps

1. Review this migration plan
2. Get approval to proceed
3. Execute Phase 1 (Dependencies)
4. Execute Phase 2 (Implementation)
5. Continue through all phases
6. Update tasks.md to reflect completed migration

---

**Note**: This migration improves reliability and eliminates hardware constraints while maintaining all existing functionality through the fallback system.