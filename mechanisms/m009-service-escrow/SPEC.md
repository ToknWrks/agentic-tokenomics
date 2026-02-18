# M009 — Service Provision Escrow

## 0. Header

| Field | Value |
|-------|-------|
| **Mechanism ID** | m009 |
| **Name** | Service Provision Escrow |
| **Status** | Draft — v0 advisory |
| **Owner** | Regen Network core / community |
| **Scope** | Ecosystem services (verification, monitoring, methodology development) with milestone-based payment release |

---

## 1. Problem

Ecosystem service engagements (project verification, MRV setup, methodology development) lack trustless payment coordination. Providers risk non-payment after delivery; clients risk paying for incomplete or substandard work. Without milestone-based escrow and dispute resolution, participants rely on informal agreements with no recourse mechanism. This limits the growth of the service marketplace and concentrates work among a small set of trusted providers.

---

## 2. Target actor and action

| Actor | Action |
|-------|--------|
| **Client** | Proposes service agreement with milestones and funds escrow |
| **Provider** | Accepts agreement, posts service bond, delivers milestone work |
| **AGENT-001** | Reviews milestone deliverables (evidence quality, compliance) |
| **AGENT-003** | Monitors pricing fairness and provider reliability |
| **Arbiter DAO** | Resolves disputes between client and provider (via M008) |

---

## 3. Signal definition

### Milestone Review Score (v0 advisory)

The agent produces a quality assessment for each milestone deliverable:

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `score` | integer | 0–1000 | Weighted composite of deliverable quality factors |
| `confidence` | integer | 0–1000 | Data availability indicator |
| `recommendation` | enum | APPROVE / NEEDS_REVISION / FLAG_FOR_CLIENT | Agent recommendation |
| `factors` | object | — | Individual factor scores |

---

## 4. Evidence inputs

| Input | Source | Required |
|-------|--------|----------|
| Milestone deliverable IRI | Provider submission (KOI) | Yes |
| Service agreement spec | Agreement metadata | Yes |
| Prior milestone deliverables | Agreement history | If applicable |
| Provider reputation score | M010 reputation signal | Preferred |
| Market rate data | AGENT-003 pricing monitor | Optional |
| Methodology compliance checklist | Credit class requirements | If verification service |

---

## 5. Scoring function

### Milestone review score

```
score = 0.40 × deliverable_quality
      + 0.25 × evidence_completeness
      + 0.20 × milestone_consistency
      + 0.15 × provider_reputation
```

| Factor | Weight | Description | Range |
|--------|--------|-------------|-------|
| `deliverable_quality` | 0.40 | Methodology compliance, technical quality | 0–1000 |
| `evidence_completeness` | 0.25 | Evidence IRI resolves, documents complete | 0–1000 |
| `milestone_consistency` | 0.20 | Consistency with prior milestones and agreement spec | 0–1000 |
| `provider_reputation` | 0.15 | M010 reputation of provider (default 300 if unavailable) | 0–1000 |

All factors are clamped to [0, 1000]. Final score is rounded to the nearest integer.

### Confidence

Confidence reflects data availability across four boolean signals:

| Signal | Check |
|--------|-------|
| `reputation_available` | Provider has M010 reputation score |
| `iri_resolvable` | Deliverable IRI resolves to content |
| `has_prior_milestones` | Agreement has at least one prior approved milestone |
| `spec_available` | Agreement spec is available for compliance check |

`confidence = round(count(true signals) / 4 × 1000)`

### Recommendation

| Condition | Recommendation |
|-----------|---------------|
| `score >= 700 AND confidence >= 750` | APPROVE |
| `score >= 400 AND score < 700` | NEEDS_REVISION |
| `score < 400 OR confidence < 250` | FLAG_FOR_CLIENT |

---

## 6. State machine

### Agreement lifecycle

```
PROPOSED → FUNDED → IN_PROGRESS → MILESTONE_REVIEW → IN_PROGRESS (next milestone)
                                                    → DISPUTED → RESOLVED
                                 → COMPLETED
         → CANCELLED (from PROPOSED or FUNDED)
```

