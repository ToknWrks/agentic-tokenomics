# Mechanism consumers

This document maps **mechanism IDs** to known **consumers** (agents, digests, scripts).

## m010 — Reputation Signal
**Canonical spec**
- `mechanisms/m010-reputation-signal/SPEC.md`

**Outputs**
- KPI JSON block schema: `mechanisms/m010-reputation-signal/schemas/m010_kpi.schema.json`
- Signal item schema: `mechanisms/m010-reputation-signal/schemas/m010_signal.schema.json`

**Datasets (deterministic)**
- Replay fixtures: `mechanisms/m010-reputation-signal/datasets/fixtures/v0_sample.json`

**Known consumers**
- Heartbeat character: `signal-agent` (regen-heartbeat)
- Heartbeat replay runner: `scripts/replay-m010.mjs` (regen-heartbeat)
- Heartbeat stub runner: `scripts/stub-run-signal-agent.mjs` (regen-heartbeat)
- Heartbeat validator: `scripts/validate-signal-agent.mjs` (regen-heartbeat)

## m013 — Value-Based Fee Routing
**Canonical spec**
- `mechanisms/m013-value-based-fee-routing/SPEC.md`

**Outputs**
- KPI JSON block schema: `mechanisms/m013-value-based-fee-routing/schemas/m013_kpi.schema.json`
- Fee event schema: `mechanisms/m013-value-based-fee-routing/schemas/m013_fee_event.schema.json`
- Fee config schema: `mechanisms/m013-value-based-fee-routing/schemas/m013_fee_config.schema.json`

**Datasets (deterministic)**
- Replay fixtures: `mechanisms/m013-value-based-fee-routing/datasets/fixtures/v0_sample.json`

**Known consumers**
- Reference implementation self-test: `mechanisms/m013-value-based-fee-routing/reference-impl/m013_fee.js`
- KPI computation: `mechanisms/m013-value-based-fee-routing/reference-impl/m013_kpi.js`
