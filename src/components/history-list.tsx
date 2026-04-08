"use client";

import { useMemo } from "react";

import { updateCompareSelection } from "@/lib/compare-selection";
import type { Commit } from "@/lib/domain/types";

export interface HistoryListProps {
  commits: Commit[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
}

export function HistoryList({
  commits,
  selectedIds,
  onSelectedIdsChange,
}: HistoryListProps) {
  const ordered = useMemo(
    () =>
      [...commits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [commits],
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Newest first. Select up to two versions for compare (next step).
      </p>
      <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
        {ordered.map((c) => {
          const selected = selectedIds.includes(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onSelectedIdsChange(
                    updateCompareSelection(selectedIds, c.id),
                  )
                }
                className={`w-full rounded-md border px-2 py-1.5 text-left transition-colors ${
                  selected
                    ? "border-emerald-500/80 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40"
                    : "border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/80"
                }`}
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {c.message}
                </span>
                <span className="mt-0.5 block font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selectedIds.length > 0 ? (
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {selectedIds.length === 1
            ? "1 version selected"
            : "2 versions selected for compare"}
        </p>
      ) : null}
    </div>
  );
}
