/**
 * Characterization-Tests für compactEvent.ts.
 *
 * Diese Tests pinnen das IST-Verhalten fest (Kurz-Key-Expansion ts,t,s,st,sn,ep,rt,g,p,rw,
 * Roh-Event-Durchreichung, fehlende Keys), damit Refactorings nichts stillschweigend ändern.
 * Verdächtige Verhaltensweisen werden getestet wie sie SIND (siehe Report).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ActivityEvent, EpisodeWatchEvent, MovieWatchEvent } from '../../types/WatchActivity';
import {
  compactifyEvent,
  expandCompactEvent,
  isCompactEvent,
  readEventUniversal,
} from './compactEvent';

// 2026-03-15T20:30:00.000Z
const TS = 1773606600;

/** Erwartete lokale Zeitfelder (Expansion nutzt getMonth/getDay/getHours = LOKALE Zeit). */
function localFields(tsSeconds: number) {
  const d = new Date(tsSeconds * 1000);
  return { month: d.getMonth() + 1, dayOfWeek: d.getDay(), hour: d.getHours() };
}

type AnyEvent = Record<string, unknown>;

describe('isCompactEvent', () => {
  it('erkennt Objekt mit numerischem ts als kompakt', () => {
    expect(isCompactEvent({ ts: TS, t: 'ep' })).toBe(true);
  });

  it('ts: 0 zählt als kompakt (typeof number)', () => {
    expect(isCompactEvent({ ts: 0 })).toBe(true);
  });

  it('lehnt null, undefined und Primitive ab', () => {
    expect(isCompactEvent(null)).toBe(false);
    expect(isCompactEvent(undefined)).toBe(false);
    expect(isCompactEvent('ts')).toBe(false);
    expect(isCompactEvent(42)).toBe(false);
  });

  it('lehnt leeres Objekt und Objekt ohne ts ab', () => {
    expect(isCompactEvent({})).toBe(false);
    expect(isCompactEvent({ timestamp: '2026-01-01T00:00:00.000Z' })).toBe(false);
  });

  it('lehnt ts als String ab', () => {
    expect(isCompactEvent({ ts: '1773606600' })).toBe(false);
  });

  it('Objekt mit ts (Number) UND timestamp (String) gilt als Legacy (nicht kompakt)', () => {
    expect(isCompactEvent({ ts: TS, timestamp: '2026-03-15T20:30:00.000Z' })).toBe(false);
  });
});

describe('expandCompactEvent – Basis-Felder', () => {
  it('expandiert ts zu ISO-timestamp und leitet month/dayOfWeek/hour (lokal) ab', () => {
    const ev = expandCompactEvent({ ts: TS, t: 'ep' }) as unknown as AnyEvent;
    expect(ev.timestamp).toBe(new Date(TS * 1000).toISOString());
    const lf = localFields(TS);
    expect(ev.month).toBe(lf.month);
    expect(ev.dayOfWeek).toBe(lf.dayOfWeek);
    expect(ev.hour).toBe(lf.hour);
  });

  it('setzt deviceType immer hart auf "desktop"', () => {
    const ev = expandCompactEvent({ ts: TS, t: 'mv' }) as unknown as AnyEvent;
    expect(ev.deviceType).toBe('desktop');
  });

  it('fehlendes ts (und ts: 0) fällt auf Epoch 1970 zurück', () => {
    const ohneTs = expandCompactEvent({ t: 'ep' }) as unknown as AnyEvent;
    expect(ohneTs.timestamp).toBe('1970-01-01T00:00:00.000Z');
    const tsNull = expandCompactEvent({ ts: 0, t: 'ep' }) as unknown as AnyEvent;
    expect(tsNull.timestamp).toBe('1970-01-01T00:00:00.000Z');
  });

  it('fehlendes t defaultet auf "episode_watch"', () => {
    const ev = expandCompactEvent({ ts: TS }) as unknown as AnyEvent;
    expect(ev.type).toBe('episode_watch');
  });

  it('leerer t-String defaultet ebenfalls auf "episode_watch"', () => {
    const ev = expandCompactEvent({ ts: TS, t: '' }) as unknown as AnyEvent;
    expect(ev.type).toBe('episode_watch');
  });

  it('unbekannter Kurz-Typ wird unverändert durchgereicht – aber KEINE Feld-Expansion (s/st gehen verloren)', () => {
    const ev = expandCompactEvent({
      ts: TS,
      t: 'xx',
      s: 123,
      st: 'Titel',
      rt: 42,
    }) as unknown as AnyEvent;
    expect(ev.type).toBe('xx');
    // Kein Branch matcht → s/st/rt werden nicht auf Full-Keys gemappt
    expect(ev.seriesId).toBeUndefined();
    expect(ev.movieId).toBeUndefined();
    expect(ev.seriesTitle).toBeUndefined();
    expect(ev.episodeRuntime).toBeUndefined();
    expect(ev.runtime).toBeUndefined();
  });

  it('akzeptiert auch bereits volle Typnamen in t (z. B. "movie_watch")', () => {
    const ev = expandCompactEvent({ ts: TS, t: 'movie_watch', s: 9, st: 'Film' });
    expect(ev.type).toBe('movie_watch');
    expect((ev as MovieWatchEvent).movieId).toBe(9);
    expect((ev as MovieWatchEvent).movieTitle).toBe('Film');
  });
});

