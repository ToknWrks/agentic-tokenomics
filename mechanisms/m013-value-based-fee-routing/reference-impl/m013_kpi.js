/**
 * m013 — Value-Based Fee Routing: KPI computation (v0).
 *
 * Computes aggregate KPI metrics from a set of fee events.
 *
 * @module m013_kpi
 */

import { computeFee } from "./m013_fee.js";

/**
 * Compute m013 KPI block from fee events.
 *
 * @param {Object} opts
 * @param {string} opts.as_of - ISO-8601 timestamp for the KPI snapshot
 * @param {Array} opts.fee_events - Array of fee event inputs (tx_type, value_uregen, ...)
 * @param {Object} [opts.fee_config] - Fee configuration (rates, shares, min_fee)
 * @returns {Object} KPI block conforming to m013_kpi.schema.json
 */
export function computeM013KPI({ as_of, fee_events, fee_config }) {
  const evs = fee_events ?? [];

  let totalFees = 0;
  let totalValue = 0;
  let minFeeCount = 0;
  const feesByType = {};
  const distByPool = { burn: 0, validator: 0, community: 0, agent: 0 };

  for (const ev of evs) {
    const result = computeFee({
      tx_type: ev.tx_type,
      value: ev.value_uregen,
      fee_config
    });

    totalFees += result.fee_amount;
    totalValue += ev.value_uregen;
    if (result.min_fee_applied) minFeeCount++;

    feesByType[ev.tx_type] = (feesByType[ev.tx_type] ?? 0) + result.fee_amount;

    for (const pool of ["burn", "validator", "community", "agent"]) {
      distByPool[pool] += result.distribution[pool];
    }
  }

  const avgFeeRate = totalValue > 0
    ? Number((totalFees / totalValue).toFixed(4))
    : 0;

  return {
    mechanism_id: "m013",
    scope: "v0",
    as_of,
    total_fees_uregen: totalFees,
    fee_events_count: evs.length,
    fees_by_type: feesByType,
    distribution_by_pool: distByPool,
    avg_fee_rate: avgFeeRate,
    min_fee_applied_count: minFeeCount
  };
}
