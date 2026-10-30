import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { advanceSeriesNextEpisodes, findNextEpisodePosition } from '../../lib/episode/nextEpisode';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { t } from '../../services/i18n';
import type { Series } from '../../types/Series';
import { hasEpisodeAired } from '../../utils/episodeDate';

export interface CatchUpSeries {
  series: Series;
  totalEpisodes: number;
  watchedEpisodes: number;
  remainingEpisodes: number;
  remainingMinutes: number;
  progress: number;
  currentSeason: number;
  currentEpisode: number;
  lastWatchedDate?: string;
}

export type SortOption = 'episodes' | 'time' | 'progress' | 'recent';
export type SortDirection = 'asc' | 'desc';

export interface SortOptionConfig {
  value: SortOption;
  labelDesc: string;
  labelAsc: string;
  icon: string;
}

const SCROLL_STORAGE_KEY = 'catchup-scroll-position';

const VALID_SORT_OPTIONS: SortOption[] = ['episodes', 'time', 'progress', 'recent'];

export const useCatchUpData = () => {
  const { seriesList, loading } = useSeriesList();
  const [searchParams, setSearchParams] = useSearchParams();
  const onPage = useLocation().pathname === '/catch-up';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRestoredRef = useRef(false);

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const sortParam = searchParams.get('sort') as SortOption;
    return sortParam && VALID_SORT_OPTIONS.includes(sortParam) ? sortParam : 'episodes';
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const dirParam = searchParams.get('dir') as SortDirection;
    return dirParam && ['asc', 'desc'].includes(dirParam) ? dirParam : 'desc';
  });

  const handleSortClick = useCallback(
    (value: SortOption) => {
      if (sortBy === value) {
        setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
      } else {
        setSortBy(value);
        setSortDirection('desc');
      }
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
    },
    [sortBy]
  );

  // Keep-Alive-Tab: versteckt gemountet darf er nicht in fremde URLs schreiben
  // (Ping-Pong mit dem Freundesprofil sprengte Safaris replaceState-Limit).
  useEffect(() => {
    if (!onPage) return;
    if (searchParams.get('sort') === sortBy && searchParams.get('dir') === sortDirection) return;
    setSearchParams({ sort: sortBy, dir: sortDirection }, { replace: true });
  }, [onPage, sortBy, sortDirection, searchParams, setSearchParams]);

  // Save scroll position on scroll (debounced)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(container.scrollTop));
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollRestoredRef.current) return;
    scrollRestoredRef.current = true;

    const savedPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedPosition) {
      const pos = parseInt(savedPosition, 10);
      // Delay to ensure content is rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollContainerRef.current?.scrollTo({ top: pos });
        });
      });
    }
  }, []);

  const catchUpData = useMemo(() => {
    const data: CatchUpSeries[] = [];

    seriesList.forEach((series) => {
      if (!series.seasons || series.seasons.length === 0) return;

      let totalEpisodes = 0;
      let watchedEpisodes = 0;
      let lastWatchedDate: string | undefined;
      let remainingMinutes = 0;
      const seriesRuntime = series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;

      series.seasons.forEach((season) => {
        if (!season.episodes) return;

        season.episodes.forEach((episode) => {
          if (!hasEpisodeAired(episode)) return;
          totalEpisodes++;
          if (episode.watched) {
            watchedEpisodes++;
            if (episode.lastWatchedAt || episode.firstWatchedAt) {
              const watchDate = episode.lastWatchedAt ?? episode.firstWatchedAt ?? '';
              if (!lastWatchedDate || watchDate > lastWatchedDate) {
                lastWatchedDate = watchDate;
              }
            }
          } else {
            remainingMinutes += episode.runtime || seriesRuntime;
          }
        });
      });

      const remainingEpisodes = totalEpisodes - watchedEpisodes;

      if (remainingEpisodes > 0 && totalEpisodes > 0) {
        const progress = (watchedEpisodes / totalEpisodes) * 100;

        data.push({
          series,
          totalEpisodes,
          watchedEpisodes,
          remainingEpisodes,
          remainingMinutes,
          progress,
          ...(nextEpisodePosition(series) ?? { currentSeason: 1, currentEpisode: 1 }),
          lastWatchedDate,
        });
      }
    });

    return data;
  }, [seriesList]);

  const sortedData = useMemo(() => {
    const sorted = [...catchUpData];
    const dir = sortDirection === 'desc' ? 1 : -1;

    switch (sortBy) {
      case 'episodes':
        sorted.sort((a, b) => dir * (b.remainingEpisodes - a.remainingEpisodes));
        break;
      case 'time':
        sorted.sort((a, b) => dir * (b.remainingMinutes - a.remainingMinutes));
        break;
      case 'progress':
        sorted.sort((a, b) => dir * (b.progress - a.progress));
        break;
      case 'recent':
        sorted.sort((a, b) => {
          if (!a.lastWatchedDate && !b.lastWatchedDate) return 0;
          if (!a.lastWatchedDate) return 1;
          if (!b.lastWatchedDate) return -1;
          return (
            dir * (new Date(b.lastWatchedDate).getTime() - new Date(a.lastWatchedDate).getTime())
          );
        });
        break;
    }

    return sorted;
  }, [catchUpData, sortBy, sortDirection]);

  const totals = useMemo(() => {
    const totalEpisodes = catchUpData.reduce((sum, item) => sum + item.remainingEpisodes, 0);
    const totalMinutes = catchUpData.reduce((sum, item) => sum + item.remainingMinutes, 0);
    const avgProgress =
      catchUpData.length > 0
        ? catchUpData.reduce((sum, item) => sum + item.progress, 0) / catchUpData.length
        : 0;
    return { totalEpisodes, totalMinutes, avgProgress };
  }, [catchUpData]);

  const currentLabel = useMemo(() => {
    const labels: Record<SortOption, { desc: string; asc: string }> = {
      episodes: { desc: t('Meiste Episoden'), asc: t('Wenigste Episoden') },
      time: { desc: t('Längste Zeit'), asc: t('Kürzeste Zeit') },
      progress: { desc: t('Fast fertig'), asc: t('Am Anfang') },
      recent: { desc: t('Zuletzt geschaut'), asc: t('Am längsten her') },
    };
    return sortDirection === 'desc' ? labels[sortBy].desc : labels[sortBy].asc;
  }, [sortBy, sortDirection]);

  return {
    catchUpData,
    sortedData,
    totals,
    sortBy,
    sortDirection,
    handleSortClick,
    currentLabel,
    scrollContainerRef,
    loading,
  };
};

