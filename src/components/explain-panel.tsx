"use client";

import type { ExplainApiResponse } from "@/lib/domain/types";

const ASSUMPTION_LABELS: Record<string, string> = {
  conversion_rate: "Conversion rate",
  launch_month_offset: "Launch month offset",
  monthly_traffic: "Monthly traffic",
  arpu: "ARPU ($/mo)",
  monthly_burn: "Monthly burn ($)",
  starting_cash: "Starting cash ($)",
};

const METRIC_TITLES: Record<string, string> = {
  customers: "Customers",
  mrr: "MRR",
  arr: "ARR",
  monthly_burn: "Monthly burn",
  runway: "Runway",
};

const OUTPUT_LOCALE = "en-US";

function labelAssumption(key: string): string {
  return ASSUMPTION_LABELS[key] ?? key.replaceAll("_", " ");
}

function labelMetric(key: string): string {
  return METRIC_TITLES[key] ?? key.replaceAll("_", " ");
}

function labelPathNode(key: string): string {
  return METRIC_TITLES[key] ?? ASSUMPTION_LABELS[key] ?? key.replaceAll("_", " ");
}

function formatAssumptionCell(key: string, value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (key === "conversion_rate") {
    return `${(value * 100).toLocaleString(OUTPUT_LOCALE, { maximumFractionDigits: 2 })}%`;
  }
  return value.toLocaleString(OUTPUT_LOCALE, { maximumFractionDigits: 4 });
}

function formatMetricValue(key: string, value: number): string {
  if (!Number.isFinite(value)) {
    if (value === Infinity) return "∞";
    return "—";
  }
  if (key === "customers") {
    return value.toLocaleString(OUTPUT_LOCALE, { maximumFractionDigits: 2 });
  }
  if (key === "runway") {
    return `${value.toLocaleString(OUTPUT_LOCALE, { maximumFractionDigits: 1 })} mo`;
  }
  if (key === "mrr" || key === "arr" || key === "monthly_burn") {
    return new Intl.NumberFormat(OUTPUT_LOCALE, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return String(value);
}

export function ExplainPanelSkeleton() {
  return (
    <div
      className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
      aria-busy="true"
      aria-label="Loading explanation"
    >
      <div className="mb-3 h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mb-2 h-8 max-w-md animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      <div className="h-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}

export interface ExplainPanelProps {
  data: ExplainApiResponse;
}

export function ExplainPanel({ data }: ExplainPanelProps) {
  const { metricKey, previousValue, nextValue, explanation } = data;
  const title = labelMetric(metricKey);

  return (
    <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900/60 dark:bg-violet-950/30">
      <h3 className="mb-1 text-sm font-semibold text-violet-900 dark:text-violet-100">
        Why {title} changed
      </h3>
      <p className="mb-4 font-mono text-xs text-violet-800/90 dark:text-violet-200/90">
        <span className="font-sans font-medium text-violet-900 dark:text-violet-100">
          Before:
        </span>{" "}
        {formatMetricValue(metricKey, previousValue)}
        <span className="mx-2 text-violet-600 dark:text-violet-400">→</span>
        <span className="font-sans font-medium text-violet-900 dark:text-violet-100">
          After:
        </span>{" "}
        {formatMetricValue(metricKey, nextValue)}
      </p>

      {explanation.changedAssumptions.length > 0 ? (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-violet-800 uppercase dark:text-violet-300">
            Upstream assumptions
          </h4>
          <ul className="space-y-2 text-sm">
            {explanation.changedAssumptions.map((a) => (
              <li
                key={a.key}
                className="rounded-md border border-violet-200/80 bg-white/80 px-3 py-2 dark:border-violet-900/50 dark:bg-zinc-950/60"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {labelAssumption(a.key)}
                </span>
                <span className="mt-1 block font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {formatAssumptionCell(a.key, a.previousValue)} →{" "}
                  {formatAssumptionCell(a.key, a.nextValue)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-4 text-sm text-violet-800 dark:text-violet-200">
          No assumption changes in the dependency path for this metric (values
          may match due to rounding).
        </p>
      )}

      <div className="mb-4">
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-violet-800 uppercase dark:text-violet-300">
          Propagation path
        </h4>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {explanation.propagationPath.map(labelPathNode).join(" → ")}
        </p>
      </div>

      {explanation.rationales.length > 0 ? (
        <div>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-violet-800 uppercase dark:text-violet-300">
            Rationales
          </h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {explanation.rationales.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
