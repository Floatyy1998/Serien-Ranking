/**
 * Characterization-Tests fuer compactWatch.ts
 *
 * Diese Tests pinnen das IST-Verhalten fest (Update-Map-Shapes, Format-
 * Erkennung, Konvertierung), damit Refactorings (Fassade, Adapter-
 * Typisierung, Extension-Paritaet) nichts stillschweigend aendern.
 *
 * NICHT hier getestet (lebt in seriesAdapter.ts, nicht in diesem Modul):
 * - Pre-Compact-Format {episodes:{idx:{...}}}
 * - Legacy-Semantik "{w:1} zaehlt als 1 frueherer Watch" (Increment-Logik
 *   liegt beim Aufrufer; buildEpisodeWatchedUpdates bekommt newWatchCount
 *   bereits fertig berechnet uebergeben)
 */
import { describe, expect, it } from 'vitest';
import type { EpidSeason, LegacyArraySeason } from './compactWatch';
import {
  buildEpisodeUnwatchUpdates,
  buildEpisodeWatchedUpdates,
  isEpidSeason,
  isLegacyArraySeason,
  isoToUnix,
  readEpisodeById,
  readEpisodeFromLegacyArray,
  unixToIso,
} from './compactWatch';

// Feste Zeitpunkte fuer deterministische Tests
const ISO = '2026-04-15T20:30:00.000Z';
const UNIX = 1776285000; // Math.floor(Date.parse(ISO) / 1000)

describe('compactWatch – Format-Erkennung', () => {
  it('isEpidSeason erkennt das ID-basierte Format (eps-Map)', () => {
    expect(isEpidSeason({ eps: { '123': { w: 1 } } })).toBe(true);
    expect(isEpidSeason({ eps: {} })).toBe(true);
  });

  it('isEpidSeason lehnt null/undefined/Primitive/Legacy-Format ab', () => {
    expect(isEpidSeason(null)).toBe(false);
    expect(isEpidSeason(undefined)).toBe(false);
    expect(isEpidSeason(7)).toBe(false);
    expect(isEpidSeason('eps')).toBe(false);
    expect(isEpidSeason({ w: [1, 0] })).toBe(false);
    expect(isEpidSeason({})).toBe(false);
  });

  it('isEpidSeason({eps: null}) ist false (Rumpf-Meta-Objekt, kein valides Format)', () => {
    expect(isEpidSeason({ eps: null })).toBe(false);
  });

  it('isLegacyArraySeason erkennt nur w als echtes Array', () => {
    expect(isLegacyArraySeason({ w: [1, 1, 0], c: [3, 1, 0] })).toBe(true);
    expect(isLegacyArraySeason({ w: [] })).toBe(true);
    // RTDB-serialisierte Sparse-Objekte ({0:1, 2:1}) sind KEINE Arrays:
    expect(isLegacyArraySeason({ w: { 0: 1, 2: 1 } })).toBe(false);
    expect(isLegacyArraySeason({ eps: {} })).toBe(false);
    expect(isLegacyArraySeason(null)).toBe(false);
    expect(isLegacyArraySeason(undefined)).toBe(false);
    expect(isLegacyArraySeason([1, 0])).toBe(false); // Array selbst hat kein 'w'
  });

  it('eine Season mit eps UND w-Array matcht beide Guards (Prioritaet liegt beim Aufrufer)', () => {
    const hybrid = { eps: { '1': { w: 1 } }, w: [1] };
    expect(isEpidSeason(hybrid)).toBe(true);
    expect(isLegacyArraySeason(hybrid)).toBe(true);
  });
});

