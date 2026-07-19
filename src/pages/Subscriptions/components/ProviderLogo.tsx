import { tmdbLogoUrl } from '../../../hooks/useProviderLogos';
import { getProviderSearchUrl } from '../../../lib/providerLinks';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { ProviderBrand } from '../providerBrands';

interface ProviderLogoProps {
  brand: ProviderBrand;
  logoPath?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  dimmed?: boolean;
}

/**
 * Provider-Logo: TMDB-Bild wenn vorhanden, sonst Brand-Farbverlauf mit Kürzel.
 *
 * Aktive Logos werden zu einem echten Link, der die Startseite/Suche des
 * Anbieters öffnet. `dimmed` (inaktive) Logos bleiben ein dekoratives `<div>`,
 * weil sie in `InactiveProvidersSection` bereits in einem `<button>` liegen —
 * ein verschachteltes Link-Element wäre ein a11y-/HTML-Verstoß.
 */
export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  brand,
  logoPath,
  name,
  size = 'md',
  dimmed = false,
}) => {
  const logoUrl = tmdbLogoUrl(logoPath, size === 'sm' ? 'w45' : 'w92');
  const className = `sub-logo${size === 'lg' ? ' sub-logo--lg' : ''}${
    size === 'sm' ? ' sub-logo--sm' : ''
  }`;
  const background = logoUrl
    ? '#0f1422'
    : dimmed
      ? `linear-gradient(135deg, ${brand.color}55, ${brand.accent ?? brand.color}55)`
      : `linear-gradient(135deg, ${brand.color}, ${brand.accent ?? brand.color})`;

  const inner = logoUrl ? (
    <img src={logoUrl} alt={name} loading="lazy" decoding="async" />
  ) : (
    // Dimmed (inaktive) Logos liegen halbtransparent über der dunklen Card →
    // weißes Kürzel bleibt lesbar. Volle Markenfarbe: WCAG-optimalen Text wählen
    // (helle Marken wie Amazon/Crunchyroll/WOW brauchen dunkles Kürzel).
    <span style={dimmed ? undefined : { color: getOptimalTextColor(brand.color) }}>
      {brand.abbr}
    </span>
  );

  // Nur aktive Logos werden verlinkt (dimmed liegt bereits in einem <button>).
  const providerUrl = dimmed ? null : getProviderSearchUrl(name, '');

  if (providerUrl) {
    return (
      <a
        className={className}
        href={providerUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('{title} öffnen', { title: name })}
        onClick={(e) => e.stopPropagation()}
        style={{
          background,
          opacity: 1,
          // Mindest-Touch-Target (44px), auch wenn die Logo-Box kleiner ist.
          minWidth: 44,
          minHeight: 44,
          textDecoration: 'none',
        }}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={className} style={{ background, opacity: dimmed ? 0.6 : 1 }} aria-hidden>
      {inner}
    </div>
  );
};
