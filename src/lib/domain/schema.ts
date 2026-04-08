import { z } from "zod";

import { SEED_ASSUMPTION_KEYS, type SeedAssumptionKey } from "@/lib/domain/model";
import type { Assumption } from "@/lib/domain/types";

const assumptionKeySchema = z.enum(SEED_ASSUMPTION_KEYS);

/**
 * One assumption row: allowed keys, finite numbers, non-empty rationale (trimmed).
 * Key-specific rules applied in `assumptionsBundleSchema`.
 */
export const assumptionRowSchema: z.ZodType<Assumption> = z
  .object({
    key: assumptionKeySchema,
    value: z.number().finite(),
    rationale: z.string(),
  })
  .superRefine((row, ctx) => {
    if (row.rationale.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Rationale must not be empty",
        path: ["rationale"],
      });
    }
  });

function assertKeyConstraints(
  row: { key: SeedAssumptionKey; value: number },
  ctx: z.RefinementCtx,
): void {
  const { key, value } = row;
  const path: (string | number)[] = ["value"];

  switch (key) {
    case "conversion_rate":
      if (value <= 0 || value >= 1) {
        ctx.addIssue({
          code: "custom",
          message: "Conversion rate must be between 0 and 1 (exclusive bounds)",
          path,
        });
      }
      break;
    case "launch_month_offset":
      if (!Number.isInteger(value) || value < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Launch month offset must be a non-negative integer",
          path,
        });
      }
      break;
    case "monthly_traffic":
      if (value <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Monthly traffic must be positive",
          path,
        });
      }
      break;
    case "arpu":
      if (value <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "ARPU must be positive",
          path,
        });
      }
      break;
    case "monthly_burn":
      if (value <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Monthly burn must be positive",
          path,
        });
      }
      break;
    case "starting_cash":
      if (value <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Starting cash must be positive",
          path,
        });
      }
      break;
  }
}

/**
 * Full assumption set: exactly one row per seed key, no extras, plus per-key value rules.
 */
export const assumptionsBundleSchema = z
  .array(assumptionRowSchema)
  .length(SEED_ASSUMPTION_KEYS.length)
  .superRefine((rows, ctx) => {
    const keys = rows.map((r) => r.key);
    const unique = new Set(keys);
    if (unique.size !== keys.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate assumption keys",
      });
    }
    for (const required of SEED_ASSUMPTION_KEYS) {
      if (!keys.includes(required)) {
        ctx.addIssue({
          code: "custom",
          message: `Missing assumption key: ${required}`,
        });
      }
    }
    for (const row of rows) {
      assertKeyConstraints(
        { key: row.key as SeedAssumptionKey, value: row.value },
        ctx,
      );
    }
  });

/** Body for `POST /api/commit` (Step 7): message + assumptions; server computes outputs. */
export const commitRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Commit message is required")
    .max(500, "Commit message too long"),
  assumptions: assumptionsBundleSchema,
});

export type CommitRequestInput = z.infer<typeof commitRequestSchema>;

/** Body for `POST /api/compare` (Step 10); order does not matter — server sorts by `createdAt`. */
export const compareRequestSchema = z.object({
  commitIdA: z.string().uuid(),
  commitIdB: z.string().uuid(),
});

export type CompareRequestInput = z.infer<typeof compareRequestSchema>;
