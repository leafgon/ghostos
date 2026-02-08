import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "**/*.d.ts",
      "lib/**",
      "imported/**",
      "node_modules/**",
      "src/api/parser/eta.spec.js",
      "src/api/leafio/leaflake.unit.test.js",
      "src/api/parser/leaflisp/**",
      "src/api/parser/nodelogic/**/*.spec.js",
      "src/api/parser/nodelogic/**/*.unit.test.js",
      "src/api/parser/nodelogic/**/*.spec.ts",
      "src/api/parser/nodelogic/**/*.unit.test.ts",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        WebSocket: "readonly",
        window: "readonly",
        document: "readonly",
        global: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { args: "none" }],
      "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.test.*", "**/*.spec.*"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        vi: "readonly",
      },
    },
  },
]);
