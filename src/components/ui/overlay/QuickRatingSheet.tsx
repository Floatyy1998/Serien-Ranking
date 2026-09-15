import { Save } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { hapticSelect, hapticSuccess } from '../../../lib/interaction/haptics';
import { t } from '../../../services/i18n';
import { genreMenuItems, genreMenuItemsForMovies } from '../../../config/menuItems';
import { BottomSheet } from './BottomSheet';
import { GenreRatingDetails } from '../input/GenreRatingDetails';
import { RatingControls } from '../input/RatingControls';
import { tapScale } from '../../../lib/motion';

interface QuickRatingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  seriesTitle: string;
  seasonNumber?: number;
  /** Zweites Argument sind die Einzelwerte je Genre, sofern der Nutzer sie aufgeklappt hat. */
  onRate: (rating: number, genreRatings?: Record<string, number>) => void;
  /** Überschrift über dem Titel — Standard ist der Abspann-Fall. */
  eyebrow?: string;
  /** Vorbelegung, damit eine bestehende Bewertung nicht bei 0 startet. */
  initialRating?: number;
  /** Genres des Titels — sie stehen oben und hängen am Gesamtregler. */
  genres?: string[];
  /** Bestimmt die Genre-Liste der Detailstufe (Serien und Filme haben eigene). */
  mediaType?: 'series' | 'movie';
  /** Bereits gespeicherte Bewertung je Genre (`item.rating`). */
  initialGenreRatings?: Record<string, number>;
  /** Durchgereicht an das BottomSheet (z. B. über dem Such-Overlay). */
  zIndex?: number | string;
}

const NO_GENRE_RATINGS: Record<string, number> = {};

/** Durchschnitt der bewerteten Genres, eine Nachkommastelle — wie der Bewertungseditor. */
const averageOf = (values: number[]): number => {
  const rated = values.filter((value) => value > 0);
  if (rated.length === 0) return 0;
  return Math.round((rated.reduce((sum, value) => sum + value, 0) / rated.length) * 10) / 10;
};

const spread = (values: number[]): boolean =>
  new Set(values.filter((value) => value > 0).map((value) => value.toFixed(1))).size > 1;

export const QuickRatingSheet: React.FC<QuickRatingSheetProps> = ({
  isOpen,
  onClose,
  seriesTitle,
  onRate,
  eyebrow,
  initialRating = 0,
  genres,
  mediaType = 'series',
  initialGenreRatings = NO_GENRE_RATINGS,
  zIndex,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;
  const [rating, setRating] = useState(initialRating);
  const [expanded, setExpanded] = useState(false);
  const [genreValues, setGenreValues] = useState<Record<string, number>>({});
  // Sobald Einzelwerte im Spiel sind, wird die Karte je Genre gespeichert
  // statt der Gesamtwert über alle Genres gefächert.
  const [detailActive, setDetailActive] = useState(false);

  const ownGenres = useMemo(() => [...new Set((genres ?? []).filter(Boolean))], [genres]);

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
  const signature = `${initialRating}|${ownGenres.join(',')}|${allGenres
    .map((genre) => `${genre}:${initialGenreRatings[genre] ?? ''}`)
    .join(',')}`;

  // Das Sheet bleibt montiert — ohne diesen Abgleich zeigte der zweite Aufruf
  // noch den Wert des vorherigen Titels.
  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, number> = {};
    allGenres.forEach((genre) => {
      const stored = initialGenreRatings[genre];
      if (typeof stored === 'number' && stored > 0) next[genre] = stored;
      // Fremde Genres starten unbewertet — sonst bekäme jede Serie beim
      // Speichern eine Bewertung in jedem Genre.
      else next[genre] = ownGenres.includes(genre) ? initialRating : 0;
    });
    const differs = spread(Object.values(next));
    setGenreValues(next);
    setDetailActive(differs);
    // Wer schon einmal einzeln bewertet hat, sieht diese Werte sofort.
    setExpanded(differs);
    setRating(differs ? averageOf(Object.values(next)) : initialRating);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, signature]);

  const differs = spread(Object.values(genreValues));

  /**
   * Der Gesamtregler ist der Hauptschalter — er zieht die Genres des Titels und
   * alles bereits Bewertete mit, rührt aber nichts Unbewertetes an.
   */
  const handleOverallChange = (value: number) => {
    setRating(value);
    setGenreValues((prev) => {
      const next = { ...prev };
      allGenres.forEach((genre) => {
        if (ownGenres.includes(genre) || (prev[genre] ?? 0) > 0) next[genre] = value;
      });
      return next;
    });
  };

  const handleGenreChange = (genre: string, value: number) => {
    const next = { ...genreValues, [genre]: value };
    setGenreValues(next);
    setRating(averageOf(Object.values(next)));
    setDetailActive(true);
  };

  const handleLevel = () => {
    hapticSelect();
    handleOverallChange(rating);
  };

  const handleExpandedChange = (next: boolean) => {
    hapticSelect();
    setExpanded(next);
  };

  const reset = () => {
    setRating(0);
    setExpanded(false);
    setDetailActive(false);
    setGenreValues({});
  };

  const handleSave = () => {
    if (rating <= 0) return;
    hapticSuccess();
    const perGenre = Object.fromEntries(
      Object.entries(genreValues).filter(([, value]) => value > 0)
    );
    onRate(rating, detailActive && Object.keys(perGenre).length > 0 ? perGenre : undefined);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel={t('Schnellbewertung')}
      zIndex={zIndex}
      expandable
      expanded={expanded}
      onExpandedChange={handleExpandedChange}
      expandLabel={t('Alle Genres')}
      collapseLabel={t('Weniger')}
    >
      {/* Scrollbereich — die Aktionen bleiben darunter stehen, damit
          „Speichern" bei langer Genre-Liste nicht wegscrollt. */}
      <div
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '4px 24px 16px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: accent,
            }}
          >
            {eyebrow ?? t('Keine weiteren Folgen')}
          </span>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: currentTheme.text.primary,
              margin: '8px 0 4px',
            }}
          >
            {t('{titel} bewerten?', { titel: seriesTitle })}
          </h3>
        </div>

        <RatingControls value={rating} onChange={handleOverallChange} />

        {/* Zweite Stufe: Bewertung je Genre */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="genre-detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <GenreRatingDetails
                ownGenres={ownGenres}
                otherGenres={otherGenres}
                values={genreValues}
                onChange={handleGenreChange}
                onLevel={handleLevel}
                overall={rating}
                differs={differs}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flex: '0 0 auto',
          padding: '12px 24px 4px',
          borderTop: `1px solid ${currentTheme.border?.default || 'rgba(255,255,255,0.08)'}`,
        }}
      >
        <motion.button
          whileTap={tapScale}
          onClick={handleClose}
          style={{
            flex: 1,
            padding: '14px',
            background: 'transparent',
            border: `1px solid ${currentTheme.border?.default || 'rgba(255,255,255,0.1)'}`,
            borderRadius: 'var(--radius-md)',
            color: currentTheme.text.secondary,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background var(--duration-fast) ease',
          }}
        >
          {t('Später')}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={rating === 0}
          style={{
            flex: 1,
            padding: '14px',
            background: rating > 0 ? accent : `${accent}30`,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: rating > 0 ? currentTheme.background.default : `${accent}60`,
            fontSize: '14px',
            fontWeight: 700,
            cursor: rating > 0 ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Save style={{ fontSize: '18px' }} />
          {t('Speichern')}
        </motion.button>
      </div>
    </BottomSheet>
  );
};
