# m013 reference implementation (v0)

This folder provides a **canonical computation** for m013 outputs so that different agents/runners
produce consistent numbers.

## Inputs
A fee event input object:

- `tx_type` — one of: `CreditIssuance`, `CreditTransfer`, `CreditRetirement`, `MarketplaceTrade`
- `value_uregen` — transaction value in uregen (1 REGEN = 1,000,000 uregen)
- `fee_config` (optional) — fee configuration with `fee_rates`, `distribution_shares`, `min_fee_uregen`

## Outputs
### Per-event fee result
- `fee_amount` — computed fee in uregen (after min_fee clamping)
- `min_fee_applied` — boolean indicating whether the min_fee floor was applied
- `distribution` — breakdown: `{ burn, validator, community, agent }` in uregen

### KPI block
- `total_fees_uregen` — sum of all fees in the period
- `fee_events_count` — number of fee events
- `fees_by_type` — fee totals broken down by transaction type
- `distribution_by_pool` — fee distribution totals by pool
- `avg_fee_rate` — average effective fee rate (total_fees / total_value)
- `min_fee_applied_count` — number of events where the min_fee floor was applied

## Self-test
Run `node m013_fee.js` from this directory (or from repo root). The script reads
`test_vectors/vector_v0_sample.input.json`, computes fee results, compares against
`test_vectors/vector_v0_sample.expected.json`, and exits with code 1 on any mismatch.

## Defaults (v0 Model A)
- Fee rates: CreditIssuance 2%, CreditTransfer 0.1%, CreditRetirement 0.5%, MarketplaceTrade 1%
- Distribution: Burn 30%, Validator 40%, Community 25%, Agent 5%
- Min fee: 1,000,000 uregen (1 REGEN)
