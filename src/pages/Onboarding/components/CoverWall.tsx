import { memo, useEffect, useState } from 'react';
import { getTmdbApiKey, tmdbFetch } from '../../../services/tmdbClient';

interface Props {
  /** Optional TMDB genre IDs (TV). If empty, trending fallback is used. */
  tvGenreIds?: number[];
}

/** Schlanke TMDB-Listen-Response (nur `poster_path` wird gelesen). */
type TmdbPosterResponse = { results?: Array<{ poster_path?: string | null }> };

async function loadPosters(tvGenreIds: number[]): Promise<string[]> {
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
        : [tmdbFetch<TmdbPosterResponse>('trending/tv/week')];
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
    return out.slice(0, 40);
  } catch {
    return [];
  }
}

/**
 * Animated marquee of poster art behind the onboarding stage.
 * Three offset rows, each on its own animation cycle, masked, vignetted.
 */
export const CoverWall = memo(({ tvGenreIds = [] }: Props) => {
  const [posters, setPosters] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadPosters(tvGenreIds).then((list) => {
      if (!cancelled) setPosters(list);
    });
    return () => {
      cancelled = true;
    };
  }, [tvGenreIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (posters.length === 0) {
    return (
      <>
        <div className="ob-vignette" />
      </>
    );
  }

  // Distribute posters across 3 rows. Each row content is duplicated for
  // seamless infinite scroll (translateX -50%).
  const slices: string[][] = [[], [], []];
  posters.forEach((p, i) => slices[i % 3].push(p));

  return (
    <>
      <div className="ob-wall" aria-hidden>
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
                  style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w342${p})` }}
                />
              ))}
            </div>
          );
        })}
      </div>
      <div className="ob-vignette" />
    </>
  );
});
CoverWall.displayName = 'CoverWall';
