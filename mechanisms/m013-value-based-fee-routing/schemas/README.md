# m013 output schemas

These JSON Schemas define **canonical output shapes** for m013 (Value-Based Fee Routing) artifacts.

## Files
- `m013_fee_event.schema.json` — schema for a single fee collection event (tx_type, value, fee_amount, distribution).
- `m013_fee_config.schema.json` — schema for fee configuration (rates by transaction type, distribution shares, min_fee).
- `m013_kpi.schema.json` — schema for the KPI JSON block emitted by agents/digests.

## Notes
- These schemas are intended for **validation** and consistency across repos (Heartbeat, agent skills, etc.).
- v0 is a reference spec: schemas describe outputs for the proposed fee model.
- All monetary amounts are in **uregen** (1 REGEN = 1,000,000 uregen).
- Distribution shares must satisfy the **Share Sum Unity** invariant (sum = 1.0).
- Fee rates are bounded `[0, 0.10]` per the **Rate Bound Safety** invariant.