describe('compactWatch – readEpisodeById (Compact-Format-Expander)', () => {
  const season: EpidSeason = {
    eps: {
      '5001': { w: 1, c: 3, f: 1700000000, l: 1776285000 },
      '5002': { w: 0, c: 0 },
      '5003': { w: 1 }, // Legacy-artiger Minimal-Eintrag
    },
  };

  it('expandiert einen vollen Eintrag zu EpisodeWatch mit ISO-Strings', () => {
    expect(readEpisodeById(season, 5001)).toEqual({
      watched: true,
      watchCount: 3,
      firstWatchedAt: '2023-11-14T22:13:20.000Z',
      lastWatchedAt: '2026-04-15T20:30:00.000Z',
    });
  });

  it('Episode-Key wird als String verglichen: Zahl und String liefern denselben Eintrag', () => {
    expect(readEpisodeById(season, 5001)).toEqual(readEpisodeById(season, '5001'));
  });

  it('fehlender Eintrag => watched=false, watchCount=0, keine Timestamps', () => {
    expect(readEpisodeById(season, 9999)).toEqual({
      watched: false,
      watchCount: 0,
      firstWatchedAt: undefined,
      lastWatchedAt: undefined,
    });
  });

  it('season null/undefined => sichere Defaults statt Throw', () => {
    const expected = {
      watched: false,
      watchCount: 0,
      firstWatchedAt: undefined,
      lastWatchedAt: undefined,
    };
    expect(readEpisodeById(null, 1)).toEqual(expected);
    expect(readEpisodeById(undefined, 1)).toEqual(expected);
  });

  it('w:0 mit c:0 => nicht gesehen, f/l undefined (0/fehlend = nicht gesetzt)', () => {
    expect(readEpisodeById(season, 5002)).toEqual({
      watched: false,
      watchCount: 0,
      firstWatchedAt: undefined,
      lastWatchedAt: undefined,
    });
  });

  it('BEFUND: Minimal-Eintrag {w:1} => watchCount 0 (NICHT 1) – die Regel "Legacy {w:1} = 1 Watch" setzt dieses Modul nicht um', () => {
    // Die Aufwertung auf 1 frueheren Watch muss der Aufrufer leisten.
    expect(readEpisodeById(season, 5003)).toEqual({
      watched: true,
      watchCount: 0,
      firstWatchedAt: undefined,
      lastWatchedAt: undefined,
    });
  });

  it('nur w als truthy Zahl != 1 gilt NICHT als watched (strikter ===1-Vergleich)', () => {
    const s: EpidSeason = { eps: { '1': { w: 2, c: 2 } } };
    expect(readEpisodeById(s, 1).watched).toBe(false);
    expect(readEpisodeById(s, 1).watchCount).toBe(2);
  });
});

describe('compactWatch – readEpisodeFromLegacyArray (Legacy-Array-Expander)', () => {
  const season: LegacyArraySeason = {
    w: [1, 0, 1],
    c: [10, 0, 1],
    f: [1600000000, 0, 1700000000],
    l: [1600000500, 0, 1776198600],
  };

  it('expandiert per Index (Index-basiert, NICHT Episode-ID)', () => {
    expect(readEpisodeFromLegacyArray(season, 0)).toEqual({
      watched: true,
      watchCount: 10,
      firstWatchedAt: '2020-09-13T12:26:40.000Z',
      lastWatchedAt: '2020-09-13T12:35:00.000Z',
    });
  });

  it('0-Werte in f/l => undefined-Timestamps', () => {
    expect(readEpisodeFromLegacyArray(season, 1)).toEqual({
      watched: false,
      watchCount: 0,
      firstWatchedAt: undefined,
      lastWatchedAt: undefined,
    });
  });

  it('Index ausserhalb des Arrays => Defaults statt Throw', () => {
    expect(readEpisodeFromLegacyArray(season, 99)).toEqual({
      watched: false,
      watchCount: 0,
      firstWatchedAt: undefined,
      lastWatchedAt: undefined,
    });
  });

  it('fehlende f/l-Arrays => undefined-Timestamps; Loecher (sparse) => Defaults', () => {
    const sparse: LegacyArraySeason = { w: [1], c: [] };
    expect(readEpisodeFromLegacyArray(sparse, 0)).toEqual({
      watched: true,
      watchCount: 0,
      firstWatchedAt: undefined,
      lastWatchedAt: undefined,
    });
    // Sparse-Loch bei Index 1:
    // eslint-disable-next-line no-sparse-arrays
    const holes: LegacyArraySeason = { w: [1, , 1] as number[], c: [1, , 1] as number[] };
    expect(readEpisodeFromLegacyArray(holes, 1)).toEqual({
      watched: false,
      watchCount: 0,
      firstWatchedAt: undefined,
      lastWatchedAt: undefined,
    });
  });
});

