import type { Assumption } from "@/lib/domain/types";

/** Stable keys for the MVP seed model (order preserved for UI). */
export const SEED_ASSUMPTION_KEYS = [
  "conversion_rate",
  "launch_month_offset",
  "monthly_traffic",
  "arpu",
  "monthly_burn",
  "starting_cash",
] as const;

export type SeedAssumptionKey = (typeof SEED_ASSUMPTION_KEYS)[number];

/**
 * Hardcoded baseline assumptions for the prototype.
 * Values are illustrative; calc layer (Step 3) will consume them.
 */
export function createSeedAssumptions(): Assumption[] {
  return [
    {
      key: "conversion_rate",
      value: 0.042,
      rationale: "Early funnel; ~4.2% visit-to-signup.",
    },
    {
      key: "launch_month_offset",
      value: 0,
      rationale: "0 = live now; positive = months until launch (ramp factor later).",
    },
    {
      key: "monthly_traffic",
      value: 12_000,
      rationale: "Unique visitors per month to the top of funnel.",
    },
    {
      key: "arpu",
      value: 79,
      rationale: "Average monthly revenue per paying customer ($).",
    },
    {
      key: "monthly_burn",
      value: 45_000,
      rationale: "All-in monthly cash burn ($).",
    },
    {
      key: "starting_cash",
      value: 720_000,
      rationale: "Cash on hand before the modeled period ($).",
    },
  ];
}
