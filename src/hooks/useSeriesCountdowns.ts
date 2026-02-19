import { useEffect, useState } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useAuth } from '../App';

export interface SeriesCountdown {
  seriesId: number;
  title: string;
  posterUrl: string;
  nextDate: string;
  daysUntil: number;
  seasonNumber: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_PREFIX = 'countdowns-v3-';

function getCached(userId: string): { data: SeriesCountdown[]; timestamp: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_DURATION) return parsed;
    sessionStorage.removeItem(CACHE_KEY_PREFIX + userId);
  } catch { /* ignore */ }
  return null;
}

function setCache(userId: string, data: SeriesCountdown[]) {
  try {
    sessionStorage.setItem(CACHE_KEY_PREFIX + userId, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { /* ignore */ }
}

export function useSeriesCountdowns() {
  const { seriesList } = useSeriesList();
  const { user } = useAuth() || {};
  const [countdowns, setCountdowns] = useState<SeriesCountdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || seriesList.length === 0) {
      setLoading(false);
      return;
    }

    const cached = getCached(user.uid);
    if (cached) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const updated = cached.data
        .map(c => ({
          ...c,
          daysUntil: Math.round((new Date(c.nextDate + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        }))
        .filter(c => c.daysUntil > 0)
        .sort((a, b) => a.daysUntil - b.daysUntil);
      setCountdowns(updated);
      setLoading(false);
      return;
    }

    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!apiKey) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchCountdowns() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const results: SeriesCountdown[] = [];

      const batches: typeof seriesList[] = [];
      for (let i = 0; i < seriesList.length; i += 10) {
        batches.push(seriesList.slice(i, i + 10));
      }

      for (const batch of batches) {
        if (cancelled) return;

        const promises = batch.map(async (series) => {
          try {
            const res = await fetch(
              `https://api.themoviedb.org/3/tv/${series.id}?api_key=${apiKey}&language=de-DE`
            );
            if (!res.ok) return null;
            const data = await res.json();

            if (!data.seasons || !Array.isArray(data.seasons)) return null;

            // Find the next upcoming season: air_date in the future means
            // the season hasn't started airing yet → show countdown.
            // air_date in the past means the season already started → ignore.
            let best: SeriesCountdown | null = null;

            for (const season of data.seasons) {
              if (!season.air_date || season.season_number <= 0) continue;

              const airDate = new Date(season.air_date);
              airDate.setHours(0, 0, 0, 0);
              const daysUntil = Math.round((airDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              if (daysUntil > 0 && (!best || daysUntil < best.daysUntil)) {
                best = {
                  seriesId: series.id,
                  title: series.title,
                  posterUrl: series.poster?.poster || '',
                  nextDate: season.air_date,
                  daysUntil,
                  seasonNumber: season.season_number,
                };
              }
            }

            return best;
          } catch {
            return null;
          }
        });

        const batchResults = await Promise.allSettled(promises);
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
          }
        }
      }

      if (cancelled) return;

      const sorted = results.sort((a, b) => a.daysUntil - b.daysUntil);
      setCountdowns(sorted);
      setCache(user!.uid, sorted);
      setLoading(false);
    }

    fetchCountdowns();
    return () => { cancelled = true; };
  }, [seriesList, user?.uid]);

  return { countdowns, loading };
}
