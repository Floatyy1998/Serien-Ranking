import type { Series } from '../../types/Series';

type AutoUnhideSeries = Pick<Series, 'id' | 'hidden'>;

/** Eine als „nicht weiterschauen" markierte Serie wird beim Weiterschauen wieder aktiv. */
export function shouldAutoUnhide(series: AutoUnhideSeries | null | undefined): boolean {
  return !!series && series.hidden === true;
}

export function autoUnhideUpdates(
  uid: string,
  series: AutoUnhideSeries | null | undefined
): Record<string, unknown> {
  if (!series || !shouldAutoUnhide(series)) return {};
  return {
    [`users/${uid}/series/${series.id}/hidden`]: null,
  };
}
