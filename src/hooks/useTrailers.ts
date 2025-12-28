import { useState, useEffect } from 'react';

export interface Trailer {
  id: string;
  key: string;        // YouTube Video-ID
  name: string;       // Trailer-Titel
  site: string;       // "YouTube"
  type: string;       // "Trailer", "Teaser", "Featurette"
  official: boolean;
  publishedAt?: string;
}

interface UseTrailersOptions {
  language?: string;
}

/**
 * Hook zum Laden von Trailern für Serien oder Filme von TMDB
 */
export const useTrailers = (
  type: 'tv' | 'movie',
  id: number | undefined,
  options: UseTrailersOptions = {}
) => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { language = 'de-DE' } = options;

  useEffect(() => {
    if (!id) {
      setTrailers([]);
      return;
    }

    const fetchTrailers = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiKey = import.meta.env.VITE_API_TMDB;

        // Hole deutsche Trailer
        const deResponse = await fetch(
          `https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${apiKey}&language=${language}`
        );
        const deData = await deResponse.json();

        // Hole auch englische Trailer als Fallback
        const enResponse = await fetch(
          `https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${apiKey}&language=en-US`
        );
        const enData = await enResponse.json();

        // Kombiniere und dedupliziere
        const allVideos = [...(deData.results || []), ...(enData.results || [])];
        const uniqueVideos = allVideos.filter(
          (video, index, self) =>
            index === self.findIndex((v) => v.key === video.key)
        );

        // Filtere nur YouTube-Trailer und -Teaser
        const filteredTrailers = uniqueVideos
          .filter(
            (video: any) =>
              video.site === 'YouTube' &&
              ['Trailer', 'Teaser', 'Clip', 'Featurette'].includes(video.type)
          )
          .map((video: any) => ({
            id: video.id,
            key: video.key,
            name: video.name,
            site: video.site,
            type: video.type,
            official: video.official || false,
            publishedAt: video.published_at,
          }))
          // Sortiere: Offizielle Trailer zuerst, dann nach Typ
          .sort((a: Trailer, b: Trailer) => {
            // Offizielle zuerst
            if (a.official && !b.official) return -1;
            if (!a.official && b.official) return 1;

            // Dann nach Typ-Priorität
            const typePriority: Record<string, number> = {
              Trailer: 0,
              Teaser: 1,
              Clip: 2,
              Featurette: 3,
            };
            return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
          });

        setTrailers(filteredTrailers);
      } catch (err) {
        console.error('[useTrailers] Error fetching trailers:', err);
        setError('Trailer konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    fetchTrailers();
  }, [type, id, language]);

  // Gibt den besten Trailer zurück (erster in der sortierten Liste)
  const mainTrailer = trailers[0] || null;

  return {
    trailers,
    mainTrailer,
    loading,
    error,
    hasTrailers: trailers.length > 0,
  };
};

export default useTrailers;
