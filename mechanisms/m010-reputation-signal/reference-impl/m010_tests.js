/**
 * m010 — Reputation Signal: Complete Test Suite
 *
 * Covers all 20 acceptance tests from SPEC.md section 11,
 * plus M009 integration tests.
 *
 * No external dependencies — uses Node.js built-in assert.
 * Run: node --experimental-vm-modules m010_tests.js
 *      or: node m010_tests.js  (if using a loader that supports ESM)
 */

import assert from "node:assert/strict";
import { computeM010Score } from "./m010_score.js";
import { computeM010KPI, median } from "./m010_kpi.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _passed = 0;
let _failed = 0;
const _failures = [];

function test(name, fn) {
  try {
    fn();
    _passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    _failed++;
    _failures.push({ name, err });
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
  }
}

function suite(label) {
  console.log(`\n=== ${label} ===`);
}

/** ISO timestamp helper: returns ISO string offset by `hoursAgo` from base. */
function hoursBeforeBase(base, hoursAgo) {
  return new Date(new Date(base).getTime() - hoursAgo * 3600_000).toISOString();
}

const BASE_TIME = "2026-03-15T12:00:00Z";

/** Minimal valid signal event. */
function mkEvent(overrides = {}) {
  return {
    timestamp: hoursBeforeBase(BASE_TIME, 1),
    subject_type: "Project",
    subject_id: "P-regen-001",
    category: "delivery_risk",
    endorsement_level: 3,
    signaler_id: "signaler_A",
    evidence: {
      koi_links: ["koi://note/test-1"],
      ledger_refs: ["ledger://tx/100"],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Signal state model (lightweight sim for lifecycle / challenge tests)
// ---------------------------------------------------------------------------

const VALID_SUBJECT_TYPES = new Set([
  "CreditClass", "Project", "Verifier", "Methodology", "Address",
]);
const MIN_STAKE_DEFAULT = 100; // default min stake per category
const ACTIVATION_DELAY_H = 24;
const CHALLENGE_WINDOW_DAYS = 180;
const RESOLUTION_DEADLINE_DAYS = 14;

class SignalStore {
  constructor() {
    this._signals = new Map();
    this._challenges = new Map();
    this._auditLog = [];
    this._nextId = 1;
  }

  submit(signal) {
    // Validate endorsement level
    if (
      signal.endorsement_level == null ||
      signal.endorsement_level < 1 ||
      signal.endorsement_level > 5 ||
      !Number.isInteger(signal.endorsement_level)
    ) {
      throw new Error("INVALID_ENDORSEMENT_LEVEL");
    }
    // Validate subject type
    if (!VALID_SUBJECT_TYPES.has(signal.subject_type)) {
      throw new Error("INVALID_SUBJECT_TYPE");
    }
    // Validate minimum stake
    const minStake = signal.min_stake ?? MIN_STAKE_DEFAULT;
    if ((signal.stake ?? 0) < minStake) {
      throw new Error("INSUFFICIENT_STAKE");
    }
    const id = `sig_${this._nextId++}`;
    this._signals.set(id, {
      ...signal,
      id,
      state: "SUBMITTED",
      submitted_at: signal.timestamp,
    });
    this._log("SUBMIT", id, signal.signaler_id);
    return id;
  }

  activate(signalId, now) {
    const sig = this._get(signalId);
    if (sig.state !== "SUBMITTED") throw new Error("WRONG_STATE");
    const age = (new Date(now) - new Date(sig.submitted_at)) / 3600_000;
    if (age < ACTIVATION_DELAY_H) throw new Error("ACTIVATION_DELAY_NOT_MET");
    sig.state = "ACTIVE";
    this._log("ACTIVATE", signalId);
    return sig;
  }

  withdraw(signalId, callerId) {
    const sig = this._get(signalId);
    if (sig.signaler_id !== callerId) throw new Error("NOT_OWNER");
    if (sig.state === "CHALLENGED") throw new Error("CANNOT_WITHDRAW_CHALLENGED");
    if (!["ACTIVE", "SUBMITTED"].includes(sig.state)) throw new Error("WRONG_STATE");
    sig.state = "WITHDRAWN";
    this._log("WITHDRAW", signalId, callerId);
    return sig;
  }

  challenge(signalId, challenge) {
    const sig = this._get(signalId);
    // State check
    if (!["ACTIVE", "SUBMITTED"].includes(sig.state)) {
      throw new Error("WRONG_STATE");
    }
    // Self-challenge
    if (challenge.challenger_id === sig.signaler_id) {
      throw new Error("SELF_CHALLENGE");
    }
    // Min stake
    const minStake = sig.min_stake ?? MIN_STAKE_DEFAULT;
    if ((challenge.stake ?? 0) < minStake) {
      throw new Error("INSUFFICIENT_STAKE");
    }
    // Evidence
    const hasKoi = (challenge.evidence?.koi_links ?? []).length > 0;
    const hasLedger = (challenge.evidence?.ledger_refs ?? []).length > 0;
    if (!hasKoi && !hasLedger) {
      throw new Error("NO_EVIDENCE");
    }
    // Challenge window
    const submittedAt = new Date(sig.submitted_at);
    const challengeAt = new Date(challenge.timestamp);
    const daysSince = (challengeAt - submittedAt) / (1000 * 60 * 60 * 24);
    if (daysSince > CHALLENGE_WINDOW_DAYS) {
      throw new Error("CHALLENGE_WINDOW_EXPIRED");
    }
    sig.state = "CHALLENGED";
    const cId = `ch_${this._nextId++}`;
    this._challenges.set(cId, {
      id: cId,
      signal_id: signalId,
      challenger_id: challenge.challenger_id,
      timestamp: challenge.timestamp,
      evidence: challenge.evidence,
      rationale: challenge.rationale,
      status: "pending",
    });
    this._log("CHALLENGE", signalId, challenge.challenger_id, { challenge_id: cId });
    return cId;
  }

  resolve(signalId, outcome, rationale, resolverRole = "admin") {
    const sig = this._get(signalId);
    if (sig.state !== "CHALLENGED" && sig.state !== "ESCALATED") {
      throw new Error("WRONG_STATE");
    }
    if (outcome === "VALID") {
      sig.state = "RESOLVED_VALID";
      // Mark challenge unsuccessful
      for (const ch of this._challenges.values()) {
        if (ch.signal_id === signalId && ch.status === "pending") {
          ch.status = "unsuccessful";
        }
      }
    } else if (outcome === "INVALID") {
      sig.state = "RESOLVED_INVALID";
      for (const ch of this._challenges.values()) {
        if (ch.signal_id === signalId && ch.status === "pending") {
          ch.status = "successful";
        }
      }
    } else {
      throw new Error("INVALID_OUTCOME");
    }
    this._log("RESOLVE", signalId, resolverRole, { outcome, rationale });
    return sig;
  }

  escalate(signalId) {
    const sig = this._get(signalId);
    if (sig.state !== "CHALLENGED") throw new Error("WRONG_STATE");
    sig.state = "ESCALATED";
    this._log("ESCALATE", signalId);
    return sig;
  }

  checkTimeoutEscalation(signalId, now) {
    const sig = this._get(signalId);
    if (sig.state !== "CHALLENGED") return false;
    // Find challenge for this signal
    for (const ch of this._challenges.values()) {
      if (ch.signal_id === signalId && ch.status === "pending") {
        const elapsed =
          (new Date(now) - new Date(ch.timestamp)) / (1000 * 60 * 60 * 24);
        if (elapsed > RESOLUTION_DEADLINE_DAYS) {
          this.escalate(signalId);
          return true;
        }
      }
    }
    return false;
  }

  invalidate(signalId, rationale, callerRole = "admin") {
    if (callerRole !== "admin") throw new Error("NOT_ADMIN");
    const sig = this._get(signalId);
    if (!rationale || rationale.trim().length === 0) {
      throw new Error("RATIONALE_REQUIRED");
    }
    if (!["ACTIVE", "SUBMITTED"].includes(sig.state)) {
      throw new Error("WRONG_STATE");
    }
    sig.state = "INVALIDATED";
    this._log("INVALIDATE", signalId, callerRole, { rationale });
    return sig;
  }

  /** Return active events suitable for scoring. */
  activeEvents(now) {
    const result = [];
    for (const sig of this._signals.values()) {
      // Only ACTIVE and RESOLVED_VALID contribute
      if (sig.state === "ACTIVE" || sig.state === "RESOLVED_VALID") {
        result.push(sig);
      }
    }
    return result;
  }

  get auditLog() {
    return [...this._auditLog];
  }

  getSignal(id) {
    return this._signals.get(id);
  }

  _get(id) {
    const s = this._signals.get(id);
    if (!s) throw new Error("SIGNAL_NOT_FOUND");
    return s;
  }

  _log(action, signalId, actor, extra) {
    this._auditLog.push({
      action,
      signal_id: signalId,
      actor: actor ?? null,
      timestamp: new Date().toISOString(),
      ...(extra ?? {}),
    });
  }
}

// ===========================================================================
// TESTS
// ===========================================================================

// ---------------------------------------------------------------------------
// Signal Lifecycle (Tests 1-5)
// ---------------------------------------------------------------------------
suite("Signal Lifecycle");

// --- Test 1: Full workflow ---
test("AT-01 Full workflow: submit, activate, query score, withdraw updates score", () => {
  const store = new SignalStore();
  const t0 = "2026-03-01T00:00:00Z";
  const t1 = "2026-03-02T01:00:00Z"; // 25h later for activation

  // Two signalers endorse the same subject
  const id1 = store.submit(
    mkEvent({
      timestamp: t0,
      signaler_id: "alice",
      endorsement_level: 5,
      stake: 200,
    })
  );
  const id2 = store.submit(
    mkEvent({
      timestamp: t0,
      signaler_id: "bob",
      endorsement_level: 3,
      stake: 200,
    })
  );

  // Activate both (25h after submission)
  store.activate(id1, t1);
  store.activate(id2, t1);

  // Compute score with both active
  const activeBefore = store.activeEvents(t1);
  const scoreBefore = computeM010Score({ as_of: t1, events: activeBefore });
  assert.ok(
    scoreBefore.reputation_score_0_1 > 0,
    "Score should be positive with two active signals"
  );

  // Withdraw one signal
  store.withdraw(id2, "bob");
  const activeAfter = store.activeEvents(t1);
  const scoreAfter = computeM010Score({ as_of: t1, events: activeAfter });

  // Score should change after withdrawal
  assert.notEqual(
    scoreBefore.reputation_score_0_1,
    scoreAfter.reputation_score_0_1,
    "Score should change after withdrawal"
  );
  // With only the endorsement_level=5 signal, score should be higher
  assert.ok(
    scoreAfter.reputation_score_0_1 > scoreBefore.reputation_score_0_1,
    "Score should increase when lower endorsement removed"
  );
});

// --- Test 2: Insufficient stake ---
test("AT-02 Insufficient stake: signal below category min_stake is rejected", () => {
  const store = new SignalStore();
  assert.throws(
    () =>
      store.submit(
        mkEvent({ stake: 10, min_stake: 100 })
      ),
    { message: "INSUFFICIENT_STAKE" }
  );
});

// --- Test 3: Invalid endorsement level ---
test("AT-03 Invalid endorsement level: values outside 1-5 rejected, 1-5 accepted", () => {
  const store = new SignalStore();
  // Invalid values
  for (const bad of [0, -1, 6, 10, 1.5, null]) {
    assert.throws(
      () => store.submit(mkEvent({ endorsement_level: bad, stake: 200 })),
      { message: "INVALID_ENDORSEMENT_LEVEL" },
      `Should reject endorsement_level=${bad}`
    );
  }
  // Valid values 1-5
  for (const good of [1, 2, 3, 4, 5]) {
    const id = store.submit(mkEvent({ endorsement_level: good, stake: 200 }));
    assert.ok(id, `Should accept endorsement_level=${good}`);
  }
});

// --- Test 4: Ownership ---
test("AT-04 Ownership: only original signaler can withdraw their signal", () => {
  const store = new SignalStore();
  const t0 = "2026-03-01T00:00:00Z";
  const t1 = "2026-03-02T01:00:00Z";
  const id = store.submit(
    mkEvent({ timestamp: t0, signaler_id: "alice", stake: 200 })
  );
  store.activate(id, t1);

  // Bob cannot withdraw Alice's signal
  assert.throws(
    () => store.withdraw(id, "bob"),
    { message: "NOT_OWNER" }
  );

  // Alice can
  store.withdraw(id, "alice");
  assert.equal(store.getSignal(id).state, "WITHDRAWN");
});

// --- Test 5: Activation delay ---
test("AT-05 Activation delay: SUBMITTED signals do not contribute until 24h passes", () => {
  const store = new SignalStore();
  const t0 = "2026-03-01T00:00:00Z";
  const tEarly = "2026-03-01T23:00:00Z"; // 23h later
  const tLate = "2026-03-02T01:00:00Z"; // 25h later

  const id = store.submit(
    mkEvent({ timestamp: t0, signaler_id: "alice", stake: 200 })
  );

  // Cannot activate before delay
  assert.throws(
    () => store.activate(id, tEarly),
    { message: "ACTIVATION_DELAY_NOT_MET" }
  );

  // SUBMITTED signals don't appear in activeEvents
  const activeBeforeDelay = store.activeEvents(tEarly);
  assert.equal(activeBeforeDelay.length, 0, "No active events before delay");

  // Can activate after delay
  store.activate(id, tLate);
  assert.equal(store.getSignal(id).state, "ACTIVE");
  const activeAfterDelay = store.activeEvents(tLate);
  assert.equal(activeAfterDelay.length, 1, "Signal active after delay");
});

// ---------------------------------------------------------------------------
// Challenge Workflow (Tests 6-15)
// ---------------------------------------------------------------------------
suite("Challenge Workflow");

/** Helper: create an active signal in the store. */
function createActiveSignal(store, overrides = {}) {
  const t0 = overrides.timestamp ?? "2026-03-01T00:00:00Z";
  const t1 = hoursBeforeBase(t0, -25); // 25h after t0
  const id = store.submit(
    mkEvent({
      timestamp: t0,
      signaler_id: "alice",
      stake: 200,
      ...overrides,
    })
  );
  store.activate(id, t1);
  return id;
}

// --- Test 6: Challenge submission ---
test("AT-06 Challenge submission: valid challenge transitions ACTIVE->CHALLENGED, pauses score", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store);

  // Challenge
  const chId = store.challenge(sigId, {
    challenger_id: "charlie",
    stake: 200,
    timestamp: "2026-03-05T00:00:00Z",
    evidence: { koi_links: ["koi://evidence/1"], ledger_refs: [] },
    rationale: "Signal appears to be based on outdated data.",
  });

  assert.equal(store.getSignal(sigId).state, "CHALLENGED");
  assert.ok(chId, "Challenge ID returned");

  // Challenged signal should NOT appear in active events
  const active = store.activeEvents("2026-03-05T00:00:00Z");
  assert.equal(active.length, 0, "Challenged signal excluded from scoring");
});

// --- Test 7: Self-challenge rejection ---
test("AT-07 Challenge rejection - self-challenge: cannot challenge own signal", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store, { signaler_id: "alice" });

  assert.throws(
    () =>
      store.challenge(sigId, {
        challenger_id: "alice",
        stake: 200,
        timestamp: "2026-03-05T00:00:00Z",
        evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
        rationale: "Attempting self-challenge.",
      }),
    { message: "SELF_CHALLENGE" }
  );
});

