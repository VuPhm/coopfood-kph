export type SelectionAction = "all" | "none" | "select-visible" | "clear-visible" | "invert-visible";

// Null follows the whole eligible collection; explicit IDs preserve choices outside a search.
export function updateSelection(current: readonly string[] | null, eligible: readonly string[], visible: readonly string[], action: SelectionAction): string[] | null {
  if (action === "all") return null;
  if (action === "none") return [];
  const result = new Set(current ?? eligible);
  const scope = new Set(eligible);
  for (const id of new Set(visible)) {
    if (!scope.has(id)) continue;
    if (action === "select-visible") result.add(id);
    else if (action === "clear-visible" || result.has(id)) result.delete(id);
    else result.add(id);
  }
  return [...result];
}
