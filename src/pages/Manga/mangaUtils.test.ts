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
  isOngoingPublication,
  shouldAutoComplete,
  shouldReopenCompleted,
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

describe('isOngoingPublication', () => {
  it('erkennt laufende und noch nicht gestartete Publikationen', () => {
    expect(isOngoingPublication('RELEASING')).toBe(true);
    expect(isOngoingPublication('HIATUS')).toBe(true);
    expect(isOngoingPublication('NOT_YET_RELEASED')).toBe(true);
    expect(isOngoingPublication('FINISHED')).toBe(false);
    expect(isOngoingPublication('CANCELLED')).toBe(false);
    expect(isOngoingPublication(undefined)).toBe(false);
  });
});

describe('shouldAutoComplete', () => {
  it('schliesst einen abgeschlossenen Manga beim letzten Kapitel ab', () => {
    expect(shouldAutoComplete({ status: 'FINISHED' }, 100, 99, 100)).toBe(true);
  });

  it('schliesst einen laufenden Manga nie ab', () => {
    expect(shouldAutoComplete({ status: 'RELEASING' }, 156, 155, 156)).toBe(false);
    expect(shouldAutoComplete({ status: 'HIATUS' }, 156, 155, 156)).toBe(false);
  });

  it('greift nicht bei stale Totals', () => {
    expect(shouldAutoComplete({ status: 'FINISHED' }, 2, 59, 60)).toBe(false);
  });

  it('greift nicht ohne bekanntes Total', () => {
    expect(shouldAutoComplete({ status: 'FINISHED' }, null, 5, 6)).toBe(false);
    expect(shouldAutoComplete({ status: 'FINISHED' }, 0, 5, 6)).toBe(false);
  });
});

describe('shouldReopenCompleted', () => {
  const caughtUp = {
    readStatus: 'completed',
    currentChapter: 156,
    completedAt: '2026-08-30T10:00:00.000Z',
    lastReadAt: '2026-08-30T10:00:00.100Z',
  };

  it('oeffnet einen aufgeholten Manga bei neuem Kapitel wieder', () => {
    expect(shouldReopenCompleted(caughtUp, 156, 157)).toBe(true);
  });

  it('laesst ihn zu, solange kein neues Kapitel da ist', () => {
    expect(shouldReopenCompleted(caughtUp, 156, 156)).toBe(false);
  });

  it('fasst einen bewussten Abschluss mitten in der Serie nicht an', () => {
    const manual = {
      readStatus: 'completed',
      currentChapter: 50,
      completedAt: '2026-08-30T12:00:00.000Z',
      lastReadAt: '2026-08-01T09:00:00.000Z',
    };
    expect(shouldReopenCompleted(manual, 300, 320)).toBe(false);
  });

  it('heilt Alt-Daten, deren Total dem Lesestand schon davongelaufen ist', () => {
    expect(shouldReopenCompleted(caughtUp, 157, 158)).toBe(true);
  });

  it('ignoriert andere Lesestatus und ungelesene Manga', () => {
    expect(shouldReopenCompleted({ ...caughtUp, readStatus: 'reading' }, 156, 157)).toBe(false);
    expect(shouldReopenCompleted({ ...caughtUp, currentChapter: 0 }, 0, 5)).toBe(false);
  });
});
