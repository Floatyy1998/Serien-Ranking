import { useEffect, useMemo, useState } from 'react';
import { genreMenuItems, genreMenuItemsForMovies } from '../../config/menuItems';
import { averageRating, ratingsDiffer } from '../../lib/rating/rating';

interface Options {
  /** Nur ein sichtbares Sheet gleicht ab — sonst überschriebe es die Eingabe. */
  active: boolean;
  /** Vorbelegung des Gesamtreglers (0 = unbewertet). */
  initialRating?: number;
  /** Genres des Titels — sie hängen am Gesamtregler. */
  genres?: string[];
  /** Serie oder Film — beide haben eigene Genre-Listen. */
  mediaType?: 'series' | 'movie';
  /** Bereits gespeicherte Bewertung je Genre (`item.rating`). */
  initialGenreRatings?: Record<string, number>;
  /**
   * Zusätzlicher Anstoß für den Abgleich. Die Queue reicht den Schlüssel der
   * Karte herein — zwei Titel mit denselben Genres sähen sonst gleich aus und
   * die Bewertung des vorherigen bliebe stehen.
   */
  resetKey?: string;
  /**
   * Hält die Genre-Stufe über einen Wechsel hinweg offen. Wer in der Queue
   * einzeln bewerten will, will das meist für jeden Titel.
   */
  preserveExpanded?: boolean;
}

export interface GenreRatingStage {
  /** Gesamtwert — bei Einzelwerten deren Durchschnitt. */
  rating: number;
  /** Genres des Titels. */
  ownGenres: string[];
  /** Alle übrigen Genres der passenden Liste. */
  otherGenres: string[];
  /** Aktueller Wert je Genre (0 = unbewertet). */
  genreValues: Record<string, number>;
  /** Laufen die Einzelwerte auseinander? */
  differs: boolean;
  expanded: boolean;
  setExpanded: (next: boolean) => void;
  /** Hauptschalter: zieht die Genres des Titels und alles Bewertete mit. */
  setOverall: (value: number) => void;
  setGenre: (genre: string, value: number) => void;
  /** Setzt die bewerteten Genres wieder auf den Gesamtwert. */
  level: () => void;
  /** Einzelwerte fürs Speichern — `undefined`, solange gefächert reicht. */
  genreRatingsForSave: () => Record<string, number> | undefined;
  reset: () => void;
}

const NO_GENRE_RATINGS: Record<string, number> = {};
const EMPTY_GENRES: string[] = [];

/**
 * Zustand der zweistufigen Bewertung: ein Gesamtregler plus die aufklappbare
 * Stufe je Genre. Geteilt von `QuickRatingSheet` und `RatingQueueSheet`, damit
 * es genau eine Rating-Mechanik gibt. Schreibt nichts — der Aufrufer speichert.
 */
export function useGenreRatingStage({
  active,
  initialRating = 0,
  genres,
  mediaType = 'series',
  initialGenreRatings = NO_GENRE_RATINGS,
  resetKey = '',
  preserveExpanded = false,
}: Options): GenreRatingStage {
  const [rating, setRating] = useState(initialRating);
  const [expanded, setExpanded] = useState(false);
  const [genreValues, setGenreValues] = useState<Record<string, number>>({});
  // Sobald Einzelwerte im Spiel sind, wird je Genre gespeichert statt der
  // Gesamtwert über alle Genres gefächert.
  const [detailActive, setDetailActive] = useState(false);

  const ownGenres = useMemo(() => [...new Set((genres ?? EMPTY_GENRES).filter(Boolean))], [genres]);

  // Alle übrigen Genres der passenden Liste — dazu bereits gespeicherte
  // Schlüssel, die es dort nicht (mehr) gibt (z. B. `General`).
  const otherGenres = useMemo(() => {
    const catalog = (mediaType === 'movie' ? genreMenuItemsForMovies : genreMenuItems)
      .map((entry) => entry.value)
      .filter((value) => value !== 'All' && !ownGenres.includes(value));
    const stored = Object.keys(initialGenreRatings).filter(
      (key) => initialGenreRatings[key] > 0 && !ownGenres.includes(key) && !catalog.includes(key)
    );
    return [...catalog, ...stored];
  }, [mediaType, ownGenres, initialGenreRatings]);

  const allGenres = useMemo(() => [...ownGenres, ...otherGenres], [ownGenres, otherGenres]);

  // Signatur statt Objekt-Identität: Aufrufer reichen `rating` und `genres` oft
  // als frisches Objekt herein — an der Identität hinge der Abgleich an jedem
  // Render und würde die Eingabe des Nutzers wieder zurücksetzen.
  const signature = `${resetKey}|${initialRating}|${ownGenres.join(',')}|${allGenres
    .map((genre) => `${genre}:${initialGenreRatings[genre] ?? ''}`)
    .join(',')}`;

  // Beide Sheets bleiben montiert — ohne diesen Abgleich zeigte der nächste
  // Titel noch den Wert des vorherigen.
  useEffect(() => {
    if (!active) return;
    const next: Record<string, number> = {};
    allGenres.forEach((genre) => {
      const stored = initialGenreRatings[genre];
      if (typeof stored === 'number' && stored > 0) next[genre] = stored;
      // Fremde Genres starten unbewertet — sonst bekäme jeder Titel beim
      // Speichern eine Bewertung in jedem Genre.
      else next[genre] = ownGenres.includes(genre) ? initialRating : 0;
    });
    const differsNow = ratingsDiffer(Object.values(next));
    setGenreValues(next);
    setDetailActive(differsNow);
    // Wer schon einmal einzeln bewertet hat, sieht diese Werte sofort.
    setExpanded((prev) => differsNow || (preserveExpanded && prev));
    // Die Vorbelegung gewinnt: sie ist der Wert, den die aufrufende Karte
    // anzeigt. Nur ohne Vorbelegung wird aus den Einzelwerten gemittelt.
    setRating(initialRating > 0 ? initialRating : averageRating(Object.values(next)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, signature]);

  const differs = ratingsDiffer(Object.values(genreValues));

  const setOverall = (value: number) => {
    setRating(value);
    setGenreValues((prev) => {
      const next = { ...prev };
      allGenres.forEach((genre) => {
        if (ownGenres.includes(genre) || (prev[genre] ?? 0) > 0) next[genre] = value;
      });
      return next;
    });
  };

  const setGenre = (genre: string, value: number) => {
    const next = { ...genreValues, [genre]: value };
    setGenreValues(next);
    setRating(averageRating(Object.values(next)));
    setDetailActive(true);
  };

  return {
    rating,
    ownGenres,
    otherGenres,
    genreValues,
    differs,
    expanded,
    setExpanded,
    setOverall,
    setGenre,
    level: () => setOverall(rating),
    genreRatingsForSave: () => {
      const perGenre = Object.fromEntries(
        Object.entries(genreValues).filter(([, value]) => value > 0)
      );
      return detailActive && Object.keys(perGenre).length > 0 ? perGenre : undefined;
    },
    reset: () => {
      setRating(0);
      setExpanded(false);
      setDetailActive(false);
      setGenreValues({});
    },
  };
}
