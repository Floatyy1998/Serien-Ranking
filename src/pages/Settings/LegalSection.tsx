/**
 * LegalSection - Privacy, impressum links and data source attributions
 */

import { ChevronRight } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useCallback, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getAnalyticsConsent, setAnalyticsConsent } from '../../firebase/analytics';

const DATA_SOURCES = [
  { label: 'Streaming-Anbieter', link: 'https://www.justwatch.com', name: 'JustWatch' },
  { label: 'Episoden-Informationen', link: 'https://www.tvmaze.com', name: 'TVmaze' },
  { label: 'Film- & Seriendaten', link: 'https://www.themoviedb.org', name: 'TMDB' },
  { label: 'Bewertungen', link: 'https://www.imdb.com', name: 'IMDb' },
] as const;

interface LegalSectionProps {
  onNavigatePrivacy: () => void;
  onNavigateImpressum: () => void;
}

export const LegalSection = memo(
  ({ onNavigatePrivacy, onNavigateImpressum }: LegalSectionProps) => {
    const { currentTheme } = useTheme();
    const [analyticsEnabled, setAnalyticsEnabled] = useState(() => getAnalyticsConsent() === true);

    const handleAnalyticsToggle = useCallback(() => {
      const newValue = !analyticsEnabled;
      setAnalyticsEnabled(newValue);
      setAnalyticsConsent(newValue);
      if (navigator.vibrate) navigator.vibrate(50);
    }, [analyticsEnabled]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="settings-card settings-card--compact"
      >
        <h2
          className="settings-section-title settings-section-title--tight"
          style={{ color: currentTheme.text.primary }}
        >
          Rechtliches & Datenquellen
        </h2>

        <div className="settings-legal-links">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onNavigatePrivacy}
            className="settings-legal-btn"
            style={{
              background: currentTheme.background.default,
              borderColor: currentTheme.border.default,
              color: currentTheme.text.primary,
            }}
          >
            <span>Datenschutzerkl&auml;rung</span>
            <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onNavigateImpressum}
            className="settings-legal-btn"
            style={{
              background: currentTheme.background.default,
              borderColor: currentTheme.border.default,
              color: currentTheme.text.primary,
            }}
          >
            <span>Impressum</span>
            <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
          </motion.button>
        </div>

        <div
          className="settings-datasources"
          style={{
            background: currentTheme.background.default,
            marginBottom: '12px',
          }}
        >
          <h3 className="settings-datasources-title" style={{ color: currentTheme.text.primary }}>
            Analyse & Cookies
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 0',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ color: currentTheme.text.primary, fontSize: '14px' }}>
                Firebase Analytics
              </div>
              <div style={{ color: currentTheme.text.muted, fontSize: '12px', marginTop: '2px' }}>
                Anonymisierte Nutzungsdaten zur Verbesserung der App
              </div>
            </div>
            <label className="settings-toggle-switch" style={{ flexShrink: 0, marginLeft: '12px' }}>
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={handleAnalyticsToggle}
                className="settings-toggle-input"
                aria-label="Firebase Analytics"
              />
              <span
                className="settings-toggle-track"
                style={{
                  backgroundColor: analyticsEnabled
                    ? currentTheme.primary
                    : `${currentTheme.text.muted}30`,
                }}
              >
                <span
                  className="settings-toggle-thumb"
                  style={{ left: analyticsEnabled ? '26px' : '4px' }}
                />
              </span>
            </label>
          </div>
        </div>

        <div
          className="settings-datasources"
          style={{ background: currentTheme.background.default }}
        >
          <h3 className="settings-datasources-title" style={{ color: currentTheme.text.primary }}>
            Datenquellen
          </h3>
          <div className="settings-datasources-list" style={{ color: currentTheme.text.muted }}>
            {DATA_SOURCES.map((item) => (
              <div key={item.name} className="settings-datasource-row">
                <span>{item.label}:</span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="settings-datasource-link"
                  style={{ color: currentTheme.primary }}
                >
                  {item.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }
);

LegalSection.displayName = 'LegalSection';