describe('compactWatch – buildEpisodeWatchedUpdates (Multi-Path-Update-Map)', () => {
  it('Erst-Watch: EXAKTE Map mit w/c/l/f + serienVersion-Bump ({".sv":"timestamp"})', () => {
    const updates = buildEpisodeWatchedUpdates('uid1', 4087, 0, 62085, 1, ISO, true);
    expect(updates).toEqual({
      'users/uid1/seriesWatch/4087/seasons/0/eps/62085/w': 1,
      'users/uid1/seriesWatch/4087/seasons/0/eps/62085/c': 1,
      'users/uid1/seriesWatch/4087/seasons/0/eps/62085/l': UNIX,
      'users/uid1/seriesWatch/4087/seasons/0/eps/62085/f': UNIX,
      'users/uid1/meta/serienVersion': { '.sv': 'timestamp' },
    });
    expect(Object.keys(updates)).toHaveLength(5);
  });

  it('Rewatch (isFirstWatch=false): KEIN f-Pfad, w bleibt 1, c = uebergebener neuer Count', () => {
    const updates = buildEpisodeWatchedUpdates('uid1', 4087, 2, 62085, 4, ISO, false);
    expect(updates).toEqual({
      'users/uid1/seriesWatch/4087/seasons/2/eps/62085/w': 1,
      'users/uid1/seriesWatch/4087/seasons/2/eps/62085/c': 4,
      'users/uid1/seriesWatch/4087/seasons/2/eps/62085/l': UNIX,
      'users/uid1/meta/serienVersion': { '.sv': 'timestamp' },
    });
    expect(Object.keys(updates)).toHaveLength(4);
  });

  it('c ist der vom Aufrufer berechnete newWatchCount – das Modul inkrementiert selbst NICHT', () => {
    const updates = buildEpisodeWatchedUpdates('u', 1, 0, 2, 7, ISO, false);
    expect(updates['users/u/seriesWatch/1/seasons/0/eps/2/c']).toBe(7);
  });

  it('seasonIndex wird 1:1 in den Pfad geschrieben (0-basiert; Umrechnung seasonNumber-1 macht der Aufrufer)', () => {
    const updates = buildEpisodeWatchedUpdates('u', 1, 5, 2, 1, ISO, false);
    expect(Object.keys(updates)).toContain('users/u/seriesWatch/1/seasons/5/eps/2/w');
  });

  it('seriesId und episodeId duerfen Strings sein und landen unveraendert im Pfad', () => {
    const updates = buildEpisodeWatchedUpdates('u', '4087', 0, '62085', 1, ISO, false);
    expect(Object.keys(updates)).toContain('users/u/seriesWatch/4087/seasons/0/eps/62085/w');
  });

  it('l/f sind Unix-SEKUNDEN (abgerundet), keine Millisekunden', () => {
    const updates = buildEpisodeWatchedUpdates('u', 1, 0, 2, 1, '2026-04-15T20:30:00.999Z', true);
    expect(updates['users/u/seriesWatch/1/seasons/0/eps/2/l']).toBe(UNIX);
    expect(updates['users/u/seriesWatch/1/seasons/0/eps/2/f']).toBe(UNIX);
  });

  it('BEFUND: ungueltiges/leeres nowIso schreibt l=0 (Semantik "nicht gesetzt") statt zu werfen', () => {
    const updates = buildEpisodeWatchedUpdates('u', 1, 0, 2, 1, 'kein-datum', true);
    expect(updates['users/u/seriesWatch/1/seasons/0/eps/2/l']).toBe(0);
    expect(updates['users/u/seriesWatch/1/seasons/0/eps/2/f']).toBe(0);
  });
});

