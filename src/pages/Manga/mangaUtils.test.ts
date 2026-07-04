import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ANILIST_STATUS_LABELS,
  FORMAT_COLORS,
  HIATUS_INFERENCE_DAYS,
  STATUS_COLORS,
  STATUS_LABELS,
  filterMonotonicReleases,
  getDisplayFormat,
  getDisplayFormatKey,
  getEffectiveChapterCount,
  getStatusLabel,
  inferStatus,
} from './mangaUtils';

describe('getDisplayFormat', () => {
  it('leitet aus dem Herkunftsland ab (KR → Manhwa, CN → Manhua)', () => {
    expect(getDisplayFormat('KR')).toBe('Manhwa');
    expect(getDisplayFormat('CN')).toBe('Manhua');
  });

  it('Herkunftsland gewinnt über format', () => {
    expect(getDisplayFormat('KR', 'ONE_SHOT')).toBe('Manhwa');
  });

  it('nutzt format-Fallback (ONE_SHOT / NOVEL)', () => {
    expect(getDisplayFormat('JP', 'ONE_SHOT')).toBe('One Shot');
    expect(getDisplayFormat(undefined, 'NOVEL')).toBe('Novel');
  });

  it('Default ist Manga', () => {
    expect(getDisplayFormat()).toBe('Manga');
    expect(getDisplayFormat('JP', 'MANGA')).toBe('Manga');
  });
});

describe('getDisplayFormatKey', () => {
  it('liefert Großbuchstaben-Keys passend zu FORMAT_COLORS', () => {
    expect(getDisplayFormatKey('KR')).toBe('MANHWA');
    expect(getDisplayFormatKey('CN')).toBe('MANHUA');
    expect(getDisplayFormatKey(undefined, 'ONE_SHOT')).toBe('ONE_SHOT');
    expect(getDisplayFormatKey(undefined, 'NOVEL')).toBe('NOVEL');
    expect(getDisplayFormatKey()).toBe('MANGA');
  });

  it('jeder mögliche Key existiert in FORMAT_COLORS', () => {
    for (const key of ['MANGA', 'MANHWA', 'MANHUA', 'ONE_SHOT', 'NOVEL']) {
      expect(FORMAT_COLORS[key]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('Konstanten-Integrität', () => {
  it('STATUS_LABELS und STATUS_COLORS teilen dieselben Keys', () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual(Object.keys(STATUS_COLORS).sort());
  });

  it('STATUS_COLORS sind gültige Hex-Farben', () => {
    for (const color of Object.values(STATUS_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('ANILIST_STATUS_LABELS deckt die relevanten AniList-Zustände ab', () => {
    expect(ANILIST_STATUS_LABELS.RELEASING).toBe('Laufend');
    expect(ANILIST_STATUS_LABELS.FINISHED).toBe('Abgeschlossen');
    expect(Object.keys(ANILIST_STATUS_LABELS)).toContain('HIATUS');
  });

  it('HIATUS_INFERENCE_DAYS ist 180', () => {
    expect(HIATUS_INFERENCE_DAYS).toBe(180);
  });
});

describe('filterMonotonicReleases', () => {
  it('leeres Array bleibt unverändert (gleiche Referenz)', () => {
    const input: { chapter: number }[] = [];
    expect(filterMonotonicReleases(input)).toBe(input);
  });

  it('entfernt Renumbering-Anomalien (Comeback-Chapter mit niedriger Nummer)', () => {
    // date-descending: neuester Eintrag (Comeback ch2) zuerst, dann Hauptlauf 326
    const input = [{ chapter: 2 }, { chapter: 326 }];
    expect(filterMonotonicReleases(input)).toEqual([{ chapter: 326 }]);
  });

  it('behält eine sauber aufsteigende Historie (date-desc Reihenfolge erhalten)', () => {
    const input = [{ chapter: 5 }, { chapter: 4 }, { chapter: 3 }];
    expect(filterMonotonicReleases(input)).toEqual([
      { chapter: 5 },
      { chapter: 4 },
      { chapter: 3 },
    ]);
  });

  it('akzeptiert Gleichstände (>= Maximum) und behält eine monoton steigende Historie', () => {
    // date-desc: [10, 10, 9] → chronologisch [9, 10, 10], alle >= Vorgänger-Max.
    const input = [{ chapter: 10 }, { chapter: 10 }, { chapter: 9 }];
    expect(filterMonotonicReleases(input)).toEqual([
      { chapter: 10 },
      { chapter: 10 },
      { chapter: 9 },
    ]);
  });
});

describe('inferStatus / getStatusLabel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('nicht-RELEASING-Status wird unverändert zurückgegeben', () => {
    expect(inferStatus({ status: 'FINISHED' })).toBe('FINISHED');
    expect(inferStatus({ status: undefined })).toBeUndefined();
  });

  it('RELEASING ohne lastReleaseDate bleibt RELEASING', () => {
    expect(inferStatus({ status: 'RELEASING' })).toBe('RELEASING');
  });

  it('RELEASING mit altem Release (>180 Tage) wird zu HIATUS inferiert', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-04T12:00:00'));
    expect(inferStatus({ status: 'RELEASING', lastReleaseDate: '2025-01-01' })).toBe('HIATUS');
  });

  it('RELEASING mit frischem Release bleibt RELEASING', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-04T12:00:00'));
    expect(inferStatus({ status: 'RELEASING', lastReleaseDate: '2026-06-01' })).toBe('RELEASING');
  });

  it('getStatusLabel mappt den effektiven Status auf ein Label', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-04T12:00:00'));
    expect(getStatusLabel({ status: 'FINISHED' })).toBe('Abgeschlossen');
    expect(getStatusLabel({ status: 'RELEASING', lastReleaseDate: '2025-01-01' })).toBe('Hiatus');
  });

  it('getStatusLabel gibt bei fehlendem Status leeren String zurück', () => {
    expect(getStatusLabel({ status: undefined })).toBe('');
  });

  it('getStatusLabel fällt auf den Rohstatus zurück, wenn kein Label existiert', () => {
    expect(getStatusLabel({ status: 'UNKNOWN_XYZ' })).toBe('UNKNOWN_XYZ');
  });
});

describe('getEffectiveChapterCount', () => {
  it('nimmt das Maximum aus chapters und latestChapterAvailable', () => {
    expect(getEffectiveChapterCount({ chapters: 2, latestChapterAvailable: 326 })).toBe(326);
    expect(getEffectiveChapterCount({ chapters: 400, latestChapterAvailable: 326 })).toBe(400);
  });

  it('berücksichtigt extraSources', () => {
    expect(getEffectiveChapterCount({ chapters: 10 }, 5, 42, null, undefined)).toBe(42);
  });

  it('gibt null zurück, wenn keine Quelle > 0 ist', () => {
    expect(getEffectiveChapterCount({ chapters: null, latestChapterAvailable: null })).toBeNull();
    expect(getEffectiveChapterCount({})).toBeNull();
    expect(getEffectiveChapterCount({ chapters: 0, latestChapterAvailable: 0 }, 0)).toBeNull();
  });
});
