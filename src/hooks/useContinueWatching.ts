import { useMemo } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import { HOME_CAROUSEL_MAX_ITEMS } from '../lib/episode/constants';
import { calculateSeriesMetrics, getSeriesLastWatchedAt } from '../lib/episode/seriesMetrics';
import type { Series } from '../types/Series';
import { detectEpisodeChip, type EpisodeChipType } from '../utils/episodeChips';
import { getEpisodeAirDateStr, hasEpisodeAired } from '../utils/episodeDate';
import { getImageUrl } from '../utils/imageUrl';

export const useContinueWatching = () => {
  const { seriesList } = useSeriesList();
  interface ContinueWatchingItem {
    type: 'series';
    id: number;
    title: string;
    poster: string;
    /** Volle Backdrop-URL (w1280) fürs Zeilen-Artwork; fehlt bei alten Einträgen. */
    backdrop?: string;
    progress: number;
    nextEpisode: {
      seasonNumber: number;
      episodeNumber: number;
      name: string;
      seasonIndex: number;
      episodeIndex: number;
      episodeId: number;
    };
    airDate: string;
    lastWatchedAt: string;
    genre: Series['genre'];
    provider: Series['provider'];
    episodeRuntime: number;
    seasons: Series['seasons'];
    chipType?: EpisodeChipType;
    /** Sort/priority signal only — no longer a hard include/exclude gate. */
    watchlist?: boolean;
  }

  const continueWatching = useMemo(() => {
    const items: ContinueWatchingItem[] = [];

    for (let i = 0; i < seriesList.length; i++) {
      const series = seriesList[i];
      // Versteckte Serien nie zeigen. Watchlist-Flag ist KEIN Ausschlusskriterium
      // mehr (F2): Serien mit echtem Fortschritt sollen auch ohne gesetzte
      // Watchlist im „Weiter schauen"-Feed auftauchen.
      if (series.hidden) continue;

      const lastWatchedAt = getSeriesLastWatchedAt(series);
      const { progress, watchedEpisodes, remainingEpisodes } = calculateSeriesMetrics(series);
      // Angefangen (mind. eine aired Episode gesehen) UND nicht komplett fertig
      // (noch aired-Episoden offen). Die konkrete nächste ungesehene aired
      // Episode ermittelt die Schleife unten; ohne sie wird nichts gepusht.
      if (watchedEpisodes === 0 || remainingEpisodes === 0) continue;

      const seasons = series.seasons;

      if (seasons) {
        let foundNext = false;
        for (let j = 0; j < seasons.length && !foundNext; j++) {
          const season = seasons[j];
          const episodes2 = season.episodes;
          if (!episodes2) continue;

          for (let k = 0; k < episodes2.length; k++) {
            const episode = episodes2[k];
            if (!episode?.watched && hasEpisodeAired(episode)) {
              const isInProduction = series.production?.production !== false;
              const chipType = detectEpisodeChip(episodes2, k, isInProduction);

              items.push({
                type: 'series',
                id: series.id,
                title: series.title,
                poster: getImageUrl(series.poster),
                backdrop: series.backdrop ? getImageUrl(series.backdrop, 'w1280') : undefined,
                progress,
                nextEpisode: {
                  seasonNumber: (season.seasonNumber ?? 0) + 1,
                  episodeNumber: k + 1,
                  name: episode.name,
                  seasonIndex: j,
                  episodeIndex: k,
                  episodeId: episode.id ?? 0,
                },
                airDate: getEpisodeAirDateStr(episode) || episode.air_date,
                lastWatchedAt,
                genre: series.genre,
                seasons: series.seasons,
                provider: series.provider,
                episodeRuntime: episode.runtime || series.episodeRuntime,
                chipType,
                watchlist: !!series.watchlist,
              });
              foundNext = true;
              break;
            }
          }
        }
      }
    }

    items.sort((a, b) => {
      const dateA = new Date(a.lastWatchedAt).getTime();
      const dateB = new Date(b.lastWatchedAt).getTime();
      if (dateB !== dateA) return dateB - dateA;
      // Gleich zuletzt gesehen → Watchlist-Serien leicht bevorzugen.
      if (a.watchlist !== b.watchlist) return a.watchlist ? -1 : 1;
      return 0;
    });

    return items.slice(0, HOME_CAROUSEL_MAX_ITEMS);
  }, [seriesList]);

  return continueWatching;
};
