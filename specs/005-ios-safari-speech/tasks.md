# Tasks: iOS and Safari Speech Support

**Input**: Design documents from `/specs/005-ios-safari-speech/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to ([US1], [US2], [US3])
- All paths relative to repository root

---

## Phase 1: Setup

**Purpose**: Confirm baseline before any changes.

- [x] T001 Verify existing test suite and lint pass in `packages/frontend` (run `npm test` and `npm run lint` — record baseline pass/fail state before any edits)

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Shared utility used by both US1 restart logic and future platform detection. Must be complete before US1.

**⚠️ CRITICAL**: US1 depends on this — complete before Phase 3.

- [x] T002 Add `isIOS()` helper function at the top of `packages/frontend/src/services/voiceService.js` that returns `true` for iPhone/iPod (userAgent check), pre-iPadOS-13 iPad (userAgent check), and iPadOS 13+ iPad (`navigator.maxTouchPoints > 2` AND `/Mac/.test(navigator.platform)`); replace both existing `/iPad|iPhone|iPod/.test(navigator.userAgent)` occurrences at lines 151 and 159 with calls to `isIOS()`

**Checkpoint**: `isIOS()` exists, all existing tests still pass.

---

## Phase 3: User Story 1 — Wake Word Detection Reliability on iPhone and iPad (Priority: P1) 🎯 MVP

**Goal**: Wake word detection survives repeated iOS session endings and browser backgrounding; iPads behave identically to iPhones.

**Independent Test**: On iPhone/iPad, say the wake phrase 5 times in a row across natural session breaks — app responds every time without a page reload. Switch to another app and return — detection resumes within 3 seconds.

### Implementation for User Story 1

- [x] T003 [US1] Fix `_setupWakeWordHandlers()` in `packages/frontend/src/services/voiceService.js` to add an `onend` handler with the same restart loop as `startWakeWordDetection()` (same `isListening` guard, `isRestarting` flag, `isIOS()`-based delay, and reinit fallback) — this is the root cause of wake detection permanently stopping after one iOS recovery

- [x] T004 [P] [US1] Add `visibilitychange` event listener in `packages/frontend/src/hooks/useVoiceRecognition.js`: when `document.hidden` becomes `false` and `isWaitingForWakeWord` is `true`, wait 800ms then call `startWakeWordDetection()`; also add `pageshow` listener checking `event.persisted` for PWA installed mode; remove both listeners on hook unmount

### Tests for User Story 1

- [x] T005 [P] [US1] Add tests in `packages/frontend/tests/services/voiceService.test.js` covering: (a) `isIOS()` returns true for iPhone UA, iPod UA, iPad UA, and `maxTouchPoints > 2` + Mac platform; returns false for Mac with `maxTouchPoints ≤ 1`; (b) wake word detection survives 3 consecutive `onend` fires without losing the restart handler; (c) `_setupWakeWordHandlers()` sets `onresult`, `onerror`, AND `onend` on the recognition instance

- [x] T006 [P] [US1] Add tests in `packages/frontend/tests/hooks/useVoiceRecognition.test.js` covering: (a) `visibilitychange` to `hidden: false` triggers `startWakeWordDetection()` after 800ms (use fake timers); (b) `pageshow` with `persisted: true` triggers restart; (c) listeners are removed on unmount

**Checkpoint**: User Story 1 fully functional. Wake word detection on iOS survives OS session endings and browser backgrounding. iPads correctly get 1000ms restart delay.

---

## Phase 4: User Story 2 — Spoken Responses and Error Feedback on iPhone and iPad (Priority: P1)

**Goal**: Spoken responses play exactly once on the successful voice path; error states always produce a visible toast; audio is never the sole feedback channel for errors on iOS.

**Independent Test**: On iPhone — complete a wake-phrase → response cycle (audio plays exactly once); revoke microphone permission (toast appears within 1 second, auto-dismisses in 5 seconds); put device in Restrictions mode (no-voices toast appears). On macOS Safari — complete a full cycle with no double-speech.

### Implementation for User Story 2

- [x] T007 [P] [US2] Fix double-speak race in `speak()` in `packages/frontend/src/services/voiceService.js`: add a `hasStarted` guard flag inside the `voices.length === 0` branch; both the `onvoiceschanged` handler and the `setTimeout` callback must check `if (hasStarted) return; hasStarted = true;` then set `this.SpeechSynthesis.onvoiceschanged = null` and call `clearTimeout(timeoutId)` before calling `_speakWithCancellation`

- [x] T008 [P] [US2] Remove all `this.speak(message)` calls from `onerror` handlers in `packages/frontend/src/services/voiceService.js` (lines 82–84 in `_setupWakeWordHandlers` and lines 128–143 in `startWakeWordDetection`); these silently fail on iOS since `onerror` is outside the user gesture chain — the `onError` callback is sufficient for surfacing errors to the UI layer

- [x] T009 [P] [US2] Gate the wake phrase trigger in the `onresult` handler inside `startWakeWordDetection()` in `packages/frontend/src/services/voiceService.js`: wrap `if (containsWakePhrase(transcript))` with `if (!this.isSpeaking && containsWakePhrase(transcript))` so wake phrases are ignored while a response is playing (FR-009)

- [x] T010 [P] [US2] Add empty-voices error emission in `_startSpeech()` in `packages/frontend/src/services/voiceService.js`: when `voices.length === 0` after the guard check, call `this.onError?.('no-voices')` and `resolve()` instead of warning and continuing silently (FR-010)

- [x] T011 [US2] Update `packages/frontend/src/hooks/useVoiceRecognition.js`: (a) change `error` state from `string | null` to `{ code: string, isPermanent: boolean } | null`; (b) add `clearError` callback; (c) track consecutive `not-allowed` errors — first occurrence sets `isPermanent: false`, second consecutive sets `isPermanent: true` (resets on any successful recognition start); (d) map `no-voices` and `not-supported` (from `isSupported()` check at mount) to the structured error shape; (e) expose `voiceError` and `clearError` from hook return

- [x] T012 [US2] Create `packages/frontend/src/components/VoiceErrorToast.jsx`: accepts `{ error: { code, isPermanent } | null, onDismiss }` props; renders `null` when `error` is null; auto-dismisses after 5000ms using `useEffect` with `clearTimeout` cleanup; maps error codes to user-facing messages using the error taxonomy from `data-model.md` (not-allowed+permanent → Settings guidance; not-allowed+session → re-allow prompt; audio-capture, no-speech, network, no-voices, not-supported → their respective messages from the plan); uses Racine (Seeds) design system components for toast styling

- [x] T013 [US2] Mount `<VoiceErrorToast error={voiceError} onDismiss={clearError} />` in the component that renders the voice interface in `packages/frontend/src/` (locate the component that uses `useVoiceRecognition` and add the toast alongside it)

### Tests for User Story 2

- [x] T014 [P] [US2] Add tests in `packages/frontend/tests/services/voiceService.test.js` covering: (a) `speak()` called exactly once when voices are empty (both `onvoiceschanged` and `setTimeout` fire — only one `_speakWithCancellation` call); (b) `onerror` handlers do NOT call `speak()`; (c) wake phrase ignored when `isSpeaking` is true; (d) `onError` called with `'no-voices'` when voices list is empty

- [x] T015 [P] [US2] Create `packages/frontend/tests/components/VoiceErrorToast.test.jsx`: (a) renders correct message for each error code; (b) `not-allowed` + `isPermanent: true` shows Settings guidance; (c) `not-allowed` + `isPermanent: false` shows re-allow prompt; (d) auto-dismisses after 5000ms (fake timers); (e) `onDismiss` called on dismiss; (f) renders nothing when `error` is null

- [x] T016 [P] [US2] Add tests in `packages/frontend/tests/hooks/useVoiceRecognition.test.js` covering: (a) `voiceError.code` set when service emits error; (b) `clearError` sets error to null; (c) first `not-allowed` → `isPermanent: false`; consecutive `not-allowed` → `isPermanent: true`; successful start resets permanent flag; (d) `voiceError` set to `not-supported` immediately if `isSupported()` false

**Checkpoint**: Error toast appears for all failure modes; audio plays exactly once on success path; wake phrase ignored during speech.

---

## Phase 5: User Story 3 — Voice Graceful Degradation on macOS Safari (Priority: P2)

**Goal**: macOS Safari completes a full voice cycle without double-speech; unsupported browsers show a clear message within 2 seconds of page load.

**Independent Test**: Open in a non-SpeechRecognition browser — "voice not supported" toast appears on load. Open in macOS Safari — complete wake-phrase → query → response cycle with no audio duplication.

### Implementation for User Story 3

- [x] T017 [US3] Wire unsupported browser detection in `packages/frontend/src/hooks/useVoiceRecognition.js`: in the mount `useEffect`, if `voiceService.isSupported()` returns `false`, immediately call `setVoiceError({ code: 'not-supported', isPermanent: true })` — this satisfies SC-006 (visible message within 2 seconds of page load) without requiring user interaction

### Tests for User Story 3

- [x] T018 [P] [US3] Add tests in `packages/frontend/tests/hooks/useVoiceRecognition.test.js` for unsupported browser: (a) when `isSupported()` returns false, `voiceError` is `{ code: 'not-supported', isPermanent: true }` immediately on mount; (b) `VoiceErrorToast` renders the not-supported message

**Checkpoint**: All three user stories independently functional and testable.

---

## Final Phase: Polish & Validation

- [x] T019 Run full test suite with coverage report in `packages/frontend` (`npm run test:coverage`); confirm ≥80% branch coverage on `voiceService.js`, `useVoiceRecognition.js`, and `VoiceErrorToast.jsx`

- [x] T020 [P] Run ESLint and production build in `packages/frontend` (`npm run lint && npm run build`); confirm zero lint errors and successful build

- [x] T021 Change `WAKE_PHRASE` constant in `packages/frontend/src/utils/constants.js` from `'good morning weatherbot'` to `'ready'` (lowercase, single word, matching the iOS wake word constraint from spec)

- [x] T022 [P] Update `packages/frontend/src/utils/voiceUtils.test.js` — replace all occurrences of `'good morning weatherbot'` in test assertions with `'ready'` (wake phrase detection tests, `removeWakePhrase` tests)

- [x] T023 [P] Update `packages/frontend/src/services/voiceService.test.js` — replace all occurrences of `'good morning weatherbot'` in test transcripts with `'ready'`

- [x] T024 [P] Update `packages/frontend/src/components/voice/WakeWordDetector.test.jsx` — replace `'good morning weatherbot'` with `'ready'` in test assertions (UI text checks on lines 67, 83)

- [x] T025 [P] Update E2E test files in `packages/frontend/tests/e2e/` — replace `'good morning weatherbot'` and `'weatherbot'` wake word references with `'ready'` in `voice-workflow.test.js`, `voice-workflow.spec.js`, and `README.md`

- [x] T026 Run full test suite with coverage in `packages/frontend` (`npm run test:coverage`); confirm all tests pass after wake word change

- [x] T027 [P] Run ESLint and production build in `packages/frontend` (`npm run lint && npm run build`); confirm zero failures

- [ ] T028 Execute all 8 manual test scenarios from `specs/005-ios-safari-speech/quickstart.md`; mark each item complete; record any failures as issues before closing the feature

- [x] T029 Fix `startListening()` in `packages/frontend/src/services/voiceService.js` to use `continuous: true` + `interimResults: true` + 1500ms silence timeout for finalization — iOS fires single-word results; the old `continuous: false` + `interimResults: false` design captured only the first word

- [x] T030 [P] Update `packages/frontend/src/services/voiceService.test.js` — update `should start listening for query` to assert `continuous: true` and `interimResults: true`; update `should handle final result` to simulate silence timeout with `vi.useFakeTimers()` and `vi.advanceTimersByTime(1500)`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks US1**
- **US1 (Phase 3)**: Depends on Phase 2 — T003 and T004 are parallelizable with each other; T005/T006 are parallelizable with T003/T004
- **US2 (Phase 4)**: Depends on Phase 2 only — T007/T008/T009/T010 are all parallelizable; T011 depends on T007–T010; T012 depends on T011; T013 depends on T012
- **US3 (Phase 5)**: Depends on T011/T012 (structured error state and toast component from US2)
- **Polish (Final)**: Depends on all story phases complete; T021 (wake word constant change) must complete before T022–T025 (test file updates); T022–T025 are fully parallelizable; T026–T027 depend on T021–T025

### User Story Dependencies

- **US1 (P1)**: Requires T002 (isIOS helper) — no other story dependencies
- **US2 (P1)**: Requires T002 (isIOS helper, already done) — no dependency on US1 completion
- **US3 (P2)**: Requires T011 (structured error state) and T012 (VoiceErrorToast) from US2

### Parallel Opportunities Within US1

```bash
# After T003 completes, these can run simultaneously:
Task T004: "Add visibilitychange/pageshow handlers in useVoiceRecognition.js"
Task T005: "Write isIOS() and wake-restart tests in voiceService.test.js"
Task T006: "Write visibility/resume tests in useVoiceRecognition.test.js"
```

### Parallel Opportunities Within US2

```bash
# These four voiceService fixes share no function dependencies — run together:
Task T007: "Fix double-speak guard in speak()"
Task T008: "Remove speak() from onerror handlers"
Task T009: "Gate wake phrase on !isSpeaking"
Task T010: "Add no-voices error emission"

