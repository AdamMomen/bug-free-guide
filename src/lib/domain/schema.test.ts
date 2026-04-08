import { describe, expect, it } from "vitest";

import { createSeedAssumptions } from "@/lib/domain/model";
import {
  assumptionsBundleSchema,
  commitRequestSchema,
  assumptionRowSchema,
} from "@/lib/domain/schema";

describe("assumptionsBundleSchema", () => {
  it("accepts the factory seed assumptions", () => {
    const seed = createSeedAssumptions();
    const out = assumptionsBundleSchema.safeParse(seed);
    expect(out.success).toBe(true);
  });

  it("rejects conversion_rate outside (0, 1)", () => {
    const seed = createSeedAssumptions();
    const bad = seed.map((r) =>
      r.key === "conversion_rate" ? { ...r, value: 1.2 } : r,
    );
    const out = assumptionsBundleSchema.safeParse(bad);
    expect(out.success).toBe(false);
  });

  it("rejects empty rationale (after trim)", () => {
    const seed = createSeedAssumptions();
    const bad = seed.map((r) =>
      r.key === "arpu" ? { ...r, rationale: "   " } : r,
    );
    const out = assumptionsBundleSchema.safeParse(bad);
    expect(out.success).toBe(false);
  });

  it("rejects unknown assumption keys on a row", () => {
    const out = assumptionRowSchema.safeParse({
      key: "not_a_key",
      value: 1,
      rationale: "x",
    });
    expect(out.success).toBe(false);
  });

  it("rejects monthly_burn that is not positive", () => {
    const seed = createSeedAssumptions();
    const bad = seed.map((r) =>
      r.key === "monthly_burn" ? { ...r, value: 0 } : r,
    );
    const out = assumptionsBundleSchema.safeParse(bad);
    expect(out.success).toBe(false);
  });

  it("rejects wrong number of rows", () => {
    const out = assumptionsBundleSchema.safeParse(
      createSeedAssumptions().slice(0, 3),
    );
    expect(out.success).toBe(false);
  });
});

describe("commitRequestSchema", () => {
  it("accepts a valid commit payload", () => {
    const out = commitRequestSchema.safeParse({
      message: "Initial model",
      assumptions: createSeedAssumptions(),
    });
    expect(out.success).toBe(true);
  });

  it("rejects blank commit message", () => {
    const out = commitRequestSchema.safeParse({
      message: "  ",
      assumptions: createSeedAssumptions(),
    });
    expect(out.success).toBe(false);
  });
});
