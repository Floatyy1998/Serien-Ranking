/**
 * Characterization-Tests für wrappedCalculator (Re-Export-Fassade über src/services/wrapped/*).
 *
 * Diese Tests pinnen das IST-Verhalten der puren Wrapped-Berechnungsfunktionen fest,
 * damit Refactorings (Fassade, Adapter-Typisierung, Extension-Parität) nichts
 * stillschweigend ändern. Sie ändern KEIN Verhalten des Moduls.
 *
 * Hinweis Zeitzonen: alle Timestamps sind bewusst OHNE 'Z'-Suffix (lokale Zeit),
 * damit new Date(...)-basierte Ableitungen (Jahr, Minuten, Datumsformat)
 * unabhängig von der Maschinen-Zeitzone deterministisch sind.
 * Ausnahme: findMostActiveDay parst den Date-only-Key ('YYYY-MM-DD') als UTC —
 * der dayName-Assert gilt für Zeitzonen >= UTC (z.B. Europe/Berlin).
 */
import { describe, expect, it } from 'vitest';
import type { AchievementContext, FunFactContext } from './wrapped';
import {
  calculateFavoriteDayOfWeek,
  calculateFavoriteTimeOfDay,
  calculateHeatmapData,
  calculateLateNightStats,
  calculateMonthlyBreakdown,
  calculateAchievements,
  calculateTopGenres,
  calculateTopMovies,
  calculateTopProviders,
  calculateTopSeries,
  findFirstWatch,
  findLastWatch,
  findMostActiveDay,
  findMostActiveMonth,
  generateFunFacts,
} from './wrapped';
import { calculateWrappedStats } from './wrappedCalculator';
import type {
  ActivityEvent,
  BingeSession,
  EpisodeWatchEvent,
  MovieWatchEvent,
} from '../types/WatchActivity';

// Builder

const ep = (over: Partial<EpisodeWatchEvent> = {}): EpisodeWatchEvent => ({
  type: 'episode_watch',
  timestamp: '2025-06-15T20:30:00',
  month: 6,
  dayOfWeek: 0,
  hour: 20,
  seriesId: 1,
  seriesTitle: 'Dark',
  seasonNumber: 1,
  episodeNumber: 1,
  isRewatch: false,
  ...over,
});

const mov = (over: Partial<MovieWatchEvent> = {}): MovieWatchEvent => ({
  type: 'movie_watch',
  timestamp: '2025-06-15T21:00:00',
  month: 6,
  dayOfWeek: 0,
  hour: 21,
  movieId: 100,
  movieTitle: 'Inception',
  ...over,
});

const binge = (over: Partial<BingeSession> = {}): BingeSession => ({
  id: 'b1',
  startedAt: '2025-03-01T20:00:00',
  seriesId: 1,
  seriesTitle: 'Dark',
  episodes: [
    { seasonNumber: 1, episodeNumber: 1, watchedAt: '2025-03-01T20:00:00' },
    { seasonNumber: 1, episodeNumber: 2, watchedAt: '2025-03-01T20:45:00' },
    { seasonNumber: 1, episodeNumber: 3, watchedAt: '2025-03-01T21:30:00' },
  ],
  totalMinutes: 135,
  isActive: false,
  ...over,
});

const achCtx = (over: Partial<AchievementContext> = {}): AchievementContext => ({
  totalEpisodes: 0,
  totalMovies: 0,
  totalMinutes: 0,
  favoriteTimeOfDay: {
    timeOfDay: 'evening',
    label: 'Abends (18-22 Uhr)',
    count: 0,
    percentage: 0,
  },
  favoriteDayOfWeek: { dayOfWeek: 2, dayName: 'Dienstag', count: 0, percentage: 0 },
  topGenres: [],
  longestStreak: 0,
  yearBingeSessions: [],
  ...over,
});

const ffCtx = (over: Partial<FunFactContext> = {}): FunFactContext => ({
  totalMinutes: 7200,
  totalEpisodes: 100,
  totalMovies: 10,
  topSeries: [],
  mostActiveMonth: {
    month: 6,
    monthName: 'Juni',
    episodesWatched: 25,
    moviesWatched: 5,
    minutesWatched: 1000,
  },
  favoriteTimeOfDay: { timeOfDay: 'night', label: 'Nachts (22-6 Uhr)', count: 10, percentage: 40 },
  ...over,
});

/** find() ohne non-null-assertion — wirft, wenn das Element fehlt. */
const mustFind = <T>(list: T[], predicate: (item: T) => boolean): T => {
  const found = list.find(predicate);
  if (!found) throw new Error('Element nicht gefunden');
  return found;
};

const achievementById = (ctx: AchievementContext, id: string) =>
  mustFind(calculateAchievements(ctx), (a) => a.id === id);

// calculateWrappedStats (Fassade + Gesamtaggregation)

