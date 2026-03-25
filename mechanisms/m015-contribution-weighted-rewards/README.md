# m015 — Contribution-Weighted Rewards

m015 replaces passive staking rewards with an **activity-based distribution system** where participants earn from the Community Pool proportional to their ecological and governance contributions.

## What it outputs
- An **activity score** per participant per epoch, computed as a weighted sum of five on-chain activities: credit purchases (0.30), credit retirements (0.30), platform facilitation (0.20), governance voting (0.10), and proposal submission (0.10).
- A **distribution amount** per participant per epoch: `activity_pool * (participant_score / total_scores)`.
- **Stability tier** allocation: fixed 6% annual return for committed long-term holders, capped at 30% of Community Pool inflow.

## What it does not do (v0)
- No on-chain token distributions; v0 is scoring and projection only.
- No enforcement of stability tier locks; v0 computes accruals for validation.
- No direct interaction with x/gov or x/ecocredit modules; v0 reads chain data via indexer.

## How to reference
- Canonical spec: `mechanisms/m015-contribution-weighted-rewards/SPEC.md`
- Activity weights: SPEC.md section 5.1
- Stability tier: SPEC.md section 6
- State machine: SPEC.md section 7

## Replay datasets
See `datasets/` for deterministic fixtures used to generate non-zero KPI outputs without MCP.
- `v0_sample.json` -- single distribution period with 4 participants
- `v0_stability_sample.json` -- stability tier scenarios (committed, matured, early exit)

## Schemas
Canonical JSON schemas for m015 outputs live in `schemas/`.
- `m015_activity_score.schema.json` -- activity score output per participant
- `m015_stability_commitment.schema.json` -- stability tier commitment record
- `m015_kpi.schema.json` -- KPI output for distribution periods
