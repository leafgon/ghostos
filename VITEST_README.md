# Vitest Browser API Testing

This project now includes Vitest configuration for testing browser APIs. Vitest provides a fast and modern testing framework that works well with browser environments.

## Setup

The Vitest configuration includes:

- **Browser Environment**: Uses `jsdom` to simulate browser APIs
- **Mock Setup**: Comprehensive browser API mocks in `vitest.setup.js`
- **TypeScript Support**: Full TypeScript support with proper type checking
- **Coverage**: Built-in coverage reporting

## Configuration Files

### `vitest.config.js`

Main Vitest configuration with:

- Browser environment (`jsdom`)
- Test file patterns
- Coverage settings
- Module resolution aliases
- Global definitions

### `vitest.setup.js`

Browser API mocks including:

- Canvas API
- WebGL API
- Audio API
- Media API
- Storage API
- Animation API
- Performance API
- URL API
- WebSocket API
- Fetch API
- Observer APIs (ResizeObserver, IntersectionObserver)

## Usage

### Running Tests

```bash
# Run tests in watch mode (default)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Writing Browser API Tests

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Browser API Tests", () => {
  beforeEach(() => {
    // Setup mocks or test data
  });

  afterEach(() => {
    // Clean up mocks
    vi.clearAllMocks();
  });

  it("should test canvas API", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.fillRect(10, 10, 50, 50);

    expect(ctx.fillRect).toHaveBeenCalledWith(10, 10, 50, 50);
  });

  it("should test audio API", () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();

    expect(oscillator).toBeDefined();
    expect(oscillator.connect).toBeDefined();
  });
});
```

### Testing Async Browser APIs

```javascript
it("should make fetch request", async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    }),
  );

  const response = await fetch("https://api.example.com/data");
  const data = await response.json();

  expect(fetch).toHaveBeenCalledWith("https://api.example.com/data");
  expect(data).toEqual({ data: "test" });
});
```

### Testing WebGL APIs

```javascript
it("should create WebGL context", () => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");

  expect(gl).toBeDefined();
});
```

## Available Browser APIs

The setup includes mocks for these browser APIs:

### Canvas & Graphics

- `HTMLCanvasElement`
- `CanvasRenderingContext2D`
- `WebGLRenderingContext`
- `WebGL2RenderingContext`

### Audio & Media

- `AudioContext`
- `AudioBuffer`
- `AudioBufferSourceNode`
- `MediaRecorder`
- `MediaStream`

### Storage

- `localStorage`
- `sessionStorage`
- `indexedDB`

### Animation & Performance

- `requestAnimationFrame`
- `cancelAnimationFrame`
- `performance`

### Network & Communication

- `fetch`
- `WebSocket`
- `Worker`

### Observers

- `ResizeObserver`
- `IntersectionObserver`

### URL & Navigation

- `URL`
- `URLSearchParams`

## Mocking Custom APIs

To mock additional browser APIs, add them to `vitest.setup.js`:

```javascript
// Example: Mock a custom API
global.CustomAPI = vi.fn().mockImplementation(() => ({
  method1: vi.fn(),
  method2: vi.fn(),
}));
```

## Coverage

Vitest provides built-in coverage reporting:

```bash
npm run test:coverage
```

This will generate coverage reports in multiple formats:

- Text output in terminal
- HTML report in `coverage/` directory
- JSON data for CI integration

## Integration with Existing Tests

The Vitest configuration is designed to work alongside existing Jest tests. You can:

1. Keep existing Jest tests for Node.js specific code
2. Use Vitest for browser API tests
3. Gradually migrate tests as needed

## Troubleshooting

### Common Issues

1. **Missing Browser APIs**: Add mocks to `vitest.setup.js`
2. **TypeScript Errors**: Ensure types are properly imported
3. **Async Test Failures**: Use `vi.waitFor()` for async operations
4. **Mock Not Working**: Check if mocks are properly set up in setup file

### Debug Mode

Run tests with verbose output:

```bash
npm test -- --reporter=verbose
```

### UI Mode

For interactive debugging:

```bash
npm run test:ui
```

This opens a web interface for running and debugging tests.

## Best Practices

1. **Mock External Dependencies**: Always mock browser APIs that make external calls
2. **Clean Up**: Use `afterEach` to clear mocks
3. **Isolate Tests**: Each test should be independent
4. **Use Descriptive Names**: Test names should clearly describe what's being tested
5. **Test Edge Cases**: Include tests for error conditions and edge cases

## Example Test Structure

```javascript
describe("Feature Name", () => {
  let mockElement;
  let mockAPI;

  beforeEach(() => {
    // Setup
    mockElement = document.createElement("div");
    mockAPI = vi.fn();
  });

  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
  });

  describe("when condition A", () => {
    it("should behave correctly", () => {
      // Test implementation
    });
  });

  describe("when condition B", () => {
    it("should handle errors", () => {
      // Error test
    });
  });
});
```