describe('calculateWrappedStats', () => {
  it('liefert für ein leeres Jahr die dokumentierten Null-/Fallback-Werte', () => {
    const stats = calculateWrappedStats([], [], 2025);

    expect(stats.year).toBe(2025);
    expect(stats.totalEpisodesWatched).toBe(0);
    expect(stats.totalMoviesWatched).toBe(0);
    expect(stats.totalMinutesWatched).toBe(0);
    expect(stats.totalHoursWatched).toBe(0);
    expect(stats.totalDaysEquivalent).toBe(0);
    expect(stats.uniqueSeriesWatched).toBe(0);
    expect(stats.topSeries).toEqual([]);
    expect(stats.topMovies).toEqual([]);
    expect(stats.topGenres).toEqual([]);
    expect(stats.topProviders).toEqual([]);
    // Reduce mit strict > → bei komplett leerem Jahr gewinnt der erste Monat (Januar)
    expect(stats.mostActiveMonth.monthName).toBe('Januar');
    // IST-Verhalten: leeres Jahr → date '' und dayName undefined (DAY_NAMES[NaN])
    expect(stats.mostActiveDay.date).toBe('');
    expect(stats.mostActiveDay.dayName).toBeUndefined();
    // Default-Favorit ist 'evening' mit 0
    expect(stats.favoriteTimeOfDay).toEqual({
      timeOfDay: 'evening',
      label: 'Abends (18-22 Uhr)',
      count: 0,
      percentage: 0,
    });
    // indexOf(max) auf lauter Nullen → Sonntag (Index 0)
    expect(stats.favoriteDayOfWeek.dayName).toBe('Sonntag');
    expect(stats.monthlyBreakdown).toHaveLength(12);
    expect(stats.totalBingeSessions).toBe(0);
    expect(stats.longestBingeSession).toBeNull();
    expect(stats.averageBingeLength).toBe(0);
    // Streaks sind hart auf 0 verdrahtet (TODO im Modul)
    expect(stats.longestStreak).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.firstWatch).toBeNull();
    expect(stats.lastWatch).toBeNull();
    expect(stats.lateNightStats).toEqual({
      totalLateNightWatches: 0,
      midnightWatches: 0,
      latestWatch: null,
      percentage: 0,
    });
    expect(stats.heatmapData).toHaveLength(7);
    expect(stats.heatmapData.every((row) => row.length === 24 && row.every((c) => c === 0))).toBe(
      true
    );
    expect(stats.achievements).toHaveLength(10);
    expect(stats.achievements.every((a) => !a.unlocked)).toBe(true);
    expect(stats.funFacts.length).toBeGreaterThan(0);
  });

  it('filtert Events strikt aufs Kalenderjahr des Timestamps', () => {
    const events: ActivityEvent[] = [
      ep({ timestamp: '2024-12-31T23:00:00' }),
      ep({ timestamp: '2025-01-01T00:30:00', month: 1 }),
      ep({ timestamp: '2025-12-31T22:00:00', month: 12 }),
      ep({ timestamp: '2026-01-01T01:00:00', month: 1 }),
    ];
    const stats = calculateWrappedStats(events, [], 2025);
    expect(stats.totalEpisodesWatched).toBe(2);
  });

  it('zählt movie_rating-Events als geschaute Filme inklusive Laufzeit (IST-Verhalten)', () => {
    const events: ActivityEvent[] = [
      mov({ type: 'movie_rating', runtime: 90, rating: 8 }),
      mov({ type: 'movie_watch', runtime: 100 }),
    ];
    const stats = calculateWrappedStats(events, [], 2025);
    expect(stats.totalMoviesWatched).toBe(2);
    expect(stats.totalMinutesWatched).toBe(190);
  });

  it('nutzt Default-Runtimes (Episode 45, Film 120) und rundet Stunden/Tage', () => {
    const events: ActivityEvent[] = [
      ep(), // kein episodeRuntime → 45
      ep({ episodeRuntime: 30, seriesId: 2, seriesTitle: 'Severance' }),
      mov(), // kein runtime → 120
      mov({ type: 'movie_rating', runtime: 90, movieId: 101 }),
    ];
    const stats = calculateWrappedStats(events, [], 2025);
    expect(stats.totalMinutesWatched).toBe(45 + 30 + 120 + 90); // 285
    expect(stats.totalHoursWatched).toBe(5); // Math.round(4.75)
    expect(stats.totalDaysEquivalent).toBe(0.2); // auf 1 Nachkommastelle gerundet
    expect(stats.uniqueSeriesWatched).toBe(2);
  });

  it('behandelt episodeRuntime 0 als fehlend (|| → Default 45)', () => {
    const stats = calculateWrappedStats([ep({ episodeRuntime: 0 })], [], 2025);
    expect(stats.totalMinutesWatched).toBe(45);
  });

  it('filtert Binge-Sessions aufs Jahr, findet die längste (erste gewinnt bei Gleichstand) und rundet den Schnitt', () => {
    const sessions: BingeSession[] = [
      binge({ id: 'b0', startedAt: '2024-12-30T20:00:00' }), // anderes Jahr → ignoriert
      binge({
        id: 'b1',
        seriesId: 7,
        seriesTitle: 'Breaking Bad',
        totalMinutes: 200,
        episodes: [
          { seasonNumber: 1, episodeNumber: 1, watchedAt: 'x' },
          { seasonNumber: 1, episodeNumber: 2, watchedAt: 'x' },
          { seasonNumber: 1, episodeNumber: 3, watchedAt: 'x' },
          { seasonNumber: 1, episodeNumber: 4, watchedAt: 'x' },
        ],
      }),
      binge({
        id: 'b2',
        seriesTitle: 'Zweiter Vierer',
        startedAt: '2025-05-05T20:00:00',
        episodes: [
          { seasonNumber: 2, episodeNumber: 1, watchedAt: 'x' },
          { seasonNumber: 2, episodeNumber: 2, watchedAt: 'x' },
          { seasonNumber: 2, episodeNumber: 3, watchedAt: 'x' },
          { seasonNumber: 2, episodeNumber: 4, watchedAt: 'x' },
        ],
      }),
      binge({ id: 'b3' }), // 3 Episoden
    ];
    const stats = calculateWrappedStats([], sessions, 2025);
    expect(stats.totalBingeSessions).toBe(3);
    expect(stats.longestBingeSession).toEqual({
      seriesId: 7,
      seriesTitle: 'Breaking Bad',
      episodeCount: 4,
      totalMinutes: 200,
      date: '2025-03-01',
    });
    // (4 + 4 + 3) / 3 = 3.67 → gerundet 4
    expect(stats.averageBingeLength).toBe(4);
  });

  it('berechnet den Device-Breakdown relativ zu ALLEN Jahres-Events (auch ohne deviceType)', () => {
    const events: ActivityEvent[] = [
      ep({ deviceType: 'mobile' }),
      ep({ deviceType: 'mobile' }),
      mov({ deviceType: 'desktop' }),
      ep(), // ohne deviceType → zählt nur im Nenner
    ];
    const stats = calculateWrappedStats(events, [], 2025);
    expect(stats.deviceBreakdown).toEqual({
      mobile: { count: 2, percentage: 50 },
      desktop: { count: 1, percentage: 25 },
      tablet: { count: 0, percentage: 0 },
    });
  });
});

