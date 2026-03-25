# m009 replay datasets

Fixture files for replay testing of m009 (Service Provision Escrow) computations.

## Files
- `schema.json` — JSON Schema for the replay dataset format.
- `fixtures/v0_sample.json` — Five service agreements across all standard service types, with milestone review scores matching reference-impl output. Includes IN_PROGRESS, MILESTONE_REVIEW, COMPLETED, CANCELLED, and PROPOSED statuses.
- `fixtures/v0_dispute_sample.json` — Four agreements covering dispute resolution scenarios: DISPUTED (pending), RESOLVED/CLIENT_WINS, RESOLVED/PROVIDER_WINS, and RESOLVED/SPLIT.

## Usage
Feed fixture files into `m009_kpi.js` to verify KPI computation. Review scores in fixtures correspond to `m009_score.js` output for the matching factor inputs.
