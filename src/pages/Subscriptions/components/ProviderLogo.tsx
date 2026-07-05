import { tmdbLogoUrl } from '../../../hooks/useProviderLogos';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { ProviderBrand } from '../providerBrands';

interface ProviderLogoProps {
  brand: ProviderBrand;
  logoPath?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  dimmed?: boolean;
}

/** Provider-Logo: TMDB-Bild wenn vorhanden, sonst Brand-Farbverlauf mit Kürzel. */
export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  brand,
  logoPath,
  name,
  size = 'md',
  dimmed = false,
}) => {
  const logoUrl = tmdbLogoUrl(logoPath, size === 'sm' ? 'w45' : 'w92');
  return (
    <div
      className={`sub-logo${size === 'lg' ? ' sub-logo--lg' : ''}${
        size === 'sm' ? ' sub-logo--sm' : ''
      }`}
      style={{
        background: logoUrl
          ? '#0f1422'
          : dimmed
            ? `linear-gradient(135deg, ${brand.color}55, ${brand.accent ?? brand.color}55)`
            : `linear-gradient(135deg, ${brand.color}, ${brand.accent ?? brand.color})`,
        opacity: dimmed ? 0.6 : 1,
      }}
      aria-hidden
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} loading="lazy" decoding="async" />
      ) : (
        // Dimmed (inaktive) Logos liegen halbtransparent über der dunklen Card →
        // weißes Kürzel bleibt lesbar. Volle Markenfarbe: WCAG-optimalen Text wählen
        // (helle Marken wie Amazon/Crunchyroll/WOW brauchen dunkles Kürzel).
        <span style={dimmed ? undefined : { color: getOptimalTextColor(brand.color) }}>
          {brand.abbr}
        </span>
      )}
    </div>
  );
};
