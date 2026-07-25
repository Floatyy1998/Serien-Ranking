import { ChatBubbleOutline, Repeat, RemoveCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BottomSheet } from '../../components/ui';
import { StarRatingSlider } from '../../components/ui/StarRatingSlider';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { SeriesEpisode } from './types';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';

interface EpisodeActionSheetProps {
  isOpen: boolean;
  episode: SeriesEpisode | null;
  seriesTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  onRewatch: (episode: SeriesEpisode) => void;
  onUnwatch: (episode: SeriesEpisode) => void;
  /** Folgenbewertung setzen (null = entfernen). Undefined blendet die Sterne aus. */
  onRate?: (episode: SeriesEpisode, rating: number | null) => void;
  onNavigateToDiscussion: () => void;
  onClose: () => void;
}

export const EpisodeActionSheet: React.FC<EpisodeActionSheetProps> = ({
  isOpen,
  episode,
  seriesTitle,
  seasonNumber,
  episodeNumber,
  onRewatch,
  onUnwatch,
  onRate,
  onNavigateToDiscussion,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const userRating = episode?.userRating || 0;
  const [draft, setDraft] = useState(userRating);
  useEffect(() => {
    if (isOpen) setDraft(userRating);
  }, [isOpen, episode?.id, userRating]);
  if (!episode) return null;

  const watchCount = episode.watchCount || 1;
  const warningColor = currentTheme.status?.warning || '#f59e0b';
  const dirty = draft !== userRating;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} ariaLabel={t('Episode bearbeiten')}>
      <div style={{ padding: '0 20px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p
            style={{
              fontSize: '13px',
              color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
              margin: '0 0 4px',
            }}
          >
            {seriesTitle}
          </p>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px' }}>{episode.name}</h3>
          <p
            style={{
              fontSize: '14px',
              color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
              margin: 0,
            }}
          >
            S{seasonNumber} E{episodeNumber} &middot; {t('{n}x gesehen', { n: watchCount })}
          </p>
        </div>

        {/* Folgenbewertung: Sterne ziehen (Dezimalwerte), dann aktiv speichern */}
        {onRate && (
          <div style={{ marginBottom: '18px', textAlign: 'center' }}>
            <p
              style={{
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
                margin: '0 0 10px',
              }}
            >
              {t('Folge bewerten')}
            </p>
            <StarRatingSlider value={draft} onChange={setDraft} size={30} />
            <motion.button
              whileTap={dirty ? tapScale : undefined}
              onClick={() => dirty && onRate(episode, draft >= 0.5 ? draft : null)}
              disabled={!dirty}
              style={{
                marginTop: '14px',
                padding: '11px 24px',
                borderRadius: 'var(--radius-lg)',
                background: dirty ? currentTheme.primary : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: dirty
                  ? getOptimalTextColor(currentTheme.primary)
                  : currentTheme.text?.muted || 'rgba(255,255,255,0.4)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: dirty ? 'pointer' : 'default',
              }}
            >
              {draft >= 0.5 ? t('Bewertung speichern') : t('Bewertung entfernen')}
            </motion.button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <motion.button
            whileTap={tapScale}
            onClick={() => onRewatch(episode)}
            style={{
              padding: '14px',
              background: `${warningColor}26`,
              border: `1px solid ${warningColor}66`,
              borderRadius: '12px',
              color: warningColor,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Repeat style={{ fontSize: '18px' }} />
            {t('Nochmal gesehen ({n}x)', { n: watchCount + 1 })}
          </motion.button>

          <motion.button
            whileTap={tapScale}
            onClick={() => onUnwatch(episode)}
            style={{
              padding: '14px',
              background: `${currentTheme.status?.error || '#ef4444'}26`,
              border: `1px solid ${currentTheme.status?.error || '#ef4444'}4D`,
              borderRadius: '12px',
              color: currentTheme.status?.error || '#ef4444',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <RemoveCircle style={{ fontSize: '18px' }} />
            {watchCount > 2
              ? t('Auf {n}x reduzieren', { n: watchCount - 1 })
              : watchCount === 2
                ? t('Auf 1x reduzieren')
                : t('Als nicht gesehen markieren')}
          </motion.button>

          <motion.button
            whileTap={tapScale}
            onClick={onNavigateToDiscussion}
            style={{
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: currentTheme.text.secondary,
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ChatBubbleOutline style={{ fontSize: '18px' }} />
            {t('Zur Diskussion')}
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
};
