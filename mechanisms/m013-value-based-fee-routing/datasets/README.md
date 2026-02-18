# m013 datasets (replay fixtures)

These fixtures are **deterministic inputs** for generating non-zero m013 KPI outputs **without MCP**.

## Files
- `schema.json` — JSON schema for replay datasets
- `fixtures/v0_sample.json` — fee events from diverse transaction types (issuance, transfer, retirement, marketplace) including low-value events that trigger the min_fee floor

## How they are used
A replay runner (e.g., in `regen-heartbeat`) can read a fixture file and compute:
- `total_fees_uregen` — sum of all computed fees
- `fee_events_count` — number of fee events
- `fees_by_type` — fee totals broken down by transaction type
- `distribution_by_pool` — fee distribution totals by pool (burn, validator, community, agent)
- `avg_fee_rate` — average effective fee rate (total_fees / total_value)
- `min_fee_applied_count` — count of events where the min_fee floor was applied

All monetary values are in **uregen** (1 REGEN = 1,000,000 uregen).

These datasets are for validation and digest reporting only; they do not imply on-chain enforcement.
