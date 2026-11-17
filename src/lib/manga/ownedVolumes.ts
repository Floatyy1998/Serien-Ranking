/** Besitz eines Manga: ganze Reihe (`ownedAt` allein) oder einzelne Bände (`ownedVolumes`). */

import { t } from '../../services/i18n';
import type { Manga } from '../../types/Manga';

type OwnSource = Pick<Manga, 'ownedAt' | 'ownedVolumes'>;

export type MangaOwnership = 'none' | 'some' | 'all';

const KEY = /^v(\d+)$/;

/** Reine Zahlenschlüssel liefert die RTDB als Array zurück. */
export const volumeKey = (volume: number): string => `v${volume}`;

export function ownedVolumeNumbers(manga: OwnSource): number[] {
  return Object.entries(manga.ownedVolumes ?? {})
    .map(([key, since]) => (since ? Number(KEY.exec(key)?.[1]) : NaN))
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
}

export function mangaOwnership(manga: OwnSource): MangaOwnership {
  if (ownedVolumeNumbers(manga).length > 0) return 'some';
  return manga.ownedAt ? 'all' : 'none';
}

export const isMangaOwned = (manga: OwnSource): boolean => mangaOwnership(manga) !== 'none';

export const isVolumeOwned = (manga: OwnSource, volume: number): boolean =>
  mangaOwnership(manga) === 'all' || !!manga.ownedVolumes?.[volumeKey(volume)];

export const ownedSince = (manga: OwnSource, volume: number): string | undefined =>
  manga.ownedVolumes?.[volumeKey(volume)] || manga.ownedAt;

/** `ownedAt` bleibt gesetzt, solange ein Band im Regal steht — Filter und Sammelaktionen lesen nur das. */
export function toggleVolumeFields(
  manga: OwnSource,
  volume: number,
  count: number,
  now: string
): Record<string, unknown> {
  const key = volumeKey(volume);
  if (mangaOwnership(manga) === 'all') {
    const rest: Record<string, string> = {};
    for (let n = 1; n <= count; n++) if (n !== volume) rest[volumeKey(n)] = manga.ownedAt ?? now;
    return Object.keys(rest).length > 0
      ? { ownedVolumes: rest }
      : { ownedAt: null, ownedVolumes: null };
  }
  if (manga.ownedVolumes?.[key]) {
    return ownedVolumeNumbers(manga).length <= 1
      ? { ownedAt: null, ownedVolumes: null }
      : { [`ownedVolumes/${key}`]: null };
  }
  return { [`ownedVolumes/${key}`]: now, ...(manga.ownedAt ? {} : { ownedAt: now }) };
}

/** Bände (`v<Band>` → seit wann) zusätzlich ins Regal stellen; die ganze Reihe bleibt, wie sie ist. */
export function addOwnedVolumesFields(
  manga: OwnSource,
  volumes: Record<string, string>
): Record<string, unknown> {
  if (mangaOwnership(manga) === 'all') return {};
  const added = Object.entries(volumes).filter(([key]) => !manga.ownedVolumes?.[key]);
  if (added.length === 0) return {};
  const fields: Record<string, unknown> = Object.fromEntries(
    added.map(([key, since]) => [`ownedVolumes/${key}`, since])
  );
  if (!manga.ownedAt) fields.ownedAt = added.map(([, since]) => since).sort()[0];
  return fields;
}

export function ownedVolumesLabel(manga: OwnSource, total = 0): string {
  const volumes = ownedVolumeNumbers(manga);
  if (volumes.length === 0) return manga.ownedAt ? t('Ganze Reihe im Besitz') : '';
  if (volumes.length === 1) return t('Band {n} im Besitz', { n: volumes[0] });
  if (total > 0 && volumes.length >= total) {
    return t('Alle {n} Bände im Besitz', { n: volumes.length });
  }
  return t('{n} Bände im Besitz', { n: volumes.length });
}
