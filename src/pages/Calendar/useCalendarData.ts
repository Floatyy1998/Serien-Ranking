import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useAuth } from '../../AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { trackEpisodeWatched } from '../../firebase/analytics';
import type { WeeklyEpisode } from '../../hooks/useWeeklyEpisodes';
import { useWeeklyEpisodes, getWeekNumber } from '../../hooks/useWeeklyEpisodes';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { showToast, showUndoToast } from '../../lib/toast';
import { WatchActivityService } from '../../services/watchActivityService';
import { getImageUrl } from '../../utils/imageUrl';

// ── Utility helpers ──────────────────────────────────────────────

export function contrastTextColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Berlin',
  });
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ── Types ────────────────────────────────────────────────────────

export interface SeriesGroup {
  seriesId: number;
  seriesTitle: string;
  episodes: WeeklyEpisode[];
}

export type GroupedSchedule = Map<string, SeriesGroup[]>;

// ── Hook ─────────────────────────────────────────────────────────

export const useCalendarData = () => {
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList();

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);

  // Filter
  const [watchlistOnly, setWatchlistOnly] = useState<boolean>(() => {
    return localStorage.getItem('calendarWatchlistOnly') === 'true';
  });

  const toggleWatchlistOnly = useCallback((next: boolean) => {
    setWatchlistOnly(next);
    localStorage.setItem('calendarWatchlistOnly', String(next));
  }, []);

  // Weekly episodes from shared hook
  const { schedule, monday, sunday, totalEpisodes, watchedCount } = useWeeklyEpisodes(
    seriesList,
    weekOffset,
    watchlistOnly
  );

  // Expanded episode groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }, []);

  // ── Backdrops ────────────────────────────────────────────────

  const [backdrops, setBackdrops] = useState<Record<number, string>>({});
  const backdropCache = useRef<Record<number, string>>({});

  const seriesIdsInSchedule = useMemo(() => {
    const ids = new Set<number>();
    for (const [, episodes] of schedule.entries()) {
      for (const ep of episodes) ids.add(ep.seriesId);
    }
    return Array.from(ids);
  }, [schedule]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!apiKey || seriesIdsInSchedule.length === 0) return;

    const toFetch = seriesIdsInSchedule.filter((id) => !backdropCache.current[id]);
    if (toFetch.length === 0) return;

    toFetch.forEach((id) => {
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=de-DE`)
        .then((res) => res.json())
        .then((data) => {
          if (data.backdrop_path) {
            const url = getImageUrl(data.backdrop_path, 'w780');
            backdropCache.current[id] = url;
            setBackdrops((prev) => ({ ...prev, [id]: url }));
          }
        })
        .catch(() => {});
    });
  }, [seriesIdsInSchedule]);

  // ── Grouped schedule ─────────────────────────────────────────

  const todayKey = toDateKey(new Date());
  const kwNumber = getWeekNumber(monday);

  const groupedSchedule: GroupedSchedule = useMemo(() => {
    const result: GroupedSchedule = new Map();
    for (const [dateKey, episodes] of schedule.entries()) {
      const seriesMap = new Map<number, WeeklyEpisode[]>();
      for (const ep of episodes) {
        const existing = seriesMap.get(ep.seriesId);
        if (existing) existing.push(ep);
        else seriesMap.set(ep.seriesId, [ep]);
      }
      const groups = Array.from(seriesMap.values()).map((eps) => ({
        seriesId: eps[0].seriesId,
        seriesTitle: eps[0].seriesTitle,
        episodes: eps,
      }));
      result.set(dateKey, groups);
    }
    return result;
  }, [schedule]);

  // ── Mark watched ─────────────────────────────────────────────

  const handleMarkWatched = useCallback(
    async (seriesNmr: number, seasonIndex: number, episodeIndex: number) => {
      if (!user) return;
      const db = firebase.database();
      const basePath = `${user.uid}/serien/${seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}`;

      try {
        // Snapshot vorher
        const [watchCountSnap, firstSnap, lastSnap, watchedSnap] = await Promise.all([
          db.ref(`${basePath}/watchCount`).once('value'),
          db.ref(`${basePath}/firstWatchedAt`).once('value'),
          db.ref(`${basePath}/lastWatchedAt`).once('value'),
          db.ref(`${basePath}/watched`).once('value'),
        ]);
        const prevCount: number = watchCountSnap.val() || 0;
        const prevFirstWatchedAt: string | null = firstSnap.val() || null;
        const prevLastWatchedAt: string | null = lastSnap.val() || null;
        const prevWatched: boolean = !!watchedSnap.val();

        // Schreiben
        const now = new Date().toISOString();
        const updates: Record<string, unknown> = {};
        updates[`${basePath}/watched`] = true;
        updates[`${basePath}/watchCount`] = prevCount + 1;
        updates[`${basePath}/lastWatchedAt`] = now;
        if (!prevFirstWatchedAt) {
          updates[`${basePath}/firstWatchedAt`] = now;
        }
        await db.ref().update(updates);

        const series = seriesList.find((s) => s.nmr === seriesNmr);
        const label = `S${seasonIndex + 1}E${episodeIndex + 1}`;
        const title = series?.title || series?.name || '';
        showUndoToast(`${title} ${label} als gesehen markiert`, {
          onUndo: async () => {
            try {
              await db.ref(`${basePath}/watched`).set(prevWatched);
              await db.ref(`${basePath}/watchCount`).set(prevCount);
              if (prevFirstWatchedAt) {
                await db.ref(`${basePath}/firstWatchedAt`).set(prevFirstWatchedAt);
              } else {
                await db.ref(`${basePath}/firstWatchedAt`).remove();
              }
              if (prevLastWatchedAt) {
                await db.ref(`${basePath}/lastWatchedAt`).set(prevLastWatchedAt);
              } else {
                await db.ref(`${basePath}/lastWatchedAt`).remove();
              }
            } catch {
              showToast('Undo fehlgeschlagen', 2000, 'error');
            }
          },
          onCommit: () => {
            if (series) {
              trackEpisodeWatched(
                series.title || series.name || '',
                seasonIndex + 1,
                episodeIndex + 1,
                {
                  tmdbId: series.id,
                  genres: series.genre?.genres,
                  runtime: series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
                  isRewatch: prevCount > 0,
                  source: 'calendar',
                }
              );
              if (prevCount === 0) {
                const providers = series.provider?.provider?.map((p: { name: string }) => p.name);
                WatchActivityService.logEpisodeWatch(
                  user.uid,
                  series.id,
                  series.title || series.name || '',
                  seasonIndex + 1,
                  episodeIndex + 1,
                  series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
                  false,
                  series.genre?.genres,
                  providers
                );
              }
            }
          },
        });
      } catch (error) {
        console.error('Failed to mark episode:', error);
        showToast('Fehler beim Speichern', 3000, 'error');
      }
    },
    [user, seriesList]
  );

  // ── Week navigation helpers ──────────────────────────────────

  const goToPrevWeek = useCallback(() => {
    setWeekOffset((o) => o - 1);
  }, []);
  const goToNextWeek = useCallback(() => {
    setWeekOffset((o) => o + 1);
  }, []);
  const goToCurrentWeek = useCallback(() => {
    setWeekOffset(0);
  }, []);

  return {
    // Week navigation
    weekOffset,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    kwNumber,
    monday,
    sunday,

    // Filter
    watchlistOnly,
    toggleWatchlistOnly,

    // Data
    totalEpisodes,
    watchedCount,
    groupedSchedule,
    todayKey,
    backdrops,

    // Groups
    expandedGroups,
    toggleGroup,

    // Actions
    handleMarkWatched,
  };
};
