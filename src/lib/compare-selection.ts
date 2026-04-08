/**
 * Toggle id in a bounded multi-select (FIFO eviction when at capacity).
 * Used for picking two commits to compare.
 */
export function updateCompareSelection(
  selectedIds: readonly string[],
  toggledId: string,
  max = 2,
): string[] {
  const i = selectedIds.indexOf(toggledId);
  if (i !== -1) {
    return selectedIds.filter((_, j) => j !== i);
  }
  if (selectedIds.length < max) {
    return [...selectedIds, toggledId];
  }
  return [...selectedIds.slice(1), toggledId];
}
