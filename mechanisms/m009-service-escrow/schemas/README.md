# m009 output schemas

These JSON Schemas define **canonical output shapes** for m009 (Service Provision Escrow) artifacts.

## Files
- `m009_agreement.schema.json` — schema for service agreement lifecycle objects (escrow, milestones, status, dispute details).
- `m009_milestone_review.schema.json` — schema for milestone review quality score output (score, confidence, recommendation, factor breakdown).
- `m009_kpi.schema.json` — schema for KPI metrics (agreement counts, dispute rate, escrow economics, milestone stats, service type breakdown).

## Notes
- These schemas are intended for **validation** and consistency across repos (Heartbeat, agent skills, etc.).
- v0 is advisory-only: schemas describe outputs, not enforcement.
- The `status` field on agreements tracks lifecycle state (PROPOSED → FUNDED → IN_PROGRESS → MILESTONE_REVIEW → COMPLETED/DISPUTED/CANCELLED). See SPEC.md section 6.
- Standard service types: ProjectVerification, MethodologyDevelopment, MRVSetup, CreditIssuanceSupport, MonitoringReporting.
