import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Mock Web Speech API
globalThis.SpeechRecognition = class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';

  start() {}
  stop() {}
  abort() {}

  addEventListener() {}
  removeEventListener() {}
};

globalThis.webkitSpeechRecognition = globalThis.SpeechRecognition;

globalThis.SpeechSynthesisUtterance = class MockSpeechSynthesisUtterance {
  text = '';
  rate = 1;
  pitch = 1;
  volume = 1;

  constructor(text) {
    this.text = text;
  }
};

globalThis.speechSynthesis = {
  speak: () => {},
  cancel: () => {},
  pause() {},
  resume() {},
  getVoices: () => [],
};

// Mock geolocation API
globalThis.navigator.geolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};
