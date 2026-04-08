import { describe, expect, it } from "vitest";

import {
  DEPENDENCY_EDGES,
  getAllUpstreamNodes,
  getDirectPredecessors,
  type DependencyNode,
} from "@/lib/domain/deps";

const CHECKLIST_EDGES: [string, string][] = [
  ["conversion_rate", "customers"],
  ["launch_month_offset", "customers"],
  ["monthly_traffic", "customers"],
  ["customers", "mrr"],
  ["arpu", "mrr"],
  ["mrr", "arr"],
  ["monthly_burn", "runway"],
  ["starting_cash", "runway"],
];

function edgeKey(from: string, to: string): string {
  return `${from}\0${to}`;
}

describe("DEPENDENCY_EDGES", () => {
  it("includes every Step 11 relationship", () => {
    const have = new Set(
      DEPENDENCY_EDGES.map((e) => edgeKey(e.from, e.to)),
    );
    for (const [from, to] of CHECKLIST_EDGES) {
      expect(have.has(edgeKey(from, to)), `${from} -> ${to}`).toBe(true);
    }
    expect(DEPENDENCY_EDGES).toHaveLength(CHECKLIST_EDGES.length);
  });

  it("exposes direct predecessors for ARR and runway", () => {
    expect(getDirectPredecessors("arr")).toEqual(["mrr"]);
    expect(new Set(getDirectPredecessors("runway"))).toEqual(
      new Set(["monthly_burn", "starting_cash"]),
    );
  });
});

describe("paths toward ARR", () => {
  it("has upstream coverage for all assumptions that feed the ARR chain", () => {
    const upstream = getAllUpstreamNodes("arr");
    const mustHave: DependencyNode[] = [
      "conversion_rate",
      "launch_month_offset",
      "monthly_traffic",
      "arpu",
      "customers",
      "mrr",
    ];
    for (const key of mustHave) {
      expect(upstream.has(key), `missing upstream ${key}`).toBe(true);
    }
  });

  it("does not treat cash / burn assumptions as upstream of ARR", () => {
    const upstream = getAllUpstreamNodes("arr");
    expect(upstream.has("monthly_burn")).toBe(false);
    expect(upstream.has("starting_cash")).toBe(false);
  });
});

describe("runway", () => {
  it("only burn and cash assumptions are upstream of runway among seed keys", () => {
    const upstream = getAllUpstreamNodes("runway");
    expect(upstream.has("monthly_burn")).toBe(true);
    expect(upstream.has("starting_cash")).toBe(true);
    expect(upstream.has("conversion_rate")).toBe(false);
  });
});