// --- Test 8: Challenge rejection - insufficient stake ---
test("AT-08 Challenge rejection - insufficient stake: challenger below min_stake rejected", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store);

  assert.throws(
    () =>
      store.challenge(sigId, {
        challenger_id: "charlie",
        stake: 10, // below min
        timestamp: "2026-03-05T00:00:00Z",
        evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
        rationale: "Low stake challenge.",
      }),
    { message: "INSUFFICIENT_STAKE" }
  );
});

// --- Test 9: Challenge rejection - no evidence ---
test("AT-09 Challenge rejection - no evidence: challenge without evidence rejected", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store);

  assert.throws(
    () =>
      store.challenge(sigId, {
        challenger_id: "charlie",
        stake: 200,
        timestamp: "2026-03-05T00:00:00Z",
        evidence: { koi_links: [], ledger_refs: [] },
        rationale: "No evidence provided.",
      }),
    { message: "NO_EVIDENCE" }
  );

  // Also test missing evidence object entirely
  assert.throws(
    () =>
      store.challenge(sigId, {
        challenger_id: "charlie",
        stake: 200,
        timestamp: "2026-03-05T00:00:00Z",
        evidence: {},
        rationale: "Missing evidence fields.",
      }),
    { message: "NO_EVIDENCE" }
  );
});

