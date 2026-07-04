import { describe, expect, it } from 'vitest';
import { calculateAchievements } from './achievements';
import type { AchievementContext } from './achievements';
import type { BingeSession } from '../../types/WatchActivity';

const ctx = (over: Partial<AchievementContext> = {}): AchievementContext => ({
  totalEpisodes: 0,
  totalMovies: 0,
  totalMinutes: 0,
  favoriteTimeOfDay: { timeOfDay: 'evening', label: 'Abends (18-22 Uhr)', count: 0, percentage: 0 },
  favoriteDayOfWeek: { dayOfWeek: 2, dayName: 'Dienstag', count: 0, percentage: 0 },
  topGenres: [],
  longestStreak: 0,
  yearBingeSessions: [],
  ...over,
});

const session = (episodeCount: number): BingeSession => ({
  id: 'b',
  startedAt: '2025-01-01T20:00:00',
  seriesId: 1,
  seriesTitle: 'Dark',
  episodes: Array.from({ length: episodeCount }, (_, i) => ({
    seasonNumber: 1,
    episodeNumber: i + 1,
    watchedAt: 'x',
  })),
  totalMinutes: episodeCount * 45,
  isActive: false,
});

const byId = (c: AchievementContext, id: string) => {
  const found = calculateAchievements(c).find((a) => a.id === id);
  if (!found) throw new Error(`achievement ${id} nicht gefunden`);
  return found;
};

describe('calculateAchievements', () => {
  it('liefert immer alle 10 Templates', () => {
    const result = calculateAchievements(ctx());
    expect(result).toHaveLength(10);
  });

  it('mit leerem Kontext ist keines freigeschaltet', () => {
    expect(calculateAchievements(ctx()).every((a) => !a.unlocked)).toBe(true);
  });

  it('sortiert freigeschaltete Achievements nach vorne', () => {
    const result = calculateAchievements(ctx({ totalMovies: 20, totalMinutes: 100 * 60 }));
    const unlocked = result.filter((a) => a.unlocked).map((a) => a.id);
    expect(unlocked).toEqual(['movie_lover', 'marathon_runner']);
    // Die ersten beiden Einträge sind die freigeschalteten
    expect(result.slice(0, 2).every((a) => a.unlocked)).toBe(true);
  });

  it('night_owl: night + >= 30%', () => {
    expect(
      byId(
        ctx({ favoriteTimeOfDay: { timeOfDay: 'night', label: 'x', count: 1, percentage: 30 } }),
        'night_owl'
      ).unlocked
    ).toBe(true);
    expect(
      byId(
        ctx({ favoriteTimeOfDay: { timeOfDay: 'night', label: 'x', count: 1, percentage: 29 } }),
        'night_owl'
      ).unlocked
    ).toBe(false);
    expect(
      byId(
        ctx({ favoriteTimeOfDay: { timeOfDay: 'morning', label: 'x', count: 1, percentage: 90 } }),
        'night_owl'
      ).unlocked
    ).toBe(false);
    expect(
      byId(
        ctx({ favoriteTimeOfDay: { timeOfDay: 'night', label: 'x', count: 1, percentage: 42 } }),
        'night_owl'
      ).value
    ).toBe('42%');
  });

  it('early_bird: morning + >= 30%', () => {
    expect(
      byId(
        ctx({ favoriteTimeOfDay: { timeOfDay: 'morning', label: 'x', count: 1, percentage: 35 } }),
        'early_bird'
      ).unlocked
    ).toBe(true);
    expect(
      byId(
        ctx({ favoriteTimeOfDay: { timeOfDay: 'morning', label: 'x', count: 1, percentage: 20 } }),
        'early_bird'
      ).unlocked
    ).toBe(false);
  });

  it('binge_king: >= 10 Episoden in einer Session; value = längste Session', () => {
    expect(byId(ctx({ yearBingeSessions: [session(10)] }), 'binge_king').unlocked).toBe(true);
    expect(byId(ctx({ yearBingeSessions: [session(10)] }), 'binge_king').value).toBe(10);
    expect(byId(ctx({ yearBingeSessions: [session(9)] }), 'binge_king').unlocked).toBe(false);
    // maxBinge über mehrere Sessions
    expect(
      byId(ctx({ yearBingeSessions: [session(3), session(12), session(5)] }), 'binge_king').value
    ).toBe(12);
    // ohne Sessions → 0
    expect(byId(ctx(), 'binge_king').value).toBe(0);
  });

  it('movie_lover: >= 20 Filme', () => {
    expect(byId(ctx({ totalMovies: 20 }), 'movie_lover').unlocked).toBe(true);
    expect(byId(ctx({ totalMovies: 19 }), 'movie_lover').unlocked).toBe(false);
    expect(byId(ctx({ totalMovies: 33 }), 'movie_lover').value).toBe(33);
  });

  it('series_addict: >= 500 Episoden', () => {
    expect(byId(ctx({ totalEpisodes: 500 }), 'series_addict').unlocked).toBe(true);
    expect(byId(ctx({ totalEpisodes: 499 }), 'series_addict').unlocked).toBe(false);
  });

  it('genre_explorer: >= 5 Genres', () => {
    const genres = Array.from({ length: 5 }, (_, i) => ({
      genre: `G${i}`,
      count: 1,
      percentage: 20,
      minutesWatched: 10,
    }));
    expect(byId(ctx({ topGenres: genres }), 'genre_explorer').unlocked).toBe(true);
    expect(byId(ctx({ topGenres: genres.slice(0, 4) }), 'genre_explorer').unlocked).toBe(false);
    expect(byId(ctx({ topGenres: genres }), 'genre_explorer').value).toBe(5);
  });

  it('weekend_warrior: Sa/So + >= 50%', () => {
    const day = (dayOfWeek: number, percentage: number) =>
      ctx({ favoriteDayOfWeek: { dayOfWeek, dayName: 'x', count: 1, percentage } });
    expect(byId(day(6, 50), 'weekend_warrior').unlocked).toBe(true);
    expect(byId(day(0, 50), 'weekend_warrior').unlocked).toBe(true);
    expect(byId(day(6, 49), 'weekend_warrior').unlocked).toBe(false);
    expect(byId(day(3, 99), 'weekend_warrior').unlocked).toBe(false);
  });

  it('consistent: >= 30 Tage Streak', () => {
    expect(byId(ctx({ longestStreak: 30 }), 'consistent').unlocked).toBe(true);
    expect(byId(ctx({ longestStreak: 29 }), 'consistent').unlocked).toBe(false);
  });

  it('marathon_runner: gerundete Stunden >= 100', () => {
    expect(byId(ctx({ totalMinutes: 5970 }), 'marathon_runner').unlocked).toBe(true); // round(99.5)=100
    expect(byId(ctx({ totalMinutes: 5970 }), 'marathon_runner').value).toBe('100h');
    expect(byId(ctx({ totalMinutes: 5940 }), 'marathon_runner').unlocked).toBe(false); // 99h
  });

  it('completionist ist nie freischaltbar (keine Logik)', () => {
    const c = byId(
      ctx({ totalEpisodes: 99999, totalMovies: 9999, longestStreak: 999 }),
      'completionist'
    );
    expect(c.unlocked).toBe(false);
    expect(c.value).toBeUndefined();
  });

  it('behält Template-Felder (title/description/icon) bei', () => {
    const nightOwl = byId(ctx(), 'night_owl');
    expect(nightOwl.title).toBe('Nachteule');
    expect(nightOwl.icon).toBe('moon');
  });
});
