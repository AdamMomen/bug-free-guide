import { beforeEach, describe, expect, it, vi } from "vitest";

import { calculateOutputs } from "@/lib/domain/calc";
import { createSeedAssumptions } from "@/lib/domain/model";
import { createCommitStore, type CommitStore } from "@/lib/domain/store";

let testStore: CommitStore;

vi.mock("@/lib/server/commit-store-singleton", () => ({
  getCommitStore: () => testStore,
}));

async function loadPost() {
  const { POST } = await import("./route");
  return POST;
}

describe("POST /api/commit", () => {
  beforeEach(() => {
    testStore = createCommitStore();
  });

  it("creates a commit with computed outputs and returns 200", async () => {
    const POST = await loadPost();
    const assumptions = createSeedAssumptions();
    const req = new Request("http://localhost/api/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "integration test version",
        assumptions,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      id: string;
      message: string;
      createdAt: string;
      snapshot: { assumptions: unknown; outputs: unknown };
    };

    expect(body.message).toBe("integration test version");
    expect(body.snapshot.assumptions).toEqual(assumptions);
    expect(body.snapshot.outputs).toEqual(calculateOutputs(assumptions));

    const list = await testStore.listCommits();
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe(body.id);
  });

  it("returns 400 for invalid JSON", async () => {
    const POST = await loadPost();
    const req = new Request("http://localhost/api/commit", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe("Invalid JSON body");
  });

  it("returns 400 when validation fails", async () => {
    const POST = await loadPost();
    const bad = createSeedAssumptions().map((a) =>
      a.key === "conversion_rate" ? { ...a, value: 5 } : a,
    );
    const req = new Request("http://localhost/api/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "x", assumptions: bad }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe("Validation failed");
  });
});
