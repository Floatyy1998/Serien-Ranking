import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { MangaReadEvent } from '../../lib/manga/readHistory';
import { fetchMangaEvents } from '../../services/discussion/readActivityService';

/** Lädt die Kapitel-Ereignisse der Jahre, die der Zeitraum berührt (Jahreswechsel inklusive). */
export function useMangaReadEvents(
  rangeDays: number,
  now: number
): { events: MangaReadEvent[]; loading: boolean } {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [state, setState] = useState<{ key: string; events: MangaReadEvent[] }>({
    key: '',
    events: [],
  });

  const currentYear = new Date(now).getFullYear();
  const firstYear = new Date(now - rangeDays * 86400000).getFullYear();
  const key = `${uid}:${firstYear}-${currentYear}`;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const years: number[] = [];
    for (let y = firstYear; y <= currentYear; y++) years.push(y);
    Promise.all(years.map((y) => fetchMangaEvents(uid, y).catch(() => [])))
      .then((lists) => {
        if (!cancelled) setState({ key, events: lists.flat() as MangaReadEvent[] });
      })
      .catch(() => {
        if (!cancelled) setState({ key, events: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, key, firstYear, currentYear]);

  return { events: state.events, loading: !!uid && state.key !== key };
}
