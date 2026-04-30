# Implementation Plan: iOS and Safari Speech Support

**Branch**: `005-ios-safari-speech` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-ios-safari-speech/spec.md`

## Summary

Fix five silent failure modes in the Web Speech API implementation that prevent reliable voice interaction on iOS Safari and macOS Safari. The changes are confined entirely to the frontend voice layer (`voiceService.js`, `useVoiceRecognition.js`, and a new toast feedback component). No server changes, no new dependencies, no data storage changes.

## Technical Context

**Language/Version**: JavaScript ES2022+, Node.js 22+  
**Primary Dependencies**: React 22+, Vite 5+, Web Speech API (browser-native — no library)  
**Storage**: N/A — all state is in-memory; no persistence changes  
**Testing**: Vitest + React Testing Library  
**Target Platform**: iOS Safari 14.1+ (iPhone and iPad), macOS Safari 14.1+  
**Performance Goals**: Wake word detection ready within 3 seconds of iOS session end; error toast visible within 1 second; zero duplicate speech per trigger  
**Constraints**: Web Speech API callbacks from `onerror` do not carry iOS gesture context — audio must not be the sole feedback channel for error states; no third-party voice services permitted  
**Scale/Scope**: Client-side only; 3 files modified, 1 component added, ~4 new test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Voice-First Interaction | ✅ Pass | Feature directly restores voice reliability on iOS |
| II. PWA Architecture | ✅ Pass | No changes to service workers, manifest, or caching |
| III. Spec-Driven Development | ✅ Pass | Branch `005-ios-safari-speech` with spec.md present |
| IV. Quality-First Development | ✅ Pass | Vitest + ESLint required; 80%+ coverage gate applies |
| V. Signed & Conventional Commits | ✅ Pass | GPG signing required for all commits |
| VI. Child-Friendly | ✅ Pass | Auto-dismiss toasts, seamless restart, age-appropriate UX |
| VII. Privacy & Security | ✅ Pass | No voice transmission; microphone access unchanged |

**Post-design re-check**: All gates still pass. No new dependencies or architectural patterns introduced.

## Project Structure

### Documentation (this feature)

```text
specs/005-ios-safari-speech/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (frontend package)

```text
packages/frontend/
├── src/
│   ├── services/
│   │   └── voiceService.js          # MODIFY: 5 bug fixes
│   ├── hooks/
│   │   └── useVoiceRecognition.js   # MODIFY: expose error state for toast
│   └── components/
│       └── VoiceErrorToast.jsx      # CREATE: auto-dismissing error toast
└── tests/
    ├── services/
    │   └── voiceService.test.js     # MODIFY: add iOS-scenario tests
    └── components/
        └── VoiceErrorToast.test.jsx # CREATE: toast component tests
```

**Structure Decision**: Web application (Option 2). All changes are confined to the frontend package. No backend changes.

## Implementation Phases

### Phase 1 — Core Service Fixes (voiceService.js)

Fixes the five bugs identified in code review. All changes are in `voiceService.js`.

**1.1 — iPadOS 13+ detection** (FR-001, SC-004)  
Replace the two `navigator.userAgent` checks with a reliable hybrid:
```
isIOS(): /iPhone|iPod/.test(UA) OR (maxTouchPoints > 2 AND /iPad/.test(UA)) OR (maxTouchPoints > 2 AND /Mac/.test(platform))
```
Both occurrences at lines 151 and 159 must use the new helper.

**1.2 — Restore all handlers after iOS recovery** (FR-002, FR-007, FR-008)  
`_setupWakeWordHandlers()` currently sets only `onresult` and `onerror`. Add `onend` handler to it so the iOS reinitialization path (which calls `_setupWakeWordHandlers`) also restores the restart loop. This is the primary cause of wake detection permanently stopping after one recovery attempt.

**1.3 — Prevent double-speak on voice load** (FR-005, SC-005)  
Introduce a `hasStarted` guard flag inside `speak()`. Both the `onvoiceschanged` listener and the 100ms timeout must check and set this flag before calling `_speakWithCancellation`. Clear the listener with `onvoiceschanged = null` and `clearTimeout` once the guard fires.

**1.4 — Ignore wake phrase during active speech** (FR-009)  
In the `onresult` handler inside `startWakeWordDetection`, gate the `containsWakePhrase` check behind `!this.isSpeaking`.

**1.5 — Empty voices toast** (FR-010)  
In `_startSpeech`, when `voices.length === 0`, emit an error event to the registered `onError` handler (with a distinct error code `no-voices`) instead of silently continuing. The hook and UI layer will display the toast (implemented in Phase 2).

### Phase 2 — Visual Feedback Layer

**2.1 — VoiceErrorToast component** (FR-003, FR-004, FR-004a, FR-010, FR-006)  
Create `VoiceErrorToast.jsx`: an auto-dismissing toast that disappears after 5 seconds. Receives `errorCode` and `message` props. Maps error codes to appropriate messages:

| Error Code | Message | Action |
|---|---|---|
| `not-allowed` (permanent) | "Microphone blocked. Go to Settings > Safari > Microphone to allow access." | Visual only |
| `not-allowed` (session) | "Please allow microphone access to use voice." | Visual only |
| `audio-capture` | "I need your microphone. Please allow access." | Visual only |
| `no-speech` | "I didn't hear anything. Try saying the wake phrase again." | Visual + audio |
| `network` | "Check your internet connection and try again." | Visual only |
| `no-voices` | "Voice playback isn't available on this device right now." | Visual only |
| `not-supported` | "Voice isn't supported in this browser. Try Safari or Chrome." | Visual only |

Permanent vs. temporary microphone denial is distinguished by whether the `not-allowed` error persists across a retry attempt (first denial = session; second consecutive = permanent).

**2.2 — Wire toast into useVoiceRecognition** (FR-003, FR-006)  
Expose `voiceError` and `clearVoiceError` from the hook. The hook translates service error codes into the structured error object `{ code, isPermanent }` that the toast consumes.

**2.3 — Unsupported browser message** (FR-006, SC-006)  
When `voiceService.isSupported()` returns false at mount time, set `voiceError` to `{ code: 'not-supported' }` immediately — no interaction required. The toast renders within 2 seconds of page load.

### Phase 3 — Background Recovery

**3.1 — Auto-resume on foreground** (FR-011, SC-001)  
In `useVoiceRecognition`, add a `visibilitychange` listener (and `pageshow` for PWA installed mode) at mount. When the document becomes visible again and `isWaitingForWakeWord` was true, wait 800ms (iOS audio system recovery time) then call `startWakeWordDetection()`. Tear down the listener on unmount.

### Phase 4 — Tests

**4.1 — voiceService.test.js additions**  
- iOS detection: `isIOS()` returns true for iPhone, iPod, modern iPad (maxTouchPoints > 2, Mac platform), and false for real Mac
- Wake detection survives 3 consecutive `onend` fires (SC-001)
- `speak()` called exactly once when voices empty on first call (SC-005)
- Wake phrase ignored while `isSpeaking === true` (FR-009)
- `no-voices` error emitted when voice list empty (FR-010)

**4.2 — VoiceErrorToast.test.jsx**  
- Renders correct message for each error code
- Auto-dismisses after 5 seconds (use fake timers)
- Permanent `not-allowed` shows Settings guidance; session `not-allowed` shows re-allow prompt

**4.3 — useVoiceRecognition.test.js additions**  
- `voiceError` state is set when service emits error
- `clearVoiceError` resets state
- `visibilitychange` triggers restart after 800ms delay (fake timers)

## Complexity Tracking

No constitution violations. No complexity justification required.
