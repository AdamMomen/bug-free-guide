import { beforeEach, describe, expect, it, vi } from "vitest";

import { calculateOutputs } from "@/lib/domain/calc";
import { buildDiffResult } from "@/lib/domain/diff";
import { createSeedAssumptions } from "@/lib/domain/model";
import {
  createCommitStore,
  type CommitStore,
} from "@/lib/domain/store";
import type { CompareApiResponse } from "@/lib/domain/types";

let testStore: CommitStore;

vi.mock("@/lib/server/commit-store-singleton", () => ({
  getCommitStore: () => testStore,
}));

async function loadPost() {
  const { POST } = await import("./route");
  return POST;
}

describe("POST /api/compare", () => {
  beforeEach(() => {
    testStore = createCommitStore();
  });

  it("returns diff sorted older → newer", async () => {
    const POST = await loadPost();
    const base = createSeedAssumptions();
    const older = await testStore.createCommit({
      message: "older",
      snapshot: {
        assumptions: base,
        outputs: calculateOutputs(base),
      },
    });

    const newerAssumptions = createSeedAssumptions().map((a) =>
      a.key === "arpu" ? { ...a, value: 100 } : a,
    );
    const newer = await testStore.createCommit({
      message: "newer",
      snapshot: {
        assumptions: newerAssumptions,
        outputs: calculateOutputs(newerAssumptions),
      },
    });

    const req = new Request("http://localhost/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitIdA: newer.id,
        commitIdB: older.id,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as CompareApiResponse;

    const [sortedOlder, sortedNewer] = [older, newer].slice().sort((x, y) => {
      const t = x.createdAt.localeCompare(y.createdAt);
      if (t !== 0) return t;
      return x.id.localeCompare(y.id);
    });

    expect(body.previous.id).toBe(sortedOlder.id);
    expect(body.next.id).toBe(sortedNewer.id);
    expect(body.diff).toEqual(
      buildDiffResult(sortedOlder.snapshot, sortedNewer.snapshot),
    );
  });

  it("returns 400 for identical ids", async () => {
    const POST = await loadPost();
    const id = crypto.randomUUID();
    const req = new Request("http://localhost/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commitIdA: id, commitIdB: id }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when a commit is missing", async () => {
    const POST = await loadPost();
    const base = createSeedAssumptions();
    const c = await testStore.createCommit({
      message: "only",
      snapshot: { assumptions: base, outputs: calculateOutputs(base) },
    });
    const req = new Request("http://localhost/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitIdA: c.id,
        commitIdB: crypto.randomUUID(),
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
