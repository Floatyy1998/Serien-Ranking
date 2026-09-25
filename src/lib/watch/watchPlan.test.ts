import { describe, expect, it } from 'vitest';
import {
  compactWatchPlanDraft,
  expandPlanGuests,
  expandPlanInvites,
  expandWatchPlan,
  expandWatchPlanEntry,
  firstUnwatchedEpisode,
  formatPlanTime,
  groupWatchPlanByDate,
  guestCopyKey,
  planInviteId,
  planItemPath,
  planReminderAt,
  planUses12Hour,
  planSeasons,
  resolveWatchPlanEntry,
  sharedPlanFields,
  weekDateKeys,
  type WatchPlanEntry,
} from './watchPlan';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';

const mkSeries = (seasons: boolean[][]): Series =>
  ({
    id: 7,
    title: 'Serie',
    seasons: seasons.map((eps, s) => ({
      seasonNumber: s,
      episodes: eps.map((watched, e) => ({
        id: 1000 + s * 100 + e,
        episode_number: e + 1,
        name: `E${e + 1}`,
        watched,
        air_date: '2026-01-01',
      })),
    })),
  }) as unknown as Series;

const entry = (over: Partial<WatchPlanEntry> = {}): WatchPlanEntry => ({
  key: 'k1',
  kind: 'series',
  itemId: 7,
  title: 'Serie',
  date: '2026-09-25',
  createdAt: 1,
  ...over,
});

describe('expandWatchPlanEntry', () => {
  it('liest die Kurzform', () => {
    expect(
      expandWatchPlanEntry('a', {
        k: 's',
        id: 7,
        t: 'Serie',
        d: '2026-09-25',
        h: '20:15',
        s: 2,
        e: 3,
        x: 1102,
        n: ' mit Freunden ',
        c: 5,
      })
    ).toEqual({
      key: 'a',
      kind: 'series',
      itemId: 7,
      title: 'Serie',
      date: '2026-09-25',
      time: '20:15',
      seasonNumber: 2,
      episodeNumber: 3,
      episodeId: 1102,
      note: 'mit Freunden',
      createdAt: 5,
    });
  });

  it('verwirft kaputte Einträge und ungültige Uhrzeiten', () => {
    expect(expandWatchPlanEntry('a', null)).toBeNull();
    expect(expandWatchPlanEntry('a', { k: 'x', id: 1, d: '2026-09-25' })).toBeNull();
    expect(expandWatchPlanEntry('a', { k: 'm', id: 1, d: '25.09.2026' })).toBeNull();
    expect(expandWatchPlanEntry('a', { k: 'm', id: 1, d: '2026-09-25', h: '25:00' })?.time).toBe(
      undefined
    );
  });

  it('ignoriert Folgenangaben bei Filmen', () => {
    const film = expandWatchPlanEntry('a', { k: 'm', id: 1, d: '2026-09-25', s: 1, e: 2 });
    expect(film?.seasonNumber).toBeUndefined();
    expect(film?.episodeNumber).toBeUndefined();
  });

  it('expandWatchPlan überspringt Unlesbares', () => {
    expect(
      expandWatchPlan({ a: { k: 'm', id: 1, d: '2026-09-25' }, b: 'kaputt' }).map((e) => e.key)
    ).toEqual(['a']);
  });
});

describe('compactWatchPlanDraft', () => {
  it('schreibt keine undefined-Felder', () => {
    const stored = compactWatchPlanDraft(
      { kind: 'movie', itemId: 3, title: 'Film', date: '2026-09-25', time: '', note: '  ' },
      9
    );
    expect(stored).toEqual({ k: 'm', id: 3, t: 'Film', d: '2026-09-25', c: 9 });
    expect(Object.values(stored)).not.toContain(undefined);
  });

  it('lässt die Folge ohne Staffel weg und kürzt die Notiz', () => {
    const stored = compactWatchPlanDraft(
      { kind: 'series', itemId: 7, title: 'S', date: '2026-09-25', episodeNumber: 3 },
      1
    );
    expect(stored.e).toBeUndefined();
    const long = compactWatchPlanDraft(
      { kind: 'movie', itemId: 3, title: 'F', date: '2026-09-25', note: 'x'.repeat(200) },
      1
    );
    expect(long.n).toHaveLength(80);
  });

  it('übersteht den Rundweg', () => {
    const draft = {
      kind: 'series' as const,
      itemId: 7,
      title: 'Serie',
      date: '2026-09-25',
      time: '21:00',
      seasonNumber: 1,
      episodeNumber: 2,
      episodeId: 1001,
      note: 'Notiz',
    };
    expect(expandWatchPlanEntry('z', compactWatchPlanDraft(draft, 4))).toEqual({
      ...draft,
      key: 'z',
      createdAt: 4,
    });
  });
});

