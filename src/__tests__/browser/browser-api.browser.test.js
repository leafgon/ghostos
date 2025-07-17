import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as lib from '../../../lib/index.esm.js';
import { doBottle } from '../../api/parser/nodelogic/datautils/bottling.js';

// Debug: Log what's available in the lib object
console.log('lib keys:', Object.keys(lib));
console.log('lib type:', typeof lib);
console.log('lib.doBottle type:', typeof lib.doBottle);
console.log('lib.default:', lib.default);

// Example browser API tests
describe('Browser API Tests', () => {
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    // Create a mock canvas element
    mockCanvas = document.createElement('canvas');
    mockContext = {
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
    };
    
    // Mock the getContext method
    mockCanvas.getContext = vi.fn(() => mockContext);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Canvas API', () => {
    it('should create canvas and get 2D context', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      const ctx = canvas.getContext('2d');
      
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(100);
      expect(canvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should draw a rectangle on canvas', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      ctx.fillRect(10, 10, 50, 50);
      
      expect(ctx.fillRect).toHaveBeenCalledWith(10, 10, 50, 50);
    });

    it('should clear canvas area', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      ctx.clearRect(0, 0, 100, 100);
      
      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
    });
  });

  describe('WebGL API', () => {
    it('should create WebGL context', () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      
      expect(gl).toBeDefined();
    });
  });

  describe('Audio API', () => {
    it('should create AudioContext', () => {
      const audioContext = new AudioContext();
      
      expect(audioContext).toBeDefined();
      expect(audioContext.createOscillator).toBeDefined();
      expect(audioContext.createGain).toBeDefined();
    });

    it('should create oscillator and gain nodes', () => {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      expect(oscillator).toBeDefined();
      expect(gainNode).toBeDefined();
      expect(oscillator.connect).toBeDefined();
      expect(gainNode.connect).toBeDefined();
    });
  });

  describe('Media API', () => {
    it('should create MediaRecorder', () => {
      const stream = new MediaStream();
      const mediaRecorder = new MediaRecorder(stream);
      
      expect(mediaRecorder).toBeDefined();
      expect(mediaRecorder.start).toBeDefined();
      expect(mediaRecorder.stop).toBeDefined();
    });
  });

  describe('Storage API', () => {
    it('should use localStorage', () => {
      localStorage.setItem('test-key', 'test-value');
      const value = localStorage.getItem('test-key');
      
      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should use sessionStorage', () => {
      sessionStorage.setItem('session-key', 'session-value');
      const value = sessionStorage.getItem('session-key');
      
      expect(sessionStorage.setItem).toHaveBeenCalledWith('session-key', 'session-value');
      expect(sessionStorage.getItem).toHaveBeenCalledWith('session-key');
    });
  });

  describe('Animation API', () => {
    it('should use requestAnimationFrame', () => {
      const callback = vi.fn();
      const id = requestAnimationFrame(callback);
      
      expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
      expect(id).toBe(1);
    });

    it('should use cancelAnimationFrame', () => {
      const id = 1;
      cancelAnimationFrame(id);
      
      expect(cancelAnimationFrame).toHaveBeenCalledWith(id);
    });
  });

  describe('Performance API', () => {
    it('should use performance.now', () => {
      const timestamp = performance.now();
      
      expect(performance.now).toHaveBeenCalled();
      expect(typeof timestamp).toBe('number');
    });

    it('should use performance.mark', () => {
      performance.mark('test-mark');
      
      expect(performance.mark).toHaveBeenCalledWith('test-mark');
    });
  });

  describe('URL API', () => {
    it('should create URL object', () => {
      const url = new URL('https://example.com/path?param=value');
      
      expect(url).toBeDefined();
      expect(url.href).toBe('https://example.com/path?param=value');
      expect(url.origin).toBe('http://localhost');
    });

    it('should use URLSearchParams', () => {
      const params = new URLSearchParams('param1=value1&param2=value2');
      
      expect(params).toBeDefined();
      expect(params.get).toBeDefined();
      expect(params.set).toBeDefined();
    });
  });

  describe('WebSocket API', () => {
    it('should create WebSocket connection', () => {
      const ws = new WebSocket('ws://localhost:8080');
      
      expect(ws).toBeDefined();
      expect(ws.send).toBeDefined();
      expect(ws.close).toBeDefined();
      expect(ws.addEventListener).toBeDefined();
    });
  });

  describe('Fetch API', () => {
    it('should make fetch request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        })
      );

      const response = await fetch('https://api.example.com/data');
      const data = await response.json();
      
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/data');
      expect(data).toEqual({ data: 'test' });
    });
  });

  describe('ResizeObserver API', () => {
    it('should create ResizeObserver', () => {
      const observer = new ResizeObserver(() => {});
      
      expect(observer).toBeDefined();
      expect(observer.observe).toBeDefined();
      expect(observer.unobserve).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });
  });

  describe('IntersectionObserver API', () => {
    it('should create IntersectionObserver', () => {
      const observer = new IntersectionObserver(() => {});
      
      expect(observer).toBeDefined();
      expect(observer.observe).toBeDefined();
      expect(observer.unobserve).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });
  });
}); 

describe('doBottle utility', () => {
  it('should create a bottle object with key, data, and label', () => {
    const key = 'testKey';
    const data = { foo: 'bar' };
    const label = { tag: 'mylabel' };
    const bottle = doBottle(key, data, label);
    expect(bottle).toEqual({
      _bname: key,
      _content: data,
      _label: label
    });
  });

  it('should default label to empty object if not provided', () => {
    const key = 'testKey';
    const data = 42;
    const bottle = doBottle(key, data);
    expect(bottle).toEqual({
      _bname: key,
      _content: data,
      _label: {}
    });
  });

  it('should import doBottle from the built ESM bundle and work', async () => {
    const lib = await import('../../../lib/index.esm.js');
    // Access doBottle directly as a named export
    expect(typeof lib.doBottle).toBe('function');
    const bottle = lib.doBottle('key', 123);
    expect(bottle).toMatchObject({
      _bname: 'key',
      _content: 123,
      _label: {}
    });
  });

  it('should log ESM bundle export structure', async () => {
    const lib = await import('../../../lib/index.esm.js');
    
    // Check if lib is actually imported
    expect(typeof lib).toBe('object');
    expect(lib).toBeDefined();
    
    // Log the structure and then fail with the info
    const libKeys = Object.keys(lib);
    const defaultKeys = lib.default ? Object.keys(lib.default) : [];
    
    expect(libKeys.includes('doBottle')).toBe(true);
  });
}); 