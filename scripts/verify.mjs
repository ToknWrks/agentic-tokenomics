#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();

function requireFile(rel) {
  const p = path.join(repoRoot, rel);
  if (!fs.existsSync(p)) {
    console.error(`Missing required file: ${rel}`);
    process.exit(2);
  }
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { cwd: repoRoot, encoding: "utf8" });
  if (res.status !== 0) {
    console.error(res.stdout || "");
    console.error(res.stderr || "");
    process.exit(res.status ?? 3);
  }
}

function readJson(rel) {
  const p = path.join(repoRoot, rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Core files
requireFile("README.md");
requireFile("mechanisms/m010-reputation-signal/SPEC.md");
requireFile("mechanisms/m010-reputation-signal/README.md");
requireFile("mechanisms/m010-reputation-signal/schemas/m010_kpi.schema.json");
requireFile("mechanisms/m010-reputation-signal/schemas/m010_signal.schema.json");
requireFile("mechanisms/m010-reputation-signal/datasets/fixtures/v0_sample.json");

// Mechanism index check
run("node", ["scripts/build-mechanism-index.mjs", "--check"]);

// m013 core files
requireFile("mechanisms/m013-value-based-fee-routing/SPEC.md");
requireFile("mechanisms/m013-value-based-fee-routing/README.md");
requireFile("mechanisms/m013-value-based-fee-routing/schemas/m013_kpi.schema.json");
requireFile("mechanisms/m013-value-based-fee-routing/schemas/m013_fee_event.schema.json");
requireFile("mechanisms/m013-value-based-fee-routing/schemas/m013_fee_config.schema.json");
requireFile("mechanisms/m013-value-based-fee-routing/datasets/fixtures/v0_sample.json");

// Basic schema sanity — m010
const kpiSchema = readJson("mechanisms/m010-reputation-signal/schemas/m010_kpi.schema.json");
if (!kpiSchema.required || !kpiSchema.required.includes("mechanism_id")) {
  console.error("m010 KPI schema missing required fields.");
  process.exit(4);
}

// Basic schema sanity — m013
const m013KpiSchema = readJson("mechanisms/m013-value-based-fee-routing/schemas/m013_kpi.schema.json");
if (!m013KpiSchema.required || !m013KpiSchema.required.includes("mechanism_id")) {
  console.error("m013 KPI schema missing required fields.");
  process.exit(4);
}

// m013 self-test
run("node", ["mechanisms/m013-value-based-fee-routing/reference-impl/m013_fee.js"]);

console.log("agentic-tokenomics verify: PASS");
