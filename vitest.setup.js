import { vi } from "vitest";

// Mock Tone.js and instrument modules to avoid AudioContext usage in tests
const noop = () => {};
class MockToneNode {
  connect() {}
  toDestination() {}
  set() {}
  dispose() {}
  triggerAttack() {}
  triggerRelease() {}
  triggerAttackRelease() {}
}

vi.mock("tone", () => ({
  AutoFilter: class extends MockToneNode {},
  BitCrusher: class extends MockToneNode {},
  Chebyshev: class extends MockToneNode {},
  PitchShift: class extends MockToneNode {},
  Transport: { state: "stopped", start: noop },
  start: noop,
}));

vi.mock("tone/build/esm/instrument/Synth.js", () => ({ Synth: class extends MockToneNode {} }));
vi.mock("tone/build/esm/instrument/AMSynth.js", () => ({ AMSynth: class extends MockToneNode {} }));
vi.mock("tone/build/esm/instrument/DuoSynth.js", () => ({
  DuoSynth: class extends MockToneNode {},
}));
vi.mock("tone/build/esm/instrument/FMSynth.js", () => ({ FMSynth: class extends MockToneNode {} }));
vi.mock("tone/build/esm/instrument/MembraneSynth.js", () => ({
  MembraneSynth: class extends MockToneNode {},
}));
vi.mock("tone/build/esm/instrument/MetalSynth.js", () => ({
  MetalSynth: class extends MockToneNode {},
}));
vi.mock("tone/build/esm/instrument/MonoSynth.js", () => ({
  MonoSynth: class extends MockToneNode {},
}));
vi.mock("tone/build/esm/instrument/NoiseSynth.js", () => ({
  NoiseSynth: class extends MockToneNode {},
}));
vi.mock("tone/build/esm/instrument/PluckSynth.js", () => ({
  PluckSynth: class extends MockToneNode {},
}));
vi.mock("tone/build/esm/instrument/PolySynth.js", () => ({
  PolySynth: class extends MockToneNode {},
}));
vi.mock("tone/build/esm/instrument/Sampler.js", () => ({
  Sampler: class extends MockToneNode {},
}));

// Mock browser APIs that might not be available in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock WebGL APIs
global.WebGLRenderingContext = vi.fn();
global.WebGL2RenderingContext = vi.fn();

// Mock Canvas APIs
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

// Mock Audio APIs
global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn() },
  })),
  createAnalyser: vi.fn(() => ({
    connect: vi.fn(),
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
  })),
}));

// Mock Web Audio APIs
global.AudioBuffer = vi.fn();
global.AudioBufferSourceNode = vi.fn();

// Mock Media APIs
global.MediaStream = vi.fn().mockImplementation(() => ({
  getTracks: vi.fn(() => []),
  getVideoTracks: vi.fn(() => []),
  getAudioTracks: vi.fn(() => []),
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
}));

global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  requestData: vi.fn(),
}));

// Mock Web Workers
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// Mock fetch for browser environment
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;

// Mock IndexedDB
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 0);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

// Mock URL API
global.URL = vi.fn().mockImplementation((url) => ({
  href: url,
  origin: "http://localhost",
  protocol: "http:",
  host: "localhost",
  hostname: "localhost",
  port: "",
  pathname: "/",
  search: "",
  searchParams: new URLSearchParams(),
  hash: "",
}));

// Mock URLSearchParams
global.URLSearchParams = vi.fn().mockImplementation(() => ({
  get: vi.fn(),
  set: vi.fn(),
  append: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
  toString: vi.fn(() => ""),
}));

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};