// Rankings: Top Serien / Filme / Genres / Provider

describe('calculateTopSeries', () => {
  it('aggregiert pro seriesId; Titel kommt vom ERSTEN Event der Serie', () => {
    const result = calculateTopSeries([
      ep({ seriesId: 1, seriesTitle: 'Dark' }),
      ep({ seriesId: 1, seriesTitle: 'Dark (umbenannt)', episodeRuntime: 60 }),
      ep({ seriesId: 2, seriesTitle: 'Severance', episodeRuntime: 50 }),
    ]);
    expect(result).toEqual([
      { id: 1, title: 'Dark', episodesWatched: 2, minutesWatched: 105 }, // 45 (Default) + 60
      { id: 2, title: 'Severance', episodesWatched: 1, minutesWatched: 50 },
    ]);
  });

  it('sortiert absteigend nach Episodenanzahl und begrenzt auf limit (Default 5)', () => {
    const events = [1, 2, 3, 4, 5, 6].flatMap((id) =>
      Array.from({ length: id }, () => ep({ seriesId: id, seriesTitle: `S${id}` }))
    );
    const top = calculateTopSeries(events);
    expect(top).toHaveLength(5);
    expect(top.map((s) => s.id)).toEqual([6, 5, 4, 3, 2]);
    expect(calculateTopSeries(events, 2).map((s) => s.id)).toEqual([6, 5]);
  });
});

describe('calculateTopMovies', () => {
  it('dedupliziert NICHT — derselbe Film mehrfach ergibt mehrere Einträge', () => {
    const result = calculateTopMovies([
      mov({ movieId: 100, rating: 7 }),
      mov({ movieId: 100, rating: 9 }),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].rating).toBe(9);
  });

  it('sortiert nach Rating absteigend (fehlendes Rating = 0) und nutzt Runtime-Default 120', () => {
    const result = calculateTopMovies([
      mov({ movieId: 1, movieTitle: 'Ohne Rating' }),
      mov({ movieId: 2, movieTitle: 'Gut', rating: 8, runtime: 148 }),
      mov({ movieId: 3, movieTitle: 'Runtime 0', rating: 5, runtime: 0 }),
    ]);
    expect(result.map((m) => m.id)).toEqual([2, 3, 1]);
    expect(result[0].minutesWatched).toBe(148);
    expect(result[1].minutesWatched).toBe(120); // runtime 0 → Default
    expect(result[2].minutesWatched).toBe(120); // runtime fehlt → Default
  });
});

