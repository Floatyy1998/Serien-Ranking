import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { CompactBookEvent } from '../../lib/books/bookEvents';
import { fetchBookEvents } from '../../services/books/bookService';

export const BOOK_EVENTS_CHANGED = 'book-events-changed';

/** Nach einem Lese-Fortschritt melden, damit Statistiken nachladen. */
export function notifyBookEventsChanged(): void {
  window.dispatchEvent(new Event(BOOK_EVENTS_CHANGED));
}

const cache = new Map<string, CompactBookEvent[]>();

/** Lese-Events der angegebenen Jahre; lädt bei jeder Fortschrittsmeldung neu. */
export function useBookEvents(years: number[]) {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const yearsKey = years.join(',');
  const [events, setEvents] = useState<CompactBookEvent[]>(() =>
    uid ? years.flatMap((y) => cache.get(`${uid}:${y}`) ?? []) : []
  );
  const [loading, setLoading] = useState(!!uid);

  const load = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const list = await Promise.all(
      (yearsKey ? yearsKey.split(',') : []).map(async (y) => {
        const year = Number(y);
        const data = await fetchBookEvents(uid, year).catch(
          () => cache.get(`${uid}:${year}`) ?? []
        );
        cache.set(`${uid}:${year}`, data);
        return data;
      })
    );
    setEvents(list.flat().sort((a, b) => a.ts - b.ts));
    setLoading(false);
  }, [uid, yearsKey]);

  useEffect(() => {
    void load();
    const onChange = () => void load();
    window.addEventListener(BOOK_EVENTS_CHANGED, onChange);
    return () => window.removeEventListener(BOOK_EVENTS_CHANGED, onChange);
  }, [load]);

  return { events, loading };
}
