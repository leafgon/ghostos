import { readFile } from "node:fs/promises";

const cortexSourcePath = "src/api/parser/nodelogic/elements/library/cortex.js";
const cortexSourceSuffix = `/${cortexSourcePath}`;
const bundles = [
  ["lib/index.core.js", "lib/index.core.js.map"],
  ["lib/index.esm.js", "lib/index.esm.js.map"],
];

const normalizeNewlines = (value) => value.replaceAll("\r\n", "\n").trimEnd();
const cortexSource = normalizeNewlines(await readFile(cortexSourcePath, "utf8"));

for (const [bundlePath, sourceMapPath] of bundles) {
  const bundle = await readFile(bundlePath, "utf8");
  const sourceMap = JSON.parse(await readFile(sourceMapPath, "utf8"));
  const cortexSourceIndex = sourceMap.sources.findIndex((source) =>
    source.endsWith(cortexSourceSuffix),
  );

  if (cortexSourceIndex < 0 || typeof sourceMap.sourcesContent?.[cortexSourceIndex] !== "string") {
    throw new Error(`${sourceMapPath} does not contain the Cortex source.`);
  }

  const bundledCortexSource = normalizeNewlines(sourceMap.sourcesContent[cortexSourceIndex]);
  if (bundledCortexSource !== cortexSource) {
    throw new Error(`${sourceMapPath} contains stale Cortex source.`);
  }

  if (/field:["']timeoutMs["'],fallback:2e3/.test(bundle)) {
    throw new Error(`${bundlePath} still injects the legacy 2000ms Cortex timeout.`);
  }
  if (/field:["']maxAttempts["'],fallback:2,/.test(bundle)) {
    throw new Error(`${bundlePath} still injects the legacy Cortex attempt default.`);
  }
}

console.log("Verified publishable Cortex artifacts are current.");