| Transition | Trigger | Guard |
|------------|---------|-------|
| → PROPOSED | `client.propose_service(spec, milestones, escrow)` | 1 ≤ milestones ≤ 20, sum(payments) = escrow |
| PROPOSED → FUNDED | `provider.accept(bond) AND client.fund(escrow)` | provider reputation ≥ min, bond ≥ escrow × bond_ratio |
| PROPOSED → CANCELLED | `client.cancel() OR provider.reject() OR timeout(acceptance_window)` | state = PROPOSED |
| FUNDED → IN_PROGRESS | `start_date_reached OR both_parties_confirm` | — |
| FUNDED → CANCELLED | `client.cancel() OR mutual_cancel()` | cancellation fee applied |
| IN_PROGRESS → MILESTONE_REVIEW | `provider.submit_deliverable(milestone_id, evidence_iri)` | milestone is current, status = IN_PROGRESS |
| MILESTONE_REVIEW → IN_PROGRESS | `client.approve_milestone(milestone_id)` | payment released to provider |
| MILESTONE_REVIEW → DISPUTED | `client.dispute(milestone_id, reason) OR timeout(review_period)` | milestone status = PENDING_REVIEW |
| MILESTONE_REVIEW → MILESTONE_REVIEW | `provider.revise(milestone_id, new_iri)` | revision_count < max_revisions |
| DISPUTED → RESOLVED | `arbiter.resolve(resolution_type, rationale)` | arbiter assigned, deadline not expired |
| RESOLVED → IN_PROGRESS | `both_parties_confirm_continuation` | resolution ≠ CLIENT_WINS, remaining milestones > 0 |
| RESOLVED → COMPLETED | `CLIENT_WINS OR no remaining milestones OR mutual termination` | — |
| IN_PROGRESS → COMPLETED | `all_milestones_approved` | bond refund, platform fee |

### Milestone lifecycle

```
PENDING → IN_PROGRESS → SUBMITTED → APPROVED
                                   → DISPUTED
                                   → REVISED → SUBMITTED (re-review)
```

---

## 7. Token flows

### Escrow funding

```
Client  ──(escrow_amount)──→  Escrow Contract
Provider ──(service_bond)──→  Escrow Contract    (bond = escrow × provider_bond_ratio)
```

### Milestone approval

```
Escrow Contract ──(milestone.payment − platform_fee)──→ Provider
Escrow Contract ──(platform_fee)──→ Community Pool     (fee = 1% of milestone payment)
```

### Completion

```
Escrow Contract ──(service_bond)──→ Provider           (bond refund)
Escrow Contract ──(completion_fee)──→ Community Pool    (fee = 1% of total escrow)
```

### Cancellation (pre-start, from FUNDED)

```
Escrow Contract ──(escrow − cancellation_fee)──→ Client
Escrow Contract ──(service_bond)──→ Provider           (full bond refund)
Escrow Contract ──(cancellation_fee)──→ Community Pool  (fee = 2% of escrow)
```

### Dispute resolutions

| Outcome | Client receives | Provider receives | Community pool |
|---------|----------------|-------------------|----------------|
| **CLIENT_WINS** | remaining escrow − arbiter_fee | 0 (bond slashed: 50% client, 50% pool) | 50% of bond + arbiter_fee |
| **PROVIDER_WINS** | 0 | remaining escrow + bond − arbiter_fee | arbiter_fee |
| **SPLIT(X%)** | X% of remaining − arbiter_fee share | (100−X)% of remaining + bond − arbiter_fee share | arbiter_fee |

### Governance parameters

| Parameter | Default | Range |
|-----------|---------|-------|
| `provider_bond_ratio` | 10% (1000 bps) | 5–25% |
| `platform_fee_rate` | 1% (100 bps) | 0–5% |
| `cancellation_fee_rate` | 2% (200 bps) | 0–10% |
| `min_provider_reputation` | 100 | 0–500 |
| `acceptance_window` | 7 days | 1–30 days |
| `max_revisions` | 3 | 1–10 |
| `arbiter_fee_rate` | 5% of disputed amount | 1–15% |
| `default_review_period` | 14 days | 3–30 days |

---

## 8. Standard service types

| Service Type | Typical Escrow (REGEN) | Milestones | Review Period | Min Provider Reputation |
|--------------|----------------------|------------|---------------|------------------------|
| Project Verification | 2,000–10,000 | 3–5 | 14 days | 200 |
| Methodology Development | 10,000–50,000 | 5–10 | 21 days | 400 |
| MRV Setup | 5,000–20,000 | 4–6 | 14 days | 300 |
| Credit Issuance Support | 1,000–5,000 | 2–3 | 7 days | 100 |
| Monitoring & Reporting | 500–3,000 | 1–3 | 7 days | 100 |

---

## 9. Security invariants

