import { ChatBubbleOutline, Repeat, RemoveCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { BottomSheet } from '../../components/ui';
import type { SeriesEpisode } from './types';

interface EpisodeActionSheetProps {
  isOpen: boolean;
  episode: SeriesEpisode | null;
  seriesTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  onRewatch: (episode: SeriesEpisode) => void;
  onUnwatch: (episode: SeriesEpisode) => void;
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
  onNavigateToDiscussion,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  if (!episode) return null;

  const watchCount = episode.watchCount || 1;
  const warningColor = currentTheme.status?.warning || '#f59e0b';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} ariaLabel="Episode bearbeiten">
      <div style={{ padding: '0 20px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p
            style={{
              fontSize: '12px',
              color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
              margin: '0 0 4px',
            }}
          >
            {seriesTitle}
          </p>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px' }}>{episode.name}</h3>
          <p
            style={{
              fontSize: '13px',
              color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
              margin: 0,
            }}
          >
            S{seasonNumber} E{episodeNumber} &middot; {watchCount}x gesehen
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onRewatch(episode)}
            style={{
              padding: '14px',
              background: `linear-gradient(135deg, ${warningColor}, #f59e0b)`,
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Repeat style={{ fontSize: '18px' }} />
            Nochmal gesehen ({watchCount + 1}x)
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onUnwatch(episode)}
            style={{
              padding: '14px',
              background: 'rgba(255, 107, 107, 0.15)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '12px',
              color: '#ff6b6b',
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
              ? `Auf ${watchCount - 1}x reduzieren`
              : watchCount === 2
                ? 'Auf 1x reduzieren'
                : 'Als nicht gesehen markieren'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onNavigateToDiscussion}
            style={{
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: 'white',
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
            Zur Diskussion
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
};
