import { describe, expect, it } from "vitest";

import { calculateOutputs } from "@/lib/domain/calc";
import { buildDiffResult, diffAssumptions, diffMetrics } from "@/lib/domain/diff";
import { createSeedAssumptions } from "@/lib/domain/model";

function cloneAssumptions() {
  return createSeedAssumptions().map((a) => ({ ...a }));
}

describe("diffAssumptions", () => {
  it("detects changed assumption values by key", () => {
    const prev = cloneAssumptions();
    const next = cloneAssumptions();
    const row = next.find((r) => r.key === "conversion_rate")!;
    row.value = 0.05;

    const changes = diffAssumptions(prev, next);
    expect(changes).toEqual([
      {
        key: "conversion_rate",
        previousValue: 0.042,
        nextValue: 0.05,
      },
    ]);
  });

  it("ignores unchanged rows and rationale-only edits", () => {
    const prev = cloneAssumptions();
    const next = cloneAssumptions();
    const row = next.find((r) => r.key === "arpu")!;
    row.rationale = "Updated copy only; value same.";

    expect(diffAssumptions(prev, next)).toEqual([]);
  });
});

describe("diffMetrics", () => {
  it("computes deltas and direction for finite metrics", () => {
    const assumptions = cloneAssumptions();
    const prevOut = calculateOutputs(assumptions);
    const nextAssumptions = cloneAssumptions();
    nextAssumptions.find((r) => r.key === "arpu")!.value = 100;
    const nextOut = calculateOutputs(nextAssumptions);

    const prevMrr = prevOut.find((m) => m.key === "mrr")!.value;
    const nextMrr = nextOut.find((m) => m.key === "mrr")!.value;

    const metricChanges = diffMetrics(prevOut, nextOut);
    const mrr = metricChanges.find((c) => c.key === "mrr");
    expect(mrr).toBeDefined();
    expect(mrr!.delta).toBeCloseTo(nextMrr - prevMrr);
    expect(mrr!.direction).toBe("up");
    expect(mrr!.previousValue).toBe(prevMrr);
    expect(mrr!.nextValue).toBe(nextMrr);

    const arr = metricChanges.find((c) => c.key === "arr");
    expect(arr?.direction).toBe("up");
  });

  it("labels direction down when a metric decreases", () => {
    const assumptions = cloneAssumptions();
    const prevOut = calculateOutputs(assumptions);
    const nextAssumptions = cloneAssumptions();
    nextAssumptions.find((r) => r.key === "monthly_traffic")!.value = 1000;
    const nextOut = calculateOutputs(nextAssumptions);

    const customers = diffMetrics(prevOut, nextOut).find(
      (c) => c.key === "customers",
    );
    expect(customers?.direction).toBe("down");
    expect(customers!.delta).toBeLessThan(0);
  });

  it("omits metrics within float tolerance", () => {
    const assumptions = cloneAssumptions();
    const out = calculateOutputs(assumptions);
    const barely = out.map((m) => ({
      ...m,
      value: m.value + 1e-15,
    }));
    expect(diffMetrics(out, barely)).toEqual([]);
  });
});

describe("buildDiffResult", () => {
  it("returns empty diffs for identical snapshots", () => {
    const assumptions = cloneAssumptions();
    const snapshot = {
      assumptions,
      outputs: calculateOutputs(assumptions),
    };
    const r = buildDiffResult(snapshot, {
      assumptions: cloneAssumptions(),
      outputs: calculateOutputs(cloneAssumptions()),
    });
    expect(r.assumptionChanges).toEqual([]);
    expect(r.metricChanges).toEqual([]);
  });

  it("combines assumption and metric changes", () => {
    const prevA = cloneAssumptions();
    const snapPrev = {
      assumptions: prevA,
      outputs: calculateOutputs(prevA),
    };
    const nextA = cloneAssumptions();
    nextA.find((r) => r.key === "starting_cash")!.value = 600_000;
    const snapNext = {
      assumptions: nextA,
      outputs: calculateOutputs(nextA),
    };

    const r = buildDiffResult(snapPrev, snapNext);
    expect(r.assumptionChanges.some((c) => c.key === "starting_cash")).toBe(
      true,
    );
    expect(r.metricChanges.some((c) => c.key === "runway")).toBe(true);
  });
});
