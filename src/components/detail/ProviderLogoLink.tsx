import React from 'react';
import {
  getProviderSearchUrl,
  handleProviderLinkClick,
  providerNeedsClipboardCopy,
} from '../../lib/providerLinks';
import { normalizeProviderName } from '../../services/detection/providerChangeDetection';

interface ProviderLogoLinkProps {
  /** Image URL (already a full https URL, the caller resolved it). */
  src: string;
  /** Display name. Will be normalized internally for the deep-link lookup. */
  name: string;
  /** Title of the series/movie — used as the search query. */
  searchTitle: string;
  /**
   * Inline styles applied directly to the `<img>` element. Should include any
   * positioning (absolute, bottom, right, …) and explicit width/height so the
   * badge matches the caller's existing layout pixel-for-pixel.
   */
  style?: React.CSSProperties;
}

/**
 * Renders a single provider logo as a deep-link badge. The `<img>` is rendered
 * with the caller's style verbatim — the link wrapper uses `display: contents`
 * so it disappears from the layout box tree (only the click/hit area belongs
 * to the link). Falls back to a plain `<img>` when no deep link is known.
 *
 * `stopPropagation` on click prevents the parent poster's click handler
 * (which usually navigates to the detail page) from firing on tap.
 */
export const ProviderLogoLink = React.memo(function ProviderLogoLink({
  src,
  name,
  searchTitle,
  style,
}: ProviderLogoLinkProps) {
  const normalized = normalizeProviderName(name);
  const url = normalized ? getProviderSearchUrl(normalized, searchTitle) : null;
  const needsClipboard = normalized ? providerNeedsClipboardCopy(normalized) : false;
  const titleAttr = needsClipboard ? `${name}: Titel kopieren + Suche öffnen` : `${name} öffnen`;
  const img = (
    <img src={src} alt={name} loading="lazy" decoding="async" style={style} title={titleAttr} />
  );
  if (!url) return img;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => handleProviderLinkClick(e, normalized ?? '', searchTitle, url)}
      title={titleAttr}
      style={{ display: 'contents' }}
    >
      {img}
    </a>
  );
});
