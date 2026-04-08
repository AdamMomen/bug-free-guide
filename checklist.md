# Finance Memory Git — Step-by-Step Build + Verification Routine

## 0. Principles
- [x] Next.js is already set up
- [x] Tailwind CSS is already set up
- [x] Use **pnpm** for all package management and scripts
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
- [ ] `app/page.tsx`
- [ ] `app/api/commit/route.ts`
- [ ] optional modal/component file

### Tasks
- [ ] add save version button
- [ ] add commit message input/modal
- [ ] send assumptions to API
- [ ] server recomputes outputs
- [ ] server persists full snapshot
- [ ] UI refreshes commit list

### Verification
- [ ] inspect route and UI files
- [ ] run `pnpm test`
- [ ] manual browser verification with `pnpm dev`:
  - [ ] click save
  - [ ] enter message
  - [ ] commit stored
  - [ ] commit visible in history

### Tests
- [ ] API route test if practical
- [ ] integration test for commit creation optional
- [ ] manual verification required

### Done when
- [ ] commit can be created from UI
- [ ] persisted data verified
- [ ] `pnpm typecheck` passes
- [ ] tests pass where applicable

---

## Step 8 — Build commit history view
### Goal
Render ordered version history from stored commits.

### Files
- [ ] `components/history-list.tsx`
- [ ] `app/history/page.tsx` or section in main page

### Tasks
- [ ] fetch commits
- [ ] render newest first
- [ ] display message + timestamp
- [ ] allow selecting 2 commits for compare

### Verification
- [ ] inspect files
- [ ] run `pnpm typecheck`
- [ ] run `pnpm test`
- [ ] manual browser verification:
  - [ ] commit list renders
  - [ ] order is correct
  - [ ] user can select versions

### Tests
- [ ] history list component test optional
- [ ] store tests already support data validity

### Done when
- [ ] history visible and selectable
- [ ] manual verification complete
- [ ] `pnpm typecheck` passes

---

## Step 9 — Build semantic diff engine
### Goal
Compare two snapshots by business meaning, not raw JSON.

### Files
- [ ] `lib/domain/diff.ts`

### Tasks
- [ ] implement `diffAssumptions`
- [ ] implement `diffMetrics`
- [ ] implement `buildDiffResult`
- [ ] compare by stable key
- [ ] ignore unchanged rows
- [ ] compute deltas and direction
- [ ] distinguish rationale-only changes if needed

### Verification
- [ ] inspect diff functions
- [ ] run `pnpm test`
- [ ] run `pnpm typecheck`

### Tests
- [ ] `diff.test.ts`
  - [ ] changed assumptions detected
  - [ ] unchanged assumptions ignored
  - [ ] output metric deltas correct
  - [ ] direction labels correct

### Done when
- [ ] diff tests pass
- [ ] code reviewed
- [ ] `pnpm typecheck` passes

---

## Step 10 — Add compare API + compare UI
### Goal
User can compare two selected versions and see semantic diff.

### Files
- [ ] `app/api/compare/route.ts`
- [ ] `components/diff-panel.tsx`

### Tasks
- [ ] create compare endpoint
- [ ] load 2 commits
- [ ] call diff engine
- [ ] render changed assumptions
- [ ] render changed outputs
- [ ] render deltas in readable way

### Verification
- [ ] inspect route/component files
- [ ] run `pnpm test`
- [ ] manual browser verification:
  - [ ] select 2 commits
  - [ ] compare works
  - [ ] assumptions changes visible
  - [ ] output deltas visible

### Tests
- [ ] API compare test optional
- [ ] diff engine tests required
- [ ] manual verification required

### Done when
- [ ] semantic diff visible in UI
- [ ] output matches expected changes
- [ ] `pnpm typecheck` passes
- [ ] tests pass

---

## Step 11 — Build static dependency map
### Goal
Encode causal paths from assumptions to metrics.

### Files
- [ ] `lib/domain/explain.ts` or separate `lib/domain/deps.ts`

### Tasks
- [ ] hardcode dependency map:
  - [ ] `conversion_rate -> customers`
  - [ ] `launch_month_offset -> customers`
  - [ ] `monthly_traffic -> customers`
  - [ ] `customers -> mrr`
  - [ ] `arpu -> mrr`
  - [ ] `mrr -> arr`
  - [ ] `monthly_burn -> runway`
  - [ ] `starting_cash -> runway`

### Verification
- [ ] inspect dependency map file
- [ ] run `pnpm typecheck`
- [ ] add unit test for expected edges

### Tests
- [ ] `deps.test.ts`
  - [ ] expected relationships present
  - [ ] no missing path to ARR

### Done when
- [ ] tests pass
- [ ] map reviewed
- [ ] `pnpm typecheck` passes

---

## Step 12 — Build explanation engine
### Goal
Given two commits and a metric, explain why it changed.

### Files
- [ ] `lib/domain/explain.ts`

### Tasks
- [ ] implement `explainMetricChange`
- [ ] identify changed assumptions
- [ ] filter upstream assumptions only
- [ ] build propagation path
- [ ] include rationales
- [ ] support ARR first; runway second if time

### Verification
- [ ] inspect explain logic
- [ ] run `pnpm test`
- [ ] run `pnpm typecheck`

### Tests
- [ ] `explain.test.ts`
  - [ ] ARR explanation includes conversion when changed
  - [ ] ARR explanation excludes unrelated burn
  - [ ] propagation path is ordered correctly
  - [ ] rationale included

### Done when
- [ ] explanation tests pass
- [ ] code reviewed
- [ ] `pnpm typecheck` passes

---

## Step 13 — Add explain API + metric drilldown UI
### Goal
User clicks ARR and sees clear explanation.

### Files
- [ ] `app/api/explain/route.ts`
- [ ] `components/explain-panel.tsx`
- [ ] diff UI integration

### Tasks
- [ ] add click action from metric diff row
- [ ] fetch explanation
- [ ] render:
  - [ ] old value
  - [ ] new value
  - [ ] changed assumptions
  - [ ] propagation path
  - [ ] rationale text

### Verification
- [ ] inspect route/component files
- [ ] run `pnpm test`
- [ ] manual browser verification:
  - [ ] click ARR
  - [ ] explanation opens
  - [ ] upstream assumptions shown correctly
  - [ ] rationale visible
  - [ ] unrelated assumptions excluded

### Tests
- [ ] explain engine tests required
- [ ] manual verification required

### Done when
- [ ] UI answers “Why did ARR change?”
- [ ] explanation behavior verified
- [ ] `pnpm typecheck` passes
- [ ] tests pass

---

## Step 14 — Regression pass after each major feature
### Goal
Make testing routine and cumulative.

### After every completed step, run:
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] manual browser check for affected flow
- [ ] inspect changed files

### Regression routine
- [ ] Step 3 completed → rerun Step 2 relevant checks
- [ ] Step 7 completed → rerun calc + store + UI checks
- [ ] Step 10 completed → rerun commit + history + diff checks
- [ ] Step 13 completed → rerun full end-to-end flow

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
- [ ] full regression pass

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