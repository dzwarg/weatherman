# Research: iOS and Safari Speech Support

**Phase**: 0 | **Date**: 2026-04-29 | **Feature**: 005-ios-safari-speech

## RES-001: iPadOS 13+ User Agent Detection

**Decision**: Use `navigator.maxTouchPoints > 2` as the primary check, with `/iPad/.test(navigator.userAgent)` as a fallback for older iPadOS versions.

**Rationale**: iPadOS 13+ reports `"Macintosh; Intel Mac OS X"` in the user agent, identical to macOS. Macs report `maxTouchPoints` of 0 or 1 (Magic Trackpad reports 1); iPads report 5. The threshold `> 2` reliably separates iPads from Macs including those with touch trackpads.

**Recommended helper**:
```javascript
function isIOS() {
  if (/iPhone|iPod/.test(navigator.userAgent)) return true;
  if (/iPad/.test(navigator.userAgent)) return true;           // pre-iPadOS 13
  if (navigator.maxTouchPoints > 2 && /Mac/.test(navigator.platform)) return true; // iPadOS 13+
  return false;
}
```

**Alternatives considered**:
- `'ontouchstart' in window` — can fire falsely on some Mac trackpad configurations
- `navigator.platform === 'MacIntel'` alone — also matches real Macs
- CSS media queries — not accessible in JavaScript service code

**Caveats**: `maxTouchPoints` returns 0 in headless/automation contexts, so this check will correctly return false for non-touch Macs in test environments (tests should mock `navigator.maxTouchPoints`).

---

## RES-002: Page Visibility for iOS Background/Foreground Detection

**Decision**: Use `visibilitychange` as the primary event, paired with `pageshow` (checking `event.persisted`) for PWA installed mode. Add an 800ms delay before restarting recognition on return.

**Rationale**: `visibilitychange` fires reliably on iOS 14-17 in in-browser tabs. PWAs installed to the home screen are more consistent with `pageshow`. The 800ms delay allows the iOS audio subsystem to release resources before SpeechRecognition is restarted — restarting immediately can cause silent failures.

**Implementation**:
```javascript
const handleVisibilityChange = () => {
  if (!document.hidden && wasListening) {
    setTimeout(() => startWakeWordDetection(), 800);
  }
};
const handlePageShow = (e) => {
  if (e.persisted && wasListening) {
    setTimeout(() => startWakeWordDetection(), 800);
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);
document.addEventListener('pageshow', handlePageShow);
```

**Alternatives considered**:
- `focus` event — unreliable on iOS Safari; may not fire on tab return
- `resume` event — Android/Cordova specific; does not exist in iOS Safari context

---

## RES-003: SpeechSynthesis Double-Invoke Prevention

**Decision**: Use a `hasStarted` boolean guard flag scoped inside the `speak()` Promise, combined with listener removal and `clearTimeout`.

**Rationale**: Both `onvoiceschanged` and the setTimeout fallback can fire in sequence. A single boolean guard ensures `_speakWithCancellation` is called at most once regardless of which path fires first. Removing the listener prevents future `voiceschanged` events (e.g., voice pack updates) from triggering a second speak call.

**Pattern**:
```javascript
const voices = this.SpeechSynthesis.getVoices();
if (voices.length === 0) {
  let hasStarted = false;
  const proceed = () => {
    if (hasStarted) return;
    hasStarted = true;
    this.SpeechSynthesis.onvoiceschanged = null;
    clearTimeout(timeoutId);
    this._speakWithCancellation(text, options, resolve, reject);
  };
  this.SpeechSynthesis.onvoiceschanged = proceed;
  const timeoutId = setTimeout(proceed, 100);
  return;
}
```

**Alternatives considered**:
- `addEventListener('voiceschanged', fn, { once: true })` — `{ once }` option not available on `SpeechSynthesis` which uses assignment-style handlers, not `addEventListener`
- `Promise.race()` — adds complexity without benefit over the guard pattern
- State queue — over-engineered for a single-call scenario

---

## RES-004: iOS Gesture Context for SpeechSynthesis

**Decision**: Attempt audio in the successful recognition path (gesture context is inherited through Web Speech API `onresult` callbacks on iOS); use visual-only toast for all error paths.

**Rationale**: iOS Safari propagates gesture context through Web Speech API result callbacks. A `speak()` call inside `recognition.onresult` — triggered by the user saying the wake phrase — is treated as user-initiated and plays successfully. Error callbacks (`onerror`) do NOT inherit gesture context; `speak()` in those handlers silently drops on iOS. This matches the spec's FR-004 requirement.

**Practical implication**: The error handler code path in `startWakeWordDetection` that currently calls `this.speak(message)` must be changed to emit an error event only (no audio). The toast component handles the user-visible feedback. Audio for successful responses remains in the `onresult`-triggered path and works correctly.

**No "unlock" mechanism**: There is no API to pre-authorize SpeechSynthesis for later non-gesture calls. Each call requires either a direct gesture or inheritance through a gesture-originating callback chain.
