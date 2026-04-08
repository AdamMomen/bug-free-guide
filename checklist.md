# Finance Memory Git — Step-by-Step Build + Verification Routine

## 0. Principles
- [x] Next.js is already set up
- [x] Tailwind CSS is already set up
- [x] Use **pnpm** for all package management and scripts
- [x] Client-side **network calls** use **SWR** (`useSWR` / `useSWRMutation`); show **skeleton** UI while the initial load has no data
- [ ] Every step must end with **verification**
- [ ] No feature is considered done until:
  - [ ] implementation is complete
  - [ ] test passes, or
  - [ ] file/manual verification is completed and recorded
- [ ] Testing is the default validation path
- [ ] If automated test is not yet practical, do:
  - [ ] file check
  - [ ] type check
  - [ ] manual runtime verification
- [ ] After each feature:
  - [ ] run tests
  - [ ] inspect affected files
  - [ ] verify UI or API behavior
  - [ ] only then move on

---

## 1. Required pnpm Commands
### Baseline verification commands
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm dev`

### Recommended package installs
- [x] `pnpm add zod`
- [x] `pnpm add swr`
- [x] `pnpm add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/node`

### Required `package.json` scripts
- [x] `"dev": "next dev"`
- [x] `"build": "next build"`
- [x] `"start": "next start"`
- [x] `"lint": "eslint ."` (Next.js 16+ — use ESLint CLI; `next lint` removed)
- [x] `"typecheck": "tsc --noEmit"`
- [x] `"test": "vitest run"`
- [x] `"test:watch": "vitest"`
- [ ] `"test:ui": "vitest --ui"` optional

---

## 2. Definition of Verification
A step is only marked complete if all are true:
- [ ] code added
- [ ] affected files reviewed
- [ ] `pnpm typecheck` passes
- [ ] relevant tests pass with `pnpm test`
- [ ] runtime behavior verified if UI/API involved

---

# Build Sequence

## Step 1 — Create domain type definitions
### Goal
Define exact TypeScript types for assumptions, outputs, commits, diffs, explanations.

### Files
- [x] `src/lib/domain/types.ts` (app uses `src/` + `@/*` path alias)

### Tasks
- [x] define `Assumption`
- [x] define `OutputMetric`
- [x] define `ModelSnapshot`
- [x] define `Commit`
- [x] define `AssumptionChange`
- [x] define `MetricChange`
- [x] define `DiffResult`
- [x] define `ExplanationResult` (also `MetricTrend`, `ExplanationAssumptionRef`)

### Verification
- [x] inspect `src/lib/domain/types.ts`
- [x] run `pnpm typecheck`
- [x] add minimal type import smoke test if useful

### Done when
- [x] types compile with no TS errors
- [x] file reviewed manually

---

## Step 2 — Seed hardcoded model assumptions
### Goal
Create a static seed model with realistic default assumptions.

### Files
- [x] `src/lib/domain/model.ts`

### Tasks
- [x] define seed assumptions:
  - [x] `conversion_rate`
  - [x] `launch_month_offset`
  - [x] `monthly_traffic`
  - [x] `arpu`
  - [x] `monthly_burn`
  - [x] `starting_cash`
- [x] export helper to return initial assumptions

### Verification
- [x] inspect file
- [x] run `pnpm typecheck`
- [x] add unit test asserting seed assumptions shape

### Tests
- [x] `model.test.ts`
  - [x] seed returns expected keys
  - [x] seed values are valid

### Done when
- [x] `pnpm test` passes
- [x] file reviewed
- [x] `pnpm typecheck` passes

---

## Step 3 — Build deterministic calculation engine
### Goal
Implement pure functions for customers, MRR, ARR, runway.

### Files
- [x] `src/lib/domain/calc.ts`

### Tasks
- [x] implement `calculateCustomers`
- [x] implement `calculateMRR`
- [x] implement `calculateARR`
- [x] implement `calculateRunway`
- [x] implement `calculateOutputs`

### Formula targets
- [x] `customers = monthly_traffic * conversion_rate * launchFactor`
- [x] `mrr = customers * arpu`
- [x] `arr = mrr * 12`
- [x] `runway = starting_cash / monthly_burn`

### Verification
- [x] inspect formulas in file
- [x] run `pnpm typecheck`
- [x] run `pnpm test`

### Tests
- [x] `calc.test.ts`
  - [x] customers formula works
  - [x] MRR formula works
  - [x] ARR formula works
  - [x] runway formula works
  - [x] same inputs produce same outputs

### Done when
- [x] all calc tests pass
- [x] formulas reviewed manually
- [x] `pnpm typecheck` passes

**Notes:** `launchFactor` from `calculateLaunchFactor`: `1` when `launch_month_offset <= 0` (live), `0` when `> 0` (prelaunch). `runway` is `Infinity` if `monthly_burn === 0`, `NaN` if burn `< 0`. `calculateOutputs` also echoes `monthly_burn` for UI parity.

---

## Step 4 — Build minimal assumptions + outputs UI
### Goal
Render assumptions and computed outputs on screen.

### Files
- [x] `src/app/page.tsx`
- [x] `src/components/assumptions-table.tsx`
- [x] `src/components/output-cards.tsx`

### Tasks
- [x] render assumptions table
- [x] render output metric cards
- [x] wire assumptions to local draft state
- [x] recompute outputs on edit
- [x] show unsaved-change indicator

### Verification
- [x] inspect component files
- [x] run `pnpm typecheck`
- [x] run `pnpm test`
- [ ] manual browser verification with `pnpm dev`:
  - [ ] page loads
  - [ ] assumptions display
  - [ ] output cards display
  - [ ] editing assumption updates outputs

### Tests
- [ ] component smoke test optional
- [ ] manual verification required

### Done when
- [ ] browser behavior verified
- [x] `pnpm typecheck` passes
- [x] affected files reviewed

**Notes:** Page includes **Save baseline** / **Revert to baseline** so the unsaved pill has a clear meaning. On Apple Silicon + pnpm, `@tailwindcss/oxide-darwin-arm64` may be required for `pnpm build` if optional deps did not link.

---

## Step 5 — Add validation layer
### Goal
Validate assumptions and commit payloads early.

### Files
- [x] `src/lib/domain/schema.ts`
- [ ] API route files later

### Tasks
- [x] add Zod schema for assumptions
- [x] add Zod schema for commit request
- [x] validate:
  - [x] percentage range
  - [x] positive burn
  - [x] non-empty rationale
  - [x] valid keys only

### Verification
- [x] inspect schema file
- [x] run `pnpm test`
- [x] run `pnpm typecheck`

### Tests
- [x] `schema.test.ts`
  - [x] valid payload accepted
  - [x] invalid conversion rejected
  - [x] missing rationale rejected

### Done when
- [x] tests pass
- [x] schema file reviewed
- [x] `pnpm typecheck` passes

**Notes:** `conversion_rate` is `(0, 1)`. `monthly_burn` must be **> 0** (stricter than calc’s `0` → ∞ runway). Bundle must have exactly six rows, one per `SEED_ASSUMPTION_KEYS`. `commitRequestSchema` is ready for Step 7 `POST /api/commit`.

---

## Step 6 — Build in-memory or JSON-backed commit store
### Goal
Persist full snapshots for version history.

### Files
- [x] `src/lib/domain/store.ts`
- [x] `data/commits.json` (seed empty `commits` array)

### Tasks
- [x] implement `listCommits`
- [x] implement `createCommit`
- [x] implement `getCommitById`
- [x] store full snapshot
- [x] use immutable commit records
- [x] generate commit IDs
- [x] add timestamps

### Verification
- [x] inspect store file
- [x] test write/read roundtrip
- [x] if file-backed, inspect JSON file contents manually
- [x] run `pnpm typecheck`

### Tests
- [x] `store.test.ts`
  - [x] commit creation persists snapshot
  - [x] commit retrieval works
  - [x] list ordering works

### Done when
- [x] `pnpm test` passes
- [x] stored snapshots inspected
- [x] `pnpm typecheck` passes

**Notes:** `createCommitStore({ filePath })` uses `data/commits.json` shape `{ "commits": Commit[] }` (disk order oldest → newest; `listCommits` returns newest first). In-memory: `createCommitStore()`. Use `path.join(process.cwd(), DEFAULT_COMMITS_RELATIVE_PATH)` on the server (Step 7).

---

## Step 7 — Add commit creation flow in UI
### Goal
User can save current draft as a new version.

### Files
- [x] `src/app/page.tsx`
- [x] `src/app/api/commit/route.ts`
- [x] `src/app/api/commits/route.ts` (list for refresh)
- [x] `src/components/versioning-panel.tsx`
- [x] `src/lib/server/commit-store-singleton.ts`

### Tasks
- [x] add save version button
- [x] add commit message input/modal
- [x] send assumptions to API (via **`useSWRMutation`**)
- [x] server recomputes outputs
- [x] server persists full snapshot
- [x] UI refreshes commit list (`mutate()` on `/api/commits` after successful save)

### Verification
- [x] inspect route and UI files
- [x] run `pnpm test`
- [x] manual browser verification with `pnpm dev`:
  - [x] click save
  - [x] enter message
  - [x] commit stored
  - [x] commit visible in history

### Tests
- [x] `src/app/api/commit/route.test.ts` (POST success, invalid JSON, validation 400)
- [x] integration test for commit creation optional → covered by route test + `store.test.ts` file roundtrip
- [x] manual verification required

### Done when
- [x] commit can be created from UI
- [x] persisted data verified (file-backed `store.test.ts` + route persists full snapshot)
- [x] `pnpm typecheck` passes
- [x] tests pass where applicable

**Notes:** `POST /api/commit` validates with `commitRequestSchema`, runs `calculateOutputs`, appends via file-backed `getCommitStore()`. `process.cwd()` join uses `/* turbopackIgnore: true */` for clean `pnpm build`. Invalid assumptions return **400** with flattened Zod issues (shown in UI).

---

## Step 8 — Build commit history view
### Goal
Render ordered version history from stored commits.

### Files
- [x] `src/components/history-list.tsx`
- [x] section in main page (`VersioningPanel` on `src/app/page.tsx`; optional `/history` route deferred)

### Tasks
- [x] load commits with **`useSWR`**; **skeleton** list while `isLoading` / no data
- [x] render newest first
- [x] display message + timestamp
- [x] allow selecting 2 commits for compare

### Verification
- [x] inspect files
- [x] run `pnpm typecheck`
- [x] run `pnpm test`
- [x] manual browser verification:
  - [x] commit list renders
  - [x] order is correct
  - [x] user can select versions

### Tests
- [x] `src/lib/compare-selection.test.ts` (selection toggle / cap behavior)
- [x] store tests already support data validity

### Done when
- [x] history visible and selectable
- [x] manual verification complete
- [x] `pnpm typecheck` passes

---

## Step 9 — Build semantic diff engine
### Goal
Compare two snapshots by business meaning, not raw JSON.

### Files
- [x] `src/lib/domain/diff.ts`

### Tasks
- [x] implement `diffAssumptions`
- [x] implement `diffMetrics`
- [x] implement `buildDiffResult`
- [x] compare by stable key
- [x] ignore unchanged rows
- [x] compute deltas and direction
- [x] rationale-only assumption edits ignored (values unchanged); numeric diff only

### Verification
- [x] inspect diff functions
- [x] run `pnpm test`
- [x] run `pnpm typecheck`

### Tests
- [x] `src/lib/domain/diff.test.ts`
  - [x] changed assumptions detected
  - [x] unchanged assumptions ignored
  - [x] output metric deltas correct
  - [x] direction labels correct

### Done when
- [x] diff tests pass
- [x] code reviewed
- [x] `pnpm typecheck` passes

---

## Step 10 — Add compare API + compare UI
### Goal
User can compare two selected versions and see semantic diff.

### Files
- [x] `src/app/api/compare/route.ts`
- [x] `src/components/diff-panel.tsx` (wired from `src/components/versioning-panel.tsx`)

### Tasks
- [x] create compare endpoint
- [x] load 2 commits
- [x] call diff engine
- [x] render changed assumptions
- [x] render changed outputs
- [x] render deltas in readable way

### Verification
- [x] inspect route/component files
- [x] run `pnpm test`
- [x] manual browser verification (`pnpm dev`, http://localhost:3000):
  - [x] select 2 commits
  - [x] compare works
  - [x] assumptions changes visible
  - [x] output deltas visible

### Tests
- [x] `src/app/api/compare/route.test.ts`
- [x] diff engine tests required (`diff.test.ts`)
- [x] manual verification required

### Done when
- [x] semantic diff visible in UI (confirm in browser)
- [x] output matches expected changes (route test + diff tests)
- [x] `pnpm typecheck` passes
- [x] tests pass

---

## Step 11 — Build static dependency map
### Goal
Encode causal paths from assumptions to metrics.

### Files
- [x] `src/lib/domain/deps.ts` (Step 12 will add `explain.ts`)

### Tasks
- [x] hardcode dependency map:
  - [x] `conversion_rate -> customers`
  - [x] `launch_month_offset -> customers`
  - [x] `monthly_traffic -> customers`
  - [x] `customers -> mrr`
  - [x] `arpu -> mrr`
  - [x] `mrr -> arr`
  - [x] `monthly_burn -> runway`
  - [x] `starting_cash -> runway`

### Verification
- [x] inspect dependency map file
- [x] run `pnpm typecheck`
- [x] add unit test for expected edges

### Tests
- [x] `src/lib/domain/deps.test.ts`
  - [x] expected relationships present
  - [x] no missing path to ARR

### Done when
- [x] tests pass
- [x] map reviewed
- [x] `pnpm typecheck` passes

---

## Step 12 — Build explanation engine
### Goal
Given two commits and a metric, explain why it changed.

### Files
- [x] `src/lib/domain/explain.ts`

### Tasks
- [x] implement `explainMetricChange`
- [x] identify changed assumptions
- [x] filter upstream assumptions only
- [x] build propagation path
- [x] include rationales (from newer snapshot rows)
- [x] support ARR first; runway covered in tests

### Verification
- [x] inspect explain logic
- [x] run `pnpm test`
- [x] run `pnpm typecheck`

### Tests
- [x] `src/lib/domain/explain.test.ts`
  - [x] ARR explanation includes conversion when changed
  - [x] ARR explanation excludes unrelated burn
  - [x] propagation path is ordered correctly
  - [x] rationale included

### Done when
- [x] explanation tests pass
- [x] code reviewed
- [x] `pnpm typecheck` passes

---

## Step 13 — Add explain API + metric drilldown UI
### Goal
User clicks ARR and sees clear explanation.

### Files
- [x] `src/app/api/explain/route.ts`
- [x] `src/components/explain-panel.tsx`
- [x] diff UI integration (`diff-panel` + `versioning-panel`)

### Tasks
- [x] add click action from metric diff row
- [x] fetch explanation (**`useSWR`** with keyed `POST /api/explain`; **`ExplainPanelSkeleton`** while loading)
- [x] render:
  - [x] old value
  - [x] new value
  - [x] changed assumptions (upstream-only list)
  - [x] propagation path
  - [x] rationale text

### Verification
- [x] inspect route/component files
- [x] run `pnpm test`
- [x] manual browser verification (http://localhost:3000):
  - [x] click ARR
  - [x] explanation opens
  - [x] upstream assumptions shown correctly
  - [x] rationale visible
  - [x] unrelated assumptions excluded

### Tests
- [x] `explain` engine tests (`explain.test.ts`) + `src/app/api/explain/route.test.ts`
- [x] manual verification required

### Done when
- [x] UI answers “Why did ARR change?” (after manual click-through)
- [x] explanation behavior verified in browser
- [x] `pnpm typecheck` passes
- [x] tests pass

---

## Step 14 — Regression pass after each major feature
### Goal
Make testing routine and cumulative.

### After every completed step, run:
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] manual browser check for affected flow
- [x] inspect changed files

### Regression routine
- [x] Step 3 completed → rerun Step 2 relevant checks
- [x] Step 7 completed → rerun calc + store + UI checks
- [x] Step 10 completed → rerun commit + history + diff checks
- [x] Step 13 completed → rerun full end-to-end flow

---

## Step 15 — End-to-end verification checklist
### Final happy path
- [ ] page loads
- [ ] assumptions render
- [ ] user edits `conversion_rate`
- [ ] outputs update immediately
- [ ] user edits `launch_month_offset`
- [ ] outputs update again
- [ ] user saves version with message
- [ ] history shows new version
- [ ] user compares previous vs latest
- [ ] diff shows changed assumptions
- [ ] diff shows ARR delta
- [ ] user clicks ARR
- [ ] explanation panel shows:
  - [ ] old ARR
  - [ ] new ARR
  - [ ] changed assumptions
  - [ ] propagation chain
  - [ ] rationale
- [ ] all tests pass
- [ ] files reviewed

---

## Step 16 — Status board
### Completed
- [x] Next.js setup
- [x] Tailwind CSS setup

### Pending
- [ ] pnpm scripts configured
- [ ] test runner configured
- [ ] domain types
- [ ] seed model
- [ ] calc engine
- [ ] assumptions UI
- [ ] validation
- [ ] commit store
- [ ] commit flow
- [ ] history view
- [ ] semantic diff
- [ ] compare UI
- [ ] dependency map
- [ ] explanation engine
- [ ] explain UI
- [x] full regression pass

---

## Step 17 — Rule for marking progress
- [ ] Never mark a feature complete immediately after coding
- [ ] Mark it complete only after:
  - [ ] code exists
  - [ ] tests pass
  - [ ] files reviewed
  - [ ] runtime verified where relevant

---

## Step 18 — North Star
- [ ] Testing is the source of truth
- [ ] File inspection is the backup
- [ ] Manual runtime verification is mandatory for UI
- [ ] Final product is only done when the full flow is verified end-to-end