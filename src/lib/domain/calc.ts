import type { Assumption, OutputMetric } from "@/lib/domain/types";

import type { SeedAssumptionKey } from "@/lib/domain/model";

const REQUIRED_KEYS: SeedAssumptionKey[] = [
  "conversion_rate",
  "launch_month_offset",
  "monthly_traffic",
  "arpu",
  "monthly_burn",
  "starting_cash",
];

function assumptionValues(assumptions: Assumption[]): Record<string, number> {
  return Object.fromEntries(assumptions.map((a) => [a.key, a.value]));
}

function requireAssumption(
  values: Record<string, number>,
  key: SeedAssumptionKey,
): number {
  const v = values[key];
  if (v === undefined) {
    throw new Error(`Missing assumption: ${key}`);
  }
  return v;
}

/**
 * Prelaunch: `launch_month_offset > 0` (months until launch) → no funnel revenue yet.
 * Live: offset 0 (or negative, treated as already live) → full factor.
 */
export function calculateLaunchFactor(launchMonthOffset: number): number {
  return launchMonthOffset > 0 ? 0 : 1;
}

export function calculateCustomers(input: {
  monthlyTraffic: number;
  conversionRate: number;
  launchMonthOffset: number;
}): number {
  const factor = calculateLaunchFactor(input.launchMonthOffset);
  return input.monthlyTraffic * input.conversionRate * factor;
}

export function calculateMRR(input: {
  customers: number;
  arpu: number;
}): number {
  return input.customers * input.arpu;
}

export function calculateARR(mrr: number): number {
  return mrr * 12;
}

/** Months of runway; `Infinity` when burn is zero (no cash consumption). */
export function calculateRunway(input: {
  startingCash: number;
  monthlyBurn: number;
}): number {
  if (input.monthlyBurn <= 0) {
    return input.monthlyBurn === 0 ? Infinity : NaN;
  }
  return input.startingCash / input.monthlyBurn;
}

/**
 * Deterministic outputs for the MVP model (order stable for UI).
 */
export function calculateOutputs(assumptions: Assumption[]): OutputMetric[] {
  const v = assumptionValues(assumptions);
  for (const key of REQUIRED_KEYS) {
    requireAssumption(v, key);
  }

  const monthlyTraffic = v.monthly_traffic;
  const conversionRate = v.conversion_rate;
  const launchMonthOffset = v.launch_month_offset;
  const arpu = v.arpu;
  const monthlyBurn = v.monthly_burn;
  const startingCash = v.starting_cash;

  const customers = calculateCustomers({
    monthlyTraffic,
    conversionRate,
    launchMonthOffset,
  });
  const mrr = calculateMRR({ customers, arpu });
  const arr = calculateARR(mrr);
  const runway = calculateRunway({
    startingCash,
    monthlyBurn,
  });

  return [
    { key: "customers", value: customers },
    { key: "mrr", value: mrr },
    { key: "arr", value: arr },
    { key: "monthly_burn", value: monthlyBurn },
    { key: "runway", value: runway },
  ];
}
