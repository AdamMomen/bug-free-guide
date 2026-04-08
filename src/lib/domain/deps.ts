import type { SeedAssumptionKey } from "@/lib/domain/model";

/**
 * Output metric keys in **`calculateOutputs`** order (display / diff ordering).
 */
export const OUTPUT_METRIC_KEYS = [
  "customers",
  "mrr",
  "arr",
  "monthly_burn",
  "runway",
] as const;

export type OutputMetricKey = (typeof OUTPUT_METRIC_KEYS)[number];

/**
 * Any node in the causal graph: a seed assumption row and/or an output metric.
 * (`monthly_burn` is both an assumption key and an echoed output key.)
 */
export type DependencyNode = SeedAssumptionKey | OutputMetricKey;

export interface DependencyEdge {
  readonly from: DependencyNode;
  readonly to: DependencyNode;
}

/**
 * Static forward edges: `from` directly influences `to` in the MVP model.
 * Step 11 — aligns with `calc.ts` structure.
 */
export const DEPENDENCY_EDGES: DependencyEdge[] = [
  { from: "conversion_rate", to: "customers" },
  { from: "launch_month_offset", to: "customers" },
  { from: "monthly_traffic", to: "customers" },
  { from: "customers", to: "mrr" },
  { from: "arpu", to: "mrr" },
  { from: "mrr", to: "arr" },
  { from: "monthly_burn", to: "runway" },
  { from: "starting_cash", to: "runway" },
];

function buildReverseAdjacency(): Map<string, string[]> {
  const rev = new Map<string, string[]>();
  for (const { from, to } of DEPENDENCY_EDGES) {
    const list = rev.get(to);
    if (list) list.push(from);
    else rev.set(to, [from]);
  }
  return rev;
}

const reverseAdjacency = buildReverseAdjacency();

/**
 * All nodes that can affect `target` via dependency edges (not including `target` itself).
 * Walks the graph **backward** (outputs ← assumptions / intermediates).
 */
export function getAllUpstreamNodes(target: string): ReadonlySet<string> {
  const seen = new Set<string>();
  const stack = reverseAdjacency.get(target) ?? [];
  for (const n of stack) seen.add(n);

  let i = 0;
  const queue = [...stack];
  while (i < queue.length) {
    const node = queue[i++]!;
    for (const pred of reverseAdjacency.get(node) ?? []) {
      if (seen.has(pred)) continue;
      seen.add(pred);
      queue.push(pred);
    }
  }
  return seen;
}

/** Direct predecessors of `target` in the dependency graph. */
export function getDirectPredecessors(target: string): readonly string[] {
  return reverseAdjacency.get(target) ?? [];
}
