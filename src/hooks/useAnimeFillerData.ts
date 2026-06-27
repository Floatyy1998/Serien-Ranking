import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildFillerLookup,
  getAnimeFillerData,
  refreshAnimeFillerViaBackend,
  type AnimeFillerData,
  type FillerEpisode,
} from '../services/animeFillerService';

interface SeasonLike {
  seasonNumber?: number;
  season_number?: number;
  episodes?: unknown[];
}

interface UseAnimeFillerDataResult {
  data: AnimeFillerData | null;
  loading: boolean;
  /**
   * True when the backend has data for this series. Mirrors the old
   * `enabled` flag so callers can keep silent-on-non-anime semantics.
   */
  enabled: boolean;
  /** Lookup keyed by `s{seasonNumber}-e{episodeNumber}` (1-based numbers). */
  fillerByKey: Map<string, FillerEpisode>;
  /** Ask the backend to re-fetch this series from AniList/Jikan. */
  reload: () => void;
}

/**
 * Reads filler/recap info from the backend (Firebase admin/animeFiller).
 * The frontend never talks to AniList/Jikan directly; reloads go through
 * a backend endpoint.
 */
export function useAnimeFillerData(
  seriesId: number | string | undefined,
  seasons?: SeasonLike[]
): UseAnimeFillerDataResult {
  const [data, setData] = useState<AnimeFillerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!seriesId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getAnimeFillerData(seriesId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId, reloadKey]);

  const fillerByKey = useMemo(() => {
    if (!data || !seasons) return new Map<string, FillerEpisode>();
    return buildFillerLookup(seasons, data.episodes);
  }, [data, seasons]);

  const reload = useCallback(() => {
    if (seriesId === undefined) return;
    setLoading(true);
    refreshAnimeFillerViaBackend(seriesId)
      .then((result) => setData(result))
      .finally(() => {
        setLoading(false);
        setReloadKey((k) => k + 1);
      });
  }, [seriesId]);

  return {
    data,
    loading,
    enabled: data !== null,
    fillerByKey,
    reload,
  };
}
