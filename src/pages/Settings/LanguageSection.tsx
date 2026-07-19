/** Sprachwahl: Auto (Browsersprache, DACH→Deutsch) / Deutsch / Englisch. Wechsel lädt die App neu. */

import { Language, Public } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScaleSmall } from '../../lib/motion';
import type { AppLanguage } from '../../services/i18n';
import { getAppLanguageSetting, setAppLanguageSetting, t } from '../../services/i18n';
import { getWatchRegionSetting, setWatchRegionSetting } from '../../services/region';

const OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

/** Länder mit eigener TMDB-Provider-Abdeckung — Auswahl fürs Streaming-Land. */
const REGIONS: { code: string; label: string }[] = [
  { code: 'DE', label: 'Deutschland' },
  { code: 'AT', label: 'Österreich' },
  { code: 'CH', label: 'Schweiz' },
  { code: 'US', label: 'USA' },
  { code: 'GB', label: 'Großbritannien' },
  { code: 'IE', label: 'Irland' },
  { code: 'CA', label: 'Kanada' },
  { code: 'AU', label: 'Australien' },
  { code: 'FR', label: 'Frankreich' },
  { code: 'IT', label: 'Italien' },
  { code: 'ES', label: 'Spanien' },
  { code: 'PT', label: 'Portugal' },
  { code: 'NL', label: 'Niederlande' },
  { code: 'PL', label: 'Polen' },
  { code: 'SE', label: 'Schweden' },
  { code: 'NO', label: 'Norwegen' },
  { code: 'DK', label: 'Dänemark' },
  { code: 'FI', label: 'Finnland' },
  { code: 'BR', label: 'Brasilien' },
  { code: 'MX', label: 'Mexiko' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'Südkorea' },
  { code: 'IN', label: 'Indien' },
  { code: 'TR', label: 'Türkei' },
];

export const LanguageSection = () => {
  const { currentTheme } = useTheme();
  const [selected, setSelected] = useState<AppLanguage>(getAppLanguageSetting());
  const [region, setRegion] = useState<string>(getWatchRegionSetting());

  const choose = (value: AppLanguage) => {
    if (value === selected) return;
    setSelected(value);
    setAppLanguageSetting(value);
    // Sprache ist beim Boot fixiert — Neuladen wendet sie überall an
    window.location.reload();
  };

  const chooseRegion = (value: string) => {
    if (value === region) return;
    setRegion(value);
    setWatchRegionSetting(value);
    // Region ist wie die Sprache beim Boot fixiert
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.23 }}
      className="settings-card"
    >
      <h2 className="settings-section-title" style={{ color: currentTheme.text.primary }}>
        {t('Sprache')}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Language style={{ fontSize: 22, color: currentTheme.primary }} />
        {OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileTap={tapScaleSmall}
              onClick={() => choose(opt.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: `1px solid ${active ? currentTheme.primary : currentTheme.border.default}`,
                background: active ? `${currentTheme.primary}22` : 'transparent',
                color: active ? currentTheme.primary : currentTheme.text.secondary,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
      <p style={{ color: currentTheme.text.muted, fontSize: '0.85rem' }}>
        {t('Auto nutzt die Gerätesprache: Deutsch im DACH-Raum, sonst Englisch.')}
      </p>
      <h2
        className="settings-section-title"
        style={{ color: currentTheme.text.primary, marginTop: 18 }}
      >
        {t('Streaming-Land')}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Public style={{ fontSize: 22, color: currentTheme.primary }} />
        <select
          value={region}
          onChange={(e) => chooseRegion(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: `1px solid ${currentTheme.border.default}`,
            background: 'transparent',
            color: currentTheme.text.primary,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <option value="auto">{t('Auto (aus Gerätesprache)')}</option>
          {REGIONS.map((r) => (
            <option key={r.code} value={r.code}>
              {t(r.label)}
            </option>
          ))}
        </select>
      </div>
      <p style={{ color: currentTheme.text.muted, marginBottom: 0, fontSize: '0.85rem' }}>
        {t('Bestimmt, für welches Land Streaming-Anbieter angezeigt werden.')}
      </p>
    </motion.div>
  );
};
