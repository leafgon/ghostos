import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Browser environment for browser API testing
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    include: [
      "src/**/*.browser.test.js",
      "src/**/*.browser.test.ts",
      "src/**/*.browser.test.jsx",
      "src/**/*.browser.test.tsx",
      "src/**/*.browser.spec.js",
      "src/**/*.browser.spec.ts",
      "src/**/*.browser.spec.jsx",
      "src/**/*.browser.spec.tsx",
    ],
    exclude: [
      "node_modules",
      "lib",
      "**/*.d.ts",
      "src/api/leafui/elements/floweditor/lib/reactflow.11.10.4",
      "src/api/parser/leaflisp/stdlib",
      "src/api/parser/leaflisp/pocket-lisp",
      "src/api/leafui/lib/texteditor/cm-vim",
      // Exclude existing Jest tests to avoid conflicts
      "src/**/*.spec.js",
      "src/**/*.unit.test.js",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "lib/", "**/*.d.ts", "**/*.config.js", "vitest.setup.js"],
    },
  },
  resolve: {
    alias: {
      "@ghostos/core": resolve(__dirname, "src/index.core.js"),
      "graphology-components": false,
      "quickjs-emscripten": false,
    },
  },
  define: {
    // Mock browser APIs that might not be available in jsdom
    "process.env.NODE_ENV": '"test"',
    global: "globalThis",
  },
});