# After T007–T010, test tasks can run in parallel with T011:
Task T014: "voiceService error tests"   ← parallel with T011
Task T015: "VoiceErrorToast tests"      ← after T012
Task T016: "Hook error state tests"     ← after T011
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002)
3. Complete Phase 3: US1 — wake word reliability (T003–T006)
4. **STOP and validate**: 5 consecutive interactions on iPhone; iPad detection; background resume
5. Complete Phase 4: US2 — spoken responses + error feedback (T007–T016)
6. **STOP and validate**: Error toast; no double-speak; wake phrase ignored during speech
7. Deploy/demo: iOS voice experience fully working

### Incremental Delivery

1. T001–T002 → Foundation ready
2. T003–T006 → **US1 complete** → Demo: reliable wake word detection on iPhone/iPad
3. T007–T016 → **US2 complete** → Demo: spoken responses + visible error feedback
4. T017–T018 → **US3 complete** → Demo: graceful degradation on unsupported browsers
5. T019–T020 → Polish + validation (original)
6. T021–T030 → Wake word change + query listening fix + re-validation → PR ready

---

## Summary

| Phase | Tasks | Story | Parallelizable |
|---|---|---|---|
| Phase 1: Setup | T001 | — | No |
| Phase 2: Foundational | T002 | — | No |
| Phase 3: US1 | T003–T006 | US1 | T004, T005, T006 parallel after T003 |
| Phase 4: US2 | T007–T016 | US2 | T007–T010 fully parallel; T014–T016 parallel after deps |
| Phase 5: US3 | T017–T018 | US3 | T018 parallel |
| Polish (original) | T019–T020 | — | T020 parallel |
| Polish (wake word) | T021–T030 | — | T022–T025, T030 fully parallel |
| **Total** | **30 tasks** | | |

---

## Changelog

| Date | Commit | Task | Description |
|------|--------|------|-------------|
| 2026-06-13 | `a34d784` | T001–T020 | Full iOS/Safari speech compatibility (US1, US2, US3, original polish) |
| 2026-06-13 | `ee4e9dd` | T021–T027 | Change wake word from 'good morning weatherbot' to 'ready'; update all tests; re-validate |
| 2026-06-13 | (pending) | T029–T030 | Fix `startListening()` to use `continuous: true` + silence timer for iOS multi-word query capture; update tests |