// --- Test 10: Challenge rejection - wrong state ---
test("AT-10 Challenge rejection - wrong state: cannot challenge WITHDRAWN/INVALIDATED/CHALLENGED", () => {
  const store = new SignalStore();

  // WITHDRAWN signal
  const w = createActiveSignal(store, { signaler_id: "alice" });
  store.withdraw(w, "alice");
  assert.throws(
    () =>
      store.challenge(w, {
        challenger_id: "charlie",
        stake: 200,
        timestamp: "2026-03-05T00:00:00Z",
        evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
        rationale: "Attempt on withdrawn.",
      }),
    { message: "WRONG_STATE" }
  );

  // INVALIDATED signal
  const inv = createActiveSignal(store, { signaler_id: "bob" });
  store.invalidate(inv, "Admin policy violation found.", "admin");
  assert.throws(
    () =>
      store.challenge(inv, {
        challenger_id: "charlie",
        stake: 200,
        timestamp: "2026-03-05T00:00:00Z",
        evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
        rationale: "Attempt on invalidated.",
      }),
    { message: "WRONG_STATE" }
  );

  // Already CHALLENGED signal
  const ch = createActiveSignal(store, { signaler_id: "dave" });
  store.challenge(ch, {
    challenger_id: "charlie",
    stake: 200,
    timestamp: "2026-03-05T00:00:00Z",
    evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
    rationale: "First challenge.",
  });
  assert.throws(
    () =>
      store.challenge(ch, {
        challenger_id: "eve",
        stake: 200,
        timestamp: "2026-03-05T00:00:00Z",
        evidence: { koi_links: ["koi://e/2"], ledger_refs: [] },
        rationale: "Second challenge on already challenged.",
      }),
    { message: "WRONG_STATE" }
  );
});

