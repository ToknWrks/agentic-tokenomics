# m015 output schemas

These JSON Schemas define **canonical output shapes** for m015 (Contribution-Weighted Rewards) artifacts.

## Files
- `m015_activity_score.schema.json` -- schema for individual activity score output (total_score + breakdown by activity type).
- `m015_stability_commitment.schema.json` -- schema for stability tier commitment records (amount, lock period, status, accrued rewards).
- `m015_kpi.schema.json` -- schema for the KPI JSON block emitted by agents/digests (total distributed, activity pool, stability pool, participant count, avg score, stability commitments).

## Notes
- These schemas are intended for **validation** and consistency across repos (Heartbeat, agent skills, etc.).
- Amounts are in **uregen** (1 REGEN = 1,000,000 uregen).
- v0 is scoring/projection only: schemas describe outputs, not enforcement.
- The `status` field on stability commitments tracks lifecycle state (uncommitted -> committed -> matured / early_exit). See SPEC.md section 6.2.
