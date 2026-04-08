import { join } from "node:path";

import {
  createCommitStore,
  DEFAULT_COMMITS_RELATIVE_PATH,
  type CommitStore,
} from "@/lib/domain/store";

let instance: CommitStore | null = null;

/** Single file-backed store for API routes (lazy, cwd-relative). */
export function getCommitStore(): CommitStore {
  if (!instance) {
    instance = createCommitStore({
      filePath: join(
        /* turbopackIgnore: true */
        process.cwd(),
        DEFAULT_COMMITS_RELATIVE_PATH,
      ),
    });
  }
  return instance;
}
