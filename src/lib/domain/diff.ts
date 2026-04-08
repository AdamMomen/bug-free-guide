import { OUTPUT_METRIC_KEYS } from "@/lib/domain/deps";
import { SEED_ASSUMPTION_KEYS } from "@/lib/domain/model";
import type {
  Assumption,
  AssumptionChange,
  DiffResult,
  MetricChange,
  MetricTrend,
  ModelSnapshot,
  OutputMetric,
} from "@/lib/domain/types";

/** Match float tolerance used in the assumptions UI for “no phantom dirty”. */
function valuesNearlyEqual(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return Object.is(a, b);
  }
  const scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) <= 1e-9 * scale;
}

function orderedAssumptionKeys(
  previous: Assumption[],
  next: Assumption[],
): string[] {
  const keys = new Set([
    ...previous.map((r) => r.key),
    ...next.map((r) => r.key),
  ]);
  const ordered: string[] = [];
  for (const k of SEED_ASSUMPTION_KEYS) {
    if (keys.has(k)) {
      ordered.push(k);
      keys.delete(k);
    }
  }
  for (const k of [...keys].sort()) {
    ordered.push(k);
  }
  return ordered;
}

function orderedMetricKeys(
  previous: OutputMetric[],
  next: OutputMetric[],
): string[] {
  const keys = new Set([
    ...previous.map((m) => m.key),
    ...next.map((m) => m.key),
  ]);
  const ordered: string[] = [];
  for (const k of OUTPUT_METRIC_KEYS) {
    if (keys.has(k)) {
      ordered.push(k);
      keys.delete(k);
    }
  }
  for (const k of [...keys].sort()) {
    ordered.push(k);
  }
  return ordered;
}

function metricTrend(previousValue: number, nextValue: number): MetricTrend {
  if (valuesNearlyEqual(previousValue, nextValue)) {
    return "unchanged";
  }
  return nextValue > previousValue ? "up" : "down";
}

/**
 * Assumption rows that differ numerically by stable `key` (unchanged rows omitted).
 * Rationale-only edits are ignored here; values drive the diff.
 */
export function diffAssumptions(
  previous: Assumption[],
  next: Assumption[],
): AssumptionChange[] {
  const prevMap = new Map(previous.map((r) => [r.key, r.value]));
  const nextMap = new Map(next.map((r) => [r.key, r.value]));
  const out: AssumptionChange[] = [];

  for (const key of orderedAssumptionKeys(previous, next)) {
    const a = prevMap.get(key);
    const b = nextMap.get(key);
    if (a === undefined || b === undefined) continue;
    if (valuesNearlyEqual(a, b)) continue;
    out.push({ key, previousValue: a, nextValue: b });
  }
  return out;
}

/**
 * Metric rows that differ by stable `key` (unchanged rows omitted).
 */
export function diffMetrics(
  previous: OutputMetric[],
  next: OutputMetric[],
): MetricChange[] {
  const prevMap = new Map(previous.map((m) => [m.key, m.value]));
  const nextMap = new Map(next.map((m) => [m.key, m.value]));
  const out: MetricChange[] = [];

  for (const key of orderedMetricKeys(previous, next)) {
    const a = prevMap.get(key);
    const b = nextMap.get(key);
    if (a === undefined || b === undefined) continue;
    if (valuesNearlyEqual(a, b)) continue;
    const delta = b - a;
    out.push({
      key,
      previousValue: a,
      nextValue: b,
      delta,
      direction: metricTrend(a, b),
    });
  }
  return out;
}

export function buildDiffResult(
  previous: ModelSnapshot,
  next: ModelSnapshot,
): DiffResult {
  return {
    assumptionChanges: diffAssumptions(previous.assumptions, next.assumptions),
    metricChanges: diffMetrics(previous.outputs, next.outputs),
  };
}
