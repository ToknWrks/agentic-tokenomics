# m009 reference implementation (v0 advisory)

This folder provides a **canonical computation** for m009 outputs so that different agents/runners
produce consistent numbers.

## Inputs

### Scoring (`m009_score.js`)
An input object per milestone deliverable:

- `milestone` — milestone metadata:
  - `agreement_id` (string)
  - `milestone_index` (integer)
  - `service_type` (string, one of ProjectVerification/MethodologyDevelopment/MRVSetup/CreditIssuanceSupport/MonitoringReporting)
  - `deliverable_iri` (string)
- `factors` — pre-computed factor scores (each 0–1000):
  - `deliverable_quality` — methodology compliance and technical quality
  - `evidence_completeness` — evidence IRI resolvability and document completeness
  - `milestone_consistency` — consistency with prior milestones and agreement spec
  - `provider_reputation` — M010 reputation score (default 300 if unavailable)
  - `reputation_available` (boolean), `iri_resolvable` (boolean), `has_prior_milestones` (boolean), `spec_available` (boolean)

### KPI (`m009_kpi.js`)
- `as_of` (ISO-8601 string, Z-suffixed)
- `agreements[]` — each with `status`, `service_type`, `escrow_amount`, `provider_bond`, `milestones[]`, `dispute` (optional)

## Outputs

### Score
- `score` (0–1000) — weighted composite
- `confidence` (0–1000) — data availability
- `recommendation` — APPROVE / NEEDS_REVISION / FLAG_FOR_CLIENT
- `factors` — individual factor scores

Formula:
```
score = 0.40 × deliverable_quality + 0.25 × evidence_completeness + 0.20 × milestone_consistency + 0.15 × provider_reputation
```

### KPI block
- Agreement counts by status (proposed, funded, in_progress, completed, disputed, cancelled)
- `dispute_rate`, `resolution_breakdown`
- Escrow economics (total escrowed/released/slashed/fees, average)
- Milestone stats (total, approved, disputed, approval rate)
- Service type breakdown
