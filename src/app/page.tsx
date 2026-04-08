"use client";

import { useMemo, useState } from "react";

import { AssumptionsTable } from "@/components/assumptions-table";
import { OutputCards } from "@/components/output-cards";
import { calculateOutputs } from "@/lib/domain/calc";
import { createSeedAssumptions } from "@/lib/domain/model";
import type { Assumption } from "@/lib/domain/types";

function cloneAssumptions(rows: Assumption[]): Assumption[] {
  return rows.map((a) => ({ ...a }));
}

/** Avoid “phantom dirty” from float rounding in `<input type="number">`. */
function valueNearlyEqual(a: number, b: number): boolean {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) <= 1e-9 * scale;
}

function assumptionsValuesEqual(a: Assumption[], b: Assumption[]): boolean {
  if (a.length !== b.length) return false;
  const mapB = new Map(b.map((x) => [x.key, x.value]));
  for (const row of a) {
    const other = mapB.get(row.key);
    if (other === undefined || !valueNearlyEqual(row.value, other)) {
      return false;
    }
  }
  return true;
}

export default function Home() {
  const baseline = useMemo(() => createSeedAssumptions(), []);

  const [draft, setDraft] = useState<Assumption[]>(() =>
    cloneAssumptions(baseline),
  );
  const [saved, setSaved] = useState<Assumption[]>(() =>
    cloneAssumptions(baseline),
  );

  const isDirty = !assumptionsValuesEqual(draft, saved);

  const outputs = useMemo(() => calculateOutputs(draft), [draft]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Finance Memory Git
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Outputs follow the draft. <strong>Save baseline</strong> only
              updates the green/amber pill. <strong>Revert</strong> restores the
              last baseline; <strong>Reset to seed</strong> restores factory
              defaults.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isDirty ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/80 dark:text-amber-100">
                Unsaved changes
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100">
                In sync with baseline
              </span>
            )}
            <button
              type="button"
              title="Discard edits and reload the last saved baseline into the form"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => setDraft(cloneAssumptions(saved))}
            >
              Revert to baseline
            </button>
            <button
              type="button"
              title="Store current values as the new baseline (pill turns green; fields stay as-is)"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              onClick={() => setSaved(cloneAssumptions(draft))}
            >
              Save baseline
            </button>
            <button
              type="button"
              title="Reset both draft and baseline to the factory seed model"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => {
                const seed = cloneAssumptions(baseline);
                setDraft(seed);
                setSaved(cloneAssumptions(seed));
              }}
            >
              Reset to seed
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <AssumptionsTable
          assumptions={draft}
          onValueChange={(key, value) => {
            setDraft((prev) =>
              prev.map((row) =>
                row.key === key ? { ...row, value } : row,
              ),
            );
          }}
        />
        <OutputCards outputs={outputs} />
      </main>
    </div>
  );
}
