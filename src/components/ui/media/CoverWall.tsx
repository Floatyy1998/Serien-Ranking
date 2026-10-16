import { memo, useEffect, useState } from 'react';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { discoverManga } from '../../../services/api/anilistService';
import { fetchShelf } from '../../../services/api/bookDiscovery';
import { getTmdbApiKey, tmdbFetch } from '../../../services/api/tmdbClient';
import './CoverWall.css';

interface Props {
  /** Optional TMDB genre IDs (TV). If empty, trending fallback is used. */
  tvGenreIds?: number[];
  /** Anzahl Marquee-Reihen (3 = Onboarding-Bühne, 6 = volle Seiten-Pane). */
  rows?: number;
  /** Fertige Bild-URLs (Manga-/Buchcover) statt TMDB-Postern. */
  covers?: string[];
}

const imageUrl = (p: string) =>
  p.startsWith('http') || p.startsWith('data:') ? p : `https://image.tmdb.org/t/p/w342${p}`;

/** Schlanke TMDB-Listen-Response (nur `poster_path` wird gelesen). */
type TmdbPosterResponse = { results?: Array<{ poster_path?: string | null }> };

let readingCovers: Promise<string[][]> | null = null;

/** Bekannte Manga und Buch-Bestseller für die gemischte Wand — einmal je Sitzung. */
function loadReadingCovers(): Promise<string[][]> {
  readingCovers ??= Promise.all([
    discoverManga('popular', 1, 24)
      .then(({ results }) => results.filter((m) => !m.isAdult).map((m) => m.coverImage.large))
      .catch(() => [] as string[]),
    Promise.all(
      (['fantasy', 'thriller', 'romance'] as const).map((id) =>
        fetchShelf(id, { limit: 8 }).catch(() => [])
      )
    ).then((shelves) =>
      shelves
        .flat()
        .map((book) => coverAtSize(book.cover, 'M'))
        .filter((cover): cover is string => !!cover)
    ),
  ]);
  return readingCovers;
}

/** Jedes dritte Bild ein Manga- oder Buchcover, abwechselnd. */
function mixCovers(posters: string[], [manga, books]: string[][]): string[] {
  const reading: string[] = [];
  for (let i = 0; i < Math.max(manga.length, books.length); i++) {
    if (manga[i]) reading.push(manga[i]);
    if (books[i]) reading.push(books[i]);
  }
  if (posters.length === 0) return reading.slice(0, 60);
  const out: string[] = [];
  posters.forEach((poster, i) => {
    out.push(poster);
    if (i % 2 === 1 && reading.length) out.push(reading.shift() as string);
  });
  return out.slice(0, 72);
}

async function loadPosters(tvGenreIds: number[]): Promise<string[]> {
  if (tvGenreIds.length === 0) {
    const [posters, reading] = await Promise.all([loadTmdbPosters([]), loadReadingCovers()]);
    return mixCovers(posters, reading);
  }
  return loadTmdbPosters(tvGenreIds);
}

async function loadTmdbPosters(tvGenreIds: number[]): Promise<string[]> {
  if (!getTmdbApiKey()) return [];
  try {
    const requests =
      tvGenreIds.length > 0
        ? tvGenreIds.map((id) =>
            tmdbFetch<TmdbPosterResponse>('discover/tv', {
              with_genres: id,
              sort_by: 'popularity.desc',
              page: 1,
            })
          )
        : // Eine Trending-Seite = nur 20 Poster — zu wenig für breite Reihen
          // (schwarze Löcher rechts). Drei Quellen ≈ 60 Poster.
          [
            tmdbFetch<TmdbPosterResponse>('trending/tv/week'),
            tmdbFetch<TmdbPosterResponse>('trending/tv/week', { page: 2 }),
            tmdbFetch<TmdbPosterResponse>('trending/movie/week'),
          ];
    const responses = await Promise.all(requests);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of responses) {
      for (const item of r.results || []) {
        if (item.poster_path && !seen.has(item.poster_path)) {
          seen.add(item.poster_path);
          out.push(item.poster_path);
        }
      }
    }
    return out.slice(0, 60);
  } catch {
    return [];
  }
}

/**
 * Animated marquee of poster art — die Kino-Bühne hinter Onboarding,
 * Start-Seite und den Auth-Seiten. Three offset rows, each on its own
 * animation cycle, masked, vignetted.
 */
export const CoverWall = memo(({ tvGenreIds = [], rows = 3, covers }: Props) => {
  const [loaded, setLoaded] = useState<string[]>([]);
  const ownCovers = !!covers?.length;
  const posters = ownCovers ? covers : loaded;

  useEffect(() => {
    if (ownCovers) return;
    let cancelled = false;
    loadPosters(tvGenreIds).then((list) => {
      if (!cancelled) setLoaded(list);
    });
    return () => {
      cancelled = true;
    };
  }, [tvGenreIds.join(','), ownCovers]); // eslint-disable-line react-hooks/exhaustive-deps

  if (posters.length === 0) {
    return (
      <>
        <div className="ob-vignette" />
      </>
    );
  }

  // Distribute posters across the rows. Each row content is duplicated for
  // seamless infinite scroll (translateX -50%).
  const slices: string[][] = Array.from({ length: rows }, () => []);
  posters.forEach((p, i) => slices[i % rows].push(p));

  return (
    <>
      {/* Clip-Rahmen: die Wand ragt bewusst ueber den Rand hinaus. Ohne diesen
          Rahmen zaehlt der Ueberstand zum scrollbaren Bereich des Elternteils —
          auf dem Telefon liess sich die Seite dadurch weit nach rechts wischen. */}
      <div className="ob-wall-clip" aria-hidden>
        <div className="ob-wall">
          {slices.map((row, idx) => {
            const doubled = [...row, ...row];
            return (
              <div
                key={idx}
                className={`ob-wall-row ${idx % 2 === 1 ? 'ob-wall-row--rev' : ''}`}
                style={{
                  animationDuration: `${110 + idx * 25}s`,
                  paddingLeft: idx === 1 ? '6%' : 0,
                }}
              >
                {doubled.map((p, i) => (
                  <div
                    key={`${idx}-${i}`}
                    className="ob-wall-poster"
                    style={{ backgroundImage: `url(${imageUrl(p)})` }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ob-vignette" />
    </>
  );
});
CoverWall.displayName = 'CoverWall';
