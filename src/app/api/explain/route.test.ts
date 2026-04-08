import { beforeEach, describe, expect, it, vi } from "vitest";

import { calculateOutputs } from "@/lib/domain/calc";
import { explainMetricChange } from "@/lib/domain/explain";
import { createSeedAssumptions } from "@/lib/domain/model";
import {
  createCommitStore,
  type CommitStore,
} from "@/lib/domain/store";
import type { ExplainApiResponse } from "@/lib/domain/types";

let testStore: CommitStore;

vi.mock("@/lib/server/commit-store-singleton", () => ({
  getCommitStore: () => testStore,
}));

async function loadPost() {
  const { POST } = await import("./route");
  return POST;
}

describe("POST /api/explain", () => {
  beforeEach(() => {
    testStore = createCommitStore();
  });

  it("returns explanation for ARR when upstream assumptions differ", async () => {
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
      a.key === "conversion_rate" ? { ...a, value: 0.05 } : a,
    );
    const newer = await testStore.createCommit({
      message: "newer",
      snapshot: {
        assumptions: newerAssumptions,
        outputs: calculateOutputs(newerAssumptions),
      },
    });

    const req = new Request("http://localhost/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitIdA: newer.id,
        commitIdB: older.id,
        metricKey: "arr",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ExplainApiResponse;

    const olderVal = older.snapshot.outputs.find((o) => o.key === "arr")!.value;
    const newerVal = newer.snapshot.outputs.find((o) => o.key === "arr")!.value;
    const [sortedOlder, sortedNewer] = [older, newer].slice().sort((x, y) => {
      const t = x.createdAt.localeCompare(y.createdAt);
      if (t !== 0) return t;
      return x.id.localeCompare(y.id);
    });

    expect(body.previous.id).toBe(sortedOlder.id);
    expect(body.next.id).toBe(sortedNewer.id);
    expect(body.previousValue).toBe(
      sortedOlder.snapshot.outputs.find((o) => o.key === "arr")!.value,
    );
    expect(body.nextValue).toBe(
      sortedNewer.snapshot.outputs.find((o) => o.key === "arr")!.value,
    );
    expect(body.explanation).toEqual(
      explainMetricChange({
        metricKey: "arr",
        previous: sortedOlder.snapshot,
        next: sortedNewer.snapshot,
      }),
    );
    expect(olderVal).not.toBe(newerVal);
  });

  it("returns 400 when metric unchanged between commits", async () => {
    const POST = await loadPost();
    const base = createSeedAssumptions();
    const snap = {
      assumptions: base,
      outputs: calculateOutputs(base),
    };
    const a = await testStore.createCommit({ message: "a", snapshot: snap });
    const b = await testStore.createCommit({ message: "b", snapshot: snap });
    const req = new Request("http://localhost/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitIdA: a.id,
        commitIdB: b.id,
        metricKey: "arr",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