describe('groupWatchPlanByDate', () => {
  it('sortiert ganztägig vor Uhrzeit und dann nach Anlage', () => {
    const grouped = groupWatchPlanByDate([
      entry({ key: 'spät', time: '22:00' }),
      entry({ key: 'früh', time: '18:00' }),
      entry({ key: 'ohne2', createdAt: 5 }),
      entry({ key: 'ohne1', createdAt: 2 }),
      entry({ key: 'morgen', date: '2026-09-26' }),
    ]);
    expect(grouped.get('2026-09-25')?.map((e) => e.key)).toEqual([
      'ohne1',
      'ohne2',
      'früh',
      'spät',
    ]);
    expect(grouped.get('2026-09-26')?.map((e) => e.key)).toEqual(['morgen']);
  });
});

describe('Staffeln und Folgen', () => {
  it('nummeriert Staffeln 1-basiert aus der 0-basierten Position', () => {
    expect(planSeasons(mkSeries([[true], [false]])).map((s) => s.seasonNumber)).toEqual([1, 2]);
  });

  it('schlägt die erste ungesehene Folge vor', () => {
    const next = firstUnwatchedEpisode(
      mkSeries([
        [true, true],
        [true, false, false],
      ])
    );
    expect(next).toMatchObject({ seasonNumber: 2, episodeNumber: 2 });
    expect(firstUnwatchedEpisode(mkSeries([[true]]))).toBeNull();
  });

  it('löst per Folgen-Id auf und fällt auf die Nummer zurück', () => {
    const series = mkSeries([[true, false]]);
    const byId = new Map([[7, series]]);
    const done = resolveWatchPlanEntry(
      entry({ seasonNumber: 1, episodeNumber: 9, episodeId: 1000 }),
      byId,
      new Map()
    );
    expect(done.episode?.episodeNumber).toBe(1);
    expect(done.done).toBe(true);
    const open = resolveWatchPlanEntry(
      entry({ seasonNumber: 1, episodeNumber: 2 }),
      byId,
      new Map()
    );
    expect(open.done).toBe(false);
    expect(resolveWatchPlanEntry(entry(), byId, new Map()).done).toBe(false);
  });

  it('erkennt gesehene Filme', () => {
    const movie = { id: 3, title: 'Film', watched: true, rating: {} } as unknown as Movie;
    const resolved = resolveWatchPlanEntry(
      entry({ kind: 'movie', itemId: 3 }),
      new Map(),
      new Map([[3, movie]])
    );
    expect(resolved.done).toBe(true);
  });
});

describe('Hilfen', () => {
  it('liefert sieben lokale Tage ab Montag, auch über den Monatswechsel', () => {
    expect(weekDateKeys(new Date(2026, 8, 28))).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
  });

  it('baut den passenden Link', () => {
    expect(planItemPath({ kind: 'movie', itemId: 3 })).toBe('/movie/3');
    expect(planItemPath({ kind: 'series', itemId: 7 })).toBe('/series/7');
    expect(planItemPath({ kind: 'series', itemId: 7, seasonNumber: 2, episodeNumber: 4 })).toBe(
      '/episode/7/s/2/e/4'
    );
  });
});