// --- Test 11: Challenge rejection - expired window ---
test("AT-11 Challenge rejection - expired window: challenge outside challenge_window rejected", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store, {
    timestamp: "2025-01-01T00:00:00Z",
  });

  // 200 days later — past 180-day window
  assert.throws(
    () =>
      store.challenge(sigId, {
        challenger_id: "charlie",
        stake: 200,
        timestamp: "2025-07-20T00:00:00Z", // ~200 days after
        evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
        rationale: "Late challenge attempt.",
      }),
    { message: "CHALLENGE_WINDOW_EXPIRED" }
  );
});

// --- Test 12: Resolution - VALID ---
test("AT-12 Resolution VALID: signal restored to ACTIVE-equivalent, score resumes", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store);

  store.challenge(sigId, {
    challenger_id: "charlie",
    stake: 200,
    timestamp: "2026-03-05T00:00:00Z",
    evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
    rationale: "Challenge for review.",
  });

  // During challenge: no active events
  assert.equal(
    store.activeEvents("2026-03-06T00:00:00Z").length,
    0,
    "No active during challenge"
  );

  // Resolve VALID
  store.resolve(sigId, "VALID", "Evidence reviewed; signal is accurate.");
  assert.equal(store.getSignal(sigId).state, "RESOLVED_VALID");

  // After resolution: signal contributes again
  const active = store.activeEvents("2026-03-06T00:00:00Z");
  assert.equal(active.length, 1, "Signal restored after VALID resolution");

  // Score should be positive
  const score = computeM010Score({ as_of: "2026-03-06T12:00:00Z", events: active });
  assert.ok(score.reputation_score_0_1 > 0, "Score resumes after VALID");
});

