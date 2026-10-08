export function parsePositiveQuantity(value: string): number | null {
  const trimmed = value.trim();
  // One decimal separator only; never guess grouping or parse a numeric prefix.
  if (!/^(?:[0-9]+(?:[.,][0-9]+)?|[.,][0-9]+)$/.test(trimmed)) return null;
  const quantity = Number(trimmed.replace(",", "."));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}