describe('expandCompactEvent – episode_watch (t: "ep")', () => {
  it('expandiert alle Kurz-Keys s,st,sn,ep,rt,g,p,rw korrekt', () => {
    const ev = expandCompactEvent({
      ts: TS,
      t: 'ep',
      s: 1399,
      st: 'Game of Thrones',
      sn: 3,
      ep: 9,
      rt: 55,
      g: ['Drama', 'Fantasy'],
      p: ['Sky', 'WOW'],
      rw: 1,
    }) as unknown as EpisodeWatchEvent;
    expect(ev.type).toBe('episode_watch');
    expect(ev.seriesId).toBe(1399);
    expect(ev.seriesTitle).toBe('Game of Thrones');
    expect(ev.seasonNumber).toBe(3);
    expect(ev.episodeNumber).toBe(9);
    expect(ev.episodeRuntime).toBe(55);
    expect(ev.genres).toEqual(['Drama', 'Fantasy']);
    expect(ev.providers).toEqual(['Sky', 'WOW']);
    expect(ev.provider).toBe('Sky'); // erster Provider wird als Haupt-Provider gesetzt
    expect(ev.isRewatch).toBe(true);
  });

  it('fehlende optionale Keys erzeugen KEINE Full-Keys, isRewatch ist aber immer gesetzt (false)', () => {
    const ev = expandCompactEvent({ ts: TS, t: 'ep' }) as unknown as AnyEvent;
    expect('seriesId' in ev).toBe(false);
    expect('seriesTitle' in ev).toBe(false);
    expect('seasonNumber' in ev).toBe(false);
    expect('episodeNumber' in ev).toBe(false);
    expect('episodeRuntime' in ev).toBe(false);
    expect('genres' in ev).toBe(false);
    expect('providers' in ev).toBe(false);
    expect('provider' in ev).toBe(false);
    expect('isBingeSession' in ev).toBe(false);
    expect('bingeSessionId' in ev).toBe(false);
    expect(ev.isRewatch).toBe(false);
  });

  it('rw: 0, fehlend oder != 1 ergibt isRewatch false (nur exakt 1 zählt)', () => {
    expect((expandCompactEvent({ ts: TS, t: 'ep', rw: 0 }) as EpisodeWatchEvent).isRewatch).toBe(
      false
    );
    expect((expandCompactEvent({ ts: TS, t: 'ep' }) as EpisodeWatchEvent).isRewatch).toBe(false);
    expect(
      (expandCompactEvent({ ts: TS, t: 'ep', rw: 2 as number }) as EpisodeWatchEvent).isRewatch
    ).toBe(false);
  });

  it('Null-Werte bleiben erhalten: s=0, sn=0, ep=0, rt=0 werden expandiert (!= null Check)', () => {
    const ev = expandCompactEvent({
      ts: TS,
      t: 'ep',
      s: 0,
      sn: 0,
      ep: 0,
      rt: 0,
    }) as unknown as EpisodeWatchEvent;
    expect(ev.seriesId).toBe(0);
    expect(ev.seasonNumber).toBe(0);
    expect(ev.episodeNumber).toBe(0);
    expect(ev.episodeRuntime).toBe(0);
  });

  it('leerer Titel-String st: "" wird verworfen (falsy-Check)', () => {
    const ev = expandCompactEvent({ ts: TS, t: 'ep', st: '' }) as unknown as AnyEvent;
    expect('seriesTitle' in ev).toBe(false);
  });

  it('bs: 1 → isBingeSession true; bs: 0 → Key fehlt; bid wird zu bingeSessionId', () => {
    const binge = expandCompactEvent({
      ts: TS,
      t: 'ep',
      bs: 1,
      bid: 'binge-42',
    }) as unknown as EpisodeWatchEvent;
    expect(binge.isBingeSession).toBe(true);
    expect(binge.bingeSessionId).toBe('binge-42');
    const kein = expandCompactEvent({ ts: TS, t: 'ep', bs: 0 }) as unknown as AnyEvent;
    expect('isBingeSession' in kein).toBe(false);
  });

  it('leere g/p-Arrays: genres [] wird gesetzt, providers [] gesetzt, provider ist undefined', () => {
    const ev = expandCompactEvent({ ts: TS, t: 'ep', g: [], p: [] }) as unknown as AnyEvent;
    expect(ev.genres).toEqual([]);
    expect(ev.providers).toEqual([]);
    expect('provider' in ev).toBe(true);
    expect(ev.provider).toBeUndefined();
  });
});

