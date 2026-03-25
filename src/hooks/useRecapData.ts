import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getSeriesLastWatchedAt, normalizeSeasons } from '../lib/episode/seriesMetrics';
import type { Series } from '../types/Series';
import { hasEpisodeAired } from '../utils/episodeDate';

const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;
const RECAP_THRESHOLD_DAYS = 30;

export interface RecapEpisode {
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string;
  stillPath: string | null;
}

interface RecapData {
  shouldShowRecap: boolean;
  recapEpisodes: RecapEpisode[];
  aiRecap: string | null;
  loading: boolean;
  daysSinceLastWatch: number;
  dismissed: boolean;
  dismiss: () => void;
  dismissPermanent: () => void;
  generateAiRecap: () => Promise<void>;
  aiLoading: boolean;
  aiError: string | null;
  askQuestion: (question: string) => Promise<void>;
  questionAnswer: string | null;
  questionLoading: boolean;
}

/**
 * Findet die letzten geschauten Episoden direkt VOR der ersten ungeschauten.
 * Das ist der echte "Wo war ich?"-Punkt – unabhängig von Timestamps.
 */
function getLastWatchedEpisodes(
  series: Series,
  count: number
): { seasonIndex: number; episodeIndex: number; seasonNumber: number; episodeNumber: number }[] {
  // Alle Episoden flach in chronologischer Reihenfolge sammeln
  const allEpisodes: {
    seasonIndex: number;
    episodeIndex: number;
    seasonNumber: number;
    episodeNumber: number;
    watched: boolean;
  }[] = [];

  const seasons = normalizeSeasons(series.seasons);
  for (let sIdx = 0; sIdx < seasons.length; sIdx++) {
    const season = seasons[sIdx];
    const episodes = season.episodes || [];
    const epArray = (Array.isArray(episodes) ? episodes : Object.values(episodes)) as {
      episode_number?: number;
      watched?: boolean;
    }[];
    for (let eIdx = 0; eIdx < epArray.length; eIdx++) {
      const ep = epArray[eIdx];
      if (!ep) continue;
      allEpisodes.push({
        seasonIndex: sIdx,
        episodeIndex: eIdx,
        seasonNumber: season.seasonNumber + 1,
        episodeNumber: ep.episode_number || eIdx + 1,
        watched: !!ep.watched,
      });
    }
  }

  // Finde die letzte geschaute Episode vor der ersten ungeschauten
  let lastWatchedIdx = -1;
  for (let i = 0; i < allEpisodes.length; i++) {
    if (allEpisodes[i].watched) {
      lastWatchedIdx = i;
    } else {
      // Erste ungeschaute Episode gefunden – stopp
      break;
    }
  }

  // Falls Lücken existieren (z.B. S1 komplett, S2 teilweise), suche den letzten Watch-Block
  if (lastWatchedIdx === -1) {
    // Kein zusammenhängender Block gefunden, nimm die letzte geschaute Episode überhaupt
    for (let i = allEpisodes.length - 1; i >= 0; i--) {
      if (allEpisodes[i].watched) {
        lastWatchedIdx = i;
        break;
      }
    }
  }

  if (lastWatchedIdx === -1) return [];

  const lastWatched = allEpisodes[lastWatchedIdx];

  // Prüfe ob die erste ungeschaute Episode in einer NEUEN Staffel ist
  // → dann zeige die komplette letzte geschaute Staffel
  const firstUnwatched = allEpisodes[lastWatchedIdx + 1];
  const isNewSeason = firstUnwatched && firstUnwatched.seasonIndex > lastWatched.seasonIndex;

  if (isNewSeason) {
    // Komplette letzte geschaute Staffel
    return allEpisodes
      .filter((ep) => ep.seasonIndex === lastWatched.seasonIndex && ep.watched)
      .map(({ seasonIndex, episodeIndex, seasonNumber, episodeNumber }) => ({
        seasonIndex,
        episodeIndex,
        seasonNumber,
        episodeNumber,
      }));
  }

  // Sonst: die letzten `count` geschauten Episoden bis zum Stopp-Punkt
  const start = Math.max(0, lastWatchedIdx - count + 1);
  return allEpisodes
    .slice(start, lastWatchedIdx + 1)
    .filter((ep) => ep.watched)
    .map(({ seasonIndex, episodeIndex, seasonNumber, episodeNumber }) => ({
      seasonIndex,
      episodeIndex,
      seasonNumber,
      episodeNumber,
    }));
}

