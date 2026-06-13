# Feature Specification: iOS and Safari Speech Support

**Feature Branch**: `005-ios-safari-speech`  
**Created**: 2026-04-29  
**Status**: Draft  
**Input**: User description: "fully support ios and safari browser for speech events"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Wake Word Detection Works Reliably on iPhone and iPad (Priority: P1)

A child on an iPhone or iPad opens the app and says "Ready." The app hears the wake word and transitions to active listening — every time, not just the first time. Today, the app silently stops listening after the first recovery attempt, leaving children speaking to an unresponsive app.

**Why this priority**: Wake word detection is the primary entry point for the entire voice interface. If it fails silently, no other voice feature is reachable on iOS.

**Independent Test**: Can be fully tested on an iPhone or iPad by saying the wake phrase, receiving a weather response, and then saying the wake phrase again multiple times in a row — the app should respond each time without requiring a page reload.

**Acceptance Scenarios**:

1. **Given** the app is open on an iPhone running iOS 17, **When** the child says "Ready," **Then** the app enters active listening mode and responds with a spoken greeting.
2. **Given** the app has just completed a voice interaction on an iPad (iPadOS 16+), **When** the child says the wake word again after the response finishes, **Then** the app detects it and starts a new interaction.
3. **Given** wake word detection has been running for several minutes on iOS, **When** the operating system ends the recognition session (as it does periodically), **Then** the app silently restarts detection and remains ready to hear the wake phrase.
4. **Given** the app is running on an iPad (iPadOS 13+), **When** the wake word detection restart logic runs, **Then** it applies the same recovery behavior as an iPhone (longer restart delay and full reinitialization when needed).

---

### User Story 2 - Spoken Responses Play Reliably on iPhone and iPad (Priority: P1)

After asking about the weather, the child hears a spoken response. On iOS today, spoken responses triggered by voice recognition errors (e.g., "Microphone access was denied") are silently dropped because iOS requires audio to be initiated by a user tap. Children are left with no feedback about what went wrong.

**Why this priority**: Without audible responses, the app's core value proposition — a voice-first experience for children — is broken on iOS devices, which are a primary target platform.

**Independent Test**: Can be fully tested on an iPhone by (a) granting and then revoking microphone permission and triggering a recognition error, and (b) completing a normal wake-word-to-response cycle — both should produce visible feedback, and (b) should also produce audible feedback.

**Acceptance Scenarios**:

1. **Given** the app has just heard the wake phrase and processed a weather query, **When** the server returns a response, **Then** the child hears the spoken response on their iPhone or iPad.
2. **Given** microphone permission was denied, **When** the app detects this error, **Then** the child sees an auto-dismissing toast message explaining the issue, visible for approximately 5 seconds (since audio cannot be guaranteed to play outside a user gesture on iOS).
3. **Given** a spoken response is in progress, **When** a second response is triggered, **Then** the first response is cancelled cleanly and the second one plays without duplication or silence.
4. **Given** the app is running on macOS Safari, **When** a spoken response is triggered, **Then** it plays without being duplicated (no double-speaking from the voice-loading fallback).

---

### User Story 3 - Voice Feature Works or Gracefully Degrades on macOS Safari (Priority: P2)

A parent or older sibling opens the app in Safari on a Mac. Voice features either work fully or the app clearly communicates which capabilities are unavailable, rather than failing silently.

**Why this priority**: macOS Safari has broad feature support but distinct quirks that cause subtle failures. Silent failures are worse than clear degradation messages because they leave users confused.

**Independent Test**: Can be fully tested on macOS Safari by completing a full voice interaction cycle from wake word through spoken response, and by verifying no unexpected double-speech or unresponsive states occur.

**Acceptance Scenarios**:

1. **Given** Safari on macOS, **When** the user says the wake phrase, **Then** the app detects it and proceeds to active listening normally.
2. **Given** Safari on macOS where voices load before the app requests them, **When** the app speaks a response, **Then** the response plays exactly once (not twice).
3. **Given** a browser that does not support voice features, **When** the app loads, **Then** a visible message informs the user that voice is not supported and they should use a supported browser.

---

### Edge Cases

