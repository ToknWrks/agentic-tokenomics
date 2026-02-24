#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function readJson(rel) {
  const abs = path.join(repoRoot, rel);
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

async function loadModuleFromJs(rel) {
  const abs = path.join(repoRoot, rel);
  const src = fs.readFileSync(abs, "utf8");
  const dataUrl = `data:text/javascript;base64,${Buffer.from(src).toString("base64")}`;
  return import(dataUrl);
}

function assertSubset(actual, expected, label) {
  for (const [key, value] of Object.entries(expected)) {
    assert.deepStrictEqual(
      actual[key],
      value,
      `${label}: expected '${key}' to equal ${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`
    );
  }
}

function computeOutputs(input, computeM010KPI, computeM010Score) {
  return {
    kpi: computeM010KPI({
      as_of: input.as_of,
      events: input.events,
      challenges: input.challenges,
      scope: input.scope
    }),
    score: computeM010Score({
      as_of: input.as_of,
      events: input.events
    })
  };
}

async function main() {
  const { computeM010KPI } = await loadModuleFromJs("mechanisms/m010-reputation-signal/reference-impl/m010_kpi.js");
  const { computeM010Score } = await loadModuleFromJs("mechanisms/m010-reputation-signal/reference-impl/m010_score.js");

  const vectors = [
    {
      name: "v0_sample",
      inputRel: "mechanisms/m010-reputation-signal/reference-impl/test_vectors/vector_v0_sample.input.json",
      expectedRel: "mechanisms/m010-reputation-signal/reference-impl/test_vectors/vector_v0_sample.expected.json"
    },
    {
      name: "v0_challenge",
      inputRel: "mechanisms/m010-reputation-signal/datasets/fixtures/v0_challenge_sample.json",
      expectedRel: "mechanisms/m010-reputation-signal/reference-impl/test_vectors/vector_v0_challenge.expected.json",
      assertFixtureKpis: true
    }
  ];

  for (const vector of vectors) {
    const input = readJson(vector.inputRel);
    const expected = readJson(vector.expectedRel);
    const actual = computeOutputs(input, computeM010KPI, computeM010Score);

    try {
      assert.deepStrictEqual(actual, expected);
    } catch (err) {
      console.error(`m010 vector mismatch for '${vector.name}'`);
      console.error("Expected:");
      console.error(JSON.stringify(expected, null, 2));
      console.error("Actual:");
      console.error(JSON.stringify(actual, null, 2));
      throw err;
    }

    if (vector.assertFixtureKpis && input.expected_outputs?.challenge_kpis) {
      assertSubset(actual.kpi.challenge_kpis ?? {}, input.expected_outputs.challenge_kpis, `fixture expected_outputs.challenge_kpis (${vector.name})`);
    }
  }

  console.log("m010 reference-impl vectors: PASS");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
