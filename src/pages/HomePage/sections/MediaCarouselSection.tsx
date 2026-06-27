import {
  AutoAwesome,
  LocalFireDepartment,
  Movie as MovieIcon,
  Star,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import {
  HorizontalScrollContainer,
  SectionHeader,
  SkeletonPosterRow,
} from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { useTransitionNavigate } from '../../../hooks/useTransitionNavigate';
import {
  getProviderSearchUrl,
  handleProviderLinkClick,
  providerNeedsClipboardCopy,
} from '../../../lib/providerLinks';

interface MediaProvider {
  name: string;
  logo: string;
}

interface MiniProviderBadgesProps {
  providers: MediaProvider[];
  isMobile: boolean;
  textColor: string;
  align?: 'left' | 'right';
  /** Search title used to build the provider deep-link */
  searchTitle: string;
}

// Compact provider strip for carousel cards. Sized small enough to not compete
// with the card's title/rank/badge — uses a glassmorphic dark fill (matches the
// trending type chip) rather than a solid themed background. Mobile shows one
// badge with a +N counter; desktop shows up to 3 badges plus an overflow chip.
function MiniProviderBadges({
  providers,
  isMobile,
  textColor,
  align = 'left',
  searchTitle,
}: MiniProviderBadgesProps) {
  if (providers.length === 0) return null;
  // Just the logo with rounded corners + drop-shadow. No themed frame around
  // it — provider logos ship with their own brand color, so adding a dark
  // glass frame just adds padding without conveying info.
  const badgeSize = isMobile ? 26 : 30;
  const desktopMax = 3;
  const visibleDesktop = providers.slice(0, desktopMax);
  const desktopOverflow = providers.length - desktopMax;
  const mobileOverflow = providers.length - 1;
  const first = providers[0];

  const logoStyle: React.CSSProperties = {
    width: badgeSize,
    height: badgeSize,
    borderRadius: '5px',
    objectFit: 'cover',
    display: 'block',
    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
  };
  const overflowChipStyle: React.CSSProperties = {
    width: badgeSize,
    height: badgeSize,
    borderRadius: '5px',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '9px' : '10px',
    fontWeight: 700,
    color: textColor,
    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
  };
  const counterStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: -3,
    right: -4,
    background: 'rgba(0,0,0,0.92)',
    color: '#fff',
    fontSize: '8px',
    fontWeight: 700,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
    border: '1px solid rgba(255,255,255,0.18)',
    lineHeight: 1,
  };

  // Wrap the logo img in an <a display: contents> so the link adds clickability
  // without inserting a new layout box around the img (the img keeps its exact
  // size + corner-radius — no frame, no padding).
  const renderLogo = (p: MediaProvider, extraEl?: React.ReactNode) => {
    const url = getProviderSearchUrl(p.name, searchTitle);
    const titleAttr = providerNeedsClipboardCopy(p.name)
      ? `${p.name}: Titel kopieren + Suche öffnen`
      : `${p.name} öffnen`;
    const wrap = (children: React.ReactNode) =>
      url ? (
        <a
          key={p.name}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={titleAttr}
          onClick={(e) => handleProviderLinkClick(e, p.name, searchTitle, url)}
          style={{ display: 'contents' }}
        >
          {children}
        </a>
      ) : (
        <React.Fragment key={p.name}>{children}</React.Fragment>
      );
    // Mobile-only +N counter sits on top of the first badge — wrap both in a
    // small relatively-positioned span so the counter can absolute-position.
    // The `title` is set on the img (not the <a>) because display: contents
    // removes the anchor's hover hitbox — tooltip would otherwise never show.
    if (extraEl) {
      return wrap(
        <span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
          <img
            src={p.logo}
            alt={p.name}
            loading="lazy"
            decoding="async"
            style={logoStyle}
            title={titleAttr}
          />
          {extraEl}
        </span>
      );
    }
    return wrap(
      <img
        src={p.logo}
        alt={p.name}
        loading="lazy"
        decoding="async"
        style={logoStyle}
        title={titleAttr}
      />
    );
  };

  if (isMobile) {
    return (
      <div
        style={{
          display: 'flex',
          gap: '4px',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          lineHeight: 0,
        }}
      >
        {renderLogo(
          first,
          mobileOverflow > 0 ? <span style={counterStyle}>+{mobileOverflow}</span> : null
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        lineHeight: 0,
      }}
    >
      {visibleDesktop.map((p) => renderLogo(p))}
      {desktopOverflow > 0 && <div style={overflowChipStyle}>+{desktopOverflow}</div>}
    </div>
  );
}

interface MediaItem {
  id: number;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  rating?: number;
  voteCount?: number;
  releaseDate?: string;
  genres?: string;
  year?: string;
  providers?: MediaProvider[];
}

interface MediaCarouselSectionProps {
  variant: 'seasonal' | 'trending' | 'top-rated';
  items: MediaItem[];
  title: string;
  onSeeAll?: () => void;
  iconColor?: string;
  /** Show skeleton placeholder while TMDB request is in flight. */
  loading?: boolean;
}

export const MediaCarouselSection = React.memo(function MediaCarouselSection({
  variant,
  items,
  title,
  onSeeAll,
  iconColor,
  loading,
}: MediaCarouselSectionProps) {
  const navigate = useTransitionNavigate();
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const cardWidth = isMobile ? '155px' : '240px';

  if (loading && items.length === 0) {
    const sectionIcon =
      variant === 'seasonal' ? (
        <AutoAwesome />
      ) : variant === 'trending' ? (
        <LocalFireDepartment />
      ) : (
        <Star />
      );
    return (
      <section style={{ marginBottom: '32px' }}>
        <SectionHeader
          icon={sectionIcon}
          iconColor={iconColor || currentTheme.accent}
          title={title}
        />
        <SkeletonPosterRow posterWidth={isMobile ? 155 : 240} count={6} />
      </section>
    );
  }

  if (items.length === 0) return null;

  const sectionIcon =
    variant === 'seasonal' ? (
      <AutoAwesome />
    ) : variant === 'trending' ? (
      <LocalFireDepartment />
    ) : (
      <Star />
    );

  const sectionIconColor = iconColor || currentTheme.accent;

  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionHeader
        icon={sectionIcon}
        iconColor={sectionIconColor}
        title={title}
        onSeeAll={onSeeAll}
      />
      <HorizontalScrollContainer gap={14} style={{ padding: '0 20px' }}>
        {items.map((item, index) => {
          // Trending — Disney+ inspired cinematic cards
          if (variant === 'trending') {
            return (
              <motion.div
                key={`${variant}-${item.type}-${item.id}`}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/${item.type}/${item.id}`)}
                style={{
                  cursor: 'pointer',
                  flexShrink: 0,
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
                  <img
                    src={item.poster}
                    alt={item.title}
                    decoding="async"
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

                  {/* Corner cutout with liquid glass rank number */}
                  {(() => {
                    const isDouble = index + 1 >= 10;
                    const size = isMobile ? (isDouble ? 96 : 76) : isDouble ? 135 : 110;
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: size,
                          height: size,
                          zIndex: 2,
                        }}
                      >
                        <svg
                          width={size}
                          height={size}
                          viewBox={`0 0 ${size} ${size}`}
                          style={{ position: 'absolute', top: 0, left: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id={`corner-grad-${index}`}
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor={currentTheme.primary} />
                              <stop
                                offset="100%"
                                stopColor={currentTheme.primaryDark || currentTheme.primary}
                              />
                            </linearGradient>
                          </defs>
                          <path
                            d={`M14,0 L${size},0 Q${size * 0.38},${size * 0.38} 0,${size} L0,14 Q0,0 14,0 Z`}
                            fill={`url(#corner-grad-${index})`}
                          />
                        </svg>
                        <span
                          style={{
                            position: 'absolute',
                            top: '25%',
                            left: '25%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1,
                            fontSize: isMobile ? '34px' : '48px',
                            fontWeight: 900,
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1,
                            color: 'rgba(255,255,255,0.75)',
                            userSelect: 'none',
                            letterSpacing: '-2px',
                            textShadow: `
                              0 1px 0 rgba(255,255,255,0.3),
                              0 2px 0 rgba(0,80,60,0.4),
                              0 3px 0 rgba(0,70,50,0.3),
                              0 4px 0 rgba(0,60,40,0.2),
                              0 5px 10px rgba(0,0,0,0.35)
                            `,
                          }}
                        >
                          {index + 1}
                        </span>
                      </div>
                    );
                  })()}

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
                    {/* Top-right: type badge */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: isMobile ? '6px 8px' : '8px 10px',
                      }}
                    >
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.55)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          borderRadius: '8px',
                          padding: isMobile ? '3px 7px' : '4px 10px',
                          fontSize: isMobile ? '10px' : '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color:
                            item.type === 'movie' ? 'rgba(255, 193, 7, 1)' : currentTheme.primary,
                          border: `1px solid ${
                            item.type === 'movie'
                              ? 'rgba(255, 193, 7, 0.3)'
                              : `${currentTheme.primary}50`
                          }`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          pointerEvents: 'auto',
                        }}
                      >
                        {item.type === 'movie' ? (
                          <>
                            <MovieIcon style={{ fontSize: isMobile ? '10px' : '12px' }} />
                            Film
                          </>
                        ) : (
                          <>
                            <Tv style={{ fontSize: isMobile ? '10px' : '12px' }} />
                            Serie
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom: gradient + providers + title + meta */}
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
                      {item.providers && item.providers.length > 0 && (
                        <div style={{ marginBottom: '6px', pointerEvents: 'auto' }}>
                          <MiniProviderBadges
                            providers={item.providers}
                            isMobile={isMobile}
                            textColor={currentTheme.text.muted}
                            searchTitle={item.title}
                          />
                        </div>
                      )}
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
                            <Star style={{ fontSize: isMobile ? '11px' : '12px' }} />
                            {item.rating.toFixed(1)}
                          </span>
                        )}
                        {item.rating != null && item.year && (
                          <span style={{ opacity: 0.4 }}>&bull;</span>
                        )}
                        {item.year && <span>{item.year}</span>}
                        {item.year && item.genres && <span style={{ opacity: 0.4 }}>&bull;</span>}
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

          // Cinematic poster cards (seasonal + top-rated)
          return (
            <motion.div
              key={`${variant}-${item.type}-${item.id}`}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/${item.type}/${item.id}`)}
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
                <img
                  src={item.poster}
                  alt={item.title}
                  decoding="async"
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
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: '8px',
                        padding: isMobile ? '3px 7px' : '4px 10px',
                        fontSize: isMobile ? '10px' : '12px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0,
                        color:
                          item.type === 'movie' ? 'rgba(255, 193, 7, 1)' : currentTheme.primary,
                        border: `1px solid ${
                          item.type === 'movie'
                            ? 'rgba(255, 193, 7, 0.3)'
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
        })}
      </HorizontalScrollContainer>
    </section>
  );
});