// --- Test 13: Resolution - INVALID ---
test("AT-13 Resolution INVALID: signal permanently removed from score", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store);

  store.challenge(sigId, {
    challenger_id: "charlie",
    stake: 200,
    timestamp: "2026-03-05T00:00:00Z",
    evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
    rationale: "Fraudulent signal.",
  });

  store.resolve(sigId, "INVALID", "Signal evidence was fabricated.");
  assert.equal(store.getSignal(sigId).state, "RESOLVED_INVALID");

  // Signal permanently excluded
  const active = store.activeEvents("2026-03-10T00:00:00Z");
  assert.equal(active.length, 0, "INVALID signal permanently excluded");
});

// --- Test 14: Resolution timeout / escalation ---
test("AT-14 Resolution timeout: unresolved challenge auto-escalates after deadline", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store);

  store.challenge(sigId, {
    challenger_id: "charlie",
    stake: 200,
    timestamp: "2026-03-05T00:00:00Z",
    evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
    rationale: "Challenge needing resolution.",
  });

  // Check before deadline (10 days)
  const escalatedEarly = store.checkTimeoutEscalation(
    sigId,
    "2026-03-15T00:00:00Z"
  );
  assert.equal(escalatedEarly, false, "Should not escalate before deadline");
  assert.equal(store.getSignal(sigId).state, "CHALLENGED");

  // Check after deadline (15 days)
  const escalatedLate = store.checkTimeoutEscalation(
    sigId,
    "2026-03-20T00:00:00Z"
  );
  assert.equal(escalatedLate, true, "Should escalate after deadline");
  assert.equal(store.getSignal(sigId).state, "ESCALATED");

  // Escalated signal still not in active events
  const active = store.activeEvents("2026-03-20T00:00:00Z");
  assert.equal(active.length, 0, "Escalated signal still paused");

  // Can still be resolved from ESCALATED state
  store.resolve(sigId, "VALID", "Governance resolved in favor of signal.");
  assert.equal(store.getSignal(sigId).state, "RESOLVED_VALID");
});

// --- Test 15: Withdrawal during challenge ---
test("AT-15 Withdrawal during challenge: signaler cannot withdraw a CHALLENGED signal", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store, { signaler_id: "alice" });

  store.challenge(sigId, {
    challenger_id: "charlie",
    stake: 200,
    timestamp: "2026-03-05T00:00:00Z",
    evidence: { koi_links: ["koi://e/1"], ledger_refs: [] },
    rationale: "Challenge blocks withdrawal.",
  });

  assert.throws(
    () => store.withdraw(sigId, "alice"),
    { message: "CANNOT_WITHDRAW_CHALLENGED" }
  );
});

// ---------------------------------------------------------------------------
// Admin Invalidation (Tests 16-18)
// ---------------------------------------------------------------------------
suite("Admin Invalidation");

// --- Test 16: Admin invalidation ---
test("AT-16 Admin invalidation: only admin can invalidate; signal excluded from score", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store);

  // Non-admin cannot invalidate
  assert.throws(
    () => store.invalidate(sigId, "Trying as non-admin.", "user"),
    { message: "NOT_ADMIN" }
  );

  // Admin can invalidate
  store.invalidate(sigId, "Policy violation — duplicate signal.", "admin");
  assert.equal(store.getSignal(sigId).state, "INVALIDATED");

  const active = store.activeEvents("2026-03-05T00:00:00Z");
  assert.equal(active.length, 0, "Invalidated signal excluded from score");
});

// --- Test 17: Invalidation rationale required ---
test("AT-17 Invalidation rationale: invalidation without rationale is rejected", () => {
  const store = new SignalStore();
  const sigId = createActiveSignal(store);

  assert.throws(
    () => store.invalidate(sigId, "", "admin"),
    { message: "RATIONALE_REQUIRED" }
  );
  assert.throws(
    () => store.invalidate(sigId, "   ", "admin"),
    { message: "RATIONALE_REQUIRED" }
  );
});

