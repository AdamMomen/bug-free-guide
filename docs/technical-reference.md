# Technical reference — Finance Memory For Reasoning

Engineering details for this repository: local development, containers, HTTP API, and stack. For strategy and problem framing, see the root [README.md](../README.md).

## What this codebase is

A **prototype web app** that exercises a small financial planning model: editable assumptions, deterministic outputs, **named versions**, **semantic diff** between any two versions, and **causal explanations** for why a metric changed (assumptions on the dependency path, propagation chain, rationales).

## Using the application

1. **Assumptions** — Change numeric inputs (traffic, conversion, ARPU, burn, cash, etc.). Outputs update as you type.
2. **Baseline** — The header pill shows whether the draft matches your saved baseline. **Save baseline** records the current draft as baseline; **Revert** reloads the last baseline into the form; **Reset to seed** restores factory defaults.
3. **Outputs** — Customers, MRR, ARR, burn, runway—derived from the current draft.
4. **Versions** — Enter a **version message** and **Save version** to persist the current draft (with computed outputs) on the server.
5. **Compare** — In the history list, select **two** versions, then **Compare selected versions**. You’ll see assumption diffs and metric deltas (older → newer).
6. **Why it changed** — In the diff, **click a metric row** (e.g. ARR). The explanation panel shows upstream assumption changes, the propagation path, and rationales.

**Guided tour** — In the header, **Guided tour** runs a step-by-step overlay (`data-tutorial` anchors). Some steps only highlight after you have run compare or opened an explanation.

## Development

Requires [pnpm](https://pnpm.io/) (see `packageManager` in `package.json`).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script           | Purpose                    |
| ---------------- | -------------------------- |
| `pnpm dev`       | Next.js dev server         |
| `pnpm build`     | Production build           |
| `pnpm start`     | Run production server       |
| `pnpm lint`      | ESLint                     |
| `pnpm typecheck` | TypeScript (`tsc --noEmit`) |
| `pnpm test`      | Vitest                     |

## Docker

Build and run (persist saved versions via a volume on `/app/data`):

```bash
docker build -t finance-memory-for-reasoning .
docker run --rm -p 3000:3000 -v fmr-data:/app/data finance-memory-for-reasoning
```

The image includes a `HEALTHCHECK` that probes `GET /api/health` (JSON `{"ok":true}`).

## HTTP API (JSON)

| Method / path       | Role                          |
| ------------------- | ----------------------------- |
| `GET /api/health`   | Liveness probe                |
| `GET /api/commits`  | List saved versions           |
| `POST /api/commit`  | Save a version                |
| `POST /api/compare` | Diff two stored versions      |
| `POST /api/explain` | Causal explanation for a metric |

## Stack

Next.js (App Router), React, Tailwind CSS v4, SWR, Zod, Vitest.

## Related internal docs

- [architecture.md](../architecture.md)
- [prd.md](../prd.md)
- [checklist.md](../checklist.md)
