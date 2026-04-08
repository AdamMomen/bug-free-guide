"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DiffPanel } from "@/components/diff-panel";
import { ExplainPanel, ExplainPanelSkeleton } from "@/components/explain-panel";
import { HistoryList } from "@/components/history-list";
import type {
  Assumption,
  Commit,
  CompareApiResponse,
  ExplainApiResponse,
} from "@/lib/domain/types";

async function commitsFetcher(url: string): Promise<Commit[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load versions");
  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as Commit[]) : [];
}

type CommitSaveArg = { message: string; assumptions: Assumption[] };

type ExplainSwrKey = readonly ["explain", string, string, string];

async function explainFetcher(key: ExplainSwrKey): Promise<ExplainApiResponse> {
  const [, commitIdA, commitIdB, metricKey] = key;
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commitIdA, commitIdB, metricKey }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    issues?: unknown;
  } & Partial<ExplainApiResponse>;
  if (!res.ok) {
    const detail =
      typeof data.error === "string" ? data.error : "Explain failed";
    throw new Error(
      data.issues != null
        ? `${detail}: ${JSON.stringify(data.issues)}`
        : detail,
    );
  }
  if (
    data.explanation == null ||
    data.metricKey == null ||
    data.previousValue === undefined ||
    data.nextValue === undefined ||
    data.previous == null ||
    data.next == null
  ) {
    throw new Error("Invalid explain response");
  }
  return data as ExplainApiResponse;
}

async function commitSaveFetcher(
  url: string,
  { arg }: { arg: CommitSaveArg },
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: arg.message.trim(),
      assumptions: arg.assumptions,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    issues?: unknown;
  };
  if (!res.ok) {
    const detail = typeof data.error === "string" ? data.error : "Save failed";
    throw new Error(
      data.issues != null
        ? `${detail}: ${JSON.stringify(data.issues)}`
        : detail,
    );
  }
}

function CommitsListSkeleton() {
  return (
    <ul
      className="max-h-48 space-y-2 overflow-y-auto text-sm"
      aria-busy="true"
      aria-label="Loading versions"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <li
          key={i}
          className="rounded-md border border-zinc-100 px-2 py-1.5 dark:border-zinc-800"
        >
          <div className="h-4 max-w-[70%] animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-3 max-w-[12rem] animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </li>
      ))}
    </ul>
  );
}

export function VersioningPanel({ assumptions }: { assumptions: Assumption[] }) {
  const {
    data: commits,
    error: loadError,
    isLoading,
    mutate,
  } = useSWR<Commit[]>("/api/commits", commitsFetcher);
  const {
    trigger: saveVersion,
    isMutating,
    error: saveError,
    reset: resetSaveMutation,
  } = useSWRMutation("/api/commit", commitSaveFetcher, {
    onSuccess: () => {
      void mutate();
    },
  });
  const [message, setMessage] = useState("");
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [comparePayload, setComparePayload] = useState<CompareApiResponse | null>(
    null,
  );
  const [compareBusy, setCompareBusy] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [explainMetricKey, setExplainMetricKey] = useState<string | null>(null);

  const explainSwrKey: ExplainSwrKey | null =
    comparePayload && explainMetricKey
      ? [
          "explain",
          comparePayload.previous.id,
          comparePayload.next.id,
          explainMetricKey,
        ]
      : null;

  const {
    data: explainData,
    error: explainError,
    isLoading: explainLoading,
  } = useSWR(explainSwrKey, explainFetcher);

  /** Drop ids that disappeared from the server list without syncing in an effect (lint-safe). */
  const compareSelectionVisible = useMemo(() => {
    if (commits === undefined) return compareSelection;
    const valid = new Set(commits.map((c) => c.id));
    return compareSelection.filter((id) => valid.has(id));
  }, [commits, compareSelection]);

  async function handleSaveVersion() {
    try {
      await saveVersion({ message, assumptions });
      setMessage("");
    } catch {
      /* error surfaced via saveError */
    }
  }

  function setSelectionAndClearCompare(ids: string[]) {
    setCompareSelection(ids);
    setComparePayload(null);
    setCompareError(null);
    setExplainMetricKey(null);
  }

  async function handleCompareSelected() {
    const ids = compareSelectionVisible;
    if (ids.length !== 2) return;
    setCompareError(null);
    setCompareBusy(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitIdA: ids[0],
          commitIdB: ids[1],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        issues?: unknown;
        previous?: CompareApiResponse["previous"];
        next?: CompareApiResponse["next"];
        diff?: CompareApiResponse["diff"];
      };
      if (!res.ok) {
        const detail =
          typeof data.error === "string" ? data.error : "Compare failed";
        setCompareError(
          data.issues != null
            ? `${detail}: ${JSON.stringify(data.issues)}`
            : detail,
        );
        return;
      }
      if (
        data.previous == null ||
        data.next == null ||
        data.diff == null
      ) {
        setCompareError("Invalid compare response");
        return;
      }
      setComparePayload({
        previous: data.previous,
        next: data.next,
        diff: data.diff,
      });
      setExplainMetricKey(null);
    } catch {
      setCompareError("Compare request failed");
    } finally {
      setCompareBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Versions
      </h2>
      <div
        className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end"
        data-tutorial="version-save"
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Commit message
          <input
            type="text"
            value={message}
            onChange={(e) => {
              resetSaveMutation();
              setMessage(e.target.value);
            }}
            placeholder="Describe this version…"
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            disabled={isMutating}
          />
        </label>
        <button
          type="button"
          disabled={isMutating || message.trim().length === 0}
          onClick={() => void handleSaveVersion()}
          className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-800 dark:hover:bg-emerald-700"
        >
          {isMutating ? "Saving…" : "Save version"}
        </button>
      </div>
      {saveError ? (
        <p className="mb-3 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {saveError.message}
        </p>
      ) : null}
      {loadError ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-600 dark:text-red-400">
            Could not load versions.
          </p>
          <button
            type="button"
            onClick={() => void mutate()}
            className="self-start rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Retry
          </button>
        </div>
      ) : isLoading || commits === undefined ? (
        <CommitsListSkeleton />
      ) : commits.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No saved versions yet.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2" data-tutorial="version-compare">
            <HistoryList
              commits={commits}
              selectedIds={compareSelectionVisible}
              onSelectedIdsChange={setSelectionAndClearCompare}
            />
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                disabled={
                  compareSelectionVisible.length !== 2 || compareBusy
                }
                onClick={() => void handleCompareSelected()}
                className="self-start rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {compareBusy ? "Comparing…" : "Compare selected versions"}
              </button>
              {compareError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {compareError}
                </p>
              ) : null}
              {comparePayload ? (
                <DiffPanel
                  data={comparePayload}
                  onMetricRowClick={(key) => setExplainMetricKey(key)}
                  selectedMetricKey={explainMetricKey}
                />
              ) : null}
              {explainMetricKey ? (
                explainError ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {explainError instanceof Error
                      ? explainError.message
                      : "Explain failed"}
                  </p>
                ) : explainLoading ? (
                  <ExplainPanelSkeleton />
                ) : explainData ? (
                  <ExplainPanel data={explainData} />
                ) : null
              ) : null}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