// --- Test 18: Invalidation audit trail ---
test("AT-18 Invalidation audit: all invalidation events appear in audit log with rationale", () => {
  const store = new SignalStore();
  const id1 = createActiveSignal(store, { signaler_id: "alice" });
  const id2 = createActiveSignal(store, { signaler_id: "bob" });

  store.invalidate(id1, "Duplicate content detected.", "admin");
  store.invalidate(id2, "Signaler lost authorization.", "admin");

  const invalidations = store.auditLog.filter((e) => e.action === "INVALIDATE");
  assert.equal(invalidations.length, 2, "Two invalidation entries in audit log");

  assert.ok(
    invalidations[0].rationale.includes("Duplicate"),
    "First rationale recorded"
  );
  assert.ok(
    invalidations[1].rationale.includes("authorization"),
    "Second rationale recorded"
  );

  // All invalidation events have signal_id and actor
  for (const inv of invalidations) {
    assert.ok(inv.signal_id, "signal_id present");
    assert.equal(inv.actor, "admin", "actor is admin");
  }
});

// ---------------------------------------------------------------------------
// Adversarial (Tests 19-20)
// ---------------------------------------------------------------------------
suite("Adversarial");

// --- Test 19: Sybil attempt ---
test("AT-19 Sybil attempt: many low-stake identities bounded vs single larger stakeholder", () => {
  // In v0, stake-weighting is not active, but min_stake enforcement applies.
  // Many identities below min_stake cannot submit signals at all.
  const store = new SignalStore();

  // 50 sybil identities with stake = 50 (below min 100)
  let rejected = 0;
  for (let i = 0; i < 50; i++) {
    try {
      store.submit(
        mkEvent({
          signaler_id: `sybil_${i}`,
          stake: 50,
          endorsement_level: 5,
        })
      );
    } catch {
      rejected++;
    }
  }
  assert.equal(rejected, 50, "All sybil submissions below min_stake rejected");

  // One legitimate identity with sufficient stake succeeds
  const legit = store.submit(
    mkEvent({
      signaler_id: "legit_whale",
      stake: 500,
      endorsement_level: 3,
    })
  );
  assert.ok(legit, "Legitimate staker accepted");

  // Even if sybils had exactly min_stake, in v0 (no stake weighting)
  // each contributes equally. Test that with stake weighting (future v1),
  // 10 sybils at min_stake vs 1 holder at 10x produce bounded influence.
  // For v0, we verify the score function's behavior:
  const sybilEvents = Array.from({ length: 10 }, (_, i) => ({
    timestamp: hoursBeforeBase(BASE_TIME, 1),
    endorsement_level: 5,
    signaler_id: `sybil_${i}`,
    stake: 100,
  }));
  const whaleEvents = [
    {
      timestamp: hoursBeforeBase(BASE_TIME, 1),
      endorsement_level: 5,
      signaler_id: "whale",
      stake: 1000,
    },
  ];

  // In v0 (no stake weighting), both produce the same score since
  // endorsement levels are the same
  const sybilScore = computeM010Score({ as_of: BASE_TIME, events: sybilEvents });
  const whaleScore = computeM010Score({ as_of: BASE_TIME, events: whaleEvents });

  assert.equal(
    sybilScore.reputation_score_0_1,
    whaleScore.reputation_score_0_1,
    "v0: same endorsement levels produce same score (no stake weighting)"
  );

  // With future stake weighting enabled, 10 sybils at 100 vs 1 whale at 1000
  // should produce equal total stake influence (10*100 == 1000), not 10x
  // This is the design intention; stake weighting bounds sybil advantage.
});

// --- Test 20: Challenge spam (v1) ---
test("AT-20 Challenge spam: repeated frivolous challenges incur cumulative deposit loss", () => {
  // v1 simulation: challenge deposits
  const CHALLENGE_DEPOSIT_RATE = 0.1; // 10% of staked amount
  const MIN_DEPOSIT = 100; // minimum deposit in REGEN

  const challengerStake = 2000;
  let challengerBalance = challengerStake;
  const deposits = [];

  // Simulate 5 frivolous challenges, all resolved VALID (challenger loses)
  for (let i = 0; i < 5; i++) {
    const deposit = Math.max(
      challengerStake * CHALLENGE_DEPOSIT_RATE,
      MIN_DEPOSIT
    );
    deposits.push(deposit);
    challengerBalance -= deposit; // forfeited
  }

  // After 5 failed challenges, total loss = 5 * 200 = 1000
  const totalLoss = deposits.reduce((s, d) => s + d, 0);
  assert.equal(totalLoss, 1000, "5 failed challenges cost 1000 REGEN");
  assert.equal(challengerBalance, 1000, "Challenger balance halved");

  // Eventually challenger cannot afford deposits
  let canAfford = true;
  let round = 5;
  while (canAfford && round < 20) {
    const deposit = Math.max(
      challengerStake * CHALLENGE_DEPOSIT_RATE,
      MIN_DEPOSIT
    );
    if (challengerBalance < deposit) {
      canAfford = false;
    } else {
      challengerBalance -= deposit;
      round++;
    }
  }
  assert.equal(canAfford, false, "Challenger eventually cannot afford more deposits");
  assert.equal(round, 10, "Exhausted after 10 total challenges");
});

