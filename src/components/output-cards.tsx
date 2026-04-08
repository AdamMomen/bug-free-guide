"use client";

import type { OutputMetric } from "@/lib/domain/types";

const TITLES: Record<string, string> = {
  customers: "Customers",
  mrr: "MRR",
  arr: "ARR",
  monthly_burn: "Monthly burn",
  runway: "Runway",
};

/** Fixed locale so SSR (Node) and client format numbers the same — avoids hydration mismatch. */
const OUTPUT_LOCALE = "en-US";

function formatMetric(key: string, value: number): string {
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

export interface OutputCardsProps {
  outputs: OutputMetric[];
}

export function OutputCards({ outputs }: OutputCardsProps) {
  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      data-tutorial="outputs"
    >
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Outputs
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {outputs.map((m) => (
          <li
            key={m.key}
            className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {TITLES[m.key] ?? m.key}
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">
              {formatMetric(m.key, m.value)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
