import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { calculateOutputs } from "@/lib/domain/calc";
import { createSeedAssumptions } from "@/lib/domain/model";
import { createCommitStore } from "@/lib/domain/store";
import type { ModelSnapshot } from "@/lib/domain/types";

function seedSnapshot(): ModelSnapshot {
  const assumptions = createSeedAssumptions();
  return {
    assumptions,
    outputs: calculateOutputs(assumptions),
  };
}

describe("createCommitStore (memory)", () => {
  it("createCommit persists snapshot and returns immutable clone", async () => {
    const store = createCommitStore();
    const snap = seedSnapshot();
    const created = await store.createCommit({
      message: "v1",
      snapshot: snap,
    });

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(created.message).toBe("v1");
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(created.snapshot.outputs).toEqual(snap.outputs);

    created.snapshot.assumptions[0]!.value = 999;
    const again = await store.getCommitById(created.id);
    expect(again?.snapshot.assumptions[0]?.value).toBe(snap.assumptions[0]!.value);
  });

  it("getCommitById returns null for unknown id", async () => {
    const store = createCommitStore();
    expect(await store.getCommitById("missing")).toBeNull();
  });

  it("listCommits is newest first", async () => {
    const store = createCommitStore();
    const a = await store.createCommit({
      message: "first",
      snapshot: seedSnapshot(),
    });
    const b = await store.createCommit({
      message: "second",
      snapshot: seedSnapshot(),
    });
    const list = await store.listCommits();
    expect(list.map((c) => c.message)).toEqual(["second", "first"]);
    expect(list[0]!.id).toBe(b.id);
    expect(list[1]!.id).toBe(a.id);
  });
});

describe("createCommitStore (file)", () => {
  let dir: string;
  let filePath: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "fmgit-store-"));
    filePath = join(dir, "commits.json");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("write/read roundtrip across store instances", async () => {
    const s1 = createCommitStore({ filePath });
    const snap = seedSnapshot();
    const c = await s1.createCommit({ message: "persisted", snapshot: snap });

    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("persisted");
    expect(raw).toContain(c.id);

    const s2 = createCommitStore({ filePath });
    const list = await s2.listCommits();
    expect(list).toHaveLength(1);
    expect(list[0]!.message).toBe("persisted");
    expect(list[0]!.snapshot.outputs).toEqual(snap.outputs);
  });
});

describe("id generation", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "fixed-id-for-test"),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses crypto.randomUUID", async () => {
    const store = createCommitStore();
    const c = await store.createCommit({
      message: "m",
      snapshot: seedSnapshot(),
    });
    expect(c.id).toBe("fixed-id-for-test");
  });
});