- When the user backgrounds the browser on iOS, wake word detection stops. When the user returns to the app, detection resumes automatically without requiring a manual tap.
- If microphone permission is revoked while the app is actively listening, the app shows a toast error. If the denial is permanent (user selected "Don't Allow" in iOS Settings), the toast directs the user to Settings; if temporary (session-only denial), it prompts them to re-allow in the browser.
- If the child speaks the wake word while the app is still delivering a spoken response, the wake phrase is ignored; the response plays to completion and wake word detection resumes automatically afterward.
- On iOS 14 devices, voice recognition may have additional limitations. The app applies the same recovery logic on a best-effort basis; P1 success criteria are only formally validated on iOS 17+ hardware (see Assumptions).
- If the voice synthesis voices list is empty (privacy mode or restricted device), the app shows an auto-dismissing error toast and skips audio output — consistent with other speech failure states.
- If the child enters active listening mode but does not speak within approximately 8 seconds, the app times out with a visual cue and returns to wake word detection without playing audio (consistent with the iOS audio-initiation constraint).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST detect iPad devices running iPadOS 13 and later as mobile iOS devices, applying the same voice recognition recovery behavior as iPhone.
- **FR-002**: When the wake word detection session is restarted on iOS due to an operating system timeout, the app MUST preserve the automatic restart behavior so that wake word detection continues indefinitely.
- **FR-003**: When a voice recognition error occurs on iOS, the app MUST display a visible on-screen error message as an auto-dismissing toast that disappears after approximately 5 seconds, in addition to any attempted spoken feedback.
- **FR-004**: The app MUST NOT rely solely on spoken audio to communicate error states on iOS when the error originates outside of a user-initiated interaction — falling back to visual-only feedback in those cases.
- **FR-004a**: The app MUST distinguish between a temporary microphone denial (prompt the user to re-allow in the browser) and a permanent denial (direct the user to device Settings to restore access), displaying the appropriate guidance in the error toast.
- **FR-005**: The app MUST speak each response exactly once per trigger, regardless of how quickly the device makes voices available at startup.
- **FR-006**: The app MUST display a dismissible inline banner at the top of the page when the current browser does not support voice recognition, rather than silently disabling the feature, and must not block access to non-voice functionality.
- **FR-007**: When the app recovers from a failed voice session on iOS, it MUST fully restore all listening capabilities (hearing speech, detecting errors, and knowing when to restart) — not just a partial recovery that stops working on the next session end.
- **FR-008**: The app MUST support wake word detection that recovers from at least 3 consecutive operating-system-initiated session endings without requiring a page reload, using exponential backoff (delay doubles after each consecutive failure, capped at 30s) to avoid battery drain during rapid cycling.
- **FR-009**: While a spoken response is playing, the app MUST ignore any wake word detections and resume wake word detection automatically once the response finishes.
- **FR-010**: When no voices are available for speech synthesis (e.g., device privacy mode or restricted profile), the app MUST show an auto-dismissing error toast and skip audio output rather than silently producing no sound.
- **FR-011**: The app MUST automatically resume wake word detection when the user returns to the app after backgrounding the browser on iOS, without requiring a manual tap to restart.
- **FR-012**: When the child enters active listening mode (after wake word detection) but does not speak within approximately 8 seconds, the app MUST display a visual cue indicating no speech was detected and return to wake word detection mode.

### Key Entities

- **Voice Recognition Session**: An active period during which the app is listening for speech; has a lifecycle of started → active → ended, with automatic restart on iOS.
- **Wake Word**: The single word ("Ready") that transitions the app from passive listening to active query mode.
- **Spoken Response**: Audio output generated by the app in reply to a completed voice interaction; must be audible and play exactly once per trigger.
- **Error Feedback**: Notification to the user when a voice operation fails; may be spoken, visual, or both depending on platform capability. For microphone permission errors, content varies by denial type: permanent denial directs to Settings; session denial prompts re-allow in browser.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A child can complete 5 consecutive wake-word-to-response voice interactions on an iPhone or iPad without the app becoming unresponsive to the wake phrase; after each iOS session end, wake word detection is ready again within 3 seconds.
- **SC-002**: 100% of spoken responses play audibly when triggered by a completed wake-phrase interaction on iOS Safari (user-initiated path, not background error).
- **SC-003**: Error conditions (denied microphone, no speech detected) always produce a visible toast message on iOS that appears within 1 second of the error and auto-dismisses after 5 seconds, regardless of whether audio plays.
- **SC-004**: Wake word detection on iPadOS 13+ behaves identically to iPhone — same recovery timing, same restart depth.
- **SC-005**: On macOS Safari, a full voice interaction cycle (wake phrase → query → spoken response) produces no duplicate speech and no silent failures.
- **SC-006**: Users on unsupported browsers see a dismissible inline banner with a clear explanation within 2 seconds of the page loading, and can still access non-voice app functionality.

## Clarifications

### Session 2026-04-29

- Q: What form should visible error messages take on iOS when audio cannot be guaranteed? → A: Auto-dismissing toast (~5 seconds)
- Q: What should happen if the child says the wake phrase while a spoken response is still playing? → A: Ignore it; finish the response, then resume wake word detection
- Q: How quickly must wake word detection be ready again after an iOS session end? → A: Within 3 seconds
- Q: Should permanent vs. temporary microphone denial be handled differently? → A: Yes — permanent denial directs to Settings; temporary denial prompts re-allow in browser
- Q: Are Firefox and Edge in scope for this feature? → A: Out of scope; Safari and iOS only
- Q: What should happen when the voice synthesis voices list is empty (privacy mode, restricted device)? → A: Show auto-dismissing error toast and skip audio, consistent with other speech failure states
- Q: Should wake word detection resume automatically when the user returns from backgrounding the browser on iOS? → A: Yes — resume automatically, no manual tap required

### Session 2026-06-12

- Q: What should happen when the child is in active listening (post-wake-word) but doesn't speak? → A: Timeout after ~8 seconds of silence, show a visual cue ("I didn't hear anything"), return to wake word detection
- Q: What backoff strategy should be used when iOS rapidly ends speech recognition sessions in succession? → A: Exponential backoff — restart delay doubles after each consecutive failure (1s → 2s → 4s → ...), capped at 30s maximum
- Q: What form should the unsupported browser message take? → A: Dismissible inline banner at top of page, allowing partial app use for non-voice features
- Q: What should the wake phrase be? → A: "Ready" (single word) for all browsers, replacing "good morning weatherbot"

## Assumptions

- The target iOS versions are iOS 14.5 and later, as this is the minimum version supporting voice recognition in the browser.
- The target macOS Safari version is Safari 14.1 and later.
- Android, Chrome, Firefox, and Edge browsers are out of scope for this feature. Firefox and Edge support the same underlying browser speech APIs and are not known to have the issues being addressed here.
- Visual fallback feedback (on-screen messages) is acceptable for iOS error cases where audio cannot be guaranteed.
- The wake word was changed from "good morning weatherbot" to "Ready" as part of this feature, applying across all browsers (see Clarifications). The response flow is not changing — only the reliability of the voice pipeline on Safari/iOS is in scope.
- Performance on older devices (iOS 14 on iPhone 6s) is a best-effort concern; P1 success criteria are validated on iOS 17 on iPhone 12 or newer.
