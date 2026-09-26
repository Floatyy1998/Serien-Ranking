import { Save, SkipNext, CheckCircle } from '@mui/icons-material';
import type { PanInfo } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { FriendRatingsPanel } from '../../social/FriendRatingsPanel';
import { RatingSheetTabs, type RatingSheetTab } from '../../social/RatingSheetTabs';
import { getImageUrl } from '../../../utils/imageUrl';
import { hapticSelect, hapticSuccess } from '../../../lib/interaction/haptics';
import { tapScale } from '../../../lib/motion';
import { useGenreRatingStage } from '../../../hooks/rating/useGenreRatingStage';
import type { UnratedQueueItem } from '../../../hooks/rating/useUnratedQueue';
import { t } from '../../../services/i18n';
import { BottomSheet } from './BottomSheet';
import { GenreRatingStage } from '../input/GenreRatingStage';

interface RatingQueueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: UnratedQueueItem[];
  /**
   * Zweites Argument sind die Einzelwerte je Genre, sofern der Nutzer die
   * Detailstufe aufgeklappt hat.
   */
  onRate: (item: UnratedQueueItem, rating: number, genreRatings?: Record<string, number>) => void;
  onSkip: (item: UnratedQueueItem) => void;
}

const SWIPE_SKIP_THRESHOLD = 90;

export const RatingQueueSheet: React.FC<RatingQueueSheetProps> = ({
  isOpen,
  onClose,
  items,
  onRate,
  onSkip,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;
  const { favoriteFriends } = useOptimizedFriends();
  const [startCount, setStartCount] = useState(items.length);
  const [tab, setTab] = useState<RatingSheetTab>('rate');

  const current = items[0] ?? null;
  const showTabs = favoriteFriends.length > 0 && current !== null;

  // Jede Karte startet beim Bewerten — der Blick auf die Freunde ist die Ausnahme.
  useEffect(() => {
    setTab('rate');
  }, [current?.key]);

  // Der Kartenschlüssel stößt den Abgleich an — zwei Titel mit denselben Genres
  // sähen sonst gleich aus und der Wert des vorherigen bliebe stehen.
  // `preserveExpanded`: wer einzeln bewerten will, will das meist für jeden
  // Titel der Queue und nicht bei jeder Karte neu aufklappen.
  const stage = useGenreRatingStage({
    active: isOpen && current !== null,
    genres: current?.genres,
    mediaType: current?.type ?? 'series',
    resetKey: current?.key ?? '',
    preserveExpanded: true,
  });

  // Snapshot the queue length when the sheet opens so the progress label
  // ("3 von 8") counts up as cards are cleared.
  useEffect(() => {
    if (isOpen) setStartCount(items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const done = startCount - items.length;

  const handleSave = () => {
    if (!current || stage.rating <= 0) return;
    hapticSuccess();
    onRate(current, stage.rating, stage.genreRatingsForSave());
  };

  const handleSkip = () => {
    if (!current) return;
    onSkip(current);
  };

  const handleExpandedChange = (next: boolean) => {
    hapticSelect();
    stage.setExpanded(next);
  };

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_SKIP_THRESHOLD) handleSkip();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('Schnell-Bewertung')}
      expandable={current !== null && tab === 'rate'}
      expanded={current !== null && tab === 'rate' && stage.expanded}
      onExpandedChange={handleExpandedChange}
      expandLabel={t('Alle Genres')}
      collapseLabel={t('Weniger')}
    >
      {current ? (
        <>
          {/* Scrollbereich — die Aktionen bleiben darunter stehen, damit
              „Speichern" bei langer Genre-Liste nicht wegscrollt. */}
          <div
            // userSelect / onDragStart: siehe QuickRatingSheet — eine
            // Textauswahl neben den Reglern bricht den Regler-Zug ab.
            onDragStart={(e) => e.preventDefault()}
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              padding: '8px 24px 16px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {/* Progress */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: accent,
                }}
              >
                {t('Noch offen · {aktuell} von {gesamt}', {
                  aktuell: Math.min(done + 1, startCount),
                  gesamt: startCount,
                })}
              </span>
            </div>

            {/* Swipeable card */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={current.key}
                // Aufgeklappt ziehen die Genre-Regler waagerecht — der
                // Karten-Wisch würde ihnen den Zug wegnehmen.
                drag={stage.expanded ? false : 'x'}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, x: -220 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '20px',
                  cursor: stage.expanded ? 'default' : 'grab',
                  touchAction: 'pan-y',
                }}
              >
                <img
                  src={getImageUrl(current.posterPath, 'w185')}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '64px',
                    height: '96px',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'cover',
                    flexShrink: 0,
                    boxShadow: '0 4px 16px -6px rgba(0,0,0,0.6)',
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: currentTheme.text.muted,
                    }}
                  >
                    {current.type === 'series' ? t('Serie') : t('Film')}
                  </span>
                  <h3
                    style={{
                      fontSize: '19px',
                      fontWeight: 700,
                      color: currentTheme.text.primary,
                      margin: '2px 0 0',
                      lineHeight: 1.2,
                    }}
                  >
                    {current.title}
                  </h3>
                </div>
              </motion.div>
            </AnimatePresence>

            {showTabs && (
              <RatingSheetTabs value={tab} onChange={setTab} friendCount={favoriteFriends.length} />
            )}

            {tab === 'rate' ? (
              <GenreRatingStage stage={stage} />
            ) : (
              <FriendRatingsPanel itemId={current.id} mediaType={current.type} active />
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
              onClick={handleSkip}
              aria-label={t('Diesen Titel überspringen')}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <SkipNext style={{ fontSize: '18px' }} />
              {t('Überspringen')}
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
        </>
      ) : (
        /* Done state */
        <div style={{ textAlign: 'center', padding: '24px 24px 32px' }}>
          <CheckCircle style={{ fontSize: '56px', color: accent }} />
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: currentTheme.text.primary,
              margin: '12px 0 4px',
            }}
          >
            {t('Alles bewertet!')}
          </h3>
          <p style={{ fontSize: '14px', color: currentTheme.text.secondary, margin: '0 0 20px' }}>
            {t('Kein offener Titel mehr in deiner Bewertungs-Queue.')}
          </p>
          <motion.button
            whileTap={tapScale}
            onClick={onClose}
            style={{
              padding: '14px 32px',
              background: accent,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: currentTheme.background.default,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('Schließen')}
          </motion.button>
        </div>
      )}
    </BottomSheet>
  );
};
