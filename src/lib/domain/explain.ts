import {
  DEPENDENCY_EDGES,
  OUTPUT_METRIC_KEYS,
  getAllUpstreamNodes,
} from "@/lib/domain/deps";
import { buildDiffResult, diffAssumptions } from "@/lib/domain/diff";
import { SEED_ASSUMPTION_KEYS } from "@/lib/domain/model";
import type {
  ExplanationAssumptionRef,
  ExplanationResult,
  ModelSnapshot,
} from "@/lib/domain/types";

/**
 * Nodes reachable from `seedKeys` along **`DEPENDENCY_EDGES`** that still lie on
 * paths constrained to the upstream subgraph of `target` (including `target`).
 */
function forwardReachableToTarget(
  seedKeys: ReadonlySet<string>,
  target: string,
): Set<string> {
  const allowed = new Set(getAllUpstreamNodes(target));
  allowed.add(target);

  const reachable = new Set<string>();
  const queue: string[] = [];
  for (const k of seedKeys) {
    if (allowed.has(k)) {
      reachable.add(k);
      queue.push(k);
    }
  }

  let i = 0;
  while (i < queue.length) {
    const n = queue[i++]!;
    for (const { from, to } of DEPENDENCY_EDGES) {
      if (from !== n) continue;
      if (!allowed.has(to)) continue;
      if (!reachable.has(to)) {
        reachable.add(to);
        queue.push(to);
      }
    }
  }
  return reachable;
}

/** Stable causal order: seed assumptions first, then output metrics in calc order. */
function orderPropagationPath(nodes: ReadonlySet<string>): string[] {
  const ordered: string[] = [];
  for (const k of SEED_ASSUMPTION_KEYS) {
    if (nodes.has(k)) ordered.push(k);
  }
  for (const k of OUTPUT_METRIC_KEYS) {
    if (nodes.has(k)) ordered.push(k);
  }
  return ordered;
}

/**
 * Explain why `metricKey` differs between two snapshots: relevant assumption
 * deltas, ordered propagation path, and rationales from the **newer** snapshot.
 * Returns **`null`** when that output did not change between snapshots.
 */
export function explainMetricChange(input: {
  metricKey: string;
  previous: ModelSnapshot;
  next: ModelSnapshot;
}): ExplanationResult | null {
  const { metricKey, previous: older, next: newer } = input;

  const diff = buildDiffResult(older, newer);
  if (!diff.metricChanges.some((m) => m.key === metricKey)) {
    return null;
  }

  const upstream = getAllUpstreamNodes(metricKey);
  const assumptionChanges = diffAssumptions(
    older.assumptions,
    newer.assumptions,
  );
  const relevantChanges = assumptionChanges.filter((c) => upstream.has(c.key));

  const seeds = new Set(relevantChanges.map((c) => c.key));
  const reachable = forwardReachableToTarget(seeds, metricKey);
  const propagationPath = orderPropagationPath(reachable);

  const newerByKey = new Map(newer.assumptions.map((a) => [a.key, a]));
  const changedAssumptions: ExplanationAssumptionRef[] = relevantChanges.map(
    (c) => {
      const row = newerByKey.get(c.key)!;
      return {
        key: c.key,
        rationale: row.rationale,
        previousValue: c.previousValue,
        nextValue: c.nextValue,
      };
    },
  );

  const rationales = changedAssumptions.map((a) => a.rationale);

  return {
    metricKey,
    changedAssumptions,
    propagationPath,
    rationales,
  };
}
