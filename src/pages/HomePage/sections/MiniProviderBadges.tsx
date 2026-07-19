import React from 'react';
import {
  getProviderSearchUrl,
  handleProviderLinkClick,
  providerNeedsClipboardCopy,
} from '../../../lib/providerLinks';
import type { MediaProvider } from './mediaCarouselTypes';
import { t } from '../../../services/i18n';

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
export function MiniProviderBadges({
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
    backdropFilter: 'var(--blur-sm)',
    WebkitBackdropFilter: 'var(--blur-sm)',
    border: '1px solid var(--glass-border-medium)',
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
      ? t('{name}: Titel kopieren + Suche öffnen', { name: p.name })
      : t('{name} öffnen', { name: p.name });
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
