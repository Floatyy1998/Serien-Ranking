import { describe, expect, it } from 'vitest';
import type { FriendActivity } from '../../types/Friend';
import { getActivityMeta, getDateGroup, isMovieActivity, type ActivityTheme } from './activityMeta';

const act = (over: Partial<FriendActivity>): FriendActivity =>
  ({ type: 'series_added', ...over }) as unknown as FriendActivity;

const theme: ActivityTheme = {
  primary: '#p',
  accent: '#a',
  status: { error: '#e', warning: '#w', success: '#s' },
  text: { secondary: '#sec', muted: '#m' },
};

describe('isMovieActivity', () => {
  it('true für movie-Typen', () => {
    expect(isMovieActivity(act({ type: 'movie_rated' }))).toBe(true);
    expect(isMovieActivity(act({ type: 'movie_added_to_watchlist' }))).toBe(true);
  });
  it('true über itemType === "movie"', () => {
    expect(isMovieActivity(act({ type: 'series_added', itemType: 'movie' }))).toBe(true);
  });
  it('false für Serien-Aktivität', () => {
    expect(isMovieActivity(act({ type: 'series_rated' }))).toBe(false);
  });
});

describe('getActivityMeta', () => {
  it('Bewertung → "bewertet", isRating, warning-Farbe (mit accent-Fallback)', () => {
    const m = getActivityMeta(act({ type: 'series_rated' }));
    expect(m.verb).toBe('bewertet');
    expect(m.isRating).toBe(true);
    expect(m.subtle).toBe(false);
    expect(m.color(theme)).toBe('#w');
    expect(
      m.color({
        ...theme,
        status: { ...theme.status, warning: undefined as unknown as string },
      })
    ).toBe('#a');
  });
  it('episode_watched → verb + suffix, success-Farbe', () => {
    const m = getActivityMeta(act({ type: 'episode_watched' }));
    expect(m.verb).toBe('eine Folge von');
    expect(m.suffix).toBe('geschaut');
    expect(m.color(theme)).toBe('#s');
  });
  it('episodes_watched → Plural-verb', () => {
    expect(getActivityMeta(act({ type: 'episodes_watched' })).verb).toBe('Folgen von');
  });
  it('Watchlist add/remove', () => {
    expect(getActivityMeta(act({ type: 'series_added_to_watchlist' })).verb).toBe(
      'auf die Watchlist gesetzt'
    );
    const rem = getActivityMeta(act({ type: 'movie_removed_from_watchlist' }));
    expect(rem.verb).toBe('von der Watchlist entfernt');
    expect(rem.subtle).toBe(true);
    expect(rem.color(theme)).toBe('#m');
  });
  it('Löschung → subtle, muted', () => {
    const m = getActivityMeta(act({ type: 'series_deleted' }));
    expect(m.verb).toBe('aus der Liste entfernt');
    expect(m.subtle).toBe(true);
  });
  it('default/added → Farbe je nach movie/series', () => {
    expect(getActivityMeta(act({ type: 'series_added' })).color(theme)).toBe('#p');
    expect(getActivityMeta(act({ type: 'movie_added' })).color(theme)).toBe('#a');
    // unbekannter Typ → default
    expect(
      getActivityMeta(act({ type: 'irgendwas' as unknown as FriendActivity['type'] })).verb
    ).toBe('zur Liste hinzugefügt');
  });
});

describe('getDateGroup', () => {
  const now = new Date('2026-07-04T15:00:00').getTime();
  const startOfToday = (() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const day = 86400000;
  it('Heute / Gestern / Diese Woche / Älter', () => {
    expect(getDateGroup(startOfToday + 3600000, now)).toBe('Heute');
    expect(getDateGroup(startOfToday - 1, now)).toBe('Gestern');
    expect(getDateGroup(startOfToday - 3 * day, now)).toBe('Diese Woche');
    expect(getDateGroup(startOfToday - 10 * day, now)).toBe('Älter');
  });
});
