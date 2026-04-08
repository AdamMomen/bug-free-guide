import { NextResponse } from "next/server";
import { flattenError } from "zod";

import { buildDiffResult } from "@/lib/domain/diff";
import { compareRequestSchema } from "@/lib/domain/schema";
import type { CompareApiResponse } from "@/lib/domain/types";
import { getCommitStore } from "@/lib/server/commit-store-singleton";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = compareRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: flattenError(parsed.error),
      },
      { status: 400 },
    );
  }

  const { commitIdA, commitIdB } = parsed.data;
  if (commitIdA === commitIdB) {
    return NextResponse.json(
      { error: "Choose two different commits" },
      { status: 400 },
    );
  }

  const store = getCommitStore();
  const [a, b] = await Promise.all([
    store.getCommitById(commitIdA),
    store.getCommitById(commitIdB),
  ]);

  if (!a || !b) {
    return NextResponse.json({ error: "Commit not found" }, { status: 404 });
  }

  const [older, newer] = [a, b].slice().sort((x, y) => {
    const t = x.createdAt.localeCompare(y.createdAt);
    if (t !== 0) return t;
    return x.id.localeCompare(y.id);
  });

  const payload: CompareApiResponse = {
    previous: {
      id: older.id,
      message: older.message,
      createdAt: older.createdAt,
    },
    next: {
      id: newer.id,
      message: newer.message,
      createdAt: newer.createdAt,
    },
    diff: buildDiffResult(older.snapshot, newer.snapshot),
  };

  return NextResponse.json(payload);
}
