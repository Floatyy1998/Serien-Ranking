/**
 * ActivityEntryCard - A single rich timeline row in the friends activity feed.
 * Shows who did what (verb phrase), a type badge, optional rating and the
 * media poster. The whole row opens the item; the avatar opens the friend.
 */

import MovieRounded from '@mui/icons-material/MovieRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import TvRounded from '@mui/icons-material/TvRounded';
import { motion } from 'framer-motion';
import React from 'react';
import type { FriendActivity } from '../../types/Friend';
import { isPlaceholderUrl } from '../../utils/imageUrl';
import { t } from '../../services/i18n';
import { getActivityMeta, type ActivityTheme } from './activityMeta';

interface ActivityEntryCardProps {
  activity: FriendActivity;
  posterUrl: string | undefined;
  itemTitle: string;
  userName: string;
  userPhotoURL?: string;
  timeLabel?: string;
  theme: ActivityTheme & {
    background: { default: string; surface: string };
    text: { primary: string; secondary: string; muted: string };
    border: { default: string };
    primary: string;
    accent: string;
  };
  index?: number;
  onClick: () => void;
  onAvatarClick?: () => void;
}

export const ActivityEntryCard = React.memo(
  ({
    activity,
    posterUrl,
    itemTitle,
    userName,
    userPhotoURL,
    timeLabel,
    theme,
    index = 0,
    onClick,
    onAvatarClick,
  }: ActivityEntryCardProps) => {
    const meta = getActivityMeta(activity);
    const accent = meta.color(theme);
    const rating = activity.rating;
    const hasRating = meta.isRating && typeof rating === 'number' && rating > 0;
    const showPoster = posterUrl && !isPlaceholderUrl(posterUrl);
    const { Icon } = meta;
    // Ganzen Satz übersetzen (Wortstellung!), dann am {title}-Platzhalter splitten.
    const sentenceTemplate = meta.suffix
      ? t(`hat ${meta.verb} {title} ${meta.suffix}`)
      : t(`hat {title} ${meta.verb}`);
    const [sentenceBefore, sentenceAfter = ''] = sentenceTemplate.split('{title}');

    return (
      <motion.div
        className="activity-entry"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: Math.min(index * 0.035, 0.35),
          type: 'spring',
          stiffness: 260,
          damping: 24,
        }}
        onClick={onClick}
        style={{
          display: 'flex',
          gap: '13px',
          padding: '13px',
          background: theme.background.surface,
          border: `1px solid ${theme.border.default}`,
          borderRadius: '18px',
          cursor: 'pointer',
          opacity: meta.subtle ? 0.72 : 1,
        }}
      >
        {/* Avatar + floating type badge */}
        <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'flex-start' }}>
          <button
            onClick={(e) => {
              if (onAvatarClick) {
                e.stopPropagation();
                onAvatarClick();
              }
            }}
            aria-label={t('Profil von {name}', { name: userName })}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: onAvatarClick ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(userPhotoURL
                ? {
                    backgroundImage: `url("${userPhotoURL}")`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                  }
                : {
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  }),
            }}
          >
            {!userPhotoURL && (
              <PersonRounded style={{ fontSize: '22px', color: theme.text.secondary }} />
            )}
          </button>
          <span
            style={{
              position: 'absolute',
              right: '-3px',
              bottom: '-3px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: accent,
              border: `2.5px solid ${theme.background.surface}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${accent}66`,
            }}
          >
            <Icon style={{ fontSize: '12px', color: '#fff' }} />
          </span>
        </div>

        {/* Text body */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            paddingTop: '1px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '7px',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: theme.text.secondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '60%',
              }}
            >
              {userName}
            </span>
            {timeLabel && (
              <span
                style={{
                  fontSize: '12px',
                  color: theme.text.muted,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                · {timeLabel}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: '14px',
              lineHeight: 1.45,
              color: theme.text.muted,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {sentenceBefore}
            <span style={{ fontWeight: 700, color: theme.text.secondary }}>{itemTitle}</span>
            {sentenceAfter}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              flexWrap: 'wrap',
              marginTop: '1px',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px 3px 8px',
                borderRadius: '999px',
                background: `${meta.isMovie ? theme.accent : theme.primary}18`,
                color: meta.isMovie ? theme.accent : theme.primary,
                fontSize: '11px',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {meta.isMovie ? (
                <MovieRounded style={{ fontSize: '13px' }} />
              ) : (
                <TvRounded style={{ fontSize: '13px' }} />
              )}
              {meta.isMovie ? t('Film') : t('Serie')}
            </span>

            {hasRating && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px 3px 7px',
                  borderRadius: '999px',
                  background: `${accent}1f`,
                  color: accent,
                  fontSize: '12px',
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                <StarRounded style={{ fontSize: '14px' }} />
                {rating}
              </span>
            )}
          </div>
        </div>

        {/* Poster */}
        {showPoster && (
          <div
            style={{
              width: '50px',
              height: '75px',
              borderRadius: '10px',
              overflow: 'hidden',
              flexShrink: 0,
              alignSelf: 'center',
              boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
            }}
          >
            <img
              src={posterUrl}
              alt={itemTitle}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </motion.div>
    );
  }
);

ActivityEntryCard.displayName = 'ActivityEntryCard';
