/**
 * ActivitySpotlight - Cinematic hero banner featuring the single freshest
 * friend activity. The item's own poster bleeds into the background as an
 * ambient, blurred backdrop; a glass card carries the story on top.
 */

import MovieRounded from '@mui/icons-material/MovieRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import TvRounded from '@mui/icons-material/TvRounded';
import { motion } from 'framer-motion';
import { isPlaceholderUrl } from '../../utils/imageUrl';
import { getActivityMeta, type ActivityTheme } from './activityMeta';
import type { FriendActivity } from '../../types/Friend';

interface ActivitySpotlightProps {
  activity: FriendActivity;
  posterUrl?: string;
  itemTitle: string;
  userName: string;
  userPhotoURL?: string;
  timeLabel: string;
  theme: ActivityTheme & {
    background: { default: string; surface: string };
    text: { primary: string; secondary: string; muted: string };
    primary: string;
    accent: string;
  };
  onClick: () => void;
  onAvatarClick: () => void;
}

export const ActivitySpotlight = ({
  activity,
  posterUrl,
  itemTitle,
  userName,
  userPhotoURL,
  timeLabel,
  theme,
  onClick,
  onAvatarClick,
}: ActivitySpotlightProps) => {
  const meta = getActivityMeta(activity);
  const accent = meta.color(theme);
  const hasPoster = posterUrl && !isPlaceholderUrl(posterUrl);
  const rating = activity.rating;
  const hasRating = meta.isRating && typeof rating === 'number' && rating > 0;

  const sentence = meta.suffix
    ? `${meta.verb} ${itemTitle} ${meta.suffix}`
    : `${itemTitle} ${meta.verb}`;

  return (
    <motion.div
      className="activity-spotlight"
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        background: theme.background.surface,
        border: `1px solid ${theme.primary}3a`,
        boxShadow: `0 12px 32px -14px rgba(0,0,0,0.7), inset 0 1px 0 ${theme.primary}1f`,
      }}
    >
      {/* Ambient poster backdrop */}
      {hasPoster && (
        <div
          aria-hidden
          className="activity-spotlight__backdrop"
          style={{ backgroundImage: `url("${posterUrl}")` }}
        />
      )}
      {/* Scrim + accent bleed */}
      <div
        aria-hidden
        className="activity-spotlight__scrim"
        style={{
          background: `linear-gradient(105deg, ${theme.background.surface}f7 0%, ${theme.background.surface}ea 45%, ${theme.background.surface}9c 100%), radial-gradient(120% 140% at 92% 10%, ${accent}30, transparent 62%)`,
        }}
      />

      <div className="activity-spotlight__body">
        <div className="activity-spotlight__content">
          {/* Eyebrow */}
          <div className="activity-spotlight__eyebrow" style={{ color: accent }}>
            <span className="activity-spotlight__live-dot" style={{ background: accent }} />
            ZULETZT · {timeLabel}
          </div>

          {/* Who */}
          <button
            className="activity-spotlight__who"
            onClick={(e) => {
              e.stopPropagation();
              onAvatarClick();
            }}
            style={{ color: theme.text.muted }}
          >
            <span
              className="activity-spotlight__avatar"
              style={
                userPhotoURL
                  ? { backgroundImage: `url("${userPhotoURL}")` }
                  : { background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }
              }
            >
              {!userPhotoURL && (
                <PersonRounded style={{ fontSize: 16, color: theme.text.secondary }} />
              )}
            </span>
            <span style={{ fontWeight: 700, color: theme.text.secondary }}>{userName}</span>
          </button>

          {/* What */}
          <h2 className="activity-spotlight__title" style={{ color: theme.text.secondary }}>
            {sentence}
          </h2>

          {/* Chips */}
          <div className="activity-spotlight__chips">
            <span
              className="activity-spotlight__chip"
              style={{ background: `${accent}22`, color: accent }}
            >
              {meta.isMovie ? (
                <MovieRounded style={{ fontSize: 15 }} />
              ) : (
                <TvRounded style={{ fontSize: 15 }} />
              )}
              <span>{meta.isMovie ? 'Film' : 'Serie'}</span>
            </span>
            {hasRating && (
              <span
                className="activity-spotlight__chip activity-spotlight__chip--rating"
                style={{
                  background: `${theme.status.warning}26`,
                  color: theme.status.warning,
                }}
              >
                <StarRounded style={{ fontSize: 16 }} />
                {rating}
                <span style={{ opacity: 0.6, fontWeight: 600 }}>/10</span>
              </span>
            )}
          </div>
        </div>

        {/* Poster */}
        {hasPoster && (
          <div
            className="activity-spotlight__poster"
            style={{ boxShadow: `0 14px 36px -8px ${accent}77, 0 8px 20px rgba(0,0,0,0.5)` }}
          >
            <img src={posterUrl} alt={itemTitle} loading="lazy" decoding="async" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
