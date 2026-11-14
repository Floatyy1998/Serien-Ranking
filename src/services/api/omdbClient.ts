const cache = new Map<string, Promise<number | null>>();

const DAY = 86_400_000;

async function load(
  imdbId: string,
  season: number,
  episode: number,
  airDate?: string | null
): Promise<number | null> {
  const key = import.meta.env.VITE_API_OMDb;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&Season=${season}&Episode=${episode}&apikey=${key}`
    );
    const data = (await res.json()) as { imdbRating?: string; Released?: string };
    const rating = parseFloat(data.imdbRating ?? '');
    if (!(rating > 0)) return null;
    // Staffel-/Folgennummern der App sind Positionen; weicht das Datum ab, ist es eine andere Folge.
    const released = Date.parse(data.Released ?? '');
    const aired = Date.parse(airDate ?? '');
    if (!isNaN(released) && !isNaN(aired) && Math.abs(released - aired) > 3 * DAY) return null;
    return rating;
  } catch {
    return null;
  }
}

/** IMDb-Wertung einer einzelnen Folge über OMDb; je Folge nur eine Anfrage pro Sitzung. */
export function fetchEpisodeImdbRating(
  imdbId: string,
  season: number,
  episode: number,
  airDate?: string | null
): Promise<number | null> {
  const cacheKey = `${imdbId}/${season}/${episode}`;
  let hit = cache.get(cacheKey);
  if (!hit) {
    hit = load(imdbId, season, episode, airDate);
    cache.set(cacheKey, hit);
  }
  return hit;
}
