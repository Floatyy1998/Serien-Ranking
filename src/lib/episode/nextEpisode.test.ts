import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import {
  advanceSeriesNextEpisodes,
  findLastWatchedPosition,
  findNextEpisodePosition,
} from './nextEpisode';

type Season = Series['seasons'][number];
type Episode = Season['episodes'][number];

let nextId = 1;

const ep = (o: Partial<Episode> = {}): Episode =>
  ({
    id: nextId++,
    air_date: '2020-01-01',
    name: 'Ep',
    watched: false,
    ...o,
  }) as Episode;

const seen = (lastWatchedAt?: string, extra: Partial<Episode> = {}): Episode =>
  ep({ watched: true, ...(lastWatchedAt ? { lastWatchedAt } : {}), ...extra });

const unaired = (): Episode => ep({ air_date: '2999-01-01' });

/** Staffel mit `count` Folgen; `seen` = Indizes gesehener Folgen (alle ohne Zeitstempel). */
const season = (seasonNumber: number, episodes: Episode[]): Season =>
  ({ seasonNumber, episodes }) as Season;

const makeSeries = (seasons: Season[]): Series =>
  ({ id: 1, title: 'Test', seasons, rating: {} }) as unknown as Series;

const open = (n: number): Episode[] => Array.from({ length: n }, () => ep());

describe('findLastWatchedPosition', () => {
  it('liefert null, wenn nichts gesehen wurde', () => {
    expect(findLastWatchedPosition(makeSeries([season(0, open(3))]))).toBeNull();
  });

  it('nimmt die Folge mit dem jüngsten Zeitstempel, nicht die letzte in der Reihenfolge', () => {
    const s = makeSeries([
      season(0, [seen('2026-10-30T10:00:00.000Z'), ep()]),
      season(1, [seen('2026-10-01T10:00:00.000Z'), ep()]),
    ]);
    expect(findLastWatchedPosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 0 });
  });

  it('bei gleichem Zeitstempel (Bulk-Mark) gewinnt die spätere Folge', () => {
    const stamp = '2026-10-30T10:00:00.000Z';
    const s = makeSeries([season(0, [seen(stamp), seen(stamp), seen(stamp), ep()])]);
    expect(findLastWatchedPosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 2 });
  });

  it('ohne Zeitstempel (Legacy) gewinnt die in Staffelreihenfolge letzte gesehene Folge', () => {
    const s = makeSeries([season(0, [seen(), seen(), ep()]), season(1, [seen(), ep()])]);
    expect(findLastWatchedPosition(s)).toEqual({ seasonIndex: 1, episodeIndex: 0 });
  });

  it('nutzt firstWatchedAt, wenn lastWatchedAt fehlt', () => {
    const s = makeSeries([
      season(0, [seen(undefined, { firstWatchedAt: '2026-10-30T10:00:00.000Z' }), ep()]),
      season(1, [seen('2026-10-01T10:00:00.000Z'), ep()]),
    ]);
    expect(findLastWatchedPosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 0 });
  });
});

