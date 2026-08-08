import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const runtimeFiles = [
  "src/api/leafio/leaflake.js",
  "src/api/parser/eta.js",
  "src/api/parser/nodelogic/elements/library/directus.js",
  "src/api/parser/nodelogic/elements/library/href.js",
  "src/api/parser/nodelogic/elements/library/http.js",
  "src/api/parser/nodelogic/elements/library/openai.js",
  "src/api/parser/nodelogic/elements/library/rancher.js",
  "src/api/parser/nodelogic/wizardry/leaflisp.js",
];

describe("Lodash browser imports", () => {
  it.each(runtimeFiles)("uses direct function imports in %s", (relativePath) => {
    const source = readFileSync(resolve(process.cwd(), relativePath), "utf8");

    expect(source).not.toMatch(/from\s+["']lodash["']/);
  });
});
