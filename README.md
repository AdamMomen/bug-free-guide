# Finance Memory For Reasoning

**Financial models should accumulate institutional knowledge—not reset every planning cycle.**

This repository anchors a working slice of that idea: a model where assumptions, outputs, and the **reasoning behind the numbers** stay connected as conditions change.

---

## Why the problem is strategic, not cosmetic

Every time market conditions shift, a new segment opens, pricing moves, or a planning cycle restarts, many teams still **rebuild the model from scratch**. By the time the spreadsheet is finished, the world has moved again—and the **context** that shaped the last version (trade-offs, judgment calls, narrative behind each line) rarely survives. It lives in someone’s head or deep in “version fourteen” of a file nobody trusts.

That is not just inefficient. It is **structural**: without a durable link between figures and the assumptions and decisions that produced them, leadership and boards see outputs that are hard to defend, and advanced tooling—including AI—has **nothing coherent to reason over**. Speed without context does not produce better judgment.

## What “good” looks like at the architecture level

The direction this work supports is two layers, treated as one system:

1. **A rigorous calculation layer** — Deterministic relationships from assumptions to metrics, so scenarios and sensitivities are reproducible and comparable.
2. **A semantic memory layer** — Versions, provenance, and explanation: what changed, between **which** states, and **why** a downstream metric moved in terms of upstream assumptions and stated rationale.

Together, that is how a model becomes **an accumulating record** rather than a disposable artifact—closer to *the last financial model a company will ever need*, extended and questioned over time instead of thrown away each quarter.

## What you can explore in this prototype

The app in this repo is intentionally compact: a funnel-style assumption set, immediate derived metrics, **named snapshots**, **compare any two versions**, and **causal drill-down** on a metric (dependency path, changed assumptions, rationales). It is a concrete reference implementation for technical and product conversations about traceability, versioning, and explainability—not a claim of full enterprise scope.

**[Technical reference →](./docs/technical-reference.md)** — Setup, Docker, API, guided tour behavior, and stack for engineers and operators.

---

*Galdera* (Basque: “question”) names the broader bet: finance that stays queryable, scenario-rich, and **grounded in memory**. This repo is one place to ask how that behaves in software.