describe('findNextEpisodePosition', () => {
  it('liefert S1E1, wenn noch nichts gesehen wurde', () => {
    const s = makeSeries([season(0, open(3)), season(1, open(3))]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 0 });
  });

  it('liefert null, wenn alles gesehen ist', () => {
    const s = makeSeries([season(0, [seen('2026-01-01T00:00:00.000Z'), seen()])]);
    expect(findNextEpisodePosition(s)).toBeNull();
  });

  it('liefert null ohne Staffeln', () => {
    expect(findNextEpisodePosition(makeSeries(undefined as unknown as Season[]))).toBeNull();
  });

  it('klassisch: in Reihenfolge geschaut → die nächste Folge danach', () => {
    const s = makeSeries([
      season(0, [seen('2026-01-01T00:00:00.000Z'), seen('2026-01-02T00:00:00.000Z'), ep(), ep()]),
    ]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 2 });
  });

  it('Einstieg bei Staffel 8: S1–S7 bleiben offen, nächste Folge ist S8E5', () => {
    const seasons = Array.from({ length: 7 }, (_, i) => season(i, open(10)));
    seasons.push(
      season(7, [
        seen('2026-10-27T20:00:00.000Z'),
        seen('2026-10-28T20:00:00.000Z'),
        seen('2026-10-29T20:00:00.000Z'),
        seen('2026-10-30T20:00:00.000Z'),
        ...open(10),
      ])
    );
    expect(findNextEpisodePosition(makeSeries(seasons))).toEqual({
      seasonIndex: 7,
      episodeIndex: 4,
    });
  });

  it('Staffel 8 fertig, keine weitere Staffel → von vorn (S1E1)', () => {
    const s = makeSeries([
      season(0, open(3)),
      season(7, [seen('2026-10-29T20:00:00.000Z'), seen('2026-10-30T20:00:00.000Z')]),
    ]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 0 });
  });

  it('Staffel 8 fertig, S9 schon ausgestrahlt → S9E1', () => {
    const s = makeSeries([
      season(0, open(3)),
      season(7, [seen('2026-10-29T20:00:00.000Z'), seen('2026-10-30T20:00:00.000Z')]),
      season(8, open(2)),
    ]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 2, episodeIndex: 0 });
  });

  it('nach dem Anker nur unveröffentlichte Folgen → von vorn', () => {
    const s = makeSeries([
      season(0, open(3)),
      season(7, [seen('2026-10-30T20:00:00.000Z'), unaired(), unaired()]),
    ]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 0 });
  });

  it('überspringt unveröffentlichte Folgen hinter dem Anker bis zur nächsten ausgestrahlten', () => {
    const s = makeSeries([season(0, [seen('2026-10-30T20:00:00.000Z'), unaired(), ep()])]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 2 });
  });

  it('Freund-Szenario: S3E5 früher mit Freund gesehen, dann daheim S1E1 → S1E2', () => {
    const s = makeSeries([
      season(0, [seen('2026-10-30T20:00:00.000Z'), ...open(5)]),
      season(1, open(6)),
      season(2, [...open(4), seen('2026-10-20T20:00:00.000Z'), ...open(1)]),
    ]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 1 });
  });

  it('Lücke hinter dem Anker wird erst nach dem Wrap vorgeschlagen', () => {
    const withGap = makeSeries([
      season(1, [
        seen('2026-10-01T20:00:00.000Z'),
        seen('2026-10-02T20:00:00.000Z'),
        ep(), // vergessen
        seen('2026-10-04T20:00:00.000Z'),
        seen('2026-10-05T20:00:00.000Z'),
        ep(),
      ]),
    ]);
    expect(findNextEpisodePosition(withGap)).toEqual({ seasonIndex: 0, episodeIndex: 5 });

    const onlyGapLeft = makeSeries([
      season(1, [
        seen('2026-10-01T20:00:00.000Z'),
        ep(),
        seen('2026-10-04T20:00:00.000Z'),
        seen('2026-10-05T20:00:00.000Z'),
      ]),
    ]);
    expect(findNextEpisodePosition(onlyGapLeft)).toEqual({ seasonIndex: 0, episodeIndex: 1 });
  });

  it('Legacy ohne Zeitstempel verhält sich wie bisher (erste offene nach der letzten gesehenen)', () => {
    const s = makeSeries([season(0, [seen(), seen(), ep(), ep()])]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 2 });
  });

  it('gemischt: Folge mit Zeitstempel schlägt Legacy-Folgen ohne Zeitstempel', () => {
    const s = makeSeries([
      season(0, [seen('2026-10-30T20:00:00.000Z'), ...open(3)]),
      season(4, [seen(), ...open(3)]),
    ]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 0, episodeIndex: 1 });
  });

  it('ignoriert Null-Löcher in Staffeln und Folgen', () => {
    const s = makeSeries([
      null as unknown as Season,
      season(1, [null as unknown as Episode, seen('2026-10-30T20:00:00.000Z'), ep()]),
    ]);
    expect(findNextEpisodePosition(s)).toEqual({ seasonIndex: 1, episodeIndex: 2 });
  });
});

describe('advanceSeriesNextEpisodes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-30T12:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('gibt bei count 0 dieselbe Referenz zurück und markiert nichts', () => {
    const s = makeSeries([season(0, open(2))]);
    const result = advanceSeriesNextEpisodes(s, 0);
    expect(result.series).toBe(s);
    expect(result.marked).toEqual([]);
  });

  it('hakt ab dem Anker vorwärts ab und verändert das Original nicht', () => {
    const s = makeSeries([
      season(0, open(2)),
      season(7, [seen('2026-10-29T20:00:00.000Z'), ...open(3)]),
    ]);
    const { series: advanced, marked } = advanceSeriesNextEpisodes(s, 2);
    expect(marked).toEqual([
      { seasonIndex: 1, episodeIndex: 1 },
      { seasonIndex: 1, episodeIndex: 2 },
    ]);
    expect(findNextEpisodePosition(advanced)).toEqual({ seasonIndex: 1, episodeIndex: 3 });
    expect(s.seasons[1].episodes[1].watched).toBe(false);
    expect(advanced.seasons[0]).toBe(s.seasons[0]);
  });

  it('Wrap-Fall: der Anker wandert mit, sodass die nächste Folge nicht doppelt getroffen wird', () => {
    const s = makeSeries([
      season(0, open(3)),
      season(7, [seen('2026-10-29T20:00:00.000Z'), seen('2026-10-30T20:00:00.000Z')]),
    ]);
    const { series: advanced, marked } = advanceSeriesNextEpisodes(s, 1);
    expect(marked).toEqual([{ seasonIndex: 0, episodeIndex: 0 }]);
    expect(findNextEpisodePosition(advanced)).toEqual({ seasonIndex: 0, episodeIndex: 1 });
  });

  it('stoppt, wenn keine offene Folge mehr übrig ist', () => {
    const s = makeSeries([season(0, [seen('2026-10-29T20:00:00.000Z'), ep(), unaired()])]);
    const { series: advanced, marked } = advanceSeriesNextEpisodes(s, 5);
    expect(marked).toEqual([{ seasonIndex: 0, episodeIndex: 1 }]);
    expect(findNextEpisodePosition(advanced)).toBeNull();
  });
});
