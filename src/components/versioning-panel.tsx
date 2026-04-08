"use client";

import { useState } from "react";
import useSWR from "swr";

import type { Assumption, Commit } from "@/lib/domain/types";

async function commitsFetcher(url: string): Promise<Commit[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load versions");
  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as Commit[]) : [];
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
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveVersion() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          assumptions,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        issues?: unknown;
      };
      if (!res.ok) {
        const detail =
          typeof data.error === "string" ? data.error : "Save failed";
        setError(
          data.issues != null
            ? `${detail}: ${JSON.stringify(data.issues)}`
            : detail,
        );
        return;
      }
      setMessage("");
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Versions
      </h2>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Commit message
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe this version…"
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            disabled={busy}
          />
        </label>
        <button
          type="button"
          disabled={busy || message.trim().length === 0}
          onClick={() => void handleSaveVersion()}
          className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-800 dark:hover:bg-emerald-700"
        >
          {busy ? "Saving…" : "Save version"}
        </button>
      </div>
      {error ? (
        <p className="mb-3 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}
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
        <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {commits.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-zinc-100 px-2 py-1.5 dark:border-zinc-800"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {c.message}
              </span>
              <span className="ml-2 font-mono text-xs text-zinc-400">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
