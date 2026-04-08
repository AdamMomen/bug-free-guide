/**
 * Domain types for Finance Memory Git (assumptions, outputs, versioning, diff, explain).
 */

export interface Assumption {
  key: string;
  value: number;
  rationale: string;
}

export interface OutputMetric {
  key: string;
  value: number;
}

export interface ModelSnapshot {
  assumptions: Assumption[];
  outputs: OutputMetric[];
}

export interface Commit {
  id: string;
  message: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  snapshot: ModelSnapshot;
}

export interface AssumptionChange {
  key: string;
  previousValue: number;
  nextValue: number;
}

export type MetricTrend = "up" | "down" | "unchanged";

export interface MetricChange {
  key: string;
  previousValue: number;
  nextValue: number;
  delta: number;
  direction: MetricTrend;
}

export interface DiffResult {
  assumptionChanges: AssumptionChange[];
  metricChanges: MetricChange[];
}

/** `POST /api/compare` — older commit is `previous`, newer is `next` (sorted by `createdAt`). */
export interface CompareCommitSummary {
  id: string;
  message: string;
  createdAt: string;
}

export interface CompareApiResponse {
  previous: CompareCommitSummary;
  next: CompareCommitSummary;
  diff: DiffResult;
}

/** Assumption row as it contributes to an explain-why answer */
export interface ExplanationAssumptionRef {
  key: string;
  rationale: string;
  previousValue: number;
  nextValue: number;
}

export interface ExplanationResult {
  metricKey: string;
  changedAssumptions: ExplanationAssumptionRef[];
  /** Ordered keys along the calculation chain (e.g. conversion → customers → mrr → arr) */
  propagationPath: string[];
  /** Free-text rationales (per step or parallel to path — UI decides layout) */
  rationales: string[];
}