describe('compactWatch – buildEpisodeUnwatchUpdates (Revert-Pfad)', () => {
  it('kompletter Reset (previousWatched=false, count=0): loescht den GANZEN eps-Eintrag via null + serienVersion', () => {
    const updates = buildEpisodeUnwatchUpdates('uid1', 4087, 0, 62085, false, 0, null, null);
    expect(updates).toEqual({
      'users/uid1/seriesWatch/4087/seasons/0/eps/62085': null,
      'users/uid1/meta/serienVersion': { '.sv': 'timestamp' },
    });
    expect(Object.keys(updates)).toHaveLength(2);
  });

  it('Revert auf frueheren Zustand: schreibt w/c/f/l explizit zurueck (f/l aus ISO in Unix-Sekunden)', () => {
    const updates = buildEpisodeUnwatchUpdates(
      'uid1',
      4087,
      1,
      62085,
      true,
      2,
      '2023-11-14T22:13:20.000Z',
      ISO
    );
    expect(updates).toEqual({
      'users/uid1/seriesWatch/4087/seasons/1/eps/62085/w': 1,
      'users/uid1/seriesWatch/4087/seasons/1/eps/62085/c': 2,
      'users/uid1/seriesWatch/4087/seasons/1/eps/62085/f': 1700000000,
      'users/uid1/seriesWatch/4087/seasons/1/eps/62085/l': UNIX,
      'users/uid1/meta/serienVersion': { '.sv': 'timestamp' },
    });
  });

  it('previousWatched=false wird als w:0 geschrieben; fehlende Timestamps als 0', () => {
    const updates = buildEpisodeUnwatchUpdates('u', 1, 0, 2, false, 3, null, null);
    expect(updates).toEqual({
      'users/u/seriesWatch/1/seasons/0/eps/2/w': 0,
      'users/u/seriesWatch/1/seasons/0/eps/2/c': 3,
      'users/u/seriesWatch/1/seasons/0/eps/2/f': 0,
      'users/u/seriesWatch/1/seasons/0/eps/2/l': 0,
      'users/u/meta/serienVersion': { '.sv': 'timestamp' },
    });
  });

  it('previousWatched=true mit count=0 nimmt NICHT den Loesch-Pfad, sondern schreibt w:1,c:0', () => {
    const updates = buildEpisodeUnwatchUpdates('u', 1, 0, 2, true, 0, null, null);
    expect(updates['users/u/seriesWatch/1/seasons/0/eps/2']).toBeUndefined();
    expect(updates['users/u/seriesWatch/1/seasons/0/eps/2/w']).toBe(1);
    expect(updates['users/u/seriesWatch/1/seasons/0/eps/2/c']).toBe(0);
  });

  it('jede Variante bumpt serienVersion mit Server-Timestamp-Sentinel', () => {
    const del = buildEpisodeUnwatchUpdates('u', 1, 0, 2, false, 0, null, null);
    const revert = buildEpisodeUnwatchUpdates('u', 1, 0, 2, true, 1, ISO, ISO);
    expect(del['users/u/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
    expect(revert['users/u/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });
});

describe('compactWatch – isoToUnix / unixToIso', () => {
  it('isoToUnix konvertiert ISO in Unix-Sekunden (floor bei Millisekunden)', () => {
    expect(isoToUnix(ISO)).toBe(UNIX);
    expect(isoToUnix('2026-04-15T20:30:00.999Z')).toBe(UNIX);
  });

  it('isoToUnix: null/undefined/leer/ungueltig => 0', () => {
    expect(isoToUnix(null)).toBe(0);
    expect(isoToUnix(undefined)).toBe(0);
    expect(isoToUnix('')).toBe(0);
    expect(isoToUnix('nicht-parsebar')).toBe(0);
  });

  it('BEFUND: Epoch-Zeitpunkt kollabiert zu 0 und ist von "nicht gesetzt" ununterscheidbar', () => {
    expect(isoToUnix('1970-01-01T00:00:00.000Z')).toBe(0);
  });

  it('unixToIso konvertiert Sekunden in ISO-8601-UTC', () => {
    expect(unixToIso(UNIX)).toBe(ISO);
    expect(unixToIso(1700000000)).toBe('2023-11-14T22:13:20.000Z');
  });

  it('unixToIso: 0/null/undefined => undefined (0 = nicht gesetzt)', () => {
    expect(unixToIso(0)).toBeUndefined();
    expect(unixToIso(null)).toBeUndefined();
    expect(unixToIso(undefined)).toBeUndefined();
  });

  it('Roundtrip ISO -> Unix -> ISO ist verlustfrei bei vollen Sekunden', () => {
    expect(unixToIso(isoToUnix(ISO))).toBe(ISO);
  });

  it('BEFUND: negative Unix-Werte (vor 1970) sind truthy und werden konvertiert, nicht als "nicht gesetzt" behandelt', () => {
    expect(unixToIso(-86400)).toBe('1969-12-31T00:00:00.000Z');
    expect(isoToUnix('1969-12-31T00:00:00.000Z')).toBe(-86400);
  });
});
