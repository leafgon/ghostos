import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

const fixtureRoot = join(process.cwd(), "tests", "fixtures", "user-domain-mvp");
const runtimeFileRefValidAfter = Date.parse("2026-07-25T12:00:00Z");

function readJson(name) {
  return JSON.parse(readFileSync(join(fixtureRoot, name), "utf8"));
}

function sha256(name) {
  return createHash("sha256")
    .update(readFileSync(join(fixtureRoot, name)))
    .digest("hex");
}

function schemaErrors(bundle, schemaId, value) {
  const ajv = new Ajv2020({
    strict: false,
    unicodeRegExp: false,
    validateFormats: false,
  });
  const definitions = JSON.parse(JSON.stringify(bundle.$defs));
  for (const schema of Object.values(definitions)) {
    delete schema.$id;
  }
  const validate = ajv.compile({
    $schema: bundle.$schema,
    $defs: definitions,
    $ref: `#/$defs/${schemaId}`,
  });
  return validate(value) ? [] : (validate.errors ?? []);
}

function consumerErrors(name, schemaId, value) {
  const errors = [];
  if (schemaId === "leafgon.runtime_file_ref.v1") {
    const ref = String(value.ref ?? "").toLowerCase();
    const forbidden = ["tenant", "graph", "blob", "storage", "session", "hash"];
    if (forbidden.some((part) => ref.includes(part))) {
      errors.push(`${name}: runtime file ref must remain opaque`);
    }
    if (Date.parse(String(value.expiresAt ?? "")) <= runtimeFileRefValidAfter) {
      errors.push(`${name}: runtime file ref is expired`);
    }
  }
  return errors;
}

describe("Terraformer-owned user-domain contract fixtures", () => {
  it("matches pinned source hashes and consumer expectations", () => {
    const manifest = readJson("manifest.json");
    const bundle = readJson(manifest.schemaBundleCopy);

    expect(manifest.sourceRepository).toBe("leafgon/terraformer");
    expect(manifest.sourceSchemaBundlePath).toBe(
      "infra/conventions/user-domain-mvp-contracts.json",
    );
    expect(sha256(manifest.schemaBundleCopy)).toBe(manifest.sourceSchemaBundleSha256);

    const copiedNames = new Set();
    for (const [name, schemaId, expectedValid, expectedSha] of manifest.fixtures) {
      copiedNames.add(name);
      expect(sha256(name)).toBe(expectedSha);
      expect(`${manifest.sourceFixtureDirectory}/${name}`).toMatch(
        /^tests\/fixtures\/user-domain-mvp\//,
      );
      const value = readJson(name);
      const errors = [
        ...schemaErrors(bundle, schemaId, value),
        ...consumerErrors(name, schemaId, value),
      ];
      expect(errors.length === 0, JSON.stringify(errors)).toBe(expectedValid);
    }

    const actualNames = new Set(
      readdirSync(fixtureRoot).filter(
        (name) =>
          name.endsWith(".json") && name !== "manifest.json" && name !== "schema-bundle.json",
      ),
    );
    expect(actualNames).toEqual(copiedNames);
  });
});
