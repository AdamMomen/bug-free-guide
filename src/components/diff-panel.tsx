"use client";

import type {
  CompareApiResponse,
  MetricTrend,
} from "@/lib/domain/types";

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

function formatMetricDelta(key: string, delta: number): string {
  const abs = Math.abs(delta);
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  if (key === "customers") {
    return `${sign}${abs.toLocaleString(OUTPUT_LOCALE, { maximumFractionDigits: 2 })}`;
  }
  if (key === "runway") {
    return `${sign}${abs.toLocaleString(OUTPUT_LOCALE, { maximumFractionDigits: 1 })} mo`;
  }
  if (key === "mrr" || key === "arr" || key === "monthly_burn") {
    const formatted = new Intl.NumberFormat(OUTPUT_LOCALE, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(abs);
    return `${sign}${formatted}`;
  }
  return `${sign}${abs}`;
}

function trendClasses(direction: MetricTrend): string {
  switch (direction) {
    case "up":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100";
    case "down":
      return "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-100";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
  }
}

function trendLabel(direction: MetricTrend): string {
  switch (direction) {
    case "up":
      return "Up";
    case "down":
      return "Down";
    default:
      return "Flat";
  }
}

export interface DiffPanelProps {
  data: CompareApiResponse;
}

export function DiffPanel({ data }: DiffPanelProps) {
  const { previous, next: nextVersion, diff } = data;

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Compare
      </h3>
      <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          Older
        </span>
        : {previous.message}{" "}
        <span className="font-mono text-zinc-500">
          ({new Date(previous.createdAt).toLocaleString()})
        </span>
        <span className="mx-1.5 text-zinc-400">→</span>
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          Newer
        </span>
        : {nextVersion.message}{" "}
        <span className="font-mono text-zinc-500">
          ({new Date(nextVersion.createdAt).toLocaleString()})
        </span>
      </p>

      {diff.assumptionChanges.length === 0 && diff.metricChanges.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No assumption or output differences between these versions.
        </p>
      ) : null}

      {diff.assumptionChanges.length > 0 ? (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Changed assumptions
          </h4>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2 pl-3 pr-2 font-medium text-zinc-600 dark:text-zinc-300">
                    Field
                  </th>
                  <th className="py-2 pr-2 font-medium text-zinc-600 dark:text-zinc-300">
                    Before
                  </th>
                  <th className="py-2 pr-3 font-medium text-zinc-600 dark:text-zinc-300">
                    After
                  </th>
                </tr>
              </thead>
              <tbody>
                {diff.assumptionChanges.map((c) => (
                  <tr
                    key={c.key}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                  >
                    <td className="py-2 pl-3 pr-2 font-medium text-zinc-900 dark:text-zinc-100">
                      {labelAssumption(c.key)}
                    </td>
                    <td className="py-2 pr-2 font-mono text-zinc-700 tabular-nums dark:text-zinc-200">
                      {formatAssumptionCell(c.key, c.previousValue)}
                    </td>
                    <td className="py-2 pr-3 font-mono text-zinc-700 tabular-nums dark:text-zinc-200">
                      {formatAssumptionCell(c.key, c.nextValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {diff.metricChanges.length > 0 ? (
        <div>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Output changes
          </h4>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2 pl-3 pr-2 font-medium text-zinc-600 dark:text-zinc-300">
                    Metric
                  </th>
                  <th className="py-2 pr-2 font-medium text-zinc-600 dark:text-zinc-300">
                    Before
                  </th>
                  <th className="py-2 pr-2 font-medium text-zinc-600 dark:text-zinc-300">
                    After
                  </th>
                  <th className="py-2 pr-2 font-medium text-zinc-600 dark:text-zinc-300">
                    Delta
                  </th>
                  <th className="py-2 pr-3 font-medium text-zinc-600 dark:text-zinc-300">
                    Direction
                  </th>
                </tr>
              </thead>
              <tbody>
                {diff.metricChanges.map((c) => (
                  <tr
                    key={c.key}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                  >
                    <td className="py-2 pl-3 pr-2 font-medium text-zinc-900 dark:text-zinc-100">
                      {labelMetric(c.key)}
                    </td>
                    <td className="py-2 pr-2 font-mono text-zinc-700 tabular-nums dark:text-zinc-200">
                      {formatMetricValue(c.key, c.previousValue)}
                    </td>
                    <td className="py-2 pr-2 font-mono text-zinc-700 tabular-nums dark:text-zinc-200">
                      {formatMetricValue(c.key, c.nextValue)}
                    </td>
                    <td className="py-2 pr-2 font-mono text-zinc-700 tabular-nums dark:text-zinc-200">
                      {formatMetricDelta(c.key, c.delta)}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${trendClasses(c.direction)}`}
                      >
                        {trendLabel(c.direction)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
