"use client";

import type { Assumption } from "@/lib/domain/types";

const LABELS: Record<string, string> = {
  conversion_rate: "Conversion rate",
  launch_month_offset: "Launch month offset",
  monthly_traffic: "Monthly traffic",
  arpu: "ARPU ($/mo)",
  monthly_burn: "Monthly burn ($)",
  starting_cash: "Starting cash ($)",
};

function labelForKey(key: string): string {
  return LABELS[key] ?? key.replaceAll("_", " ");
}

export interface AssumptionsTableProps {
  assumptions: Assumption[];
  onValueChange: (key: string, value: number) => void;
}

export function AssumptionsTable({
  assumptions,
  onValueChange,
}: AssumptionsTableProps) {
  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      data-tutorial="assumptions"
    >
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Assumptions
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2 pr-4 font-medium text-zinc-600 dark:text-zinc-300">
                Field
              </th>
              <th className="py-2 pr-4 font-medium text-zinc-600 dark:text-zinc-300">
                Value
              </th>
              <th className="py-2 font-medium text-zinc-600 dark:text-zinc-300">
                Rationale
              </th>
            </tr>
          </thead>
          <tbody>
            {assumptions.map((row) => (
              <tr
                key={row.key}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
              >
                <td className="py-2 pr-4 align-top font-medium text-zinc-900 dark:text-zinc-100">
                  {labelForKey(row.key)}
                </td>
                <td className="py-2 pr-4 align-top">
                  <input
                    type="number"
                    className="w-full max-w-[10rem] rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-zinc-900 tabular-nums dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    step={row.key === "conversion_rate" ? "0.0001" : "1"}
                    value={row.value}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      if (Number.isNaN(v)) return;
                      onValueChange(row.key, v);
                    }}
                  />
                </td>
                <td className="py-2 align-top text-zinc-600 dark:text-zinc-400">
                  {row.rationale}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
