import { NextResponse } from "next/server";
import { flattenError } from "zod";

import { calculateOutputs } from "@/lib/domain/calc";
import { commitRequestSchema } from "@/lib/domain/schema";
import { getCommitStore } from "@/lib/server/commit-store-singleton";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = commitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: flattenError(parsed.error),
      },
      { status: 400 },
    );
  }

  const { message, assumptions } = parsed.data;
  const snapshot = {
    assumptions,
    outputs: calculateOutputs(assumptions),
  };

  const commit = await getCommitStore().createCommit({ message, snapshot });
  return NextResponse.json(commit);
}
