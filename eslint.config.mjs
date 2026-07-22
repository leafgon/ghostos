import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

const tsRecommended = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: ["**/*.{ts,tsx,mts,cts}"],
}));

export default defineConfig([
  {
    ignores: [
      "**/*.d.ts",
      ".codex-worktrees/**",
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
    },
  },
  {
    files: ["src/api/parser/**/*.js", "src/api/utils/leafdataflow.js"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "off",
      "no-unreachable": "off",
      "no-redeclare": "off",
      "no-useless-escape": "off",
    },
  },
  ...tsRecommended,
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
