import { NextResponse } from "next/server";
import { flattenError } from "zod";

import { explainMetricChange } from "@/lib/domain/explain";
import { explainRequestSchema } from "@/lib/domain/schema";
import type { ExplainApiResponse } from "@/lib/domain/types";
import { getCommitStore } from "@/lib/server/commit-store-singleton";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = explainRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: flattenError(parsed.error),
      },
      { status: 400 },
    );
  }

  const { commitIdA, commitIdB, metricKey } = parsed.data;
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

  const prevVal = older.snapshot.outputs.find((o) => o.key === metricKey)?.value;
  const nextVal = newer.snapshot.outputs.find((o) => o.key === metricKey)?.value;
  if (prevVal === undefined || nextVal === undefined) {
    return NextResponse.json(
      { error: "Metric not found in commit snapshots" },
      { status: 400 },
    );
  }

  const explanation = explainMetricChange({
    metricKey,
    previous: older.snapshot,
    next: newer.snapshot,
  });

  if (!explanation) {
    return NextResponse.json(
      {
        error: "This metric did not change between the two selected versions",
      },
      { status: 400 },
    );
  }

  const payload: ExplainApiResponse = {
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
    metricKey,
    previousValue: prevVal,
    nextValue: nextVal,
    explanation,
  };

  return NextResponse.json(payload);
}