describe('calculateTopGenres', () => {
  it('teilt Minuten gleichmäßig auf Genres auf; Prozent relativ zur Genre-Gesamtzeit', () => {
    const result = calculateTopGenres(
      [ep({ episodeRuntime: 60, genres: ['Drama', 'Comedy'] })],
      [mov({ runtime: 120, genres: ['Drama'] })]
    );
    expect(result).toEqual([
      { genre: 'Drama', count: 2, percentage: 83, minutesWatched: 150 }, // 30 + 120 von 180
      { genre: 'Comedy', count: 1, percentage: 17, minutesWatched: 30 },
    ]);
  });

  it("ignoriert generische Genres ('All'/'alle'); Events NUR mit ignorierten Genres fallen komplett raus", () => {
    const result = calculateTopGenres(
      [
        ep({ episodeRuntime: 45, genres: ['All', 'Drama'] }),
        ep({ episodeRuntime: 45, genres: ['alle'] }), // komplett übersprungen
      ],
      []
    );
    expect(result).toEqual([{ genre: 'Drama', count: 1, percentage: 100, minutesWatched: 45 }]);
  });

  it('liefert [] wenn keine Genre-Daten vorhanden sind', () => {
    expect(calculateTopGenres([ep()], [mov()])).toEqual([]);
    expect(calculateTopGenres([], [])).toEqual([]);
  });

  it('sortiert nach Minuten (nicht Count) und respektiert limit', () => {
    const episodes = [
      ep({ episodeRuntime: 10, genres: ['Comedy'] }),
      ep({ episodeRuntime: 10, genres: ['Comedy'] }),
      ep({ episodeRuntime: 100, genres: ['Drama'] }),
    ];
    const result = calculateTopGenres(episodes, []);
    expect(result.map((g) => g.genre)).toEqual(['Drama', 'Comedy']);
    expect(result[0].count).toBe(1);
    expect(result[1].count).toBe(2);
    expect(calculateTopGenres(episodes, [], 1).map((g) => g.genre)).toEqual(['Drama']);
  });
});

describe('calculateTopProviders', () => {
  it('normalisiert Provider-Namen (Ad-Tiers, Freevee→Prime, Max→HBO Max)', () => {
    const result = calculateTopProviders(
      [
        ep({ providers: ['Netflix Standard with Ads'] }),
        ep({ providers: ['Freevee'] }),
        ep({ providers: ['Max'] }),
      ],
      []
    );
    expect(result.map((p) => p.name).sort()).toEqual(['Amazon Prime Video', 'HBO Max', 'Netflix']);
  });

  it("filtert Channel-Add-Ons (' Channel'); unbekannte Provider zaehlen mit", () => {
    const result = calculateTopProviders(
      [ep({ providers: ['Wow Fiction Amazon Channel'] }), ep({ providers: ['ARD Mediathek'] })],
      []
    );
    expect(result.map((p) => p.name)).toEqual(['ARD Mediathek']);
  });

  it('dedupliziert Provider innerhalb eines Events nach der Normalisierung', () => {
    const result = calculateTopProviders(
      [ep({ episodeRuntime: 45, providers: ['Netflix', 'Netflix basic with Ads'] })],
      []
    );
    expect(result).toEqual([
      {
        name: 'Netflix',
        episodeCount: 1,
        movieCount: 0,
        totalCount: 1,
        minutesWatched: 45,
        percentage: 100,
      },
    ]);
  });

  it('gibt jedem Provider die VOLLE Watchzeit — Prozentsumme kann über 100 liegen', () => {
    const result = calculateTopProviders(
      [ep({ episodeRuntime: 45, providers: ['Netflix', 'WOW'] })],
      []
    );
    expect(result).toHaveLength(2);
    expect(result[0].percentage).toBe(100);
    expect(result[1].percentage).toBe(100);
    expect(result[0].minutesWatched).toBe(45);
    expect(result[1].minutesWatched).toBe(45);
  });

  it('IST-Verhalten: leeres providers-Array [] unterdrückt den Fallback aufs provider-Feld', () => {
    // [] ist truthy → `providers || fallback` greift nie; Event wird gar nicht gezählt.
    const result = calculateTopProviders([ep({ providers: [], provider: 'Netflix' })], []);
    expect(result).toEqual([]);
  });

  it('fällt ohne providers-Array auf das alte provider-Feld zurück (Episoden und Filme)', () => {
    const result = calculateTopProviders(
      [ep({ provider: 'Disney+' })],
      [mov({ provider: 'paramount plus', runtime: 90 })]
    );
    expect(result).toEqual([
      {
        name: 'Paramount Plus',
        episodeCount: 0,
        movieCount: 1,
        totalCount: 1,
        minutesWatched: 90,
        percentage: 67,
      },
      {
        name: 'Disney Plus',
        episodeCount: 1,
        movieCount: 0,
        totalCount: 1,
        minutesWatched: 45,
        percentage: 33,
      },
    ]);
  });

  it('Events, deren Provider alle wegnormalisiert werden, zählen nicht in die Prozent-Basis', () => {
    const result = calculateTopProviders(
      [
        ep({ episodeRuntime: 45, providers: ['Netflix'] }),
        ep({ episodeRuntime: 500, providers: ['Wow Fiction Amazon Channel'] }), // fällt raus
      ],
      []
    );
    expect(result).toEqual([
      {
        name: 'Netflix',
        episodeCount: 1,
        movieCount: 0,
        totalCount: 1,
        minutesWatched: 45,
        percentage: 100,
      },
    ]);
  });
});

