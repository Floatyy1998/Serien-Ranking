/** Lesestand eines Manga in seiner Zählweise: Kapitel oder Bände (gedruckte Ausgaben). */

import { t } from '../../services/i18n';
import type { Manga } from '../../types/Manga';

export type MangaUnit = 'chapter' | 'volume';

type StandSource = Pick<
  Manga,
  | 'trackBy'
  | 'currentChapter'
  | 'currentVolume'
  | 'chapters'
  | 'latestChapterAvailable'
  | 'volumes'
  | 'latestVolumeAvailable'
>;

export const mangaUnit = (manga: Pick<Manga, 'trackBy'>): MangaUnit =>
  manga.trackBy === 'volumes' ? 'volume' : 'chapter';

export const mangaTotalVolumes = (
  manga: Pick<Manga, 'volumes' | 'latestVolumeAvailable'>
): number => Math.max(manga.volumes || 0, manga.latestVolumeAvailable || 0);

export interface MangaStand {
  unit: MangaUnit;
  current: number;
  /** 0 = Gesamtzahl unbekannt. */
  total: number;
  remaining: number;
  percent: number;
}

/** liveTotal: frisch geladene Gesamtzahl, bevor sie in Firebase steht. */
export function mangaStand(manga: StandSource, liveTotal = 0): MangaStand {
  const unit = mangaUnit(manga);
  const current = (unit === 'volume' ? manga.currentVolume : manga.currentChapter) || 0;
  const total =
    unit === 'volume'
      ? Math.max(mangaTotalVolumes(manga), liveTotal)
      : Math.max(manga.chapters || 0, manga.latestChapterAvailable || 0, liveTotal);
  return {
    unit,
    current,
    total,
    remaining: total > 0 ? Math.max(0, total - current) : 0,
    percent: total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0,
  };
}

export const hasReadProgress = (manga: StandSource): boolean => mangaStand(manga).current > 0;

/** „Bd. 3 / 14", „Kap. 12" — leer, solange nichts gelesen ist (außer mit showZero). */
export function standLabel({ unit, current, total }: MangaStand, showZero = false): string {
  if (current <= 0 && !showZero) return '';
  if (unit === 'volume') {
    return total > 0 ? t('Bd. {a} / {b}', { a: current, b: total }) : t('Bd. {n}', { n: current });
  }
  return total > 0 ? t('Kap. {a} / {b}', { a: current, b: total }) : t('Kap. {n}', { n: current });
}

export const mangaStandLabel = (manga: StandSource, showZero = false): string =>
  standLabel(mangaStand(manga), showZero);

export const volumesLabel = (n: number): string => (n === 1 ? t('1 Band') : t('{n} Bände', { n }));

/** „3 Bände übrig" / „12 übrig" — Bände nennen ihre Einheit, Kapitel wie bisher nicht. */
export function mangaRemainingLabel(stand: MangaStand): string {
  if (stand.remaining <= 0) return '';
  if (stand.unit === 'chapter') return t('{n} übrig', { n: stand.remaining });
  return stand.remaining === 1 ? t('1 Band übrig') : t('{n} Bände übrig', { n: stand.remaining });
}
