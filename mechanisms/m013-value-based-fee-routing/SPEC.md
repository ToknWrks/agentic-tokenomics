# m013 — Value-Based Fee Routing (SPEC)

## 0. Header
- **ID:** m013
- **Name:** Value-Based Fee Routing
- **Status:** draft (v0)
- **Owner:** (unset)
- **Last updated:** 2026-02-18
- **Scope:** Replace flat gas fees with value-proportional fees on ecological credit transactions, routing fee revenue to four purpose-specific pools.

## 1. Problem
A $10 credit and a $10,000 credit pay the same gas fee — this disconnects protocol revenue from the value it facilitates. The current flat gas model produces negligible revenue from high-value credit transactions and fails to fund network operations (validators, community governance, agent infrastructure, supply management) without relying on inflationary token emission.

## 2. Target actor and action
- **Actors:** Fee Payer (user initiating credit transaction), Burn Pool, Validator Fund, Community Pool, Agent Infrastructure Fund.
- **Action being evaluated:** a **credit transaction** (issuance, transfer, retirement, marketplace trade) that generates a value-proportional fee.
- **Event source:** `x/ecocredit` message handlers intercepted by `x/feerouter` module.

## 3. Fee Schedule

| Transaction Type | Message | Current Fee | Proposed Fee | Rationale |
|---|---|---|---|---|
| Credit Issuance | `MsgCreateBatch` | Flat gas (~0.01 REGEN) | 1-3% of credit value | Highest value event; primary revenue source |
| Credit Transfer | `MsgSend` | Flat gas | 0.1% of credit value | Minimal friction for transfers |
| Credit Retirement | `MsgRetire` | Flat gas | 0.5% of credit value | Exit fee; captures value at point of impact |
| Marketplace Trade | `MsgBuySellOrder` | Flat gas | 1% of trade value | Standard marketplace fee |
| Non-credit transactions | (various) | Flat gas | Flat gas (unchanged) | Standard Cosmos SDK transactions unaffected |

Default v0 fee rates (reference implementation):
- `CreditIssuance`: 0.02 (2%)
- `CreditTransfer`: 0.001 (0.1%)
- `CreditRetirement`: 0.005 (0.5%)
- `MarketplaceTrade`: 0.01 (1%)

## 4. Fee Calculation

```
fee_amount = max(transaction_value * fee_rate[tx_type], min_fee)
```

Where:
- `transaction_value` is denominated in uregen (1 REGEN = 1,000,000 uregen).
- `fee_rate[tx_type]` is the rate from the fee schedule (section 3).
- `min_fee` = 1,000,000 uregen (1 REGEN) — prevents zero-fee transactions on low-value credits.

### Value estimation by transaction type

```yaml
fee_calculation:
  # For marketplace trades, value is explicit (sell order price x quantity)
  marketplace_value: sell_order.price * quantity

  # For issuance, value must be estimated
  # Option A: Use most recent marketplace price for credit class
  # Option B: Use governance-set reference price per credit type
  # Option C: Use KOI-sourced external market price
  issuance_value_method: "marketplace_reference"  # OQ-M013-2

  # For transfers, value uses same estimation as issuance
  transfer_value_method: "marketplace_reference"

  # For retirements, value at point of retirement
  retirement_value_method: "marketplace_reference"

  # Minimum fee floor
  min_fee: 1 REGEN  # = 1,000,000 uregen
```

## 5. Fee Distribution

```
For each fee-generating transaction:

  fee_amount = max(transaction_value * fee_rate[transaction_type], min_fee)

  burn_pool       += floor(fee_amount * burn_share)
  community_pool  += floor(fee_amount * community_share)
  agent_infra     += floor(fee_amount * agent_share)
  validator_fund  += fee_amount - burn_pool_share - community_pool_share - agent_infra_share

  where burn_share + validator_share + community_share + agent_share = 1.0

  NOTE: Integer rounding strategy — three pools are computed with floor(),
  and the validator fund receives the remainder. This ensures
  fee_collected = sum(pool_distributions) (Fee Conservation invariant)
  with no dust loss. The validator pool absorbs at most 3 uregen of
  rounding surplus per transaction.
```