describe('Erinnerung', () => {
  const base = {
    kind: 'movie' as const,
    itemId: 3,
    title: 'Film',
    date: '2026-09-25',
    time: '20:15',
  };

  it('rechnet den Zeitpunkt lokal minus Vorlauf', () => {
    expect(planReminderAt('2026-09-25', '20:15', 15)).toBe(new Date(2026, 8, 25, 20, 0).getTime());
    expect(planReminderAt('2026-09-25', undefined, 0)).toBeNull();
  });

  it('speichert Vorlauf und Zeitpunkt nur mit Uhrzeit', () => {
    const stored = compactWatchPlanDraft({ ...base, remindOffset: 60 }, 1);
    expect(stored.r).toBe(60);
    expect(stored.ra).toBe(new Date(2026, 8, 25, 19, 15).getTime());
    const ohneZeit = compactWatchPlanDraft({ ...base, time: undefined, remindOffset: 60 }, 1);
    expect(ohneZeit.r).toBeUndefined();
    expect(ohneZeit.ra).toBeUndefined();
  });

  it('behält den Versand-Stempel nur bei gleichem Zeitpunkt', () => {
    const at = planReminderAt('2026-09-25', '20:15', 15) ?? 0;
    const previous = { remindAt: at, remindSentAt: 99 };
    expect(compactWatchPlanDraft({ ...base, remindOffset: 15 }, 1, previous).rs).toBe(99);
    expect(
      compactWatchPlanDraft({ ...base, time: '21:00', remindOffset: 15 }, 1, previous).rs
    ).toBeUndefined();
  });

  it('liest die Felder zurück', () => {
    const entry = expandWatchPlanEntry('a', {
      k: 'm',
      id: 3,
      d: '2026-09-25',
      h: '20:15',
      r: 15,
      ra: 5,
      rs: 6,
    });
    expect(entry).toMatchObject({ remindOffset: 15, remindAt: 5, remindSentAt: 6 });
    expect(expandWatchPlanEntry('a', { k: 'm', id: 3, d: '2026-09-25', r: 15 })?.remindOffset).toBe(
      undefined
    );
  });
});

describe('12-Stunden-Format', () => {
  it('folgt dem Gerät nur bei gleicher Sprache', () => {
    expect(planUses12Hour('de-DE')).toBe(false);
    expect(planUses12Hour('en-US')).toBe(true);
    expect(planUses12Hour('en-US', 'en-GB')).toBe(false);
    expect(planUses12Hour('de-DE', 'en-US')).toBe(false);
  });

  it('formatiert Mitternacht, Mittag und Abend', () => {
    expect(formatPlanTime('00:05', true)).toBe('12:05 AM');
    expect(formatPlanTime('12:00', true)).toBe('12:00 PM');
    expect(formatPlanTime('20:15', true)).toBe('8:15 PM');
    expect(formatPlanTime('20:15', false)).toBe('20:15');
  });
});

describe('Gemeinsame Termine', () => {
  it('teilt nur Termin-Felder, nie Notiz oder Erinnerung', () => {
    const shared = sharedPlanFields({
      ...entry({ time: '20:15', seasonNumber: 1, episodeNumber: 2, episodeId: 9 }),
      poster: '/p.jpg',
    });
    expect(shared).toEqual({
      k: 's',
      id: 7,
      t: 'Serie',
      d: '2026-09-25',
      h: '20:15',
      s: 1,
      e: 2,
      x: 9,
      p: '/p.jpg',
    });
  });

  it('liest Einladungen und verwirft kaputte', () => {
    const invites = expandPlanInvites({
      host_a: { f: 'host', fn: 'Lisa', hk: 'a', k: 'm', id: 3, t: 'Film', d: '2026-09-27', ts: 1 },
      host_b: { f: 'host', hk: 'b', k: 's', id: 7, t: 'Serie', d: '2026-09-26', h: '21:00' },
      kaputt: { f: 'host', k: 'm', id: 3, d: '2026-09-27' },
    });
    expect(invites.map((i) => i.inviteId)).toEqual(['host_b', 'host_a']);
    expect(invites[1]).toMatchObject({ hostName: 'Lisa', kind: 'movie', hostKey: 'a' });
  });

  it('liest den Gäste-Status und ignoriert Unbekanntes', () => {
    const guests = expandPlanGuests({ k1: { u1: 'a', u2: 'p', u3: 'x' }, k2: { u4: 'zz' } });
    expect(guests.get('k1')).toEqual({ u1: 'a', u2: 'p' });
    expect(guests.has('k2')).toBe(false);
  });

  it('behält den Host-Verweis im Rundweg', () => {
    const stored = compactWatchPlanDraft(
      {
        kind: 'movie',
        itemId: 3,
        title: 'Film',
        date: '2026-09-25',
        via: { hostUid: 'h', hostKey: 'k', hostName: 'Lisa' },
      },
      1
    );
    expect(stored.v).toEqual({ f: 'h', k: 'k', n: 'Lisa' });
    expect(expandWatchPlanEntry('x', stored)?.via).toEqual({
      hostUid: 'h',
      hostKey: 'k',
      hostName: 'Lisa',
    });
  });

  it('baut stabile Schlüssel', () => {
    expect(planInviteId('h', 'k')).toBe('h_k');
    expect(guestCopyKey('h', 'k')).toBe('inv_h_k');
  });
});
