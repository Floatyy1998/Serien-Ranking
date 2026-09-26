import { Save } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { FriendRatingsPanel } from '../../social/FriendRatingsPanel';
import { RatingSheetTabs, type RatingSheetTab } from '../../social/RatingSheetTabs';
import { useGenreRatingStage } from '../../../hooks/rating/useGenreRatingStage';
import { hapticSelect, hapticSuccess } from '../../../lib/interaction/haptics';
import { t } from '../../../services/i18n';
import { BottomSheet } from './BottomSheet';
import { GenreRatingStage } from '../input/GenreRatingStage';
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
  /** TMDB-ID — ohne sie entfällt der Freundes-Reiter. */
  itemId?: number | string;
  /** Durchgereicht an das BottomSheet (z. B. über dem Such-Overlay). */
  zIndex?: number | string;
}

export const QuickRatingSheet: React.FC<QuickRatingSheetProps> = ({
  isOpen,
  onClose,
  seriesTitle,
  onRate,
  eyebrow,
  initialRating = 0,
  genres,
  mediaType = 'series',
  initialGenreRatings,
  itemId,
  zIndex,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;
  const { favoriteFriends } = useOptimizedFriends();
  const [tab, setTab] = useState<RatingSheetTab>('rate');
  // Ohne Favoriten bleibt das Sheet genau wie vorher.
  const showTabs = favoriteFriends.length > 0 && itemId !== undefined;

  useEffect(() => {
    if (isOpen) setTab('rate');
  }, [isOpen]);

  const stage = useGenreRatingStage({
    active: isOpen,
    initialRating,
    genres,
    mediaType,
    initialGenreRatings,
  });

  const handleExpandedChange = (next: boolean) => {
    hapticSelect();
    stage.setExpanded(next);
  };

  const handleSave = () => {
    if (stage.rating <= 0) return;
    hapticSuccess();
    onRate(stage.rating, stage.genreRatingsForSave());
    stage.reset();
  };

  const handleClose = () => {
    stage.reset();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel={t('Schnellbewertung')}
      zIndex={zIndex}
      expandable={tab === 'rate'}
      expanded={tab === 'rate' && stage.expanded}
      onExpandedChange={handleExpandedChange}
      expandLabel={t('Alle Genres')}
      collapseLabel={t('Weniger')}
    >
      {/* Scrollbereich — die Aktionen bleiben darunter stehen, damit
          „Speichern" bei langer Genre-Liste nicht wegscrollt. */}
      <div
        // Riegel gegen den Sperr-Cursor: faengt der Browser trotzdem einmal ein
        // natives Drag an, wird es hier abgebrochen statt den Regler zu kapern.
        onDragStart={(e) => e.preventDefault()}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '4px 24px 16px',
          // Eine Textauswahl neben den Reglern laesst den naechsten Zug als
          // natives Drag-and-Drop enden (Sperr-Cursor, Regler verliert den Zug).
          userSelect: 'none',
          WebkitUserSelect: 'none',
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

        {showTabs && (
          <RatingSheetTabs value={tab} onChange={setTab} friendCount={favoriteFriends.length} />
        )}

        {tab === 'rate' ? (
          <GenreRatingStage stage={stage} />
        ) : (
          <FriendRatingsPanel itemId={itemId} mediaType={mediaType} active />
        )}
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
          whileTap={{ opacity: 0.7 }}
          onClick={handleSave}
          disabled={stage.rating === 0}
          style={{
            flex: 1,
            padding: '14px',
            background: stage.rating > 0 ? accent : `${accent}30`,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: stage.rating > 0 ? currentTheme.background.default : `${accent}60`,
            fontSize: '14px',
            fontWeight: 700,
            cursor: stage.rating > 0 ? 'pointer' : 'default',
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
