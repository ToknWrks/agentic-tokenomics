export function computeM009KPI({ as_of, agreements }) {
  const agrs = agreements ?? [];

  const agreements_proposed = agrs.filter(a => a.status === "PROPOSED").length;
  const agreements_funded = agrs.filter(a => a.status === "FUNDED").length;
  const agreements_in_progress = agrs.filter(a =>
    ["IN_PROGRESS", "MILESTONE_REVIEW"].includes(a.status)
  ).length;
  const agreements_completed = agrs.filter(a => a.status === "COMPLETED").length;
  const agreements_disputed = agrs.filter(a =>
    ["DISPUTED", "RESOLVED"].includes(a.status)
  ).length;
  const agreements_cancelled = agrs.filter(a => a.status === "CANCELLED").length;

  const total = agrs.length;
  const dispute_rate = total > 0
    ? Number((agreements_disputed / total).toFixed(4))
    : 0.0;

  // Resolution breakdown
  const resolved = agrs.filter(a => a.dispute?.resolution != null);
  const resolution_breakdown = resolved.length > 0
    ? {
        client_wins: resolved.filter(a => a.dispute.resolution === "CLIENT_WINS").length,
        provider_wins: resolved.filter(a => a.dispute.resolution === "PROVIDER_WINS").length,
        split: resolved.filter(a => a.dispute.resolution === "SPLIT").length
      }
    : null;

  // Escrow economics
  const escrows = agrs.map(a => parseInt(a.escrow_amount?.amount ?? "0", 10)).filter(e => e > 0);
  const total_escrowed = escrows.reduce((s, e) => s + e, 0);

  const completed_escrows = agrs.filter(a => a.status === "COMPLETED")
    .map(a => parseInt(a.escrow_amount?.amount ?? "0", 10));
  const total_released = completed_escrows.reduce((s, e) => s + e, 0);

  const slashed_escrows = agrs.filter(a => a.dispute?.resolution === "CLIENT_WINS")
    .map(a => parseInt(a.provider_bond?.amount ?? "0", 10));
  const total_slashed = slashed_escrows.reduce((s, e) => s + e, 0);

  // Platform fees: 1% of completed escrows + 2% of cancelled funded escrows
  // Only FUNDED cancellations incur fees; PROPOSED cancellations are fee-free.
  // Use cancelled_from field if available; otherwise assume fee-incurring.
  const cancelled_funded = agrs.filter(a =>
      a.status === "CANCELLED" &&
      a.escrow_amount &&
      (a.cancelled_from ?? "FUNDED") !== "PROPOSED"
    )
    .map(a => parseInt(a.escrow_amount?.amount ?? "0", 10));
  const completion_fees = Math.round(total_released * 0.01);
  const cancellation_fees = Math.round(cancelled_funded.reduce((s, e) => s + e, 0) * 0.02);
  const total_fees = completion_fees + cancellation_fees;

  const avg_escrow_amount = escrows.length > 0
    ? Number((total_escrowed / escrows.length).toFixed(1))
    : null;

  // Milestone stats
  const all_milestones = agrs.flatMap(a => a.milestones ?? []);
  const total_milestones = all_milestones.length;
  const milestones_approved = all_milestones.filter(m => m.status === "APPROVED").length;
  const milestones_disputed = all_milestones.filter(m => m.status === "DISPUTED").length;
  const avg_approval_rate = total_milestones > 0
    ? Number((milestones_approved / total_milestones).toFixed(4))
    : null;

  // Service type breakdown
  const types = {
    ProjectVerification: 0,
    MethodologyDevelopment: 0,
    MRVSetup: 0,
    CreditIssuanceSupport: 0,
    MonitoringReporting: 0
  };
  for (const a of agrs) {
    if (types[a.service_type] !== undefined) types[a.service_type]++;
  }

  return {
    mechanism_id: "m009",
    scope: "v0_advisory",
    as_of,
    agreements_proposed,
    agreements_funded,
    agreements_in_progress,
    agreements_completed,
    agreements_disputed,
    agreements_cancelled,
    dispute_rate,
    resolution_breakdown,
    escrow_economics: {
      total_escrowed: String(total_escrowed),
      total_released: String(total_released),
      total_slashed: String(total_slashed),
      total_fees: String(total_fees),
      avg_escrow_amount
    },
    milestone_stats: {
      total_milestones,
      milestones_approved,
      milestones_disputed,
      avg_approval_rate
    },
    service_type_breakdown: types
  };
}