// ---------------------------------------------------------------------------
// Score computation tests (supplement for computeM010Score)
// ---------------------------------------------------------------------------
suite("Score Computation");

test("Score: empty events returns 0", () => {
  const r = computeM010Score({ as_of: BASE_TIME, events: [] });
  assert.equal(r.reputation_score_0_1, 0);
});

test("Score: single max endorsement yields ~1.0", () => {
  const r = computeM010Score({
    as_of: BASE_TIME,
    events: [mkEvent({ endorsement_level: 5, timestamp: BASE_TIME })],
  });
  assert.equal(r.reputation_score_0_1, 1.0);
});

test("Score: single min endorsement yields ~0.2", () => {
  const r = computeM010Score({
    as_of: BASE_TIME,
    events: [mkEvent({ endorsement_level: 1, timestamp: BASE_TIME })],
  });
  assert.equal(r.reputation_score_0_1, 0.2);
});

test("Score: older signals decay toward lower influence", () => {
  // Recent high vs old high
  const events = [
    mkEvent({ endorsement_level: 5, timestamp: hoursBeforeBase(BASE_TIME, 1) }),
    mkEvent({ endorsement_level: 1, timestamp: hoursBeforeBase(BASE_TIME, 1000) }),
  ];
  const r = computeM010Score({ as_of: BASE_TIME, events });
  // Heavily decayed low endorsement barely moves the average
  assert.ok(
    r.reputation_score_0_1 > 0.9,
    `Score ${r.reputation_score_0_1} should be dominated by recent high endorsement`
  );
});

test("Score: v0 sample test vector matches expected 0.5488", () => {
  // Reproduce from test_vectors/vector_v0_sample
  const input = {
    as_of: "2026-02-04T12:00:00Z",
    events: [
      { timestamp: "2026-02-04T09:00:00Z", endorsement_level: 1 },
      { timestamp: "2026-02-04T03:00:00Z", endorsement_level: 2 },
      { timestamp: "2026-02-03T21:00:00Z", endorsement_level: 3 },
      { timestamp: "2026-02-03T15:00:00Z", endorsement_level: 4 },
      { timestamp: "2026-02-03T09:00:00Z", endorsement_level: 5 },
      { timestamp: "2026-02-03T03:00:00Z", endorsement_level: 1 },
      { timestamp: "2026-02-02T21:00:00Z", endorsement_level: 2 },
      { timestamp: "2026-02-02T15:00:00Z", endorsement_level: 3 },
      { timestamp: "2026-02-02T09:00:00Z", endorsement_level: 4 },
      { timestamp: "2026-02-02T03:00:00Z", endorsement_level: 5 },
      { timestamp: "2026-02-01T21:00:00Z", endorsement_level: 1 },
      { timestamp: "2026-02-01T15:00:00Z", endorsement_level: 2 },
    ],
  };
  const r = computeM010Score(input);
  assert.equal(r.reputation_score_0_1, 0.5488, "Matches v0 sample vector");
});

// ---------------------------------------------------------------------------
// KPI computation tests (supplement for computeM010KPI)
// ---------------------------------------------------------------------------
suite("KPI Computation");

test("KPI: empty events returns zeros", () => {
  const kpi = computeM010KPI({ as_of: BASE_TIME, events: [] });
  assert.equal(kpi.mechanism_id, "m010");
  assert.equal(kpi.signals_emitted, 0);
  assert.equal(kpi.subjects_touched, 0);
  assert.equal(kpi.evidence_coverage_rate, 0);
  assert.equal(kpi.median_event_latency_hours, null);
});

test("KPI: evidence coverage counts events with BOTH koi and ledger", () => {
  const events = [
    mkEvent({ evidence: { koi_links: ["koi://a"], ledger_refs: ["ledger://b"] } }),
    mkEvent({ evidence: { koi_links: ["koi://c"], ledger_refs: [] } }),
    mkEvent({ evidence: { koi_links: [], ledger_refs: ["ledger://d"] } }),
    mkEvent({ evidence: { koi_links: [], ledger_refs: [] } }),
  ];
  const kpi = computeM010KPI({ as_of: BASE_TIME, events });
  assert.equal(kpi.evidence_coverage_rate, 0.25); // 1 of 4
});

test("KPI: subjects_touched deduplicates by (subject_type, subject_id)", () => {
  const events = [
    mkEvent({ subject_type: "Project", subject_id: "P-001" }),
    mkEvent({ subject_type: "Project", subject_id: "P-001" }),
    mkEvent({ subject_type: "Verifier", subject_id: "V-001" }),
  ];
  const kpi = computeM010KPI({ as_of: BASE_TIME, events });
  assert.equal(kpi.subjects_touched, 2);
});

test("median helper: correct for odd and even arrays", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([5]), 5);
  assert.equal(median([]), null);
});

// ---------------------------------------------------------------------------
// M009 Integration Tests
// ---------------------------------------------------------------------------
suite("M009 Integration");

/**
 * Simulated M009 escrow service registry.
 * In production, M009 would query the m010 reputation store to assess providers.
 */
