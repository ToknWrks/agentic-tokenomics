/**
 * v0 (advisory): 4-factor weighted composite scoring for milestone deliverable review.
 *
 * Factors:
 *   deliverable_quality    (weight 0.40): Methodology compliance, technical quality
 *   evidence_completeness  (weight 0.25): Evidence IRI resolvability, document completeness
 *   milestone_consistency  (weight 0.20): Consistency with prior milestones and spec
 *   provider_reputation    (weight 0.15): M010 reputation score for provider
 *
 * See SPEC.md section 5 for full formula.
 *
 * @param {Object} opts
 * @param {Object} opts.milestone - Milestone metadata
 * @param {Object} opts.factors - Pre-computed factor scores (each 0-1000)
 * @returns {{ score: number, confidence: number, recommendation: string, factors: Object }}
 */
export function computeM009Score({ milestone, factors }) {
  const W_QUALITY = 0.40;
  const W_EVIDENCE = 0.25;
  const W_CONSISTENCY = 0.20;
  const W_REPUTATION = 0.15;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const fQuality = clamp(factors.deliverable_quality ?? 0, 0, 1000);
  const fEvidence = clamp(factors.evidence_completeness ?? 0, 0, 1000);
  const fConsistency = clamp(factors.milestone_consistency ?? 0, 0, 1000);
  const fReputation = clamp(factors.provider_reputation ?? 300, 0, 1000);

  const score = Math.round(
    W_QUALITY * fQuality +
    W_EVIDENCE * fEvidence +
    W_CONSISTENCY * fConsistency +
    W_REPUTATION * fReputation
  );

  const confidence = computeConfidence(factors);
  const recommendation = computeRecommendation(clamp(score, 0, 1000), confidence);

  return {
    score: clamp(score, 0, 1000),
    confidence,
    recommendation,
    factors: {
      deliverable_quality: fQuality,
      evidence_completeness: fEvidence,
      milestone_consistency: fConsistency,
      provider_reputation: fReputation
    }
  };
}

/**
 * Compute recommendation based on score and confidence.
 * @param {number} score
 * @param {number} confidence
 * @returns {string}
 */
function computeRecommendation(score, confidence) {
  if (score >= 700 && confidence >= 750) return "APPROVE";
  if (score < 400 || confidence < 250) return "FLAG_FOR_CLIENT";
  return "NEEDS_REVISION";
}

function computeConfidence(factors) {
  let available = 0;
  const total = 4;
  if (factors.reputation_available === true) available++;
  if (factors.iri_resolvable === true) available++;
  if (factors.has_prior_milestones === true) available++;
  if (factors.spec_available === true) available++;
  return Math.round((available / total) * 1000);
}

// --- Self-test ---
const isMain = typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("m009_score.js") || process.argv[1].endsWith("m009_score"));

if (isMain) {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const url = await import("node:url");

  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const inputPath = path.join(__dirname, "test_vectors", "vector_v0_sample.input.json");
  const expectedPath = path.join(__dirname, "test_vectors", "vector_v0_sample.expected.json");

  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));

  const results = input.milestones.map(m => computeM009Score({
    milestone: m.milestone,
    factors: m.factors
  }));

  let pass = true;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const e = expected.scores[i];
    if (r.score !== e.score) {
      console.error(`FAIL milestone[${i}]: got score=${r.score}, expected score=${e.score}`);
      pass = false;
    }
    if (r.recommendation !== e.recommendation) {
      console.error(`FAIL milestone[${i}]: got recommendation=${r.recommendation}, expected=${e.recommendation}`);
      pass = false;
    }
  }

  if (pass) {
    console.log("m009_score self-test: PASS");
    console.log(JSON.stringify({ scores: results }, null, 2));
  } else {
    process.exit(1);
  }
}