// Temporal: Monate / Tage / Tageszeiten

describe('calculateMonthlyBreakdown', () => {
  it('liefert immer 12 Monate mit deutschen Namen', () => {
    const breakdown = calculateMonthlyBreakdown([]);
    expect(breakdown).toHaveLength(12);
    expect(breakdown[0]).toEqual({
      month: 1,
      monthName: 'Januar',
      episodesWatched: 0,
      moviesWatched: 0,
      minutesWatched: 0,
    });
    expect(breakdown[11].monthName).toBe('Dezember');
  });

  it('IST-Verhalten: bucketing nach month-FELD, nicht nach Timestamp', () => {
    // Timestamp sagt Juni, month-Feld sagt Februar → landet im Februar.
    const breakdown = calculateMonthlyBreakdown([
      ep({ timestamp: '2025-06-15T20:30:00', month: 2 }),
    ]);
    expect(breakdown[1].episodesWatched).toBe(1); // Februar
    expect(breakdown[5].episodesWatched).toBe(0); // Juni
  });

  it('summiert Minuten mit Defaults; movie_rating zählt als Film', () => {
    const breakdown = calculateMonthlyBreakdown([
      ep({ month: 3 }), // 45
      ep({ month: 3, episodeRuntime: 25 }),
      mov({ month: 3 }), // 120
      mov({ month: 3, type: 'movie_rating', runtime: 90 }),
    ]);
    expect(breakdown[2]).toEqual({
      month: 3,
      monthName: 'März',
      episodesWatched: 2,
      moviesWatched: 2,
      minutesWatched: 45 + 25 + 120 + 90,
    });
  });
});

describe('findMostActiveMonth', () => {
  it('vergleicht Episoden+Filme; bei Gleichstand gewinnt der frühere Monat (strict >)', () => {
    const breakdown = calculateMonthlyBreakdown([
      ep({ month: 4 }),
      mov({ month: 4 }),
      ep({ month: 9 }),
      ep({ month: 9 }),
    ]);
    expect(findMostActiveMonth(breakdown).monthName).toBe('April');
  });
});

describe('findMostActiveDay', () => {
  it('gruppiert nach Datums-Teil des Timestamps und findet den Tag mit den meisten Titeln', () => {
    const result = findMostActiveDay([
      ep({ timestamp: '2025-06-15T10:00:00' }),
      ep({ timestamp: '2025-06-15T22:00:00', episodeRuntime: 60 }),
      mov({ timestamp: '2025-06-15T20:00:00', runtime: 90 }),
      ep({ timestamp: '2025-06-16T20:00:00' }),
    ]);
    expect(result.date).toBe('2025-06-15');
    // 2025-06-15 ist ein Sonntag (Date-only-String wird als UTC geparst; gilt für TZ >= UTC)
    expect(result.dayName).toBe('Sonntag');
    expect(result.episodesWatched).toBe(2);
    expect(result.moviesWatched).toBe(1);
    expect(result.minutesWatched).toBe(45 + 60 + 90);
  });

  it('IST-Verhalten: movie_rating-Events erzeugen einen Tag-Eintrag, zählen aber 0 Titel/Minuten', () => {
    const result = findMostActiveDay([
      mov({ type: 'movie_rating', timestamp: '2025-06-20T20:00:00', runtime: 90 }),
    ]);
    // Kein Tag übertrifft den Initialwert 0 → leerer Fallback bleibt bestehen
    expect(result.date).toBe('');
    expect(result.dayName).toBeUndefined();
    expect(result.episodesWatched).toBe(0);
  });

  it('IST-Verhalten: leere Eventliste → date "" und dayName undefined', () => {
    const result = findMostActiveDay([]);
    expect(result).toEqual({
      date: '',
      dayName: undefined,
      episodesWatched: 0,
      moviesWatched: 0,
      minutesWatched: 0,
    });
  });
});