describe('expandCompactEvent – movie / manga Typen', () => {
  it('t: "mv" mappt s→movieId, st→movieTitle, rt→runtime', () => {
    const ev = expandCompactEvent({
      ts: TS,
      t: 'mv',
      s: 550,
      st: 'Fight Club',
      rt: 139,
      g: ['Drama'],
      p: ['Netflix'],
    }) as unknown as MovieWatchEvent;
    expect(ev.type).toBe('movie_watch');
    expect(ev.movieId).toBe(550);
    expect(ev.movieTitle).toBe('Fight Club');
    expect(ev.runtime).toBe(139);
    expect(ev.genres).toEqual(['Drama']);
    expect(ev.provider).toBe('Netflix');
    expect((ev as unknown as AnyEvent).seriesId).toBeUndefined();
  });

  it('t: "mr" (movie_rating) mappt rat→rating; rat: 0 bleibt erhalten', () => {
    const ev = expandCompactEvent({
      ts: TS,
      t: 'mr',
      s: 550,
      st: 'Fight Club',
      rat: 0,
    }) as unknown as MovieWatchEvent;
    expect(ev.type).toBe('movie_rating');
    expect(ev.movieId).toBe(550);
    expect(ev.rating).toBe(0);
  });

  it('Movie-Branch expandiert keine Episode-Keys (sn/ep werden ignoriert)', () => {
    const ev = expandCompactEvent({ ts: TS, t: 'mv', s: 1, sn: 2, ep: 3 }) as unknown as AnyEvent;
    expect('seasonNumber' in ev).toBe(false);
    expect('episodeNumber' in ev).toBe(false);
    expect('isRewatch' in ev).toBe(false); // isRewatch nur im episode_watch-Branch
  });

  it('t: "ch" (chapter_read) mappt s→mangaId, st→mangaTitle, ch/vol/fmt und rw→isReread', () => {
    const ev = expandCompactEvent({
      ts: TS,
      t: 'ch',
      s: 30002,
      st: 'Berserk',
      ch: 364,
      vol: 41,
      fmt: 'MANGA',
      rw: 1,
    }) as unknown as AnyEvent;
    expect(ev.type).toBe('chapter_read');
    expect(ev.mangaId).toBe(30002);
    expect(ev.mangaTitle).toBe('Berserk');
    expect(ev.chapterNumber).toBe(364);
    expect(ev.volumeNumber).toBe(41);
    expect(ev.format).toBe('MANGA');
    expect(ev.isReread).toBe(true);
    expect('isRewatch' in ev).toBe(false);
  });

  it('chapter_read ohne rw: isReread ist immer gesetzt (false); ch: 0 bleibt erhalten, fmt: "" verworfen', () => {
    const ev = expandCompactEvent({ ts: TS, t: 'ch', ch: 0, fmt: '' }) as unknown as AnyEvent;
    expect(ev.isReread).toBe(false);
    expect(ev.chapterNumber).toBe(0);
    expect('format' in ev).toBe(false);
  });

  it('t: "rg" (manga_rating) mappt s→mangaId, st→mangaTitle, rat→rating; kein isReread', () => {
    const ev = expandCompactEvent({
      ts: TS,
      t: 'rg',
      s: 30002,
      st: 'Berserk',
      rat: 10,
    }) as unknown as AnyEvent;
    expect(ev.type).toBe('manga_rating');
    expect(ev.mangaId).toBe(30002);
    expect(ev.mangaTitle).toBe('Berserk');
    expect(ev.rating).toBe(10);
    expect('isReread' in ev).toBe(false);
  });

  it('g/p werden typunabhängig angehängt (auch bei unbekanntem Typ)', () => {
    const ev = expandCompactEvent({
      ts: TS,
      t: 'xx',
      g: ['Action'],
      p: ['Prime'],
    }) as unknown as AnyEvent;
    expect(ev.genres).toEqual(['Action']);
    expect(ev.providers).toEqual(['Prime']);
    expect(ev.provider).toBe('Prime');
  });
});

