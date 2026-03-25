# Agentic Tokenomics & Governance System

## Purpose

Design specifications and implementation plans for Regen Network's 65-75% automated governance system. Integrates AI agents (ElizaOS) with on-chain infrastructure (Cosmos SDK, CosmWasm, KOI) to automate routine governance while maintaining human oversight for critical decisions.

**Repo**: https://github.com/regen-network/agentic-tokenomics
**Access tier**: public
**Status**: Phase 1-2 complete (discovery + specification). Phase 3-5 in active PR pipeline.

## Repository Structure

```
phase-1/          — Discovery & analysis (complete)
phase-2/          — Mechanism design & specification (complete)
phase-3/          — Implementation & testing specs
mechanisms/       — Landed mechanism specs (currently only m010)
docs/             — Architecture, governance, contributor guides
schemas/          — JSON schemas for mechanism validation
scripts/          — Tooling (verify.mjs, build-mechanism-index.mjs)
.local/           — Gitignored local context (see below)
```

## Mechanism Index

### Token Utility Mechanisms (Phase 2)
| ID | Name | Status | Spec Location |
|----|------|--------|--------------|
| M001-ENH | Dual-Track Voting (Credit Class Approval) | Open PR #19 | phase-2/2.1 |
| M008 | Data Attestation Bonding | Open PR #20 | phase-2/2.1 |
| M009 | Service Provision Escrow | Open PR #21 | phase-2/2.1 |
| M010 | Reputation/Legitimacy Signaling | Merged | mechanisms/m010-reputation-signal/ |
| M011 | Marketplace Curation & Quality Signals | Open PR #22 | phase-2/2.1 |

### Economic Reboot Mechanisms (PoA Transition)
| ID | Name | Status | Spec Location | Related Work |
|----|------|--------|--------------|--------------|
| M012 | Fixed Cap Dynamic Supply | Open PR #25 | phase-2/2.6 | poa-migration OQs |
| M013 | Value-Based Fee Routing | Open PR #23 | phase-2/2.6 | **fee-router/** (CosmWasm impl) |
| M014 | Authority Validator Governance | Open PR #24 | phase-2/2.6 | poa-migration bioregional framework |
| M015 | Contribution-Weighted Rewards | Open PR #26 | phase-2/2.6 | poa-migration OQs |

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

## PR Pipeline Overview

**31 open PRs** across several categories:

### Mechanism Specs (CShear, #19-26) — Individual mechanism specifications
### Schema/Tooling (brawlaphant, #28-31) — Schema hardening and verification
### PoA Integration (glandua, #32-35) — Cosmos x/poa, bioregional validators, SDK migration
### M013 Architecture (#36) — CosmWasm contract architecture for fee routing
### Phase 3-5 Specs (brawlaphant, #37-44) — Implementation, deployment, operations specs
### Agent Implementation (#15-18) — Agent scaffolds, PoCs, feasibility reviews

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
