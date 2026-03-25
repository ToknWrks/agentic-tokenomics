# Glossary

Comprehensive glossary of terminology used throughout the Regen Agentic Tokenomics & Governance System. Entries are grouped by category and sorted for quick lookup.

## Table of Contents

1. [Mechanism IDs](#mechanism-ids)
2. [Agent IDs](#agent-ids)
3. [Workflow IDs](#workflow-ids)
4. [Governance Process IDs](#governance-process-ids)
5. [Governance Layers](#governance-layers)
6. [Technical Terms](#technical-terms)
7. [Regen-Specific Terms](#regen-specific-terms)
8. [Economic Terms](#economic-terms)
9. [Security Terms](#security-terms)

---

## Mechanism IDs

Mechanisms are protocol-level specifications for token utility, governance, and economic functions. Defined in `phase-2/2.1-token-utility-mechanisms.md` and `phase-2/2.6-economic-reboot-mechanisms.md`.

### Token Utility Mechanisms

| ID | Name | Description |
|----|------|-------------|
| **M001-ENH** | Credit Class Approval Voting Enhancement | Enhances the credit class creator allowlist with tiered approval thresholds, agent pre-screening, and expedited paths for low-risk proposals |
| **M008** | Data Attestation Bonding | Requires REGEN bonds on ecological data attestations; bonds are slashable if attestations are successfully challenged |
| **M009** | Service Provision Escrow | Escrow-based payment system for ecological service contracts with milestone-based release and dispute resolution |
| **M010** | Reputation / Legitimacy Signaling | On-chain reputation scoring for participants based on historical contributions, attestation quality, and governance participation |
| **M011** | Marketplace Curation & Quality Signals | Quality scoring and curation signals for ecological credit marketplace listings, driven by agent analysis and community input |

### Economic Reboot Mechanisms

| ID | Name | Description |
|----|------|-------------|
| **M012** | Fixed Cap Dynamic Supply | Replaces inflationary PoS supply with a hard-capped (~221M REGEN) algorithmically managed supply using mint/burn tied to ecological activity |
| **M013** | Value-Based Fee Routing | Replaces flat gas fees with percentage-based fees routed to protocol revenue, community pool, and validator compensation |
| **M014** | Authority Validator Governance (PoA Transition) | Transitions from capital-weighted PoS to a curated authority validator set (15-21 validators) with equal governance weight |
| **M015** | Contribution-Weighted Rewards | Replaces passive staking rewards with activity-based distribution using composite scores derived from on-chain contributions |

---

## Agent IDs

Autonomous agent personas operating within the ElizaOS runtime. Defined in `phase-2/2.4-agent-orchestration.md`.

| ID | Name | Role | Governance Layers |
|----|------|------|-------------------|
| **AGENT-001** | Registry Reviewer | Pre-screens credit class applications, validates project registrations, reviews credit batch issuances, and reviews service escrow milestones (M009) | Layer 2-3 |
| **AGENT-002** | Governance Analyst | Analyzes governance proposals, predicts voting outcomes, generates post-vote reports, and monitors governance health | Layer 2-3 |
| **AGENT-003** | Market Monitor | Detects price anomalies, monitors liquidity, analyzes retirement patterns, and scores marketplace curation quality (M011) | Layer 1-2 |
| **AGENT-004** | Validator Monitor | Tracks validator performance, analyzes delegation flows, and monitors network decentralization metrics | Layer 1-2 |

---

## Workflow IDs

OODA-loop workflows executed by agents. Defined in `phase-2/2.2-agentic-workflows.md`.

### Registry Reviewer Workflows (AGENT-001)

| ID | Name | Trigger |
|----|------|---------|
| **WF-RR-01** | Credit Class Application Review | `MsgProposeClassCreator` submitted on-chain |
| **WF-RR-02** | Project Registration Validation | `MsgCreateProject` submitted on-chain |
| **WF-RR-03** | Credit Batch Issuance Verification | `MsgCreateBatch` submitted on-chain |
| **WF-RR-04** | Service Escrow Milestone Review | Milestone submission event from M009 escrow contract |

### Governance Analyst Workflows (AGENT-002)

| ID | Name | Trigger |
|----|------|---------|
| **WF-GA-01** | Proposal Analysis & Summarization | New governance proposal submitted |
| **WF-GA-02** | Voting Outcome Prediction & Alerts | Voting period active; periodic polling |
| **WF-GA-03** | Post-Vote Analysis & Reporting | Voting period ends; tally finalized |

### Market Monitor Workflows (AGENT-003)

| ID | Name | Trigger |
|----|------|---------|
| **WF-MM-01** | Price Anomaly Detection | Price deviation exceeds threshold (periodic + event-driven) |
| **WF-MM-02** | Liquidity Monitoring & Reporting | Periodic (hourly) or liquidity change event |
| **WF-MM-03** | Retirement Pattern Analysis | `MsgRetire` event or periodic batch analysis |
| **WF-MM-04** | Curation Quality Monitoring & Scoring | New marketplace listing or periodic quality sweep (M011) |

### Validator Monitor Workflows (AGENT-004)

| ID | Name | Trigger |
|----|------|---------|
| **WF-VM-01** | Validator Performance Tracking | Periodic (per-epoch) or missed-block event |
| **WF-VM-02** | Delegation Flow Analysis | Delegation/undelegation events or periodic (daily) |
| **WF-VM-03** | Network Decentralization Monitoring | Periodic (daily) or validator set change |

---

## Governance Process IDs

Formalized governance processes mapping historical proposal patterns to automated decision frameworks. Defined in `phase-2/2.3-governance-processes.md`.

| ID | Name | Description |
|----|------|-------------|
| **GOV-001** | Credit Class Creator Allowlist | Manages applications for credit class creator permissions via agent pre-screening, community discussion, and on-chain vote |
| **GOV-002** | Currency Allow List Addition | Governs the addition of new fee and payment currencies to the Regen Ledger allow list |
| **GOV-003** | Software Upgrade Proposal | Manages chain software upgrades with compatibility analysis, testnet verification, and coordinated upgrade execution |
| **GOV-004** | Community Pool Spend Proposal | Governs disbursements from the ~3.2M REGEN community pool for grants, development, and ecosystem funding |
| **GOV-005** | Parameter Change Proposal | Manages on-chain parameter modifications (staking, slashing, governance, ecocredit module parameters) |

---

## Governance Layers

The 4-layer governance model defines delegation levels from fully automated to fully human-controlled. Defined in `phase-1/1.4-governance-architecture.md`.

| Layer | Name | Delegation Level | Automation | Examples |
|-------|------|-----------------|------------|----------|
| **Layer 1** | Fully Automated | Full delegation to agents | 100% | Price monitoring, data validation, routine parameter checks |
| **Layer 2** | Agentic + Oversight | Agent-led with human oversight | 85%+ | Credit class screening, routine proposal analysis, marketplace curation |
| **Layer 3** | Human-in-Loop | Shared human-agent decision-making | ~50% | Large community pool spends, contested decisions, significant parameter changes |
| **Layer 4** | Constitutional | No delegation; fully human | 0% | Protocol upgrades, governance model changes, constitutional amendments |

---

## Technical Terms

| Term | Definition |
|------|------------|
| **cadCAD** | Complex Adaptive Dynamics Computer-Aided Design; a Python library for modeling and simulating token economies and mechanism designs |
| **CosmWasm** | WebAssembly smart contract platform for Cosmos SDK chains; used for attestation bonds (M008), escrow contracts (M009), and other programmable mechanisms |
| **ElizaOS** | Open-source AI agent runtime framework used to host and orchestrate the four agent personas (AGENT-001 through AGENT-004) |
| **KOI** | Knowledge Organization Infrastructure; Regen Network's semantic data layer built on Apache Jena for knowledge graph management and verifiable ecological claims |
| **MCP** | Model Context Protocol; the integration layer enabling agents to query knowledge graphs (KOI MCP), on-chain state (Ledger MCP), and build transactions (TX Builder MCP) |
| **OODA** | Observe-Orient-Decide-Act; the decision loop pattern used by all agentic workflows to structure autonomous reasoning and action |
| **PoA** | Proof of Authority; the consensus model that Regen Network transitions to under M014, replacing capital-weighted PoS with a curated authority validator set |
| **PoS** | Proof of Stake; the current Cosmos SDK consensus model where voting power is proportional to staked REGEN |
| **TWAP** | Time-Weighted Average Price; a pricing methodology used in market monitoring (WF-MM-01) to smooth price data and detect anomalies |

---

## Regen-Specific Terms

| Term | Definition |
|------|------------|
| **Attestation** | An on-chain claim linking ecological data (identified by an IRI) to a signer's identity; attestations can be bonded (M008) and challenged |
| **Batch** | A credit batch represents a specific issuance of ecological credits under a project, with a defined vintage period, quantity, and metadata |
| **Credit class** | A category of ecological credit defined by a methodology (e.g., carbon sequestration, biodiversity), administered by a credit class admin |
| **IRI** | Internationalized Resource Identifier; used to reference off-chain data (methodology documents, MRV reports, satellite imagery) anchored on-chain via the `x/data` module |
| **REGEN** | The native staking and governance token of Regen Network; used for transaction fees, governance voting, staking, and mechanism participation |
| **uregen** | The smallest denomination of REGEN; 1 REGEN = 1,000,000 uregen. All on-chain amounts are denominated in uregen |
| **Retirement** | The permanent removal of ecological credits from circulation, representing a claimed environmental benefit; retired credits cannot be transferred or re-sold |
| **Credit class admin** | The entity authorized to manage a credit class, including approving projects, issuing batches, and updating methodology references |
| **Project** | A registered ecological project under a credit class, defined by geographic boundaries, a monitoring plan, and associated credit batches |
| **Regen Ledger** | The application-specific Cosmos SDK blockchain operated by Regen Network; hosts the ecocredit, data, and governance modules |
| **Regen Registry** | The programmatic registry built on Regen Ledger for issuing, transferring, and retiring ecological credits |
| **x/ecocredit** | The Cosmos SDK module on Regen Ledger that manages credit classes, projects, batches, and retirements |
| **x/data** | The Cosmos SDK module on Regen Ledger that anchors and attests to off-chain data using content hashes and IRIs |

---

## Economic Terms

| Term | Definition |
|------|------------|
| **Activity score** | A per-account metric measuring on-chain contributions (governance participation, attestations, ecological data submissions) used by M015 to weight reward distribution |
| **Composite score** | A weighted combination of activity score, stake commitment, and historical contribution quality used for contribution-weighted rewards (M015) and reputation signaling (M010) |
| **Hard cap** | The maximum total supply of REGEN tokens (~221M), established by M012; circulating supply can fluctuate below this cap via mint/burn dynamics but never exceed it |
| **Regrowth rate** | The rate at which new REGEN tokens are minted into circulation under M012; calculated as `r_base * staking_multiplier * ecological_multiplier` applied to the gap between current supply and the hard cap |
| **Stability tier** | A commitment level in M015 where token holders lock REGEN for defined periods in exchange for higher reward multipliers and governance weight; replaces passive staking under PoA |
| **Value-based fee** | A percentage fee on transaction value (not flat gas) introduced by M013; fee revenue is split between protocol burn, community pool, and validator compensation |
| **Carrying capacity** | Ecological metaphor for the hard cap in M012; represents nature's upper limit for resources within an ecosystem, analogous to the maximum token supply |
| **Ecological multiplier** | A factor in the M012 supply algorithm that adjusts minting rate based on real ecological outcomes (e.g., verified carbon reduction), ranging from 0.0 to 1.0+ |
| **Staking multiplier** | A factor in the M012 supply algorithm (pre-PoA) that increases the regrowth rate proportionally to the fraction of supply that is staked, ranging from 1.0 to 2.0 |
| **Stability multiplier** | The post-PoA replacement for staking multiplier in M012; increases regrowth rate based on the fraction of supply committed to stability tiers (M015), ranging from 1.0 to 2.0 |

---

## Security Terms

| Term | Definition |
|------|------------|
| **Invariant** | A property that must always hold true in the system; violations indicate a bug or attack. Example: deposit conservation (`sum(deposits) = sum(refunds) + sum(slashes) + escrow.balance`) |
| **Slashing** | The penalty mechanism that reduces a participant's bonded or deposited REGEN when they violate protocol rules (e.g., failed attestation challenge, validator downtime, rejected proposal) |
| **Bond** | REGEN tokens locked as collateral against a claim or obligation; bonds are slashable (M008 attestation bonds) or refundable (M001-ENH proposal deposits) depending on outcome |
| **Escrow** | A smart contract that holds REGEN tokens in trust until predefined conditions are met; used in M009 for service provision payments with milestone-based release |
| **Arbiter DAO** | A DAO-based dispute resolution body (via DAO DAO on CosmWasm) that adjudicates contested attestation challenges (M008) and escrow disputes (M009) when automated resolution fails |
| **Service bond** | REGEN tokens staked by an agent (e.g., 10,000 REGEN for AGENT-001) as a guarantee of good behavior; slashable if the agent produces provably incorrect recommendations |
| **Human override window** | A time-limited period (e.g., 6 hours) during which human reviewers can override an agent's automated decision before it becomes final |
| **Governance supremacy** | The security principle that human governance votes always override agent recommendations, regardless of agent confidence scores |
| **Deposit conservation** | The invariant ensuring that the sum of all deposits equals the sum of all refunds plus slashes plus current escrow balance; verified at every state transition |
| **Confidence threshold** | The minimum confidence score (typically 0.7) required for an agent to act autonomously; below this threshold, the decision is escalated to a higher governance layer |

---

*This document is part of the Regen Network Agentic Tokenomics framework.*
