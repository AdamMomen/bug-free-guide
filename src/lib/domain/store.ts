import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { Commit, ModelSnapshot } from "@/lib/domain/types";

/** Default path (repo root) for JSON persistence; use with `path.join(process.cwd(), …)`. */
export const DEFAULT_COMMITS_RELATIVE_PATH = "data/commits.json";

export type CreateCommitInput = {
  message: string;
  snapshot: ModelSnapshot;
};

function cloneModelSnapshot(s: ModelSnapshot): ModelSnapshot {
  return {
    assumptions: s.assumptions.map((a) => ({ ...a })),
    outputs: s.outputs.map((o) => ({ ...o })),
  };
}

function cloneCommit(c: Commit): Commit {
  return {
    id: c.id,
    message: c.message,
    createdAt: c.createdAt,
    snapshot: cloneModelSnapshot(c.snapshot),
  };
}

type PersistedFile = { commits: Commit[] };

export interface CommitStore {
  /** Newest commit first. */
  listCommits(): Promise<Commit[]>;
  createCommit(input: CreateCommitInput): Promise<Commit>;
  getCommitById(id: string): Promise<Commit | null>;
}

/**
 * @param options.filePath — If set, load/save JSON `{ commits: Commit[] }` (append order on disk = oldest → newest).
 * Omit for an in-memory store (tests, ephemeral use).
 */
export function createCommitStore(options?: {
  filePath?: string;
}): CommitStore {
  const filePath = options?.filePath;
  const commits: Commit[] = [];
  let loaded = false;

  async function ensureLoaded(): Promise<void> {
    if (loaded) return;
    loaded = true;
    if (!filePath) return;
    try {
      const raw = await readFile(filePath, "utf8");
      const data = JSON.parse(raw) as PersistedFile;
      if (Array.isArray(data.commits)) {
        for (const c of data.commits) {
          commits.push(cloneCommit(c));
        }
      }
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") throw e;
    }
  }

  async function persist(): Promise<void> {
    if (!filePath) return;
    await mkdir(dirname(filePath), { recursive: true });
    const payload: PersistedFile = { commits: commits.map(cloneCommit) };
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }

  return {
    async listCommits() {
      await ensureLoaded();
      return [...commits].reverse().map(cloneCommit);
    },

    async createCommit(input) {
      await ensureLoaded();
      const commit: Commit = {
        id: crypto.randomUUID(),
        message: input.message,
        createdAt: new Date().toISOString(),
        snapshot: cloneModelSnapshot(input.snapshot),
      };
      commits.push(commit);
      await persist();
      return cloneCommit(commit);
    },

    async getCommitById(id) {
      await ensureLoaded();
      const found = commits.find((c) => c.id === id);
      return found ? cloneCommit(found) : null;
    },
  };
}
