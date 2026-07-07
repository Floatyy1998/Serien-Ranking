import { Movie as MovieIcon, Star, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PosterImage } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { useTransitionNavigate } from '../../../hooks/useTransitionNavigate';
import { tapScale } from '../../../lib/motion';
import { MiniProviderBadges } from './MiniProviderBadges';
import type { MediaItem } from './mediaCarouselTypes';

interface CinematicPosterCardProps {
  item: MediaItem;
  cardWidth: string;
}

/** Cinematic poster cards (seasonal + top-rated) — Poster mit Overlay, Badges und Meta-Zeile. */
export function CinematicPosterCard({ item, cardWidth }: CinematicPosterCardProps) {
  const navigate = useTransitionNavigate();
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();

  return (
    <motion.div
      whileTap={tapScale}
      onClick={() => navigate(`/${item.type}/${item.id}`)}
      role="button"
      tabIndex={0}
      aria-label={item.title}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/${item.type}/${item.id}`);
        }
      }}
      style={{
        flexShrink: 0,
        cursor: 'pointer',
        minWidth: cardWidth,
      }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: '14px',
          width: cardWidth,
          aspectRatio: '2/3',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <PosterImage
          src={item.poster}
          alt={item.title}
          loading="eager"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '14px',
          }}
        />

        {/* Full overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          {/* Top row: provider badges left + type badge right */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: isMobile ? '6px 8px' : '8px 10px',
              gap: '4px',
            }}
          >
            {/* Left: provider badges */}
            <div
              style={{
                minWidth: 0,
                flex: '1 1 auto',
                pointerEvents: 'auto',
              }}
            >
              {item.providers && item.providers.length > 0 && (
                <MiniProviderBadges
                  providers={item.providers}
                  isMobile={isMobile}
                  textColor={currentTheme.text.muted}
                  searchTitle={item.title}
                />
              )}
            </div>

            {/* Right: type badge */}
            <div
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'var(--blur-md)',
                WebkitBackdropFilter: 'var(--blur-md)',
                borderRadius: '8px',
                padding: isMobile ? '3px 7px' : '4px 10px',
                fontSize: isMobile ? '10px' : '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                flexShrink: 0,
                color: item.type === 'movie' ? currentTheme.status.warning : currentTheme.primary,
                border: `1px solid ${
                  item.type === 'movie'
                    ? `${currentTheme.status.warning}4d`
                    : `${currentTheme.primary}50`
                }`,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                pointerEvents: 'auto',
              }}
            >
              {item.type === 'movie' ? (
                <>
                  <MovieIcon
                    style={{
                      fontSize: isMobile ? '10px' : '12px',
                    }}
                  />
                  Film
                </>
              ) : (
                <>
                  <Tv
                    style={{
                      fontSize: isMobile ? '10px' : '12px',
                    }}
                  />
                  Serie
                </>
              )}
            </div>
          </div>

          {/* Bottom: gradient + title + rating */}
          <div
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 45%, transparent 100%)',
              padding: isMobile ? '32px 10px 10px' : '48px 14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minHeight: '40%',
              justifyContent: 'flex-end',
            }}
          >
            <h3
              style={{
                fontSize: isMobile ? '15px' : '18px',
                fontWeight: 700,
                margin: 0,
                color: '#fff',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              {item.title}
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: isMobile ? '11px' : '12px',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 500,
              }}
            >
              {item.rating != null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    color: currentTheme.status.warning,
                  }}
                >
                  <Star
                    style={{
                      fontSize: isMobile ? '11px' : '12px',
                    }}
                  />
                  {item.rating.toFixed(1)}
                </span>
              )}
              {item.rating != null && (item.year || item.releaseDate) && (
                <span style={{ opacity: 0.4 }}>&bull;</span>
              )}
              {(item.year || item.releaseDate) && (
                <span>{item.year || item.releaseDate?.slice(0, 4)}</span>
              )}
              {(item.year || item.releaseDate) && item.genres && (
                <span style={{ opacity: 0.4 }}>&bull;</span>
              )}
              {item.genres && (
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.genres}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
