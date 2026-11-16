import type { WrappedStats } from '../../types/Wrapped';

export type HighlightKind = 'series' | 'movie' | 'manga' | 'book';

export interface YearHighlight {
  kind: HighlightKind;
  key: string;
  title: string;
  /** TMDB-Pfad (Serien/Filme) oder fertige Adresse (Manga/Bücher). */
  image?: string;
  episodes?: number;
  rating?: number;
  chapters?: number;
  volumes?: number;
  author?: string;
  pages?: number;
}

export type YearFactKey =
  | 'hours'
  | 'episodes'
  | 'movies'
  | 'series'
  | 'mangaChapters'
  | 'mangaVolumes'
  | 'books'
  | 'pages'
  | 'streak';

export interface YearFact {
  key: YearFactKey;
  value: number;
}

/**
 * Die Titel des Jahres quer durch alle Medien: erst je Medium der Spitzenreiter,
 * dann reihum auffüllen. Wer nur Bücher oder nur Manga hat, bekommt so trotzdem
 * eine volle Reihe, und wer alles nutzt, sieht von allem etwas.
 */
export function pickYearHighlights(stats: WrappedStats, min = 3, max = 4): YearHighlight[] {
  const lists: YearHighlight[][] = [
    stats.topSeries.map((s) => ({
      kind: 'series',
      key: `series-${s.id}`,
      title: s.title,
      image: s.poster,
      episodes: s.episodesWatched,
    })),
    stats.topMovies.map((m) => ({
      kind: 'movie',
      key: `movie-${m.id}`,
      title: m.title,
      image: m.poster,
      rating: m.rating,
    })),
    (stats.manga?.topManga ?? []).map((m) => ({
      kind: 'manga',
      key: `manga-${m.anilistId}`,
      title: m.title,
      image: m.poster,
      chapters: m.chapters,
      volumes: m.volumes,
    })),
    (stats.books?.topBooks ?? []).map((b) => ({
      kind: 'book',
      key: `book-${b.id}`,
      title: b.title,
      image: b.cover,
      author: b.author,
      pages: b.pages,
    })),
  ].filter((list) => list.length > 0) as YearHighlight[][];

  const picks: YearHighlight[] = lists.map((list) => list[0]).slice(0, max);
  for (let depth = 1; picks.length < min; depth++) {
    const round = lists.map((list) => list[depth]).filter((entry) => !!entry);
    if (round.length === 0) break;
    for (const entry of round) {
      if (picks.length < min) picks.push(entry);
    }
  }
  return picks;
}

/** Kennzahlen des Jahres, nur die mit Inhalt, in fester Reihenfolge. */
export function yearFacts(stats: WrappedStats): YearFact[] {
  const manga = stats.manga;
  const books = stats.books;
  const facts: YearFact[] = [
    { key: 'hours', value: Math.round(stats.totalHoursWatched) },
    { key: 'episodes', value: stats.totalEpisodesWatched },
    { key: 'movies', value: stats.totalMoviesWatched },
    { key: 'series', value: stats.uniqueSeriesWatched },
    manga && manga.totalChapters > 0
      ? { key: 'mangaChapters', value: manga.totalChapters }
      : { key: 'mangaVolumes', value: manga?.totalVolumes ?? 0 },
    { key: 'books', value: books?.booksFinished ?? 0 },
    { key: 'pages', value: books?.pagesRead ?? 0 },
    { key: 'streak', value: stats.longestStreak },
  ];
  return facts.filter((fact) => fact.value > 0);
}
