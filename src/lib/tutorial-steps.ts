export type TutorialStep = {
  title: string;
  body: string;
  /** Matches `[data-tutorial="…"]`. Omit for a centered step with no spotlight. */
  anchor?: string;
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome",
    body: "Finance Memory For Reasoning is a small planning model: you edit funnel assumptions and see derived metrics (customers, MRR, ARR, runway) update immediately. Versions are saved with messages; you can compare any two and ask why a metric moved.",
  },
  {
    title: "Baseline vs draft",
    body: "Edits change the draft. The pill shows whether the draft matches your saved baseline. Save baseline records what you consider “truth” for the form; Revert discards draft edits back to that baseline; Reset to seed restores factory defaults for both.",
    anchor: "baseline",
  },
  {
    title: "Assumptions",
    body: "Change numbers here (traffic, conversion, ARPU, burn, etc.). Rationale text reminds you what each field means. The calc engine is deterministic—same assumptions always yield the same outputs.",
    anchor: "assumptions",
  },
  {
    title: "Outputs",
    body: "These cards show the current draft’s results. They recalc on every assumption change so you can iterate quickly before saving a named version.",
    anchor: "outputs",
  },
  {
    title: "Save a version",
    body: "Type a commit-style message and click Save version. That snapshots the current draft assumptions (with computed outputs) to the server. You need at least two versions to run a rich compare.",
    anchor: "version-save",
  },
  {
    title: "Compare two versions",
    body: "Click up to two rows in the history list (order does not matter), then Compare selected versions. You’ll see assumption diffs and metric deltas between older vs newer.",
    anchor: "version-compare",
  },
  {
    title: "Diff and “why”",
    body: "When the compare panel appears, click a metric row (for example ARR) to fetch a causal explanation: upstream assumptions, propagation path, and rationales. If this step is not highlighted yet, run compare first.",
    anchor: "diff-panel",
  },
  {
    title: "Explanation panel",
    body: "This card answers “why did this metric change?” between the two versions you compared. If you do not see it yet, go back to the diff table and click a metric row.",
    anchor: "explain-panel",
  },
];
