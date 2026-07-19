import { Add } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScale } from '../../../lib/motion';
import { t } from '../../../services/i18n';
import type { ProviderInsight } from '../../../types/Subscription';
import { getProviderBrand } from '../providerBrands';
import { ProviderLogo } from './ProviderLogo';

interface InactiveProvidersSectionProps {
  inactiveInsights: ProviderInsight[];
  providerLogos: Record<string, string>;
  onActivate: (name: string) => void;
}

/** "Andere Anbieter"-Sektion: inaktive Provider zum Aktivieren per Tap. */
export const InactiveProvidersSection = ({
  inactiveInsights,
  providerLogos,
  onActivate,
}: InactiveProvidersSectionProps) => {
  const { currentTheme } = useTheme();

  const border = currentTheme.border.default;
  const muted = currentTheme.text.muted;

  return (
    <div className="sub-section">
      <div className="sub-section-head">
        <h2 className="sub-section-title" style={{ color: currentTheme.text.primary }}>
          {t('Andere Anbieter')}
        </h2>
        <span className="sub-section-count" style={{ color: muted }}>
          {t('Tippen zum Aktivieren')}
        </span>
      </div>

      <div className="sub-inactive-grid">
        {inactiveInsights.map((insight) => {
          const brand = getProviderBrand(insight.name);
          return (
            <motion.button
              key={insight.name}
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={tapScale}
              onClick={() => onActivate(insight.name)}
              className="sub-inactive-card"
              style={{
                borderColor: border,
                color: currentTheme.text.primary,
              }}
            >
              <ProviderLogo
                brand={brand}
                logoPath={providerLogos[insight.name]}
                name={insight.name}
                size="sm"
                dimmed
              />
              <span className="sub-inactive-name">{insight.name}</span>
              <Add style={{ fontSize: 18, color: muted, flexShrink: 0 }} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
