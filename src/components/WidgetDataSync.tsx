import { useEffect, useMemo, useRef } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import { useSeriesCountdowns } from '../hooks/useSeriesCountdowns';
import { useTodayEpisodes } from '../hooks/useTodayEpisodes';
import { isNativeApp, setWidgetData } from '../services/nativeShell';
import { getEpisodeAirDate } from '../utils/episodeDate';
import { getImageUrl } from '../utils/imageUrl';

const smallPoster = (url: string | undefined): string =>
  url ? url.replace('/w342/', '/w92/') : '';

const WEEKDAYS = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];

const dayLabel = (day: Date, today: Date): string => {
  const diff = Math.round((day.getTime() - today.getTime()) / 864e5);
  if (diff === 0) return 'HEUTE';
  if (diff === 1) return 'MORGEN';
  return `${WEEKDAYS[day.getDay()]} ${day.getDate()}.`;
};

export const WidgetDataSync = () => {
  const todayEpisodes = useTodayEpisodes();
  const { countdowns } = useSeriesCountdowns();
  const { seriesList } = useSeriesList();
  const lastJson = useRef('');

  // Nächste 7 Tage, gruppiert nach Tag (nur Tage mit Folgen)
  const week = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = today.getTime() + 7 * 864e5;
    const byDay = new Map<number, { title: string; ep: string; poster: string }[]>();

    for (const series of seriesList) {
      if (series.hidden) continue;
      for (const season of series.seasons || []) {
        (season.episodes || []).forEach((episode, idx) => {
          const airDate = getEpisodeAirDate(episode);
          if (!airDate) return;
          const day = new Date(airDate);
          day.setHours(0, 0, 0, 0);
          const t = day.getTime();
          if (t < today.getTime() || t >= end) return;
          const list = byDay.get(t) || [];
          if (list.length >= 4) return;
          list.push({
            title: series.title,
            ep: `S${season.seasonNumber || 1}E${idx + 1}`,
            poster: getImageUrl(series.poster, 'w92', ''),
          });
          byDay.set(t, list);
        });
      }
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a - b)
      .slice(0, 7)
      .map(([t, eps]) => ({ label: dayLabel(new Date(t), today), eps }));
  }, [seriesList]);

  useEffect(() => {
    if (!isNativeApp()) return;
    const next = countdowns[0];
    const payload = {
      today: todayEpisodes.slice(0, 8).map((ep) => ({
        title: ep.seriesTitle,
        ep: `S${ep.seasonNumber}E${ep.episodeNumber}`,
        watched: ep.watched,
        poster: smallPoster(ep.poster),
      })),
      countdown: next ? { title: next.title, days: next.daysUntil, date: next.nextDate } : null,
      countdowns: countdowns.slice(0, 3).map((c) => ({
        title: c.title,
        days: c.daysUntil,
        date: c.nextDate,
        poster: smallPoster(c.posterUrl),
      })),
      week,
    };
    const json = JSON.stringify(payload);
    if (json === lastJson.current) return;
    lastJson.current = json;
    setWidgetData({ ...payload, updatedAt: Date.now() });
  }, [todayEpisodes, countdowns, week]);

  return null;
};