describe('readEventUniversal', () => {
  it('expandiert kompakte Events zum Full-Format', () => {
    const ev = readEventUniversal({ ts: TS, t: 'ep', s: 1399, st: 'GoT', sn: 1, ep: 1, rw: 0 });
    const e = ev as EpisodeWatchEvent;
    expect(e.type).toBe('episode_watch');
    expect(e.seriesId).toBe(1399);
    expect(e.seriesTitle).toBe('GoT');
    expect(e.timestamp).toBe(new Date(TS * 1000).toISOString());
    expect(e.isRewatch).toBe(false);
  });

  it('reicht Legacy-Events (timestamp-String) IDENTISCH durch (gleiche Objekt-Referenz, keine Kopie)', () => {
    const legacy = {
      timestamp: '2026-03-15T20:30:00.000Z',
      month: 3,
      dayOfWeek: 0,
      hour: 21,
      type: 'episode_watch',
      seriesId: 1399,
      seriesTitle: 'GoT',
      seasonNumber: 1,
      episodeNumber: 1,
      isRewatch: false,
    } as unknown as ActivityEvent;
    const result = readEventUniversal(legacy);
    expect(result).toBe(legacy);
  });

  it('Event mit ts (Number) UND timestamp (String) wird als Legacy roh durchgereicht', () => {
    const mixed = { ts: TS, timestamp: '2026-03-15T20:30:00.000Z', type: 'movie_watch' };
    expect(readEventUniversal(mixed)).toBe(mixed);
  });

  it('ts als String wird nicht als kompakt erkannt → Roh-Durchreichung', () => {
    const raw = { ts: String(TS), t: 'ep' };
    expect(readEventUniversal(raw)).toBe(raw);
  });

  it('null/undefined/Primitive werden unverändert durchgereicht (keine Fehler)', () => {
    expect(readEventUniversal(null)).toBeNull();
    expect(readEventUniversal(undefined)).toBeUndefined();
    expect(readEventUniversal('kaputt')).toBe('kaputt');
    expect(readEventUniversal(7)).toBe(7);
  });
});

describe('compactifyEvent', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('komprimiert ein volles Episode-Event zu Kurz-Keys und lässt falsy Flags weg', () => {
    const full = {
      timestamp: new Date(TS * 1000).toISOString(),
      month: 3,
      dayOfWeek: 0,
      hour: 21,
      type: 'episode_watch',
      seriesId: 1399,
      seriesTitle: 'GoT',
      seasonNumber: 3,
      episodeNumber: 9,
      episodeRuntime: 55,
      genres: ['Drama'],
      providers: ['Sky'],
      provider: 'Sky',
      isRewatch: false,
    } as unknown as ActivityEvent;
    expect(compactifyEvent(full)).toEqual({
      ts: TS,
      t: 'ep',
      s: 1399,
      st: 'GoT',
      sn: 3,
      ep: 9,
      rt: 55,
      g: ['Drama'],
      p: ['Sky'],
    });
  });

  it('ungültiger timestamp fällt auf "jetzt" (Unix-Sekunden) zurück', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T12:00:00.000Z'));
    const full = { timestamp: 'kein-datum', type: 'movie_watch' } as unknown as ActivityEvent;
    expect(compactifyEvent(full).ts).toBe(
      Math.floor(Date.parse('2026-07-02T12:00:00.000Z') / 1000)
    );
  });

  it('unbekannter Typ wird unverändert in t übernommen', () => {
    const full = {
      timestamp: new Date(TS * 1000).toISOString(),
      type: 'custom_event',
    } as unknown as ActivityEvent;
    expect(compactifyEvent(full).t).toBe('custom_event');
  });

  it('BEFUND: seriesId 0 geht verloren (||-Kette behandelt 0 als fehlend)', () => {
    const full = {
      timestamp: new Date(TS * 1000).toISOString(),
      type: 'episode_watch',
      seriesId: 0,
      isRewatch: false,
    } as unknown as ActivityEvent;
    expect('s' in compactifyEvent(full)).toBe(false);
  });

  it('rt: episodeRuntime 0 fällt per || auf runtime zurück; rt <= 0 wird verworfen', () => {
    const fallback = {
      timestamp: new Date(TS * 1000).toISOString(),
      type: 'episode_watch',
      episodeRuntime: 0,
      runtime: 90,
    } as unknown as ActivityEvent;
    expect(compactifyEvent(fallback).rt).toBe(90);
    const nullRt = {
      timestamp: new Date(TS * 1000).toISOString(),
      type: 'episode_watch',
      episodeRuntime: 0,
    } as unknown as ActivityEvent;
    expect('rt' in compactifyEvent(nullRt)).toBe(false);
  });

  it('leere genres/providers-Arrays werden weggelassen', () => {
    const full = {
      timestamp: new Date(TS * 1000).toISOString(),
      type: 'movie_watch',
      genres: [],
      providers: [],
    } as unknown as ActivityEvent;
    const c = compactifyEvent(full);
    expect('g' in c).toBe(false);
    expect('p' in c).toBe(false);
  });

  it('isRewatch ODER isReread ergeben rw: 1; rating 0 bleibt als rat: 0 erhalten', () => {
    const rewatch = {
      timestamp: new Date(TS * 1000).toISOString(),
      type: 'episode_watch',
      isRewatch: true,
    } as unknown as ActivityEvent;
    expect(compactifyEvent(rewatch).rw).toBe(1);
    const reread = {
      timestamp: new Date(TS * 1000).toISOString(),
      type: 'chapter_read',
      isReread: true,
    } as unknown as ActivityEvent;
    expect(compactifyEvent(reread).rw).toBe(1);
    const rated = {
      timestamp: new Date(TS * 1000).toISOString(),
      type: 'movie_rating',
      movieId: 1,
      rating: 0,
    } as unknown as ActivityEvent;
    expect(compactifyEvent(rated).rat).toBe(0);
  });
});

