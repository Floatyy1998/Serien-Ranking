import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { getImageUrl } from '../../utils/imageUrl';
import { t } from '../../services/i18n';
import type { RecommendSheetMedia } from './useRecommendSheet';

interface RecommendSheetHeroProps {
  media: RecommendSheetMedia;
}

/** Hero — Cinematic Card mit Backdrop, Poster und Titel des empfohlenen Mediums. */
export const RecommendSheetHero: React.FC<RecommendSheetHeroProps> = ({ media }) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();

  const heroBackdrop = useMemo(
    () => getImageUrl(media.backdropPath || media.posterPath, 'w780', ''),
    [media.backdropPath, media.posterPath]
  );
  const posterUrl = useMemo(() => getImageUrl(media.posterPath, 'w342', ''), [media.posterPath]);

  // Sizing tokens per breakpoint
  const heroPadding = isMobile ? '18px' : '26px 30px';
  const heroPosterW = isMobile ? 82 : 108;
  const heroPosterH = isMobile ? 122 : 160;
  const heroTitleSize = isMobile ? 22 : 28;

  return (
    <div
      style={{
        position: 'relative',
        margin: isMobile ? '0 14px 18px' : '0 24px 24px',
        borderRadius: isMobile ? 22 : 28,
        overflow: 'hidden',
        border: `1px solid ${currentTheme.primary}33`,
        boxShadow: `0 22px 50px -18px rgba(0,0,0,0.55), 0 8px 22px -8px ${currentTheme.primary}33, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      {/* Backdrop layer */}
      {heroBackdrop && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${heroBackdrop})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(36px) saturate(1.6) brightness(0.45)',
            transform: 'scale(1.2)',
          }}
        />
      )}
      {/* Theme gradient */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${currentTheme.primary}66 0%, transparent 50%, ${currentTheme.accent}55 100%)`,
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 100% at 20% 0%, ${currentTheme.primary}30, transparent 60%)`,
        }}
      />
      {/* Bottom darken */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 16 : 24,
          padding: heroPadding,
        }}
      >
        {posterUrl ? (
          <motion.img
            src={posterUrl}
            alt=""
            initial={{ rotate: -3, scale: 0.95 }}
            animate={{ rotate: -2, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            style={{
              width: heroPosterW,
              height: heroPosterH,
              borderRadius: isMobile ? 12 : 14,
              objectFit: 'cover',
              boxShadow: '0 18px 36px -12px rgba(0,0,0,0.75), 0 4px 10px -2px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: heroPosterW,
              height: heroPosterH,
              borderRadius: isMobile ? 12 : 14,
              background: `linear-gradient(135deg, ${currentTheme.primary}66, ${currentTheme.accent}55)`,
              flexShrink: 0,
              transform: 'rotate(-2deg)',
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Eyebrow with bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: isMobile ? 8 : 12,
            }}
          >
            <div
              aria-hidden
              style={{
                width: 24,
                height: 2,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              }}
            />
            <div
              style={{
                fontSize: isMobile ? 10 : 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                color: '#fff',
                opacity: 0.85,
              }}
            >
              {t('Du empfiehlst')}
            </div>
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: heroTitleSize,
              fontWeight: 900,
              lineHeight: 1.1,
              fontFamily: 'var(--font-display)',
              background: `linear-gradient(135deg, #fff 0%, #fff 50%, ${currentTheme.primary}cc 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              letterSpacing: '-0.02em',
            }}
          >
            {media.title}
          </h2>
          <div
            style={{
              marginTop: isMobile ? 8 : 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--glass-heavy)',
              border: '1px solid var(--glass-border-medium)',
              backdropFilter: 'var(--blur-sm)',
              WebkitBackdropFilter: 'var(--blur-sm)',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            {media.type === 'movie' ? t('Film') : t('Serie')}
          </div>
        </div>
      </div>
    </div>
  );
};
