import { useMemo } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import { useAnimeFillerCatalog } from './useAnimeFillerCatalog';
import {
  buildFillerLookup,
  fillerEpisodesFromStatic,
  fillerLookupKey,
} from '../services/animeFillerService';
import { buildCatchUpPlan, collectOpenEpisodes, type CatchUpPlan } from '../lib/catchUpPlan';
import { calculateWatchingPace } from '../lib/date/paceCalculation';
import { getEpisodeAirDate } from '../utils/episodeDate';
import type { SeriesCountdown } from './useSeriesCountdowns';

/**
 * Aufhol-Pläne je Countdown: schaffst du den Rückstand bis zum Starttermin?
 * Der Filler-Hebel kommt aus dem statischen Anime-Katalog, nicht aus Firebase.
 */
export function useCatchUpPlans(countdowns: SeriesCountdown[]): Map<number, CatchUpPlan> {
  const { seriesList } = useSeriesList();
  const fillerCatalog = useAnimeFillerCatalog();

  return useMemo(() => {
    const plans = new Map<number, CatchUpPlan>();
    if (countdowns.length === 0 || seriesList.length === 0) return plans;

    const now = new Date();
    const byId = new Map(seriesList.map((s) => [s.id, s]));

    for (const countdown of countdowns) {
      const series = byId.get(countdown.seriesId);
      if (!series) continue;

      const targetDate = getEpisodeAirDate({ air_date: countdown.nextDate });
      if (!targetDate) continue;

      const entry = fillerCatalog?.[String(series.id)];
      const lookup = entry
        ? buildFillerLookup(series.seasons, fillerEpisodesFromStatic(entry))
        : null;
      const isFiller = lookup
        ? (sn: number, ep: number) => lookup.get(fillerLookupKey(sn, ep))?.filler === true
        : undefined;

      const open = collectOpenEpisodes(series, isFiller);
      const pace = calculateWatchingPace(series.seasons, series.episodeRuntime);

      const plan = buildCatchUpPlan({
        ...open,
        episodesPerWeek: pace.isPaused ? 0 : pace.episodesPerWeek,
        targetDate,
        now,
      });

      if (plan.shouldShow) plans.set(countdown.seriesId, plan);
    }

    return plans;
  }, [countdowns, seriesList, fillerCatalog]);
}