### Distribution Parameters

**Model A** (default for v0):

| Pool | Share | Purpose |
|---|---|---|
| Burn Pool | 30% | Supply reduction via M012 |
| Validator Fund | 40% | Fixed compensation for authority validators |
| Community Pool | 25% | Governance-directed spending |
| Agent Infrastructure | 5% | AI agent operational costs |

**Model B** (from Network Coordination Architecture, for WG discussion):

| Pool | Share | Purpose |
|---|---|---|
| Burn Pool | 25-35% | Supply reduction via M012 |
| Validator Fund | 15-25% | Authority validator compensation |
| Community Pool | 50-60% | Contributor distribution via M015 |
| Agent Infrastructure | (included in Community Pool) | Not separated |

> **OQ-M013-1**: Which distribution model should be adopted? Model A provides a dedicated Agent Infrastructure fund; Model B routes a larger share through governance.

> **OQ-M013-5**: Should the Burn Pool exist at all, and if so, at what share? See source material for full pro/con analysis.

## 6. Token Flows

```
+--------------+
| Credit       |   fee = max(value * rate, min_fee)
| Transaction  | -------------------------------------------+
+--------------+                                             |
                                                             v
                                                  +------------------+
                                                  |  Fee Collector   |
                                                  |  Module          |
                                                  +------------------+
                                                          |
                  +---------------+----------------+------+----------+
                  |               |                |                  |
                  v               v                v                  v
          +-----------+   +-----------+   +-----------+   +-----------+
          | Burn Pool |   | Validator |   | Community |   | Agent     |
          | (-> M012  |   | Fund      |   | Pool      |   | Infra    |
          |   burn)   |   | (-> M014  |   | (-> M015  |   | Fund     |
          |           |   |  validators)  |  rewards) |   | (-> ops) |
          +-----------+   +-----------+   +-----------+   +-----------+
```

## 7. Participants

| Role | Description | Token Interaction |
|---|---|---|
| Fee Payer | User initiating credit transaction | Pays % fee in REGEN (or allowed denom) |
| Burn Pool | Protocol supply reduction | Receives `burn_share` of fees -> permanent burn |
| Validator Fund | Authority validator compensation | Receives `validator_share` of fees -> fixed distribution |
| Community Pool | Governance-directed spending | Receives `community_share` of fees -> proposal-based allocation |
| Agent Infra Fund | AI agent operations | Receives `agent_share` of fees -> operational budget |

## 8. State Transitions

```
States: {FLAT_GAS, TRANSITION, VALUE_BASED}

FLAT_GAS -> TRANSITION
  trigger: governance.approve(m013_fee_proposal)
  guard: fee_collector_module deployed, pool addresses configured
  action: enable dual-fee mode (flat gas + value fees)
  note: transition period allows UI/tooling to adapt

TRANSITION -> VALUE_BASED
  trigger: transition_period_expired(90 days) OR governance.accelerate()
  guard: fee_revenue > 0 for 30 consecutive days
  action: disable legacy flat gas for credit transactions, full value-based fees
```

## 9. Security Invariants

1. **Fee Conservation**: `fee_collected = sum(pool_distributions)` — no fee revenue lost or created.
2. **Share Sum Unity**: `burn_share + validator_share + community_share + agent_share = 1.0`
3. **Non-Negative Fees**: All fee rates >= 0; fee amounts >= `min_fee`.
4. **Rate Bound Safety**: Individual fee rates bounded `[0, 0.10]` (max 10%) to prevent governance attack.
5. **Pool Isolation**: Each pool's balance is independent; no pool can draw from another without governance.

## 10. Governance Parameters

The following parameters are governance-controlled:

| Parameter | Default (v0) | Range | Description |
|---|---|---|---|
| `fee_rate.CreditIssuance` | 0.02 | [0, 0.10] | Fee rate for credit issuance |
| `fee_rate.CreditTransfer` | 0.001 | [0, 0.10] | Fee rate for credit transfers |
| `fee_rate.CreditRetirement` | 0.005 | [0, 0.10] | Fee rate for credit retirements |
| `fee_rate.MarketplaceTrade` | 0.01 | [0, 0.10] | Fee rate for marketplace trades |
| `distribution.burn_share` | 0.30 | [0, 1.0] | Share routed to burn pool |
| `distribution.validator_share` | 0.40 | [0, 1.0] | Share routed to validator fund |
| `distribution.community_share` | 0.25 | [0, 1.0] | Share routed to community pool |
| `distribution.agent_share` | 0.05 | [0, 1.0] | Share routed to agent infra fund |
| `min_fee` | 1,000,000 uregen | [0, inf) | Minimum fee floor (1 REGEN) |

Constraint: `burn_share + validator_share + community_share + agent_share = 1.0` (Share Sum Unity).

## 11. Open Questions (for WG Resolution)

> **OQ-M013-2**: How is credit value determined for non-marketplace transactions (issuance, transfer, retirement)? Options: (A) most recent marketplace price for that credit class, (B) governance-set reference price per credit type, (C) external oracle via KOI. This is critical for fee calculation accuracy.

> **OQ-M013-3**: In what denomination should fees be collected and distributed? See source material for full analysis of REGEN-only, native denom, and hybrid approaches, as well as distribution-side considerations.

> **OQ-M013-4**: How should the Agent Infrastructure fund be governed? As a separate module account with its own spending authority, or as a tagged allocation within the Community Pool subject to governance proposals?

## 12. Implementation Notes

- **Module**: New `x/feerouter` module intercepting credit transaction messages.
- **Storage**: `FeeConfig` (rates, shares, min_fee), `PoolBalance` per pool, `FeeRecord` per transaction.
- **Events**: `EventFeeCollected`, `EventFeeDistributed`, `EventRateUpdated`.
- **Integration**: Hooks into `x/ecocredit` message handlers for credit transactions.
- **Migration**: Backward compatible; flat gas remains for non-credit transactions.
- **Dependencies**: M012 (burn pool feeds mint/burn algorithm), M014 (validator fund feeds PoA compensation).

## 13. Acceptance Tests

**Fee calculation:**
1. Credit issuance of 5,000,000,000 uregen at 2% rate produces fee of 100,000,000 uregen.
2. Credit transfer of 100,000,000 uregen at 0.1% rate computes 100,000 uregen; clamped to `min_fee` = 1,000,000 uregen.
3. Credit retirement of 1,000,000,000 uregen at 0.5% rate produces fee of 5,000,000 uregen.
4. Marketplace trade of 2,500,000,000 uregen at 1% rate produces fee of 25,000,000 uregen.
5. Low-value transfer (500,000 uregen) computes 500 uregen; clamped to `min_fee` = 1,000,000 uregen.

**Fee distribution:**
6. A 100,000,000 uregen fee distributes: burn 30,000,000, validator 40,000,000, community 25,000,000, agent 5,000,000.
7. Sum of all pool distributions equals `fee_amount` (fee conservation).
8. Share Sum Unity: shares always sum to 1.0.

**Invariant enforcement:**
9. Fee rate above 0.10 (10%) is rejected by governance parameter validation.
10. Distribution shares that do not sum to 1.0 are rejected.
11. Negative fee rates are rejected.
12. Pool balances are isolated; no cross-pool withdrawals without governance.

**State transitions:**
13. System starts in FLAT_GAS; transition to TRANSITION requires governance approval + module deployment.
14. TRANSITION -> VALUE_BASED requires 30 consecutive days of fee_revenue > 0 and either 90-day expiry or governance acceleration.

---

## Appendix A — Source anchors
- `phase-2/2.6-economic-reboot-mechanisms.md` lines 182-367
  - "PROTOCOL SPECIFICATION: M013" — full specification including fee schedule, distribution models, state transitions, security invariants, and implementation notes.
