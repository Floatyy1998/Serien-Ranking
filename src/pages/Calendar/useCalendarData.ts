import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { dbRef, paths, serverTimestamp } from '../../services/db/ref';
import { useAuth } from '../../contexts/AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { trackEpisodeWatched } from '../../services/firebase/analytics';
import type { WeeklyEpisode } from '../../hooks/useWeeklyEpisodes';
import { useWeeklyEpisodes, getWeekNumber } from '../../hooks/useWeeklyEpisodes';
import { runEpisodeWatchFanout } from '../../lib/episode/episodeWatchFanout';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { applyUserUpdate } from '../../services/offline/queuedUpdate';
import { showToast, showUndoToast } from '../../lib/toast';
import { getImageUrl } from '../../utils/imageUrl';

// ── Utility helpers ──────────────────────────────────────────────

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
  const { seriesList, loading } = useSeriesList();

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
    async (seriesId: number, seasonIndex: number, episodeIndex: number) => {
      if (!user) return;
      const series = seriesList.find((s) => s.id === seriesId);
      const episode = series?.seasons?.[seasonIndex]?.episodes?.[episodeIndex];
      const episodeId = episode?.id;
      if (!episodeId) {
        showToast('Episode-ID fehlt', 2000, 'error');
        return;
      }
      const epBase = `${paths.seriesWatchItem(user.uid, seriesId)}/seasons/${seasonIndex}/eps/${episodeId}`;

      try {
        // Snapshot vorher (ganzen Entry auf einmal)
        const snap = await dbRef(epBase).once('value');
        const val = (snap.val() as { w?: number; c?: number; f?: number; l?: number } | null) || {};
        const prevCount: number = val.c || 0;
        const prevFirst: number = val.f || 0;
        const prevLast: number = val.l || 0;
        const prevWatched: number = val.w || 0;

        // Schreiben — über die persistente Offline-Queue. serienVersion-Bump
        // gehört laut Write-Regel in jede Watch-Update-Map (fehlte hier
        // bisher; ohne ihn sehen andere Geräte den Mark nicht).
        const nowUnix = Math.floor(Date.now() / 1000);
        const updates: Record<string, unknown> = {};
        updates[`${epBase}/w`] = 1;
        updates[`${epBase}/c`] = prevCount + 1;
        updates[`${epBase}/l`] = nowUnix;
        if (!prevFirst) {
          updates[`${epBase}/f`] = nowUnix;
        }
        updates[paths.serienVersion(user.uid)] = serverTimestamp();

        const label = `S${seasonIndex + 1}E${episodeIndex + 1}`;
        const title = series?.title || series?.name || '';
        await applyUserUpdate(user.uid, updates, `${title} ${label} (Kalender)`);
        showUndoToast(`${title} ${label} als gesehen markiert`, {
          onUndo: async () => {
            try {
              if (!prevWatched && prevCount === 0 && !prevFirst && !prevLast) {
                await dbRef(epBase).remove();
              } else {
                await dbRef(epBase).set({
                  ...(prevWatched ? { w: prevWatched } : {}),
                  ...(prevCount ? { c: prevCount } : {}),
                  ...(prevFirst ? { f: prevFirst } : {}),
                  ...(prevLast ? { l: prevLast } : {}),
                });
              }
            } catch {
              showToast('Undo fehlgeschlagen', 2000, 'error');
            }
          },
          onCommit: async () => {
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
              const episode = series.seasons?.[seasonIndex]?.episodes?.[episodeIndex];
              // Kein Pet-XP im Kalender (bestehendes Verhalten beibehalten).
              // Wrapped-Event nur beim Erstwatch (prevCount === 0) — dann ist
              // isRewatch ohnehin false, wie zuvor hart kodiert.
              await runEpisodeWatchFanout({
                userId: user.uid,
                seriesId: series.id,
                seriesTitle: series.title || series.name || '',
                seasonNumber: seasonIndex + 1,
                episodeNumber: episodeIndex + 1,
                runtimeMinutes: series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
                isRewatch: prevCount > 0,
                genres: series.genre?.genres,
                providers: series.provider?.provider?.map((p: { name: string }) => p.name),
                episodeAirDate: episode?.air_date,
                petXp: false,
                wrappedEvent: prevCount === 0,
              });
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
    loading,
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
