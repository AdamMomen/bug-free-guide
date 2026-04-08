import { describe, expect, it } from "vitest";

import {
  calculateARR,
  calculateCustomers,
  calculateLaunchFactor,
  calculateMRR,
  calculateOutputs,
  calculateRunway,
} from "@/lib/domain/calc";
import { createSeedAssumptions } from "@/lib/domain/model";

describe("calculateLaunchFactor", () => {
  it("is 1 when live (offset 0)", () => {
    expect(calculateLaunchFactor(0)).toBe(1);
  });

  it("is 0 when launch is in the future", () => {
    expect(calculateLaunchFactor(3)).toBe(0);
  });

  it("treats negative offset as live (factor 1)", () => {
    expect(calculateLaunchFactor(-1)).toBe(1);
  });
});

describe("calculateCustomers", () => {
  it("matches monthly_traffic * conversion_rate * launchFactor when live", () => {
    const customers = calculateCustomers({
      monthlyTraffic: 12_000,
      conversionRate: 0.042,
      launchMonthOffset: 0,
    });
    expect(customers).toBeCloseTo(12_000 * 0.042, 10);
  });

  it("is zero before launch", () => {
    expect(
      calculateCustomers({
        monthlyTraffic: 12_000,
        conversionRate: 0.042,
        launchMonthOffset: 2,
      }),
    ).toBe(0);
  });
});

describe("calculateMRR", () => {
  it("is customers * arpu", () => {
    expect(calculateMRR({ customers: 504, arpu: 79 })).toBe(504 * 79);
  });
});

describe("calculateARR", () => {
  it("is mrr * 12", () => {
    expect(calculateARR(39_816)).toBe(39_816 * 12);
  });
});

describe("calculateRunway", () => {
  it("is starting_cash / monthly_burn", () => {
    expect(
      calculateRunway({ startingCash: 720_000, monthlyBurn: 45_000 }),
    ).toBe(16);
  });

  it("is Infinity when burn is zero", () => {
    expect(
      calculateRunway({ startingCash: 100_000, monthlyBurn: 0 }),
    ).toBe(Infinity);
  });

  it("is NaN when burn is negative", () => {
    expect(
      Number.isNaN(
        calculateRunway({ startingCash: 100_000, monthlyBurn: -1 }),
      ),
    ).toBe(true);
  });
});

describe("calculateOutputs", () => {
  it("produces stable keys and values for seed assumptions", () => {
    const outputs = calculateOutputs(createSeedAssumptions());
    expect(outputs.map((o) => o.key)).toEqual([
      "customers",
      "mrr",
      "arr",
      "monthly_burn",
      "runway",
    ]);

    const map = Object.fromEntries(outputs.map((o) => [o.key, o.value]));
    expect(map.customers).toBeCloseTo(504, 9);
    expect(map.mrr).toBeCloseTo(504 * 79, 5);
    expect(map.arr).toBeCloseTo(504 * 79 * 12, 5);
    expect(map.monthly_burn).toBe(45_000);
    expect(map.runway).toBe(16);
  });

  it("is deterministic for the same inputs", () => {
    const seed = createSeedAssumptions();
    expect(calculateOutputs(seed)).toEqual(calculateOutputs(seed));
  });

  it("throws when an assumption key is missing", () => {
    expect(() =>
      calculateOutputs([{ key: "conversion_rate", value: 1, rationale: "" }]),
    ).toThrow(/Missing assumption/);
  });
});
