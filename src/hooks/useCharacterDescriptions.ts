import { useCallback, useState } from 'react';
import { useAuth } from '../AuthContext';
import { normalizeSeasons } from '../lib/episode/seriesMetrics';
import type { Series } from '../types/Series';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;
const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

interface EpisodeContext {
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string;
}

async function fetchEpisodeContext(
  seriesId: number,
  progress: UserProgress
): Promise<EpisodeContext[]> {
  const episodes: EpisodeContext[] = [];
  try {
    // Hole die aktuelle und ggf. vorherige Staffel für Kontext
    const seasonsToFetch =
      progress.season > 1 ? [progress.season - 1, progress.season] : [progress.season];

    for (const seasonNum of seasonsToFetch) {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=de-DE`
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const ep of data.episodes || []) {
        // Nur Episoden bis zum Fortschritt
        if (seasonNum === progress.season && ep.episode_number > progress.episode) break;
        if (ep.overview) {
          episodes.push({
            seasonNumber: seasonNum,
            episodeNumber: ep.episode_number,
            name: ep.name || '',
            overview: ep.overview,
          });
        }
      }
    }
  } catch {
    // Graceful fail - Beschreibungen sind optional
  }
  return episodes;
}

export interface CharacterDescription {
  name: string;
  character: string;
  description: string;
  profilePath: string | null;
  /** Full image URL (e.g. from AniList) – used instead of TMDB profilePath when set */
  imageUrl: string | null;
}

interface UserProgress {
  season: number;
  episode: number;
  isComplete: boolean;
}

function getUserProgress(series: Series): UserProgress | null {
  const seasons = normalizeSeasons(series.seasons);
  let lastSeason = 0;
  let lastEpisode = 0;

  for (let sIdx = 0; sIdx < seasons.length; sIdx++) {
    const season = seasons[sIdx];
    const episodes = season.episodes || [];
    const epArray = Array.isArray(episodes) ? episodes : Object.values(episodes);

    for (let eIdx = 0; eIdx < epArray.length; eIdx++) {
      const ep = epArray[eIdx] as { watched?: boolean; episode_number?: number };
      if (ep?.watched) {
        lastSeason = season.seasonNumber + 1;
        lastEpisode = ep.episode_number || eIdx + 1;
      }
    }
  }

  if (lastSeason === 0) return null;

  // Prüfe ob alle Episoden geschaut sind
  const hasUnwatched = seasons.some((s) => {
    const eps = Array.isArray(s.episodes) ? s.episodes : Object.values(s.episodes || {});
    return eps.some((ep) => ep && !(ep as { watched?: boolean }).watched);
  });

  return { season: lastSeason, episode: lastEpisode, isComplete: !hasUnwatched };
}

async function fetchCast(
  seriesId: number
): Promise<{ name: string; character: string; profile_path: string | null }[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${seriesId}?api_key=${TMDB_API_KEY}&language=de-DE&append_to_response=credits`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const cast = data.credits?.cast || [];
    return cast
      .slice(0, 12)
      .map((c: { name: string; character: string; profile_path: string | null }) => ({
        name: c.name,
        character: c.character,
        profile_path: c.profile_path,
      }));
  } catch {
    return [];
  }
}

async function fetchAniListCharacterImages(seriesTitle: string): Promise<Record<string, string>> {
  try {
    const query = `
      query ($search: String) {
        Media(search: $search, type: ANIME) {
          characters(sort: ROLE, perPage: 30) {
            edges {
              node {
                name { first last native }
                image { large }
              }
            }
          }
        }
      }
    `;
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: seriesTitle } }),
    });
    if (!response.ok) return {};
    const result = await response.json();
    const edges = result.data?.Media?.characters?.edges || [];
    const map: Record<string, string> = {};
    for (const edge of edges) {
      const node = edge.node;
      const fullName = `${node.name.first || ''} ${node.name.last || ''}`.trim();
      if (node.image?.large) {
        map[fullName.toLowerCase()] = node.image.large;
        if (node.name.first) map[node.name.first.toLowerCase()] = node.image.large;
        if (node.name.last) map[node.name.last.toLowerCase()] = node.image.large;
        if (node.name.native) map[node.name.native] = node.image.large;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export function useCharacterDescriptions(series: Series | undefined) {
  const { user } = useAuth() || {};
  const [characters, setCharacters] = useState<CharacterDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userProgress = series ? getUserProgress(series) : null;
  const hasAnimationGenre = series?.genre?.genres?.some((g) =>
    g.toLowerCase().includes('animation')
  );
  const isFromAsianCountry =
    series?.origin_country?.some((c) => ['JP', 'CN', 'KR'].includes(c)) || false;
  const isAsianLanguage = ['ja', 'ko', 'zh'].includes(series?.original_language || '');
  const hasAnimeKeywords = series?.genre?.genres?.some((g) => g.toLowerCase().includes('anime'));
  const isAnime =
    hasAnimeKeywords ||
    (hasAnimationGenre && (isFromAsianCountry || isAsianLanguage || !series?.origin_country));

  const generate = useCallback(async () => {
    if (!series || !userProgress || !BACKEND_URL) return;

    // Check cache
    const cacheKey = `char-desc-${series.id}-S${userProgress.season}E${userProgress.episode}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setCharacters(JSON.parse(cached));
        return;
      } catch {
        // Cache corrupt, re-fetch
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Get cast from series data or fetch from TMDB
      let cast: { name: string; character?: string; profile_path?: string | null }[] =
        series.cast?.slice(0, 12) || [];
      if (cast.length === 0) {
        cast = await fetchCast(series.id);
      }

      if (cast.length === 0) {
        setError('Keine Cast-Daten verfügbar');
        setLoading(false);
        return;
      }

      // Hole Episode-Beschreibungen als Kontext für die KI
      const episodeContext = await fetchEpisodeContext(series.id, userProgress);

      const res = await fetch(`${BACKEND_URL}/ai/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesTitle: series.title,
          originalTitle: series.original_name || series.title,
          characters: cast.map((c) => ({ name: c.name, character: c.character || c.name })),
          userProgress,
          episodeContext,
          uid: user?.uid,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json();
          setError(data.error);
        } else {
          setError(
            res.status === 404
              ? 'Serie dem KI-Modell nicht bekannt'
              : 'Fehler beim Laden der Charaktere'
          );
        }
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Bei Anime: Charakter-Bilder von AniList holen
      const aniListImages = isAnime
        ? await fetchAniListCharacterImages(series.original_name || series.title)
        : {};

      const descriptions: CharacterDescription[] = (data.characters || []).map(
        (c: { character: string; description: string }) => {
          const castMember = cast.find(
            (cm) =>
              cm.character === c.character ||
              cm.character?.includes(c.character) ||
              c.character?.includes(cm.character || '')
          );

          // Für Anime: Bild über Charakternamen in AniList suchen
          let imageUrl: string | null = null;
          if (isAnime) {
            const charLower = c.character.toLowerCase();
            imageUrl =
              aniListImages[charLower] ||
              Object.entries(aniListImages).find(
                ([key]) => charLower.includes(key) || key.includes(charLower)
              )?.[1] ||
              null;
          }

          return {
            name: isAnime ? '' : castMember?.name || '',
            character: c.character,
            description: c.description,
            profilePath: isAnime ? null : castMember?.profile_path || null,
            imageUrl,
          };
        }
      );

      setCharacters(descriptions);
      sessionStorage.setItem(cacheKey, JSON.stringify(descriptions));
    } catch {
      setError('Fehler beim Laden der Charaktere');
    } finally {
      setLoading(false);
    }
  }, [series, userProgress]);

  const [questionAnswer, setQuestionAnswer] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);

  const askQuestion = useCallback(
    async (question: string) => {
      if (!series || !userProgress || !BACKEND_URL || !question.trim()) return;

      setQuestionLoading(true);
      setQuestionAnswer(null);

      try {
        const res = await fetch(`${BACKEND_URL}/ai/character-question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seriesTitle: series.title,
            originalTitle: series.original_name || series.title,
            userProgress,
            question: question.trim(),
            uid: user?.uid,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setQuestionAnswer(data.answer);
        } else if (res.status === 429) {
          const data = await res.json();
          setQuestionAnswer(`⚠ ${data.error}`);
        } else {
          setQuestionAnswer(
            res.status === 404
              ? 'Serie dem KI-Modell nicht bekannt.'
              : 'Fehler bei der Beantwortung.'
          );
        }
      } catch {
        setQuestionAnswer('Fehler bei der Beantwortung.');
      } finally {
        setQuestionLoading(false);
      }
    },
    [series, userProgress]
  );

  return {
    characters,
    loading,
    error,
    generate,
    userProgress,
    askQuestion,
    questionAnswer,
    questionLoading,
  };
}
