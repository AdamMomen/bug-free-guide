import { describe, expect, it } from "vitest";

import { calculateOutputs } from "@/lib/domain/calc";
import { explainMetricChange } from "@/lib/domain/explain";
import { createSeedAssumptions } from "@/lib/domain/model";
import type { ModelSnapshot } from "@/lib/domain/types";

function cloneAssumptions() {
  return createSeedAssumptions().map((a) => ({ ...a }));
}

function snapshotFromAssumptions(
  assumptions: ReturnType<typeof createSeedAssumptions>,
): ModelSnapshot {
  return {
    assumptions,
    outputs: calculateOutputs(assumptions),
  };
}

describe("explainMetricChange", () => {
  it("returns null when the metric did not change", () => {
    const a = cloneAssumptions();
    const snap = snapshotFromAssumptions(a);
    expect(
      explainMetricChange({
        metricKey: "arr",
        previous: snap,
        next: snapshotFromAssumptions(cloneAssumptions()),
      }),
    ).toBeNull();
  });

  it("for ARR, includes conversion when only conversion changes", () => {
    const prevA = cloneAssumptions();
    const nextA = cloneAssumptions();
    const conv = nextA.find((r) => r.key === "conversion_rate")!;
    conv.value = 0.05;

    const exp = explainMetricChange({
      metricKey: "arr",
      previous: snapshotFromAssumptions(prevA),
      next: snapshotFromAssumptions(nextA),
    });

    expect(exp).not.toBeNull();
    expect(exp!.changedAssumptions.map((x) => x.key)).toEqual([
      "conversion_rate",
    ]);
    expect(exp!.propagationPath).toEqual([
      "conversion_rate",
      "customers",
      "mrr",
      "arr",
    ]);
    expect(exp!.rationales[0]).toContain("4.2%");
  });

  it("for ARR, excludes unrelated burn / cash changes", () => {
    const prevA = cloneAssumptions();
    const nextA = cloneAssumptions();
    nextA.find((r) => r.key === "conversion_rate")!.value = 0.05;
    nextA.find((r) => r.key === "monthly_burn")!.value = 50_000;
    nextA.find((r) => r.key === "starting_cash")!.value = 800_000;

    const exp = explainMetricChange({
      metricKey: "arr",
      previous: snapshotFromAssumptions(prevA),
      next: snapshotFromAssumptions(nextA),
    });

    expect(exp).not.toBeNull();
    expect(exp!.changedAssumptions.map((c) => c.key)).toEqual([
      "conversion_rate",
    ]);
    expect(exp!.changedAssumptions.some((c) => c.key === "monthly_burn")).toBe(
      false,
    );
    expect(exp!.changedAssumptions.some((c) => c.key === "starting_cash")).toBe(
      false,
    );
  });

  it("orders propagation path assumptions in seed-key order then metrics", () => {
    const prevA = cloneAssumptions();
    const nextA = cloneAssumptions();
    nextA.find((r) => r.key === "arpu")!.value = 100;
    nextA.find((r) => r.key === "conversion_rate")!.value = 0.05;

    const exp = explainMetricChange({
      metricKey: "arr",
      previous: snapshotFromAssumptions(prevA),
      next: snapshotFromAssumptions(nextA),
    });

    expect(exp!.propagationPath).toEqual([
      "conversion_rate",
      "arpu",
      "customers",
      "mrr",
      "arr",
    ]);
  });

  it("supports runway when cash changes", () => {
    const prevA = cloneAssumptions();
    const nextA = cloneAssumptions();
    nextA.find((r) => r.key === "starting_cash")!.value = 600_000;

    const exp = explainMetricChange({
      metricKey: "runway",
      previous: snapshotFromAssumptions(prevA),
      next: snapshotFromAssumptions(nextA),
    });

    expect(exp).not.toBeNull();
    expect(exp!.changedAssumptions.map((c) => c.key)).toEqual([
      "starting_cash",
    ]);
    expect(exp!.propagationPath).toEqual(["starting_cash", "runway"]);
  });
});