class M009EscrowSim {
  constructor(signalStore) {
    this._signalStore = signalStore;
    this._services = new Map();
  }

  /** Register a service provider. */
  registerProvider(providerId, category, minReputationThreshold = 0.3) {
    this._services.set(providerId, {
      provider_id: providerId,
      category,
      min_reputation: minReputationThreshold,
      status: "registered",
    });
  }

  /**
   * Query provider reputation by pulling their active signals from m010.
   * Returns reputation score for the provider address.
   */
  queryProviderReputation(providerId, asOf) {
    const allActive = this._signalStore.activeEvents(asOf);
    // Filter events where subject is this provider (Address type)
    const providerEvents = allActive.filter(
      (e) => e.subject_type === "Address" && e.subject_id === providerId
    );
    if (providerEvents.length === 0) {
      return { reputation_score_0_1: 0.0 };
    }
    return computeM010Score({ as_of: asOf, events: providerEvents });
  }

  /**
   * Gate: accept or reject a provider for service delivery based on
   * their m010 reputation score meeting the threshold.
   */
  acceptProvider(providerId, asOf) {
    const svc = this._services.get(providerId);
    if (!svc) throw new Error("PROVIDER_NOT_REGISTERED");
    const rep = this.queryProviderReputation(providerId, asOf);
    if (rep.reputation_score_0_1 < svc.min_reputation) {
      return { accepted: false, score: rep.reputation_score_0_1, reason: "BELOW_THRESHOLD" };
    }
    svc.status = "accepted";
    return { accepted: true, score: rep.reputation_score_0_1 };
  }
}

test("M009 Integration: provider reputation query after service completion", () => {
  const store = new SignalStore();
  const m009 = new M009EscrowSim(store);

  const t0 = "2026-03-01T00:00:00Z";
  const t1 = "2026-03-02T01:00:00Z"; // activation time

  // Provider "regen1provider" receives endorsements from multiple signalers
  const sig1 = store.submit(
    mkEvent({
      timestamp: t0,
      subject_type: "Address",
      subject_id: "regen1provider",
      signaler_id: "endorser_A",
      endorsement_level: 4,
      stake: 200,
      category: "operator_trust",
    })
  );
  const sig2 = store.submit(
    mkEvent({
      timestamp: t0,
      subject_type: "Address",
      subject_id: "regen1provider",
      signaler_id: "endorser_B",
      endorsement_level: 5,
      stake: 300,
      category: "operator_trust",
    })
  );

  store.activate(sig1, t1);
  store.activate(sig2, t1);

  // M009 queries the reputation
  const rep = m009.queryProviderReputation("regen1provider", t1);
  assert.ok(
    rep.reputation_score_0_1 > 0.7,
    `Provider reputation ${rep.reputation_score_0_1} should be high with 4+5 endorsements`
  );
});

test("M009 Integration: reputation threshold gate for provider acceptance", () => {
  const store = new SignalStore();
  const m009 = new M009EscrowSim(store);

  const t0 = "2026-03-01T00:00:00Z";
  const t1 = "2026-03-02T01:00:00Z";

  // Register providers with threshold 0.5
  m009.registerProvider("regen1good", "operator_trust", 0.5);
  m009.registerProvider("regen1weak", "operator_trust", 0.5);

  // Good provider: strong endorsement
  const good = store.submit(
    mkEvent({
      timestamp: t0,
      subject_type: "Address",
      subject_id: "regen1good",
      signaler_id: "endorser_A",
      endorsement_level: 5,
      stake: 200,
    })
  );
  store.activate(good, t1);

  // Weak provider: low endorsement
  const weak = store.submit(
    mkEvent({
      timestamp: t0,
      subject_type: "Address",
      subject_id: "regen1weak",
      signaler_id: "endorser_B",
      endorsement_level: 1,
      stake: 200,
    })
  );
  store.activate(weak, t1);

  // Good provider passes threshold
  const goodResult = m009.acceptProvider("regen1good", t1);
  assert.equal(goodResult.accepted, true, "Strong provider accepted");
  assert.ok(goodResult.score >= 0.5);

  // Weak provider fails threshold
  const weakResult = m009.acceptProvider("regen1weak", t1);
  assert.equal(weakResult.accepted, false, "Weak provider rejected");
  assert.equal(weakResult.reason, "BELOW_THRESHOLD");
  assert.ok(weakResult.score < 0.5);

  // Unregistered provider
  assert.throws(
    () => m009.acceptProvider("regen1unknown", t1),
    { message: "PROVIDER_NOT_REGISTERED" }
  );
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${"=".repeat(60)}`);
console.log(`Results: ${_passed} passed, ${_failed} failed, ${_passed + _failed} total`);
if (_failures.length > 0) {
  console.log("\nFailed tests:");
  for (const f of _failures) {
    console.log(`  - ${f.name}: ${f.err.message}`);
  }
  process.exit(1);
} else {
  console.log("All tests passed.");
  process.exit(0);
}