describe('calculateFavoriteTimeOfDay', () => {
  it('ordnet Stunden den dokumentierten Tageszeit-Fenstern zu (6/12/18/22-Grenzen)', () => {
    const cases: Array<[number, string]> = [
      [5, 'night'],
      [6, 'morning'],
      [11, 'morning'],
      [12, 'afternoon'],
      [17, 'afternoon'],
      [18, 'evening'],
      [21, 'evening'],
      [22, 'night'],
      [0, 'night'],
    ];
    for (const [hour, expected] of cases) {
      expect(calculateFavoriteTimeOfDay([ep({ hour })]).timeOfDay).toBe(expected);
    }
  });

  it('berechnet Count und gerundete Prozent relativ zu ALLEN Events', () => {
    const result = calculateFavoriteTimeOfDay([
      ep({ hour: 23 }),
      ep({ hour: 2 }),
      ep({ hour: 15 }),
    ]);
    expect(result).toEqual({
      timeOfDay: 'night',
      label: 'Nachts (22-6 Uhr)',
      count: 2,
      percentage: 67, // round(2/3*100)
    });
  });

  it('bei Gleichstand gewinnt die frühere Tageszeit in Objekt-Reihenfolge (morning vor night)', () => {
    const result = calculateFavoriteTimeOfDay([ep({ hour: 8 }), ep({ hour: 23 })]);
    expect(result.timeOfDay).toBe('morning');
  });

  it('leere Liste → Fallback evening mit 0', () => {
    expect(calculateFavoriteTimeOfDay([])).toEqual({
      timeOfDay: 'evening',
      label: 'Abends (18-22 Uhr)',
      count: 0,
      percentage: 0,
    });
  });
});

describe('calculateFavoriteDayOfWeek', () => {
  it('zählt per dayOfWeek-Feld; bei Gleichstand gewinnt der kleinste Index', () => {
    const result = calculateFavoriteDayOfWeek([
      ep({ dayOfWeek: 5 }),
      ep({ dayOfWeek: 2 }),
      ep({ dayOfWeek: 2 }),
      ep({ dayOfWeek: 5 }),
    ]);
    expect(result).toEqual({ dayOfWeek: 2, dayName: 'Dienstag', count: 2, percentage: 50 });
  });

  it('leere Liste → Sonntag (Index 0) mit 0', () => {
    expect(calculateFavoriteDayOfWeek([])).toEqual({
      dayOfWeek: 0,
      dayName: 'Sonntag',
      count: 0,
      percentage: 0,
    });
  });
});

// First / Last Watch

describe('findFirstWatch / findLastWatch', () => {
  const events: ActivityEvent[] = [
    mov({ timestamp: '2025-03-10T20:00:00', movieId: 55, movieTitle: 'Dune' }),
    ep({
      timestamp: '2025-01-05T10:00:00',
      seriesId: 9,
      seriesTitle: 'Dark',
      seasonNumber: 2,
      episodeNumber: 3,
    }),
    ep({ timestamp: '2025-11-20T21:00:00', seriesId: 9 }),
  ];

  it('findFirstWatch liefert das früheste Event mit deutschem Datum und S/E-Subtitle', () => {
    expect(findFirstWatch(events)).toEqual({
      type: 'episode',
      title: 'Dark',
      subtitle: 'S2 E3',
      date: '5. Januar',
      timestamp: '2025-01-05T10:00:00',
      id: 9,
    });
  });

  it('findLastWatch liefert das späteste Event; Filme ohne subtitle', () => {
    const last = findLastWatch([events[0]]);
    expect(last).toEqual({
      type: 'movie',
      title: 'Dune',
      date: '10. März',
      timestamp: '2025-03-10T20:00:00',
      id: 55,
    });
    expect(findLastWatch(events)?.timestamp).toBe('2025-11-20T21:00:00');
  });

  it('IST-Verhalten: movie_rating-Events können First/Last Watch sein', () => {
    const rating = mov({ type: 'movie_rating', timestamp: '2025-01-01T09:00:00', movieId: 77 });
    expect(findFirstWatch([...events, rating])?.id).toBe(77);
  });

  it('leere Liste → null', () => {
    expect(findFirstWatch([])).toBeNull();
    expect(findLastWatch([])).toBeNull();
  });
});

// Late Night Stats

