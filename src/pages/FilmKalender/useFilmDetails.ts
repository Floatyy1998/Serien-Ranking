import { useEffect, useState, type RefObject } from 'react';
import {
  fetchFilmDetails,
  peekFilmDetails,
  type FilmDetails,
  type ReleaseMode,
} from './filmReleaseData';

/** Lädt Regie, Besetzung und Anbieter, sobald `ref` sichtbar wird; `null`, solange sie fehlen. */
export function useFilmDetails(
  movieId: number,
  mode: ReleaseMode,
  ref: RefObject<HTMLElement | null>,
  enabled: boolean
): FilmDetails | null {
  const [details, setDetails] = useState<FilmDetails | null>(() =>
    enabled ? (peekFilmDetails(movieId, mode) ?? null) : null
  );

  useEffect(() => {
    if (!enabled || details) return;
    const node = ref.current;
    if (!node) return;
    let cancelled = false;
    const load = () => {
      void fetchFilmDetails(movieId, mode).then((loaded) => {
        if (!cancelled) setDetails(loaded);
      });
    };
    if (typeof IntersectionObserver === 'undefined') {
      load();
      return () => {
        cancelled = true;
      };
    }
    const observer = new IntersectionObserver((records) => {
      if (!records.some((record) => record.isIntersecting)) return;
      observer.disconnect();
      load();
    });
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [enabled, details, movieId, mode, ref]);

  return details;
}
