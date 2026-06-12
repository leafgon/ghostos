import { writeFileSync } from "node:fs";
import { transformFileSync } from "@babel/core";

const INPUT_PATH = "lib/index.core.js";
const OUTPUT_PATH = "lib/index.cjs";

const result = transformFileSync(INPUT_PATH, {
  presets: ["@babel/preset-env"],
  sourceType: "module",
});

if (!result?.code) {
  throw new Error(`Failed to transpile ${INPUT_PATH} to CommonJS.`);
}

writeFileSync(OUTPUT_PATH, `${result.code}\n`, "utf8");
