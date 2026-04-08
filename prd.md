# Finance Memory Git — MVP PRD (One Pager)

## 1. Goal
Build a minimal prototype that proves:
- financial assumptions are first-class
- model changes are versioned
- output changes are explainable

Core question:
👉 “Why did ARR change?”

---

## 2. Core Flow
1. Edit assumptions  
2. Outputs update (deterministic)  
3. Save new version  
4. Compare with previous  
5. Click metric → see why it changed  

---

## 3. Scope (MVP Only)

### In scope
- 5–7 assumptions (editable + rationale)
- 3–5 outputs (ARR, MRR, burn, runway)
- deterministic calculation
- version (commit)
- semantic diff
- explain-why view

### Out of scope
- generic formula engine
- spreadsheet import
- multi-user / collaboration
- advanced graphs / DAG
- AI-driven calculations

---

## 4. Data Model (Minimal)

### Assumption
- key
- value
- rationale

### Outputs (hardcoded)
- customers → MRR → ARR
- burn → runway

### Commit
- message
- timestamp
- snapshot (assumptions + outputs)

---

## 5. Calculation
Hardcoded chain:
conversion → customers → MRR → ARR  
burn → runway  

Deterministic only (no LLM).

---

## 6. Diff (Semantic)
Compare two versions:
- changed assumptions (old → new)
- changed outputs (delta + direction)

Example:
- conversion: 4.2% → 3.7%
- ARR: -8.1%

---

## 7. Explain-Why (Core Feature)

For a metric (e.g. ARR):
- old vs new value
- changed assumptions
- reasoning chain:
  conversion ↓ → customers ↓ → MRR ↓ → ARR ↓
- rationale text

Must be:
- structured
- traceable
- deterministic

---

## 8. UI (Minimal)

### Screen 1 — Assumptions + Outputs
- edit assumptions
- see outputs update
- save version

### Screen 2 — History + Diff
- list versions
- compare two versions
- view changes

### Right Panel — Explain
- why metric changed
- drivers + reasoning + rationale

---

## 9. Acceptance Criteria
- user edits assumptions
- outputs update correctly
- user saves version
- diff shows meaningful changes
- clicking ARR clearly explains change

---

## 10. Execution Plan

### Phase 1
- assumptions + outputs + calc

### Phase 2
- commit + snapshot + history

### Phase 3
- diff + explain-why

---

## 11. Positioning
Git for financial models, with reasoning behind every number.