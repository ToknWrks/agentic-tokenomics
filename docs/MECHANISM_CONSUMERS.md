# Mechanism consumers

This document maps **mechanism IDs** to known **consumers** (agents, digests, scripts).

## m010 — Reputation Signal
**Canonical spec**
- `mechanisms/m010-reputation-signal/SPEC.md`

**Outputs**
- KPI JSON block schema: `mechanisms/m010-reputation-signal/schemas/m010_kpi.schema.json`
- Signal item schema: `mechanisms/m010-reputation-signal/schemas/m010_signal.schema.json`
- Challenge event schema: `mechanisms/m010-reputation-signal/schemas/m010_challenge.schema.json`

**Datasets (deterministic)**
- Replay fixtures: `mechanisms/m010-reputation-signal/datasets/fixtures/v0_sample.json`
- Challenge replay fixture: `mechanisms/m010-reputation-signal/datasets/fixtures/v0_challenge_sample.json`
- Escalated challenge fixture: `mechanisms/m010-reputation-signal/datasets/fixtures/v0_challenge_escalated_sample.json`
- Edge-timing challenge fixture: `mechanisms/m010-reputation-signal/datasets/fixtures/v0_challenge_edge_timing_sample.json`

**Known consumers**
- Heartbeat character: `signal-agent` (regen-heartbeat)
- Heartbeat replay runner: `scripts/replay-m010.mjs` (regen-heartbeat)
- Heartbeat stub runner: `scripts/stub-run-signal-agent.mjs` (regen-heartbeat)
- Heartbeat validator: `scripts/validate-signal-agent.mjs` (regen-heartbeat)

**Consumer contract (current)**
- Score output key: `score.reputation_score_0_1` (normalized `0..1` in v0 advisory).
- Contributing signal statuses: `active`, `resolved_valid`.
- Excluded signal statuses: `submitted`, `challenged`, `escalated`, `resolved_invalid`, `withdrawn`, `invalidated`.
- KPI denominator convention: `challenge_rate = challenges_filed / signals_emitted`.

**Compatibility policy**
- Non-breaking:
  - adding optional fields
  - adding new deterministic fixtures or vectors
  - tightening documentation without changing output keys
- Potentially breaking (coordinate downstream first):
  - renaming/removing output keys
  - changing score range/key semantics
  - changing KPI denominator semantics
  - changing lifecycle contribution rules
