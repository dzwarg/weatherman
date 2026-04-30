# Quickstart: iOS and Safari Speech Support

**Feature**: 005-ios-safari-speech | **Date**: 2026-04-29

## What Changes

Five bugs are fixed in `voiceService.js`, a new `VoiceErrorToast` component is added, and `useVoiceRecognition` is updated to expose structured error state. No server changes. No new npm dependencies.

## Files Touched

| File | Change |
|---|---|
| `packages/frontend/src/services/voiceService.js` | Fix 5 bugs (see below) |
| `packages/frontend/src/hooks/useVoiceRecognition.js` | Expose structured error, add visibilitychange handler |
| `packages/frontend/src/components/VoiceErrorToast.jsx` | New component |
| `packages/frontend/tests/services/voiceService.test.js` | Add iOS scenario tests |
| `packages/frontend/tests/components/VoiceErrorToast.test.jsx` | New test file |
| `packages/frontend/tests/hooks/useVoiceRecognition.test.js` | Add error/visibility tests |

## Bug Fixes in voiceService.js

**Bug 1 — iPadOS 13+ not recognized as iOS** (lines 151, 159)  
Old: `/iPad|iPhone|iPod/.test(navigator.userAgent)`  
New: `isIOS()` helper using `navigator.maxTouchPoints > 2` for modern iPads

**Bug 2 — `_setupWakeWordHandlers` missing `onend`** (line 58)  
Old: sets only `onresult` and `onerror`  
New: also sets `onend` with the same restart loop as `startWakeWordDetection`

**Bug 3 — Double-speak on fast voice load** (lines 307–326)  
Old: both `onvoiceschanged` and `setTimeout` call `_speakWithCancellation`  
New: guard flag `hasStarted` + `clearTimeout` + `onvoiceschanged = null` ensures exactly one call

**Bug 4 — Wake phrase accepted during speech** (line 120)  
Old: wake phrase always triggers callback  
New: gate with `!this.isSpeaking`

**Bug 5 — Error handlers call `speak()` which fails silently on iOS** (lines 82–84, 138–143)  
Old: `this.speak(message)` in `onerror` callbacks  
New: emit via `onError` callback only; no `speak()` call in error handlers

## New: VoiceErrorToast Component

Auto-dismisses after 5 seconds. Accepts `{ code, isPermanent }` prop. Renders `null` when no error.

```jsx
<VoiceErrorToast error={voiceError} onDismiss={clearError} />
```

Mount this wherever the voice interface is rendered (e.g., alongside the voice button).

## Running Tests

```bash
# From packages/frontend
npx vitest run tests/services/voiceService.test.js
npx vitest run tests/components/VoiceErrorToast.test.jsx
npx vitest run tests/hooks/useVoiceRecognition.test.js

# Full suite with coverage
npm run test:coverage
```

## Manual Testing Checklist

- [ ] iPhone iOS 17: say wake phrase 5 times in a row — app responds each time
- [ ] iPad iPadOS 16: same test as above
- [ ] iPhone: revoke microphone permission → toast appears, says "allow access"
- [ ] iPhone: deny microphone permanently → toast says "go to Settings"
- [ ] macOS Safari: complete wake-phrase → query → response cycle — no double speech
- [ ] Any browser without SpeechRecognition: "voice not supported" toast appears on load
- [ ] iPhone: switch to another app and back → wake word detection resumes within 3s
- [ ] iPhone: speak wake phrase while response audio is playing → ignored, completes, then resumes
