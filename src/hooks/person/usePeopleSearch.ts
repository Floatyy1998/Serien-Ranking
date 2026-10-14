import { useEffect, useRef, useState } from 'react';
import type { PersonHit } from '../../lib/person/personSearch';
import { fetchTrendingPeople, searchPeople } from '../../services/api/tmdbPeople';

let popularPeopleCache: PersonHit[] | null = null;

export function usePeopleSearch(query: string, enabled: boolean) {
  const [state, setState] = useState<{ query: string; hits: PersonHit[] }>({
    query: '',
    hits: [],
  });
  const reqId = useRef(0);
  const q = query.trim();
  const active = enabled && q.length >= 2;

  useEffect(() => {
    if (!active) return;
    const id = ++reqId.current;
    const timer = setTimeout(() => {
      searchPeople(q)
        .catch(() => [] as PersonHit[])
        .then((hits) => {
          if (id === reqId.current) setState({ query: q, hits });
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [active, q]);

  const settled = state.query === q;
  return {
    people: active && settled ? state.hits : [],
    loading: active && !settled,
  };
}

/** `null`, solange die Trend-Personen noch laden. */
export function usePopularPeople(enabled: boolean): PersonHit[] | null {
  const [items, setItems] = useState<PersonHit[] | null>(() => popularPeopleCache);
  useEffect(() => {
    if (!enabled || popularPeopleCache) return;
    let alive = true;
    fetchTrendingPeople()
      .then((hits) => {
        if (hits.length > 0) popularPeopleCache = hits;
        if (alive) setItems(hits);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, [enabled]);
  return items;
}
