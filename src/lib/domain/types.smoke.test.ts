import { describe, expect, it } from "vitest";

import type {
  Assumption,
  AssumptionChange,
  Commit,
  DiffResult,
  ExplanationResult,
  MetricChange,
  ModelSnapshot,
  OutputMetric,
} from "@/lib/domain/types";

describe("domain types (compile-time smoke)", () => {
  it("accepts minimal well-shaped values", () => {
    const assumption: Assumption = {
      key: "conversion_rate",
      value: 0.04,
      rationale: "baseline",
    };
    const output: OutputMetric = { key: "arr", value: 120_000 };
    const snapshot: ModelSnapshot = {
      assumptions: [assumption],
      outputs: [output],
    };
    const commit: Commit = {
      id: "c1",
      message: "seed",
      createdAt: new Date().toISOString(),
      snapshot,
    };
    const assumptionChange: AssumptionChange = {
      key: "conversion_rate",
      previousValue: 0.04,
      nextValue: 0.037,
    };
    const metricChange: MetricChange = {
      key: "arr",
      previousValue: 120_000,
      nextValue: 110_280,
      delta: -9720,
      direction: "down",
    };
    const diff: DiffResult = {
      assumptionChanges: [assumptionChange],
      metricChanges: [metricChange],
    };
    const explain: ExplanationResult = {
      metricKey: "arr",
      changedAssumptions: [
        {
          key: assumption.key,
          rationale: assumption.rationale,
          previousValue: assumptionChange.previousValue,
          nextValue: assumptionChange.nextValue,
        },
      ],
      propagationPath: ["conversion_rate", "customers", "mrr", "arr"],
      rationales: ["Conversion feeds customers, then MRR and ARR."],
    };

    expect(commit.snapshot.outputs[0]?.key).toBe("arr");
    expect(diff.metricChanges[0]?.direction).toBe("down");
    expect(explain.propagationPath).toContain("arr");
  });
});
