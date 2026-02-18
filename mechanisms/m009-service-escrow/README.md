# m009 — Service Provision Escrow

Trustless milestone-based escrow for ecosystem services (verification, monitoring, methodology development) with agent-assisted deliverable review and dispute resolution.

## What it outputs

- **Milestone review score** (0–1000): 4-factor weighted assessment of deliverable quality (quality 0.40, evidence 0.25, consistency 0.20, reputation 0.15)
- **Confidence** (0–1000): Data availability across deliverable, reputation, prior milestones, and spec access
- **Recommendation**: APPROVE / NEEDS_REVISION / FLAG_FOR_CLIENT
- **KPI block**: Agreement counts by status, milestone approval rate, dispute rate, escrow economics, average completion time

## What it does not do in v0

- No on-chain escrow contract (payments are off-chain or manual)
- No automated milestone payment release
- No dispute resolution (Arbiter DAO integration is v1/v2)
- Agent scores are advisory only — clients make final approval decisions

## Scoring formula

```
score = 0.40 × deliverable_quality + 0.25 × evidence_completeness + 0.20 × milestone_consistency + 0.15 × provider_reputation
```

## How to reference

- **Canonical spec**: `mechanisms/m009-service-escrow/SPEC.md`
- **Schemas**: `mechanisms/m009-service-escrow/schemas/`
- **Reference implementation**: `mechanisms/m009-service-escrow/reference-impl/`

## Replay datasets

- `datasets/fixtures/v0_sample.json` — Five service agreements across standard service types
- `datasets/fixtures/v0_dispute_sample.json` — Dispute resolution scenarios
