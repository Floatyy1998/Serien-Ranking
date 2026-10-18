import { useEffect, useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import type { RawChapterEvent } from '../../../../lib/manga/chapterOperations';
import { fetchMangaEvents } from '../../../../services/discussion/readActivityService';

/** Kapitel- und Band-Ereignisse genau eines Jahres. */
export function useMangaYearEvents(
  year: number,
  enabled: boolean
): { events: RawChapterEvent[]; loading: boolean } {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const key = `${uid}:${year}`;
  const [state, setState] = useState<{ key: string; events: RawChapterEvent[] }>({
    key: '',
    events: [],
  });

  useEffect(() => {
    if (!uid || !enabled) return;
    let cancelled = false;
    fetchMangaEvents(uid, year)
      .catch(() => [])
      .then((events) => {
        if (!cancelled) setState({ key, events: events as RawChapterEvent[] });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, year, key, enabled]);

  const current = state.key === key;
  return { events: current ? state.events : [], loading: !!uid && enabled && !current };
}
