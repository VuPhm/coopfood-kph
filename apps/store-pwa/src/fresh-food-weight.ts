export function parseFreshFoodWeightKg(barcode: string): number | null {
  // Require a separate 29 prefix, four weight digits and one trailing digit.
  if (barcode.length < 7 || !barcode.startsWith("29") || /\D/.test(barcode)) return null;
  return Number(barcode.slice(-5, -1)) / 1000;
}