describe('calculateLateNightStats', () => {
  it('zählt Late-Night (22-6) und Midnight (0-4) getrennt; Prozent gerundet', () => {
    const result = calculateLateNightStats([ep({ hour: 23 }), ep({ hour: 3 }), ep({ hour: 12 })]);
    expect(result.totalLateNightWatches).toBe(2);
    expect(result.midnightWatches).toBe(1);
    expect(result.percentage).toBe(67);
  });

  it('Stunde 4 zählt als Midnight, Stunde 5 nicht mehr (hour < 5)', () => {
    expect(calculateLateNightStats([ep({ hour: 4 })]).midnightWatches).toBe(1);
    const five = calculateLateNightStats([ep({ hour: 5 })]);
    expect(five.midnightWatches).toBe(0);
    expect(five.totalLateNightWatches).toBe(1); // aber noch Late-Night (< 6)
  });

  it('latestWatch: Nachtstunden < 6 werden auf +24 normalisiert — 3 Uhr schlägt 23 Uhr', () => {
    const result = calculateLateNightStats([
      ep({ hour: 23, seriesTitle: 'Abends', timestamp: '2025-06-15T23:45:00' }),
      ep({ hour: 3, seriesTitle: 'Nachts', timestamp: '2025-06-16T03:07:00' }),
    ]);
    expect(result.latestWatch).toEqual({ time: '03:07', title: 'Nachts' });
  });

  it('IST-Verhalten: time-String mischt hour-FELD mit Minuten aus dem TIMESTAMP', () => {
    const result = calculateLateNightStats([
      ep({ hour: 23, seriesTitle: 'Mix', timestamp: '2025-06-15T20:45:00' }),
    ]);
    expect(result.latestWatch).toEqual({ time: '23:45', title: 'Mix' });
  });

  it('fehlende hour wird als 12 Uhr behandelt; Filme nutzen movieTitle', () => {
    const result = calculateLateNightStats([
      mov({ hour: undefined as unknown as number, movieTitle: 'Mittagsfilm' }),
    ]);
    expect(result.totalLateNightWatches).toBe(0);
    expect(result.latestWatch).toEqual({ time: '12:00', title: 'Mittagsfilm' });
  });

  it('leere Liste → Null-Werte und latestWatch null', () => {
    expect(calculateLateNightStats([])).toEqual({
      totalLateNightWatches: 0,
      midnightWatches: 0,
      latestWatch: null,
      percentage: 0,
    });
  });
});

// Heatmap

describe('calculateHeatmapData', () => {
  it('liefert eine 7x24-Matrix und zählt Events bei [dayOfWeek][hour]', () => {
    const heatmap = calculateHeatmapData([
      ep({ dayOfWeek: 2, hour: 21 }),
      ep({ dayOfWeek: 2, hour: 21 }),
      mov({ type: 'movie_rating', dayOfWeek: 6, hour: 0 }),
    ]);
    expect(heatmap).toHaveLength(7);
    expect(heatmap.every((row) => row.length === 24)).toBe(true);
    expect(heatmap[2][21]).toBe(2);
    expect(heatmap[6][0]).toBe(1);
    const total = heatmap.flat().reduce((a, b) => a + b, 0);
    expect(total).toBe(3);
  });

  it('fehlende Felder defaulten auf Sonntag (0) und 12 Uhr', () => {
    const heatmap = calculateHeatmapData([
      ep({
        dayOfWeek: undefined as unknown as number,
        hour: undefined as unknown as number,
      }),
    ]);
    expect(heatmap[0][12]).toBe(1);
  });
});

// Achievements

