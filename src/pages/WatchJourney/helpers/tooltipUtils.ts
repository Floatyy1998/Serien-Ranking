/**
 * Format a number using German locale (comma for decimals).
 * Rounds to 1 decimal place, drops the decimal if it's .0
 */
export function formatGermanNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded % 1 === 0) {
    return rounded.toLocaleString('de-DE');
  }
  return rounded.toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