async function fetchEpisodeOverviews(
  tmdbId: number,
  episodes: { seasonNumber: number; episodeNumber: number }[]
): Promise<RecapEpisode[]> {
  // Gruppiere nach Staffel um API-Calls zu minimieren
  const seasonNumbers = [...new Set(episodes.map((e) => e.seasonNumber))];
  const seasonDataMap: Record<
    number,
    {
      episodes: {
        episode_number: number;
        name: string;
        overview: string;
        still_path: string | null;
      }[];
    }
  > = {};

  await Promise.all(
    seasonNumbers.map(async (seasonNum) => {
      const cacheKey = `recap-season-${tmdbId}-${seasonNum}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        seasonDataMap[seasonNum] = JSON.parse(cached);
        return;
      }

      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=de-DE`
        );
        if (res.ok) {
          const data = await res.json();
          seasonDataMap[seasonNum] = data;
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch {
        // Graceful fail
      }
    })
  );

  return episodes
    .map((ep) => {
      const seasonData = seasonDataMap[ep.seasonNumber];
      const tmdbEp = seasonData?.episodes?.find((e) => e.episode_number === ep.episodeNumber);

      if (!tmdbEp || !tmdbEp.overview) return null;

      return {
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        name: tmdbEp.name || `Episode ${ep.episodeNumber}`,
        overview: tmdbEp.overview,
        stillPath: tmdbEp.still_path || null,
      };
    })
    .filter((ep): ep is RecapEpisode => ep !== null);
}

export const useRecapData = (series: Series | undefined): RecapData => {
  const { user } = useAuth() || {};
  const [recapEpisodes, setRecapEpisodes] = useState<RecapEpisode[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [shouldShowRecap, setShouldShowRecap] = useState(false);
  const [daysSinceLastWatch, setDaysSinceLastWatch] = useState(0);
  const [aiRecap, setAiRecap] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!series || dismissed) {
      setShouldShowRecap(false);
      return;
    }

    // Nicht bei Rewatch
    if (series.rewatch?.active) {
      setShouldShowRecap(false);
      return;
    }

    // Permanent dismissed
    if (localStorage.getItem(`recap-permanent-dismiss-${series.id}`) === 'true') {
      setShouldShowRecap(false);
      return;
    }

    const lastWatchedAt = getSeriesLastWatchedAt(series);
    if (lastWatchedAt === '1900-01-01') {
      setShouldShowRecap(false);
      return;
    }

    const daysSince = Math.floor(
      (Date.now() - new Date(lastWatchedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    setDaysSinceLastWatch(daysSince);

    // Prüfe ob es unwatched Episodes gibt die bereits ausgestrahlt wurden
    const hasUnwatched = series.seasons?.some((s) =>
      s.episodes?.some((ep) => !ep.watched && hasEpisodeAired(ep))
    );

    if (daysSince >= RECAP_THRESHOLD_DAYS && hasUnwatched) {
      setShouldShowRecap(true);

      // Lade Episode-Overviews
      setLoading(true);
      const lastEpisodes = getLastWatchedEpisodes(series, 5);
      if (lastEpisodes.length > 0) {
        fetchEpisodeOverviews(series.id, lastEpisodes)
          .then((episodes) => {
            setRecapEpisodes(episodes);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setShouldShowRecap(false);
    }
  }, [series, dismissed]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setShouldShowRecap(false);
  }, []);

  const dismissPermanent = useCallback(() => {
    if (!series) return;
    setDismissed(true);
    setShouldShowRecap(false);
    localStorage.setItem(`recap-permanent-dismiss-${series.id}`, 'true');
  }, [series]);

  const generateAiRecap = useCallback(async () => {
    if (!series || recapEpisodes.length === 0 || !BACKEND_URL) return;

    setAiLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/ai/recap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesTitle: series.title,
          originalTitle: series.original_name || series.title,
          episodes: recapEpisodes,
          uid: user?.uid,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiRecap(data.recap);
        setAiError(null);
      } else if (res.status === 429) {
        const data = await res.json();
        setAiError(data.error);
      } else if (res.status === 404) {
        setAiError('Serie dem KI-Modell nicht bekannt');
      } else {
        setAiError('KI-Zusammenfassung fehlgeschlagen');
      }
    } catch {
      setAiError('KI-Zusammenfassung fehlgeschlagen');
    } finally {
      setAiLoading(false);
    }
  }, [series, recapEpisodes]);

  const [questionAnswer, setQuestionAnswer] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);

  const askQuestion = useCallback(
    async (question: string) => {
      if (!series || !BACKEND_URL || !question.trim()) return;

      // Fortschritt = letzte Recap-Episode
      const lastEp = recapEpisodes[recapEpisodes.length - 1];
      const userProgress = lastEp
        ? { season: lastEp.seasonNumber, episode: lastEp.episodeNumber, isComplete: false }
        : { season: 1, episode: 1, isComplete: false };

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
    [series, recapEpisodes]
  );

  return {
    shouldShowRecap,
    recapEpisodes,
    aiRecap,
    loading,
    daysSinceLastWatch,
    dismissed,
    dismiss,
    dismissPermanent,
    generateAiRecap,
    aiLoading,
    aiError,
    askQuestion,
    questionAnswer,
    questionLoading,
  };
};