describe('calculateAchievements', () => {
  it('liefert immer alle 10 Templates; freigeschaltete zuerst, sonst Template-Reihenfolge', () => {
    const result = calculateAchievements(
      achCtx({ totalMovies: 20, totalMinutes: 100 * 60 }) // movie_lover + marathon_runner
    );
    expect(result).toHaveLength(10);
    expect(result.filter((a) => a.unlocked).map((a) => a.id)).toEqual([
      'movie_lover',
      'marathon_runner',
    ]);
    expect(result.slice(2).map((a) => a.id)).toEqual([
      'night_owl',
      'early_bird',
      'binge_king',
      'series_addict',
      'genre_explorer',
      'weekend_warrior',
      'consistent',
      'completionist',
    ]);
  });

  it('night_owl/early_bird: richtige Tageszeit UND >= 30 Prozent', () => {
    const night = (percentage: number) =>
      achCtx({
        favoriteTimeOfDay: { timeOfDay: 'night', label: 'Nachts (22-6 Uhr)', count: 5, percentage },
      });
    const get = achievementById;

    expect(get(night(30), 'night_owl').unlocked).toBe(true);
    expect(get(night(30), 'night_owl').value).toBe('30%');
    expect(get(night(29), 'night_owl').unlocked).toBe(false);
    expect(get(night(90), 'early_bird').unlocked).toBe(false); // falsche Tageszeit

    const morning = achCtx({
      favoriteTimeOfDay: {
        timeOfDay: 'morning',
        label: 'Morgens (6-12 Uhr)',
        count: 5,
        percentage: 35,
      },
    });
    expect(get(morning, 'early_bird').unlocked).toBe(true);
  });

  it('binge_king ab 10 Episoden in einer Session; value = längste Session', () => {
    const mkSession = (n: number) =>
      binge({
        episodes: Array.from({ length: n }, (_, i) => ({
          seasonNumber: 1,
          episodeNumber: i + 1,
          watchedAt: 'x',
        })),
      });
    const get = (n: number) =>
      achievementById(achCtx({ yearBingeSessions: [mkSession(n)] }), 'binge_king');
    expect(get(10).unlocked).toBe(true);
    expect(get(10).value).toBe(10);
    expect(get(9).unlocked).toBe(false);
  });

  it('movie_lover >= 20, series_addict >= 500, genre_explorer >= 5 Genres, consistent >= 30 Streak', () => {
    const find = achievementById;
    expect(find(achCtx({ totalMovies: 19 }), 'movie_lover').unlocked).toBe(false);
    expect(find(achCtx({ totalMovies: 20 }), 'movie_lover').unlocked).toBe(true);
    expect(find(achCtx({ totalEpisodes: 500 }), 'series_addict').unlocked).toBe(true);
    expect(find(achCtx({ totalEpisodes: 499 }), 'series_addict').unlocked).toBe(false);
    const genres = Array.from({ length: 5 }, (_, i) => ({
      genre: `G${i}`,
      count: 1,
      percentage: 20,
      minutesWatched: 10,
    }));
    expect(find(achCtx({ topGenres: genres }), 'genre_explorer').unlocked).toBe(true);
    expect(find(achCtx({ topGenres: genres.slice(0, 4) }), 'genre_explorer').unlocked).toBe(false);
    expect(find(achCtx({ longestStreak: 30 }), 'consistent').unlocked).toBe(true);
    expect(find(achCtx({ longestStreak: 29 }), 'consistent').unlocked).toBe(false);
  });

  it('weekend_warrior nur bei Samstag/Sonntag als Lieblingstag UND >= 50 Prozent', () => {
    const day = (dayOfWeek: number, percentage: number) =>
      achCtx({ favoriteDayOfWeek: { dayOfWeek, dayName: 'x', count: 1, percentage } });
    const get = (ctx: AchievementContext) => achievementById(ctx, 'weekend_warrior');
    expect(get(day(6, 50)).unlocked).toBe(true);
    expect(get(day(0, 50)).unlocked).toBe(true);
    expect(get(day(6, 49)).unlocked).toBe(false);
    expect(get(day(5, 99)).unlocked).toBe(false);
  });

  it('IST-Verhalten: marathon_runner rundet — 5970 Minuten (99,5h) schalten frei', () => {
    const get = (totalMinutes: number) =>
      achievementById(achCtx({ totalMinutes }), 'marathon_runner');
    expect(get(5970).unlocked).toBe(true); // round(99.5) = 100
    expect(get(5970).value).toBe('100h');
    expect(get(5940).unlocked).toBe(false); // 99h
  });

  it('IST-Verhalten: completionist hat keine Berechnungslogik und ist nie freischaltbar', () => {
    const result = calculateAchievements(
      achCtx({
        totalEpisodes: 10000,
        totalMovies: 1000,
        totalMinutes: 1000000,
        longestStreak: 365,
      })
    );
    const completionist = mustFind(result, (a) => a.id === 'completionist');
    expect(completionist.unlocked).toBe(false);
    expect(completionist.value).toBeUndefined();
  });
});

// Fun Facts

describe('generateFunFacts', () => {
  it('liefert 5 Facts mit Top-Serie (sonst 4) in fester Reihenfolge', () => {
    const withTop = generateFunFacts(
      ffCtx({
        topSeries: [{ id: 1, title: 'Dark', episodesWatched: 42, minutesWatched: 1890 }],
      })
    );
    expect(withTop.map((f) => f.id)).toEqual([
      'time_flights',
      'time_sleep',
      'top_series',
      'active_month',
      'time_of_day',
    ]);
    const withoutTop = generateFunFacts(ffCtx({ topSeries: [] }));
    expect(withoutTop.map((f) => f.id)).toEqual([
      'time_flights',
      'time_sleep',
      'active_month',
      'time_of_day',
    ]);
  });

  it('formatiert die exakten deutschen Texte (Flüge = Stunden/12, Tage 1 Nachkommastelle)', () => {
    const facts = generateFunFacts(
      ffCtx({
        totalMinutes: 7200, // 120h → 10 Flüge, 5 Tage
        topSeries: [{ id: 1, title: 'Dark', episodesWatched: 42, minutesWatched: 1890 }],
      })
    );
    expect(facts[0].text).toBe('Mit 120 Stunden könntest du 10 Mal nach New York fliegen ✈️');
    expect(facts[1].text).toBe('Das entspricht 5 Tagen durchgehend schauen - ohne Schlaf!');
    expect(facts[2].text).toBe('"Dark" war dein Favorit mit 42 Episoden');
    expect(facts[3].text).toBe('Dein aktivster Monat war Juni mit 30 Titeln');
  });

  it('time_of_day nutzt das lowercase-Label und das passende Emoji', () => {
    const facts = generateFunFacts(ffCtx());
    const tod = mustFind(facts, (f) => f.id === 'time_of_day');
    expect(tod.text).toBe('Du schaust am liebsten nachts (22-6 uhr)');
    expect(tod.icon).toBe('🌙');
  });
});
