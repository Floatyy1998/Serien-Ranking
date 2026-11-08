export function formatVoteCount(input: number | string | null | undefined): string {
  const n =
    typeof input === 'string' ? parseInt(input.replace(/[^\d]/g, ''), 10) : Number(input ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n < 1000) return String(Math.round(n));
  if (n < 999_950) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
