# m013 — Value-Based Fee Routing (v0)

m013 replaces flat gas fees with **value-proportional fees** on ecological credit transactions, routing fee revenue to four purpose-specific pools: Burn, Validator, Community, and Agent Infrastructure.

## What it outputs
- A **fee amount** (in uregen) computed as `max(value * rate, min_fee)` for each credit transaction.
- A **distribution breakdown** splitting the fee across four pools according to governance-set shares.
- KPI metrics: total fees collected, fees by transaction type, distribution by pool, average fee rate.

## What it does not do (v0)
- No on-chain module deployment; v0 is a spec + reference implementation for validation.
- Non-credit transactions remain on flat gas — unaffected by this mechanism.
- Fee denomination questions (OQ-M013-3) are deferred to WG resolution.

## How to reference
- Canonical spec: `mechanisms/m013-value-based-fee-routing/SPEC.md`
- Fee calculation: SPEC.md sections 3-4 (schedule + formula)
- Distribution model: SPEC.md section 5 (Model A default)
- Security invariants: SPEC.md section 9

## Replay datasets
See `datasets/` for deterministic fixtures used to generate non-zero KPI outputs without MCP.
- `v0_sample.json` — fee events from diverse transaction types

## Schemas
Canonical JSON schemas for m013 outputs live in `schemas/`.
- `m013_fee_event.schema.json` — fee collection event (tx_type, value, fee_amount, distribution)
- `m013_fee_config.schema.json` — fee configuration (rates by tx type, distribution shares)
- `m013_kpi.schema.json` — KPI output with `mechanism_id: "m013"`
