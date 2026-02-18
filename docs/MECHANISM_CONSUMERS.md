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

## m014 — Authority Validator Governance
**Canonical spec**
- `mechanisms/m014-authority-validator-governance/SPEC.md`

**Outputs**
- KPI JSON block schema: `mechanisms/m014-authority-validator-governance/schemas/m014_kpi.schema.json`
- Validator item schema: `mechanisms/m014-authority-validator-governance/schemas/m014_validator.schema.json`
- Performance score schema: `mechanisms/m014-authority-validator-governance/schemas/m014_performance.schema.json`

**Datasets (deterministic)**
- Replay fixtures: `mechanisms/m014-authority-validator-governance/datasets/fixtures/v0_sample.json`
- Transition fixtures: `mechanisms/m014-authority-validator-governance/datasets/fixtures/v0_transition_sample.json`

**Known consumers**
- AGENT-004: Validator Monitor (performance tracking, probation recommendations)
- Heartbeat character: `validator-monitor-agent` (regen-heartbeat, planned)
- M013 integration: validator fund balance feeds compensation computation
