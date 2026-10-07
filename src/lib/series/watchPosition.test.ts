import { describe, expect, it } from 'vitest';
import { furthestWatchedPosition } from './watchPosition';

describe('furthestWatchedPosition', () => {
  it('liefert die weiteste gesehene Folge, Staffeln 1-basiert', () => {
    expect(
      furthestWatchedPosition([
        { seasonNumber: 1, episodes: [{ watched: true }, { watched: false }, { watched: true }] },
        { seasonNumber: 0, episodes: [{ watched: true }, { watched: true }] },
      ])
    ).toEqual({ season: 2, episode: 3 });
  });

  it('versteht Objekt-Folgen und liefert null ohne Gesehenes', () => {
    expect(
      furthestWatchedPosition([{ seasonNumber: 0, episodes: { 0: { watched: true }, 1: null } }])
    ).toEqual({ season: 1, episode: 1 });
    expect(furthestWatchedPosition([{ seasonNumber: 0, episodes: [{ watched: false }] }])).toBe(
      null
    );
    expect(furthestWatchedPosition(undefined)).toBe(null);
  });
});
