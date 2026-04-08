import { describe, expect, it } from "vitest";

import { updateCompareSelection } from "./compare-selection";

describe("updateCompareSelection", () => {
  it("adds id when under capacity", () => {
    expect(updateCompareSelection([], "a")).toEqual(["a"]);
    expect(updateCompareSelection(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes id when already selected", () => {
    expect(updateCompareSelection(["a", "b"], "a")).toEqual(["b"]);
    expect(updateCompareSelection(["a"], "a")).toEqual([]);
  });

  it("evicts oldest when at capacity and adding new", () => {
    expect(updateCompareSelection(["a", "b"], "c")).toEqual(["b", "c"]);
  });

  it("respects custom max", () => {
    expect(updateCompareSelection([], "x", 1)).toEqual(["x"]);
    expect(updateCompareSelection(["x"], "y", 1)).toEqual(["y"]);
  });
});
