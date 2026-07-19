import { motion } from 'framer-motion';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';
import type { FriendAnticipationItem } from './useFriendAnticipation';

function formatCountdown(days: number, dateStr: string): string {
  if (days <= 0) return t('heute');
  if (days === 1) return t('morgen');
  if (days <= 7) return t('in {n} Tagen', { n: days });
  const d = new Date(dateStr);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

interface Props {
  friendName: string;
  items: FriendAnticipationItem[];
}

export const FriendAnticipationSection = memo(function FriendAnticipationSection({
  friendName,
  items,
}: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <div className="fp-anticipation">
      <div className="fp-anticipation-header">
        {t('Worauf {name} wartet', { name: friendName })}
      </div>

      <div className="fp-anticipation-list">
        {items.map((item, idx) => (
          <motion.div
            key={item.seriesId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(`/series/${item.seriesId}`)}
            className="fp-anticipation-item"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}10, transparent)`,
              border: `1px solid ${currentTheme.primary}25`,
            }}
          >
            <img
              src={getImageUrl(item.poster, 'w185')}
              alt={item.title}
              className="fp-anticipation-poster"
              loading="lazy"
              decoding="async"
            />

            <div className="fp-anticipation-body">
              <div className="fp-anticipation-title">{item.title}</div>
              <div className="fp-anticipation-episode" style={{ color: currentTheme.text.muted }}>
                S{item.seasonNumber}E{item.episodeNumber}
                {item.episodeTitle ? ` · ${item.episodeTitle}` : ''}
              </div>
              <div className="fp-anticipation-meta">
                <span className="fp-anticipation-countdown" style={{ color: currentTheme.accent }}>
                  {formatCountdown(item.daysUntil, item.airDate)}
                </span>
                {item.bothWaiting && (
                  <span
                    className="fp-anticipation-pair"
                    style={{
                      background: `${currentTheme.secondary}25`,
                      color: currentTheme.secondary,
                    }}
                  >
                    {t('Ihr beide')}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