1. **Escrow Conservation**: `escrow.balance = escrow_amount − sum(approved_milestone_payments) − sum(platform_fees) − sum(dispute_settlements)` at all times.
2. **Bond Integrity**: Provider bond is locked for the entire agreement lifetime and can only be released on COMPLETED or refunded on specific CANCELLED/RESOLVED transitions.
3. **Milestone Payment Bound**: `sum(milestone.payments) == escrow_amount` — no milestone can pay more than its defined amount, and the sum exactly equals the escrowed amount.
4. **Sequential Milestones**: Only `milestone[current_milestone]` can be submitted; milestones must be approved in order.
5. **Arbiter Neutrality**: Dispute arbiter cannot be client, provider, or any address that has transacted with either party within 90 days (M008 Arbiter DAO conflict checks).
6. **No Double Settlement**: A dispute can only be resolved once; resolved agreements cannot be re-disputed on the same milestone.
7. **Cancellation Guard**: FUNDED agreements incur cancellation fee; IN_PROGRESS agreements cannot be unilaterally cancelled (must dispute or mutually agree).
8. **Timeout Escalation**: If `review_period` expires without client action, the milestone auto-enters DISPUTED state to prevent indefinite blocking.

---

## 10. Attack model

| Attack | Mitigation |
|--------|-----------|
| **Client stalls review** | Timeout auto-escalates to DISPUTED after review_period |
| **Provider submits garbage** | Agent flags low-quality deliverables; client disputes; arbiter slashes bond |
| **Sybil providers** | min_provider_reputation gate (M010) prevents new accounts from accepting |
| **Arbiter collusion** | Arbiter DAO rotation, conflict-of-interest checks, bond at stake (M008) |
| **Escrow drain via fake milestones** | sum(milestone.payments) must equal escrow_amount, sequential approval |
| **Price manipulation** | AGENT-003 monitors market rates, flags outlier pricing (z-score > 2.5) |
| **Cancellation arbitrage** | Cancellation fee (2%) disincentivizes frequent propose-cancel cycles |
| **Revision spam** | max_revisions cap prevents indefinite revision loops |

---

## 11. Integration points

| System | Integration |
|--------|-------------|
| **M008 Arbiter DAO** | Dispute resolution — arbiter assignment, resolution enforcement |
| **M010 Reputation** | Provider reputation gate for acceptance; reputation update on completion |
| **M013 Fee Routing** | Platform fees follow M013 distribution model (when activated) |
| **KOI MCP** | Deliverable IRI resolution via `resolve_entity` / `get_entity_documents` |
| **Ledger MCP** | Escrow balance queries via `get_balance` / `get_all_balances` |
| **x/ecocredit** | Credit-related services link to credit class and project metadata |
| **Heartbeat** | KPI metrics published in weekly digest |

---

## 12. Acceptance tests

1. **Happy path**: Client proposes → provider accepts → fund → 3 milestones approved → completed → bond refunded → platform fee collected.
2. **Cancellation (pre-start)**: Client proposes → funds → cancels before start → escrow minus 2% returned → bond refunded.
3. **Dispute — client wins**: Milestone submitted → client disputes → arbiter rules CLIENT_WINS → provider bond slashed → client receives remaining escrow.
4. **Dispute — provider wins**: Milestone submitted → client disputes → arbiter rules PROVIDER_WINS → provider receives escrow + bond.
5. **Dispute — split**: Arbiter rules SPLIT(60%) → client gets 60%, provider gets 40% + bond.
6. **Revision cycle**: Provider submits → provider revises (up to max_revisions) → client approves.
7. **Timeout escalation**: Provider submits → review_period expires → auto-DISPUTED.
8. **Agent advisory**: Milestone submitted → AGENT-001 scores deliverable → recommendation published → client acts on recommendation.
9. **Reputation gate**: Provider with reputation below min_provider_reputation cannot accept agreement.

---

## 13. Rollout plan

| Phase | Scope | Dependencies |
|-------|-------|-------------|
| **v0 (advisory)** | Agent scores milestone deliverables off-chain; KPI metrics in digest. No on-chain escrow. | M010 (reputation), KOI MCP |
| **v1 (on-chain escrow)** | CosmWasm `service-escrow` contract with milestone payments, bond lock, cancellation. Agent gating on acceptance. | M008 (arbiter), M010, DAO DAO |
| **v2 (full dispute)** | Arbiter DAO dispute resolution integrated. AGENT-003 pricing monitor. M013 fee routing. | M008, M013, M014 (optional) |

---

## Appendix: Source anchors

| Document | Section |
|----------|---------|
| `phase-2/2.1-token-utility-mechanisms.md` | M009 Service Provision Escrow (lines 274–531) |
| `phase-3/3.1-smart-contract-specs.md` | CosmWasm Contract: Service Escrow (lines 710–855) |
| `phase-2/2.3-governance-processes.md` | GOV-002 (Parameter Changes) for governance params |
