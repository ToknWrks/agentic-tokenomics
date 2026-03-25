# Contributing to Regen Agentic Tokenomics

Welcome to the Regen Network Agentic Tokenomics & Governance System. This repository documents and implements a framework for 65-75% automated governance, integrating AI agents with on-chain infrastructure to accelerate ecological regeneration.

## Table of Contents

1. [How to Contribute](#how-to-contribute)
2. [Branch Naming Conventions](#branch-naming-conventions)
3. [Pull Request Requirements](#pull-request-requirements)
4. [Code Style](#code-style)
5. [Mechanism Contribution Workflow](#mechanism-contribution-workflow)
6. [Review Process](#review-process)
7. [Communication Channels](#communication-channels)
8. [Code of Conduct](#code-of-conduct)

---

## How to Contribute

### Fork, Branch, PR Workflow

1. **Fork** the repository to your own GitHub account.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/agentic-tokenomics.git
   cd agentic-tokenomics
   git remote add upstream https://github.com/regen-network/agentic-tokenomics.git
   ```
3. **Create a branch** from `main` using the naming conventions below:
   ```bash
   git checkout -b feat/my-new-mechanism
   ```
4. **Make your changes**, committing in logical, reviewable chunks.
5. **Keep your branch up to date** with upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
6. **Push** your branch and open a Pull Request against `main`:
   ```bash
   git push origin feat/my-new-mechanism
   ```
7. **Engage in review** -- respond to feedback, push updates, and iterate until approval.

### First Contribution Ideas

- Documentation improvements: clarify existing specifications
- Diagram creation: visualize complex workflows (Mermaid preferred)
- Review participation: provide feedback on open PRs
- Issue triage: help organize and label open issues

---

## Branch Naming Conventions

Use the following prefixes for all branches:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New features, mechanisms, or capabilities | `feat/m011-marketplace-curation` |
| `docs/` | Documentation changes only | `docs/glossary-updates` |
| `test/` | Test additions or improvements | `test/m010-integration-vectors` |
| `fix/` | Bug fixes or corrections | `fix/m010-score-rounding` |

Additional conventions:
- Use lowercase with hyphens (kebab-case)
- Include the mechanism ID when applicable (e.g., `feat/m012-dynamic-supply`)
- Keep branch names concise but descriptive

---

## Pull Request Requirements

### PR Description Template

Every PR description must include the **3-bullet format** (see `docs/CONTRIBUTOR_NAV.md`):

```
- Lands in: `<folder(s)>`
- Changes: `<one sentence>`
- Validate: `<one command>` (or "docs-only")
```

### Fork Sync & Measured PR Workflow

Use this when contributing from a fork to keep `main` clean and PRs easy to review.

```
1. Add upstream once:
   git remote add upstream https://github.com/regen-network/agentic-tokenomics.git
2. Sync local main:
   git checkout main
   git fetch upstream origin
   git reset --hard upstream/main
   git push --force-with-lease origin main
3. Create a scoped branch from main:
   git checkout -b codex/<short-topic>
4. Keep PR scope small:
   one concern per PR, minimal file touch, tests included
5. Rebase before opening/updating PR:
   git fetch upstream
   git rebase upstream/main
   git push --force-with-lease origin codex/<short-topic>
```

Recommended PR size: ~100-300 LOC and one clearly stated outcome.

### Style Guide
### Additional Requirements

- **Schema-first for mechanisms**: If your PR introduces or modifies a mechanism, the JSON schemas in `mechanisms/<id>/schemas/` must land first or in the same PR. Do not submit implementation code without corresponding schemas.
- **Reference spec sections**: Link to the relevant Phase 2 specification section (e.g., `phase-2/2.1-token-utility-mechanisms.md#M012`) when implementing mechanism logic.
- **One subtree per PR**: Prefer PRs that touch only one of `mechanisms/<id>/`, `schemas/`, `scripts/`, `docs/`, or `phase-*/`. If a change spans multiple subtrees, split into linked PRs.
- **Passing CI**: Run `npm run verify` locally before pushing. The mechanism index must be up to date (`npm run check:index`).
- **No large binary files**: Use links to external storage or fixtures in `datasets/fixtures/` for sample data.

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) style:

```
<type>(<scope>): <description>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`.

Scopes: mechanism IDs (`m010`, `m012`), agent IDs (`agent-001`), or general areas (`governance`, `schemas`, `scripts`).

---

## Code Style

This project spans multiple language ecosystems. Follow the conventions for each:

### Go (Cosmos SDK / Native Modules)

- Follow the [Cosmos SDK coding guidelines](https://docs.cosmos.network/main/build/building-modules/intro)
- Use `gofmt` and `golangci-lint`
- Proto files follow [Buf style](https://buf.build/docs/best-practices/style-guide)
- Keeper pattern for state management
- Protobuf for message and query definitions
- Module names match mechanism IDs where applicable (e.g., `x/supply` for M012, `x/attestation` for M008)
- Test with `go test ./...`

### Rust (CosmWasm Smart Contracts)

- Follow standard `rustfmt` and `clippy` lints
- Entry points: `instantiate`, `execute`, `query`, `migrate`
- Use `cosmwasm-std` testing utilities for unit tests (target `cosmwasm-std ^2.0` unless a dependency requires otherwise)
- Contract directories live under `contracts/` and are named after their mechanism (e.g., `contracts/service-escrow` for M009)
- Compile with `cargo wasm` or `RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown`

### TypeScript / JavaScript (ElizaOS Plugins, Scripts)

- ES Modules (`import`/`export`), not CommonJS
- Prefer `node:` protocol for built-in modules (e.g., `node:fs`, `node:path`)
- Use the existing `scripts/` conventions (Node.js with `.mjs` extensions)
- ElizaOS plugin structure: follow the `@elizaos/plugin-*` pattern
- Character definitions in YAML format
- No transpilation required for scripts; target Node.js 18+

### Documentation (Markdown)

- Use clear, accessible language
- Include diagrams for complex flows (Mermaid preferred; fall back to ASCII art when Mermaid is impractical)
- Cross-reference related specifications with relative links
- Use ATX-style headers (`#`, `##`, `###`)
- Use YAML code blocks for structured specifications (workflow definitions, governance processes)

---

## Mechanism Contribution Workflow

New mechanisms follow the **m010 pattern** established by `mechanisms/m010-reputation-signal/`. Each mechanism lives in its own directory with the following structure:

```
mechanisms/<mechanism-id>/
  SPEC.md              # Formal protocol specification
  README.md            # Overview, status, quick-start
  schemas/             # JSON schemas for all data types
    <id>_<type>.schema.json
  reference-impl/      # Reference implementation (JS/TS)
    <id>_<function>.js
    test_vectors/      # Deterministic test vectors
  datasets/            # Sample data and fixtures
    fixtures/
    schema.json        # Dataset schema
    README.md
```

### Step-by-Step

1. **Write the SPEC.md first.** Define purpose, participants, token flows, state transitions, security invariants, and automation logic. Follow the format in `phase-2/2.1-token-utility-mechanisms.md`.

2. **Define JSON schemas.** Create schemas for all mechanism data types in `schemas/`. Use JSON Schema (draft 2020-12). Include `$id` fields matching the mechanism namespace and `mechanism_id` in required fields.

3. **Build the reference implementation.** Write a minimal, readable implementation in JavaScript that demonstrates the core algorithm. Include test vectors with known inputs and expected outputs.

4. **Add datasets and fixtures.** Provide realistic sample data in `datasets/fixtures/` that exercises the mechanism's key scenarios (including edge cases and challenge/dispute flows). Include at least one happy-path and one failure-path test vector.

5. **Register the mechanism.** Run `npm run build:index` to update the mechanism index in `README.md`.

6. **Validate everything.** Run `npm run verify` to confirm all required files exist and schemas are well-formed.

### Required Specification Sections

Following the m010 template, every SPEC.md must include:

1. **Header** -- ID, name, status, owner, scope
2. **Problem** -- What decision or process benefits from this mechanism
3. **Target actor and action** -- Who does what; the single action being evaluated
4. **Signal definition** -- Name, unit, directionality, granularity
5. **Evidence inputs** -- Sources, fields, validity rules, anti-spoof assumptions, refresh cadence
6. **Scoring function** -- Mathematical definition with all parameters
7. **State machine** -- States, transitions, guards, actions
8. **Governance parameters** -- Parameter table with initial values, ranges, governance layer
9. **Security invariants** -- Numbered invariants the implementation must preserve
10. **Open questions** -- Unresolved design decisions for WG resolution
11. **Implementation notes** -- Module, storage, events, dependencies

### When Consuming KOI Outputs

If your mechanism consumes data from the `koi-research` repository:
- Link to `koi-research` and the relevant path (extractor, ontology, dataset, or script)
- Record the expected output shape as a JSON schema (preferred) or an example JSON blob in the mechanism README
- Do not copy KOI data into this repo; reference it

---

## Review Process

### Required Approvals

| Change Type | Minimum Approvals | Required Reviewers |
|-------------|-------------------|--------------------|
| Documentation only | 1 | Any maintainer |
| Mechanism spec (SPEC.md) | 2 | Domain expert + maintainer |
| Schema changes | 2 | Schema owner + maintainer |
| Reference implementation | 2 | Implementer + spec author |
| Script / CI changes | 1 | Any maintainer |
| Phase document edits | 2 | Spec author + maintainer |

### Review Checklist

Reviewers should verify:
- [ ] PR follows the 3-bullet description format
- [ ] Changes land in the correct subtree
- [ ] Schemas are valid and include required fields
- [ ] Reference implementations match the SPEC.md algorithm
- [ ] Test vectors produce expected outputs
- [ ] `npm run verify` passes
- [ ] No secrets, credentials, or large binaries included
- [ ] Cross-references to other specs are accurate

### For Agentic Contributors

Agent-authored contributions must be clearly labeled with:

```
[AGENT-XXX] <type>: <description>

Agent: <agent-id>@<version>
Evidence: <koi-rid>
Human-Review-Required: yes|no
Confidence: <0.0-1.0>
```

All agent PRs require `Human-Review-Required: yes` for changes to specification text, governance parameters, or security invariants.

See `phase-2/2.4-agent-orchestration.md` for the full agentic contribution protocol.

---

## Communication Channels

| Channel | Purpose | Link |
|---------|---------|------|
| **Regen Forum** | Governance proposals, mechanism design discussions, WG updates | [forum.regen.network](https://forum.regen.network) |
| **Discord** | Real-time discussion, `#agentic-governance` channel | [Regen Discord](https://discord.gg/regen-network) |
| **GitHub Issues** | Bug reports, feature requests, implementation tracking | [Issues](https://github.com/regen-network/agentic-tokenomics/issues) |
| **GitHub Discussions** | Architecture questions, open-ended design exploration | [Discussions](https://github.com/regen-network/agentic-tokenomics/discussions) |
| **KOI Knowledge Base** | Agent evidence, knowledge graph queries | [regen.gaiaai.xyz](https://regen.gaiaai.xyz) |

### Where to Start a Conversation

- **"I want to propose a new mechanism"** -- Start a forum thread for community discussion, then open a PR with the SPEC.md.
- **"I found a bug"** -- Open a GitHub Issue with reproduction steps and the mechanism ID.
- **"I have a question about a spec"** -- GitHub Discussions or Discord `#agentic-governance`.
- **"I want to contribute code"** -- Check open Issues labeled `good first issue` or `help wanted`.
- **"Agent evidence dispute"** -- Reference the KOI RID in a GitHub Issue.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

**In brief:**
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Prioritize ecological and community outcomes
- Assume good intent; seek clarification before reacting

Report concerns to the maintainers via the channels listed above or by emailing the project leads directly.

---

*This document is part of the Regen Network Agentic Tokenomics framework.*
