import { Cancel, Person, PlayCircle, Send } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { getImageUrl } from '../../../utils/imageUrl';
import { formatNotificationTime, type UnifiedNotification } from '../useUnifiedNotifications';
import { tapScale } from '../../../lib/motion';
import { getOptimalTextColor } from '../../../theme/colorUtils';

interface RecommendationCardProps {
  item: UnifiedNotification;
  isLast: boolean;
  onAccept: (recId: string) => void;
  onDecline: (recId: string) => void;
}

export const RecommendationCard = React.memo(function RecommendationCard({
  item,
  isLast,
  onAccept,
  onDecline,
}: RecommendationCardProps) {
  const { currentTheme } = useTheme();
  const data = item.recommendationData;
  if (!data) return null;

  const posterUrl = getImageUrl(data.mediaPoster, 'w185', '');
  const backdropUrl = getImageUrl(data.mediaBackdrop || data.mediaPoster, 'w780', '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      style={{
        position: 'relative',
        marginBottom: isLast ? 0 : 12,
        borderRadius: 18,
        overflow: 'hidden',
        border: `1px solid ${currentTheme.primary}33`,
        background: currentTheme.background.surface,
        boxShadow: `0 10px 26px -14px ${currentTheme.primary}55, 0 4px 10px -4px rgba(0,0,0,0.3)`,
      }}
    >
      {backdropUrl && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(28px) saturate(1.5) brightness(0.45)',
            transform: 'scale(1.15)',
            opacity: 0.55,
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${currentTheme.primary}22 0%, transparent 55%, ${currentTheme.accent}1a 100%)`,
        }}
      />

      <div style={{ position: 'relative', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: `2px solid ${currentTheme.primary}`,
              background: data.senderPhotoURL
                ? `url("${data.senderPhotoURL}") center/cover`
                : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 10px -4px ${currentTheme.primary}80`,
            }}
          >
            {!data.senderPhotoURL && <Person style={{ fontSize: 18, color: '#fff' }} aria-hidden />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: currentTheme.text.primary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {data.senderName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: currentTheme.text.muted,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Send style={{ fontSize: 11, color: currentTheme.primary }} />
              empfiehlt dir · {formatNotificationTime(item.timestamp)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              loading="lazy"
              style={{
                width: 70,
                height: 104,
                borderRadius: 10,
                objectFit: 'cover',
                boxShadow: '0 6px 16px -6px rgba(0,0,0,0.6)',
                border: `1px solid ${currentTheme.border.default}`,
                flexShrink: 0,
              }}
              decoding="async"
            />
          ) : (
            <div
              style={{
                width: 70,
                height: 104,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${currentTheme.primary}66, ${currentTheme.accent}55)`,
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: currentTheme.primary,
                marginBottom: 4,
              }}
            >
              {data.mediaType === 'movie' ? 'Film' : 'Serie'}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                lineHeight: 1.2,
                color: currentTheme.text.primary,
                fontFamily: 'var(--font-display)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              {data.mediaTitle}
            </div>
            {data.message && (
              <div
                style={{
                  position: 'relative',
                  padding: '8px 12px',
                  borderRadius: 12,
                  borderTopLeftRadius: 4,
                  background: `${currentTheme.primary}15`,
                  border: `1px solid ${currentTheme.primary}25`,
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: currentTheme.text.primary,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{data.message}&rdquo;
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <motion.button
            whileTap={tapScale}
            onClick={(e) => {
              e.stopPropagation();
              onAccept(data.recId);
            }}
            style={{
              flex: 2,
              padding: '11px 14px',
              borderRadius: 12,
              border: 'none',
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              color: getOptimalTextColor(currentTheme.primary),
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: `0 6px 18px -6px ${currentTheme.primary}99`,
            }}
          >
            <PlayCircle style={{ fontSize: 17 }} />
            Anschauen
          </motion.button>
          <motion.button
            whileTap={tapScale}
            onClick={(e) => {
              e.stopPropagation();
              onDecline(data.recId);
            }}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 12,
              background: 'transparent',
              border: `1px solid ${currentTheme.border.default}`,
              color: currentTheme.text.muted,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Cancel style={{ fontSize: 16 }} />
            Nope
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});
