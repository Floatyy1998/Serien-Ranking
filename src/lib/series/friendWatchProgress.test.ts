import { describe, expect, it } from 'vitest';
import type { Series } from '../../types/Series';
import {
  analyzeFriendWatch,
  buildSeasonMaps,
  buildSeasonMapsFromCatalog,
  totalEpisodesOf,
} from './friendWatchProgress';

const seasons = [
  { seasonNumber: 0, episodes: [{ id: 11 }, { id: 12 }] },
  { seasonNumber: 1, episodes: [{ id: 21 }, { id: 22 }, { id: 23 }] },
] as unknown as Series['seasons'];

describe('buildSeasonMaps', () => {
  it('maps episode ids to season/episode positions', () => {
    const maps = buildSeasonMaps(seasons);
    // seasonNumber ist 0-basiert, angezeigt wird +1.
    expect(maps.epIdToPos.get(11)).toEqual({ seasonNumber: 1, episodeNumber: 1, absIndex: 1 });
    expect(maps.epIdToPos.get(23)).toEqual({ seasonNumber: 2, episodeNumber: 3, absIndex: 5 });
    expect(totalEpisodesOf(maps)).toBe(5);
  });

  it('survives missing seasons', () => {
    expect(totalEpisodesOf(buildSeasonMaps(null))).toBe(0);
    expect(totalEpisodesOf(buildSeasonMaps(undefined))).toBe(0);
  });
});

describe('buildSeasonMapsFromCatalog', () => {
  it('uses the record key as the season key, not seasonNumber', () => {
    // Der Katalog-Schlüssel ist die Position; `seasonNumber` im Wert kann die
    // echte Staffelnummer tragen. Nur der Schlüssel passt zu den Watch-Daten.
    const maps = buildSeasonMapsFromCatalog({
      '0': { seasonNumber: 7, episodes: [{ id: 11 }, { id: 12 }] },
      '1': { seasonNumber: 8, episodes: [{ id: 21 }] },
    } as never);
    expect([...maps.seasonArrayPositions.keys()].sort()).toEqual(['0', '1']);
    expect(maps.epIdToPos.get(21)).toEqual({ seasonNumber: 2, episodeNumber: 1, absIndex: 3 });
    expect(totalEpisodesOf(maps)).toBe(3);
  });

  it('returns empty maps without a record', () => {
    expect(totalEpisodesOf(buildSeasonMapsFromCatalog(null))).toBe(0);
  });
});

describe('analyzeFriendWatch', () => {
  const maps = buildSeasonMaps(seasons);

  it('counts the compact format keyed by episode id', () => {
    const result = analyzeFriendWatch(
      {
        seasons: {
          '0': { eps: { '11': { w: 1 }, '12': { w: 1 } } },
          '1': { eps: { '21': { w: 1 } } },
        },
      },
      maps
    );
    expect(result.watched).toBe(3);
    expect(result.latest).toEqual({ seasonNumber: 2, episodeNumber: 1, absIndex: 3 });
  });

  it('counts the legacy position array', () => {
    const result = analyzeFriendWatch({ seasons: { '1': { w: [1, 0, 1] } } }, maps);
    expect(result.watched).toBe(2);
    // Weiteste gesehene Folge, nicht die letzte gezählte.
    expect(result.latest).toEqual({ seasonNumber: 2, episodeNumber: 3, absIndex: 5 });
  });

  it('ignores flags other than 1', () => {
    const result = analyzeFriendWatch({ seasons: { '0': { eps: { '11': { w: 0 } } } } }, maps);
    expect(result).toEqual({ watched: 0, latest: null });
  });

  it('returns nothing for an empty snapshot', () => {
    expect(analyzeFriendWatch(null, maps)).toEqual({ watched: 0, latest: null });
    expect(analyzeFriendWatch({}, maps)).toEqual({ watched: 0, latest: null });
  });
});
