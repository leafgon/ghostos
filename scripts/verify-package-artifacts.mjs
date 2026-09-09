import { readFile } from "node:fs/promises";

const cortexSourcePath = "src/api/parser/nodelogic/elements/library/cortex.js";
const cortexSourceSuffix = `/${cortexSourcePath}`;
const leaflispSourcePath = "src/api/parser/nodelogic/wizardry/leaflisp.js";
const leaflispSourceSuffix = `/${leaflispSourcePath}`;
const bundles = [
  ["lib/index.core.js", "lib/index.core.js.map"],
  ["lib/index.esm.js", "lib/index.esm.js.map"],
];

const normalizeNewlines = (value) => value.replaceAll("\r\n", "\n").trimEnd();
const cortexSource = normalizeNewlines(await readFile(cortexSourcePath, "utf8"));
const leaflispSource = normalizeNewlines(await readFile(leaflispSourcePath, "utf8"));

const assertSourceMapContainsCurrentSource = ({
  sourceMap,
  sourceMapPath,
  sourcePath,
  sourceSuffix,
  source,
}) => {
  const sourceIndex = sourceMap.sources.findIndex((candidate) => candidate.endsWith(sourceSuffix));

  if (sourceIndex < 0 || typeof sourceMap.sourcesContent?.[sourceIndex] !== "string") {
    throw new Error(`${sourceMapPath} does not contain ${sourcePath}.`);
  }

  const bundledSource = normalizeNewlines(sourceMap.sourcesContent[sourceIndex]);
  if (bundledSource !== source) {
    throw new Error(`${sourceMapPath} contains stale source for ${sourcePath}.`);
  }
};

for (const [bundlePath, sourceMapPath] of bundles) {
  const bundle = await readFile(bundlePath, "utf8");
  const sourceMap = JSON.parse(await readFile(sourceMapPath, "utf8"));
  assertSourceMapContainsCurrentSource({
    sourceMap,
    sourceMapPath,
    sourcePath: cortexSourcePath,
    sourceSuffix: cortexSourceSuffix,
    source: cortexSource,
  });
  assertSourceMapContainsCurrentSource({
    sourceMap,
    sourceMapPath,
    sourcePath: leaflispSourcePath,
    sourceSuffix: leaflispSourceSuffix,
    source: leaflispSource,
  });

  if (/field:["']timeoutMs["'],fallback:2e3/.test(bundle)) {
    throw new Error(`${bundlePath} still injects the legacy 2000ms Cortex timeout.`);
  }
  if (/field:["']maxAttempts["'],fallback:2,/.test(bundle)) {
    throw new Error(`${bundlePath} still injects the legacy Cortex attempt default.`);
  }
  if (
    bundle.includes("leaflisp.js lambda") &&
    bundle.includes("be defined as a lambda-scoped node.")
  ) {
    throw new Error(
      `${bundlePath} still contains the legacy leaflisp lambda fallback implementation.`,
    );
  }
}

console.log("Verified publishable GhostOS artifacts are current.");
