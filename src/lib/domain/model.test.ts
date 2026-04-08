import { describe, expect, it } from "vitest";

import {
  SEED_ASSUMPTION_KEYS,
  createSeedAssumptions,
} from "@/lib/domain/model";

describe("createSeedAssumptions", () => {
  it("returns exactly the expected keys in order", () => {
    const seed = createSeedAssumptions();
    expect(seed.map((a) => a.key)).toEqual([...SEED_ASSUMPTION_KEYS]);
  });

  it("returns values that satisfy basic sanity checks", () => {
    const seed = createSeedAssumptions();
    const byKey = Object.fromEntries(seed.map((a) => [a.key, a]));

    expect(byKey.conversion_rate?.value).toBeGreaterThan(0);
    expect(byKey.conversion_rate?.value).toBeLessThan(1);

    expect(byKey.launch_month_offset?.value).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(byKey.launch_month_offset?.value)).toBe(true);

    expect(byKey.monthly_traffic?.value).toBeGreaterThan(0);
    expect(byKey.arpu?.value).toBeGreaterThan(0);
    expect(byKey.monthly_burn?.value).toBeGreaterThanOrEqual(0);
    expect(byKey.starting_cash?.value).toBeGreaterThan(0);

    for (const row of seed) {
      expect(row.rationale.trim().length).toBeGreaterThan(0);
    }
  });
});
