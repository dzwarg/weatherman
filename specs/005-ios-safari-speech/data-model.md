# Data Model: iOS and Safari Speech Support

**Phase**: 1 | **Date**: 2026-04-29 | **Feature**: 005-ios-safari-speech

> No persistent data model changes. This feature is entirely in-memory client-side state. The section below documents the in-memory state machine and error taxonomy that drives the UI.

---

## VoiceService State Machine

```
                    ┌─────────────────────┐
                    │       IDLE          │
                    │  isListening: false │
                    │  isSpeaking: false  │
                    └──────────┬──────────┘
                               │ startWakeWordDetection()
                               ▼
                    ┌─────────────────────┐
                    │  WAKE_LISTENING     │◄──── OS session end → restart (≤3s)
                    │  isListening: true  │◄──── foreground return → restart (800ms delay)
                    │  isSpeaking: false  │
                    └──────────┬──────────┘
                               │ wake phrase detected
                               │ (ignored if isSpeaking === true)
                               ▼
                    ┌─────────────────────┐
                    │  QUERY_LISTENING    │
                    │  isListening: true  │
                    │  isSpeaking: false  │
                    └──────────┬──────────┘
                               │ final result received
                               ▼
                    ┌─────────────────────┐
                    │     SPEAKING        │
                    │  isListening: false │
                    │  isSpeaking: true   │
                    └──────────┬──────────┘
                               │ utterance onend
                               ▼
                    ┌─────────────────────┐
                    │  WAKE_LISTENING     │ (automatic restart)
                    └─────────────────────┘
```

**Error exits** from any state → `IDLE` + emit error event → toast displayed

---

## Error Taxonomy

All errors are communicated via the `onError` callback. The hook translates error codes into structured objects for the UI.

| Error Code | Source | iOS Audio Allowed | Toast Message Category |
|---|---|---|---|
| `not-allowed` | `recognition.onerror` | No (gesture required) | Microphone denial |
| `audio-capture` | `recognition.onerror` | No | Microphone access |
| `no-speech` | `recognition.onerror` | Yes (in result chain) | No speech detected |
| `network` | `recognition.onerror` | No | Network error |
| `aborted` | `recognition.onerror` | No | Silently ignored |
| `no-voices` | `_startSpeech` internal | N/A — audio skipped | No voices available |
| `not-supported` | `isSupported()` at mount | N/A — no recognition | Unsupported browser |

**Permanent vs. session `not-allowed`**: Determined by retry state in the hook. First `not-allowed` error → session denial message. If `not-allowed` fires again without an intervening successful start → permanent denial message (direct to Settings).

---

## Hook State Shape

`useVoiceRecognition` exposes:

```javascript
{
  isListening: boolean,           // QUERY_LISTENING active
  isWaitingForWakeWord: boolean,  // WAKE_LISTENING active
  isSupported: boolean,           // false → show not-supported toast on mount
  error: {                        // null when no error
    code: string,                 // error code from taxonomy above
    isPermanent: boolean,         // true for permanent not-allowed
  } | null,
  lastQuery: ParsedQuery | null,
  startWakeWordDetection: () => void,
  stopListening: () => void,
  startManualListening: () => void,
  clearError: () => void,         // NEW: replaces clearQuery for error state
  clearQuery: () => void,
}
```

**New fields** (additions to existing hook shape):
- `error` — replaces the current `error: string | null` with a structured object
- `clearError` — separate action from `clearQuery`
