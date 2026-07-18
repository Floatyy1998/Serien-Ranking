import { useEffect, useRef } from 'react';
import { useSeriesCountdowns } from '../hooks/useSeriesCountdowns';
import { useTodayEpisodes } from '../hooks/useTodayEpisodes';
import { isNativeApp, setWidgetData } from '../services/nativeShell';

export const WidgetDataSync = () => {
  const todayEpisodes = useTodayEpisodes();
  const { countdowns } = useSeriesCountdowns();
  const lastJson = useRef('');

  useEffect(() => {
    if (!isNativeApp()) return;
    const next = countdowns[0];
    const payload = {
      today: todayEpisodes.slice(0, 8).map((ep) => ({
        title: ep.seriesTitle,
        ep: `S${ep.seasonNumber}E${ep.episodeNumber}`,
        watched: ep.watched,
      })),
      countdown: next ? { title: next.title, days: next.daysUntil, date: next.nextDate } : null,
    };
    const json = JSON.stringify(payload);
    if (json === lastJson.current) return;
    lastJson.current = json;
    setWidgetData({ ...payload, updatedAt: Date.now() });
  }, [todayEpisodes, countdowns]);

  return null;
};