describe('Roundtrip compactify → expand', () => {
  it('Episode-Event überlebt den Roundtrip (temporale Felder werden aus ts neu abgeleitet)', () => {
    const iso = new Date(TS * 1000).toISOString();
    const full = {
      timestamp: iso,
      month: 99, // absichtlich falsch – Expansion leitet aus ts neu ab
      dayOfWeek: 99,
      hour: 99,
      type: 'episode_watch',
      seriesId: 1399,
      seriesTitle: 'GoT',
      seasonNumber: 3,
      episodeNumber: 9,
      episodeRuntime: 55,
      genres: ['Drama', 'Fantasy'],
      providers: ['Sky', 'WOW'],
      isRewatch: true,
      isBingeSession: true,
      bingeSessionId: 'b-1',
    } as unknown as ActivityEvent;
    const round = expandCompactEvent(compactifyEvent(full)) as unknown as EpisodeWatchEvent;
    expect(round.timestamp).toBe(iso);
    expect(round.type).toBe('episode_watch');
    expect(round.seriesId).toBe(1399);
    expect(round.seriesTitle).toBe('GoT');
    expect(round.seasonNumber).toBe(3);
    expect(round.episodeNumber).toBe(9);
    expect(round.episodeRuntime).toBe(55);
    expect(round.genres).toEqual(['Drama', 'Fantasy']);
    expect(round.providers).toEqual(['Sky', 'WOW']);
    expect(round.provider).toBe('Sky');
    expect(round.isRewatch).toBe(true);
    expect(round.isBingeSession).toBe(true);
    expect(round.bingeSessionId).toBe('b-1');
    const lf = localFields(TS);
    expect(round.month).toBe(lf.month);
    expect(round.dayOfWeek).toBe(lf.dayOfWeek);
    expect(round.hour).toBe(lf.hour);
    expect(round.deviceType).toBe('desktop');
  });

  it('Movie-Rating-Event überlebt den Roundtrip; Sub-Sekunden im timestamp gehen verloren', () => {
    const full = {
      timestamp: '2026-03-15T20:30:00.789Z',
      type: 'movie_rating',
      movieId: 550,
      movieTitle: 'Fight Club',
      rating: 8,
    } as unknown as ActivityEvent;
    const round = expandCompactEvent(compactifyEvent(full)) as unknown as MovieWatchEvent;
    expect(round.type).toBe('movie_rating');
    expect(round.movieId).toBe(550);
    expect(round.movieTitle).toBe('Fight Club');
    expect(round.rating).toBe(8);
    // Millisekunden werden beim Kompaktieren auf ganze Sekunden abgeschnitten
    expect(round.timestamp).toBe('2026-03-15T20:30:00.000Z');
  });
});