/**
 * Optimistischer Vorlauf für eine CatchUp-Karte.
 *
 * Liefert eine {@link CatchUpSeries}-Sicht, in der die ersten `advance` noch
 * ungesehenen, bereits ausgestrahlten Folgen als gesehen gelten – ohne auf den
 * Firebase-Re-Hydrate zu warten. So zeigt die Karte beim Bingen sofort die
 * NÄCHSTE Folge (SxEy) an, statt bis zum Realtime-Update dieselbe zu behalten.
 *
 * Reine Funktion (keine Seiteneffekte) – der eigentliche Mark-Write läuft
 * weiterhin über {@link markNextEpisodeWatched}. Konvergiert automatisch, sobald
 * die echten Daten nachkommen: der Aufrufer baut `advance` dann wieder ab.
 *
 * @returns die vorgeschobene Sicht, oder `null`, wenn die Serie durch den
 *          Vorlauf vollständig aufgeholt ist (Karte ausblenden).
 */
export const advanceCatchUpView = (item: CatchUpSeries, advance: number): CatchUpSeries | null => {
  if (advance <= 0) return item;

  const series = item.series;
  const seriesRuntime = series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;

  // Dieselbe Anker-Logik wie der echte Mark-Write: die nächsten `advance`
  // offenen Folgen gelten als gesehen, die Karte zeigt die darauf folgende.
  const advanced = advanceSeriesNextEpisodes(series, advance);
  const skipped = advanced.marked.length;
  const skippedMinutes = advanced.marked.reduce((sum, pos) => {
    const episode = series.seasons[pos.seasonIndex]?.episodes?.[pos.episodeIndex];
    return sum + (episode?.runtime || seriesRuntime);
  }, 0);

  // Keine nächste ungesehene Folge mehr übrig → Serie aufgeholt → Karte weg.
  const next = nextEpisodePosition(advanced.series);
  if (!next) return null;

  const watchedEpisodes = item.watchedEpisodes + skipped;
  const remainingEpisodes = item.totalEpisodes - watchedEpisodes;
  if (remainingEpisodes <= 0) return null;

  return {
    ...item,
    watchedEpisodes,
    remainingEpisodes,
    remainingMinutes: Math.max(0, item.remainingMinutes - skippedMinutes),
    progress: (watchedEpisodes / item.totalEpisodes) * 100,
    ...next,
  };
};

/** 1-basierte Anzeige-Position der nächsten offenen Folge; null, wenn nichts offen ist. */
function nextEpisodePosition(
  series: Series
): { currentSeason: number; currentEpisode: number } | null {
  const pos = findNextEpisodePosition(series);
  if (!pos) return null;
  const season = series.seasons[pos.seasonIndex];
  const episode = season.episodes[pos.episodeIndex];
  return {
    currentSeason: (season.seasonNumber ?? 0) + 1,
    currentEpisode: episode.episode_number || pos.episodeIndex + 1,
  };
}

export const formatTime = (minutes: number): { value: number; unit: string } => {
  if (minutes < 60) return { value: minutes, unit: t('Min') };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: hours, unit: t('Std') };
  const days = Math.floor(hours / 24);
  return { value: days, unit: t('Tage') };
};

export const formatTimeString = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};
