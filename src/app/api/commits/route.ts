import { NextResponse } from "next/server";

import { getCommitStore } from "@/lib/server/commit-store-singleton";

export async function GET() {
  const commits = await getCommitStore().listCommits();
  return NextResponse.json(commits);
}
