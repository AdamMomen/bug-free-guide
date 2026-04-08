# Finance Memory For Reasoning — Full Architecture (Mermaid + Checklist)

## Index
- **D1** — System architecture
- **D2** — Step-by-step build flow
- **D3** — Core domain model
- **D4** — Calculation dependency graph
- **D5** — Commit / snapshot lifecycle
- **D6** — Compare + diff flow
- **D7** — Explain-why flow
- **D8** — Verification / testing routine
- **D9** — UI interaction architecture
- **D10** — File/module architecture


# D1 — System Architecture

```mermaid
flowchart LR
    UI[Next.js UI<br/>React + Tailwind]
    API[Route Handlers<br/>/app/api/*]
    DOMAIN[Domain Layer<br/>calc diff explain]
    STORE[Store Layer<br/>JSON/In-memory]
    DATA[(commits.json)]

    UI --> API
    UI --> DOMAIN
    API --> DOMAIN
    API --> STORE
    STORE --> DATA
    DOMAIN --> STORE
````

---

# D2 — Step-by-Step Build Flow (with verification)

```mermaid
flowchart TD
    S1[Types] --> V1[Verify]
    V1 --> S2[Seed Model]
    S2 --> V2[Verify]
    V2 --> S3[Calc Engine]
    S3 --> V3[Verify]
    V3 --> S4[UI Assumptions + Outputs]
    S4 --> V4[Verify]
    V4 --> S5[Validation]
    S5 --> V5[Verify]
    V5 --> S6[Store]
    S6 --> V6[Verify]
    V6 --> S7[Commit Flow]
    S7 --> V7[Verify]
    V7 --> S8[History]
    S8 --> V8[Verify]
    V8 --> S9[Diff Engine]
    S9 --> V9[Verify]
    V9 --> S10[Compare UI]
    S10 --> V10[Verify]
    V10 --> S11[Dependency Map]
    S11 --> V11[Verify]
    V11 --> S12[Explain Engine]
    S12 --> V12[Verify]
    V12 --> S13[Explain UI]
    S13 --> V13[Verify End-to-End]
```

---

# D3 — Core Domain Model

```mermaid
classDiagram
    class Assumption {
      key
      value
      rationale
    }

    class OutputMetric {
      key
      value
    }

    class ModelSnapshot {
      assumptions[]
      outputs[]
    }

    class Commit {
      id
      message
      createdAt
      snapshot
    }

    class DiffResult {
      assumptionChanges[]
      metricChanges[]
    }

    class ExplanationResult {
      metricKey
      changedAssumptions[]
      propagationPath[]
      rationales[]
    }

    Commit --> ModelSnapshot
    ModelSnapshot --> Assumption
    ModelSnapshot --> OutputMetric
```

---

# D4 — Calculation Dependency Graph

```mermaid
flowchart TD
    conversion --> customers
    launch --> customers
    traffic --> customers

    customers --> mrr
    arpu --> mrr

    mrr --> arr

    burn --> runway
    cash --> runway
```

---

# D5 — Commit / Snapshot Lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant UI
    participant API
    participant CALC
    participant STORE

    U->>UI: Edit assumptions
    UI->>UI: Recompute outputs
    U->>UI: Save version
    UI->>API: POST /commit
    API->>CALC: calculateOutputs
    CALC-->>API: outputs
    API->>STORE: persist snapshot
    STORE-->>API: commit saved
    API-->>UI: response
```

---

# D6 — Compare + Diff Flow

```mermaid
sequenceDiagram
    participant UI
    participant API
    participant STORE
    participant DIFF

    UI->>API: GET /compare
    API->>STORE: load snapshots
    STORE-->>API: data
    API->>DIFF: compute diff
    DIFF-->>API: result
    API-->>UI: semantic diff
```

---

# D7 — Explain-Why Flow

```mermaid
sequenceDiagram
    participant UI
    participant API
    participant STORE
    participant EXPLAIN

    UI->>API: GET /explain?metric=arr
    API->>STORE: load snapshots
    STORE-->>API: data
    API->>EXPLAIN: explainMetricChange
    EXPLAIN-->>API: explanation
    API-->>UI: reasoning chain
```

---

# D8 — Verification / Testing Loop

```mermaid
flowchart TD
    CODE[Implement] --> TEST[pnpm test]
    TEST --> TYPE[pnpm typecheck]
    TYPE --> LINT[pnpm lint]
    LINT --> REVIEW[File Review]
    REVIEW --> MANUAL[Manual UI/API check]
    MANUAL --> OK{Pass?}

    OK -- Yes --> DONE
    OK -- No --> FIX --> TEST
```

---

# D9 — UI Interaction Architecture

```mermaid
flowchart LR
    A[Assumptions Table] --> B[Outputs]
    B --> C[Save Version]

    D[History] --> E[Select Versions]
    E --> F[Diff Panel]

    F --> G[Click ARR]
    G --> H[Explain Panel]
```

---

# D10 — File / Module Architecture

```mermaid
flowchart TD
    app --> page
    app --> api
    api --> commit
    api --> compare
    api --> explain

    lib --> types
    lib --> calc
    lib --> diff
    lib --> explain
    lib --> store

    components --> assumptions
    components --> outputs
    components --> history
    components --> diffPanel
    components --> explainPanel

    data --> commits.json
```