# Agentic Tokenomics & Governance System

## Purpose

Design specifications and implementation plans for Regen Network's 65-75% automated governance system. Integrates AI agents (ElizaOS) with on-chain infrastructure (Cosmos SDK, CosmWasm, KOI) to automate routine governance while maintaining human oversight for critical decisions.

**Repo**: https://github.com/regen-network/agentic-tokenomics
**Access tier**: public
**Status**: All 5 phases specified. 9 mechanism specs landed. 0 open PRs. Agent reference implementations present.

## Repository Structure

```
mechanisms/              — 9 mechanism specs (M001-ENH, M008-M015), each with SPEC/datasets/schemas/reference-impl
phase-1/                 — Discovery & analysis (complete)
phase-2/                 — Mechanism design & specification (complete)
phase-3/                 — Implementation specs, contract architecture, agent runtime, testing
phase-4/                 — Deployment plans, migration runbooks, community onboarding
phase-5/                 — Operations, monitoring, evolution governance
agents/                  — ElizaOS agent scaffold (monorepo with plugins, tests, Docker)
agent-002-governance-analyst/  — Standalone AGENT-002 reference implementation (TypeScript)
docs/                    — Architecture, economics, governance, integration, learning
schemas/                 — Shared JSON schemas
scripts/                 — Verification and index tooling
.local/                  — Gitignored local context (see below)
```

## Mechanism Index

### Token Utility Mechanisms (Phase 2)
| ID | Name | Status | Spec Location |
|----|------|--------|--------------|
| M001-ENH | Dual-Track Voting (Credit Class Approval) | Merged | mechanisms/m001-enh-credit-class-approval/ |
| M008 | Data Attestation Bonding | Merged | mechanisms/m008-attestation-bonding/ |
| M009 | Service Provision Escrow | Merged | mechanisms/m009-service-escrow/ |
| M010 | Reputation/Legitimacy Signaling | Merged | mechanisms/m010-reputation-signal/ |
| M011 | Marketplace Curation & Quality Signals | Merged | mechanisms/m011-marketplace-curation/ |

### Economic Reboot Mechanisms (PoA Transition)
| ID | Name | Status | Spec Location | Related Work |
|----|------|--------|--------------|--------------|
| M012 | Fixed Cap Dynamic Supply | Merged | mechanisms/m012-fixed-cap-dynamic-supply/ | poa-migration OQs |
| M013 | Value-Based Fee Routing | Merged | mechanisms/m013-value-based-fee-routing/ | **fee-router/** (CosmWasm impl) |
| M014 | Authority Validator Governance | Merged | mechanisms/m014-authority-validator-governance/ | poa-migration bioregional framework |
| M015 | Contribution-Weighted Rewards | Merged | mechanisms/m015-contribution-weighted-rewards/ | poa-migration OQs |

## Cross-References (Load on Demand)

These related workspaces contain complementary work. Do NOT auto-import — load when the task requires it.

### PoA Migration (community evidence + open questions)
- **Path**: `~/workspace/regen/workspaces/poa-migration/`
- **Contains**: 14 background docs, 36 open questions (M012-M015), gap analysis, bioregional validator vision
- **Load when**: Working on M012-M015 specs, validator governance, or community alignment
- **Key files**: `open-questions.md`, `gap-analysis-and-process.md`, `tasks.md`

### Fee Router (M013 implementation)
- **Path**: `~/workspace/regen/projects/fee-router/`
- **Contains**: Working CosmWasm contract for M013 value-based fee routing
- **Load when**: Working on M013 spec, fee distribution parameters, or burn mechanics
- **Key files**: `src/contract.rs`, `src/state.rs`, `src/msg.rs`
- **Current split**: 20% burn / 40% validator / 35% community / 5% agent infrastructure

### Protocol Politicians (agent implementation)
- **Path**: `~/workspace/regen/projects/protocol-politicians/`
- **Contains**: ElizaOS governance agent implementation
- **Load when**: Working on agent personas, workflows, or ElizaOS integration

### Regen AI Core (constraints + contexts)
- **Path**: `~/workspace/regen/projects/regen-ai-core/`
- **Contains**: Core team constraints, domain contexts (ecocredit, ledger, KOI, governance)
- **Load when**: Doing any code development or needing domain context

## Local Context (.local/ — gitignored)

### Economic Analysis (.local/economic-analysis/)
Three parallel LLM analyses of Regen's economic state (Feb 2026):
- Claude analysis — highest epistemic rigor, 6-step critical path
- GPT analysis — detailed on-chain parameter documentation
- Gemini analysis — executive-level narrative synthesis

**Sensitivity**: Contains internal strategy details (market cap, funding pipeline). Do NOT commit.

### Workspace Archive (.local/workspace-archive/)
Original tokenomics workspace content (pre-consolidation). Includes early PR drafts that map to the current open PR pipeline.

## PR History

All PRs merged as of 2026-03-25. Key contributions:
- **CShear**: Mechanism specs M001-ENH through M015 (#19-26)
- **brawlaphant**: Schema hardening, Phase 3-5 specs, simulation models, OQ resolution (#28-31, #37-57)
- **glandua**: PoA integration docs, agent implementations, M013 architecture (#15, #17, #32-36)
- **Eco-Wealth**: Agent PoC exploration (#18, closed)

## Governance Layers

| Layer | Automation | Decision Type | Agent Role |
|-------|-----------|---------------|------------|
| L1 | 100% | Price monitoring, data validation | Fully autonomous |
| L2 | 85%+ | Credit class screening, routine proposals | Agentic + human oversight |
| L3 | 50% | Large grants, contested decisions | Human-in-loop, agent assists |
| L4 | 0% | Protocol upgrades, governance changes | No agent involvement |

## Agent Personas

| ID | Name | Domain | Key Workflows |
|----|------|--------|---------------|
| AGENT-001 | Registry Reviewer | Credit classes, methodology | WF-RR-01 to WF-RR-03 |
| AGENT-002 | Governance Analyst | Proposals, voting patterns | WF-GA-01 to WF-GA-03 |
| AGENT-003 | Market Monitor | Price, liquidity | WF-MM-01 to WF-MM-03 |
| AGENT-004 | Validator Monitor | Network health | WF-VM-01 to WF-VM-03 |

## Tech Stack

- **Agent Runtime**: ElizaOS
- **Knowledge Graph**: Apache Jena + KOI Framework
- **Blockchain**: Regen Ledger (Cosmos SDK v0.53.4, CometBFT v0.38.19)
- **Smart Contracts**: CosmWasm + DAO DAO
- **Database**: PostgreSQL (pgvector)
- **Cache/Queue**: Redis Streams
- **Embeddings**: BGE (1024-dim)

## Working Conventions

- Mechanism specs follow the format in `mechanisms/m010-reputation-signal/SPEC.md`
- Schema changes require `node scripts/verify.mjs` to pass
- README mechanism index is autogenerated: `node scripts/build-mechanism-index.mjs`
- PR reviews should check cross-references against the mechanism index
- Access tiers use words (public, commons, partner, core, personal) — never numbers
- Work stages use numbers from the heptad/phase framework — never conflate with access tiers
