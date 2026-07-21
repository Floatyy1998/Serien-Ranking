/** Sprachwahl: Auto (Browsersprache, DACH→Deutsch) / Deutsch / Englisch. Wechsel lädt die App neu. */

import { Language, Public, Translate } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ThemedSelect } from '../../components/ui/ThemedSelect';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScaleSmall } from '../../lib/motion';
import type { AppLanguage } from '../../services/i18n';
import { getAppLanguageSetting, setAppLanguageSetting, t } from '../../services/i18n';
import { getWatchRegionSetting, setWatchRegionSetting } from '../../services/region';
import {
  isAutoTranslateEnabled,
  setAutoTranslateEnabled,
} from '../../services/translation/commentTranslation';

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
  const [autoTranslate, setAutoTranslate] = useState<boolean>(isAutoTranslateEnabled());

  const chooseAutoTranslate = (value: boolean) => {
    setAutoTranslate(value);
    setAutoTranslateEnabled(value);
  };

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
      <h2
        className="settings-section-title"
        style={{
          color: currentTheme.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Language style={{ fontSize: 20, color: currentTheme.primary }} />
        {t('Sprache')}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileTap={tapScaleSmall}
              onClick={() => choose(opt.value)}
              style={{
                padding: '9px 18px',
                borderRadius: 999,
                border: `1px solid ${active ? currentTheme.primary : currentTheme.border.default}`,
                background: active ? `${currentTheme.primary}22` : 'rgba(255,255,255,0.03)',
                color: active ? currentTheme.primary : currentTheme.text.secondary,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
      <p
        style={{
          color: currentTheme.text.muted,
          fontSize: '0.85rem',
          lineHeight: 1.5,
          margin: '10px 0 0 0',
        }}
      >
        {t('Auto nutzt die Gerätesprache: Deutsch im DACH-Raum, sonst Englisch.')}
      </p>

      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.08)',
          margin: '20px 0',
        }}
      />

      <h2
        className="settings-section-title"
        style={{
          color: currentTheme.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Translate style={{ fontSize: 20, color: currentTheme.primary }} />
        {t('Kommentare automatisch übersetzen')}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {[
          { value: true, label: t('An') },
          { value: false, label: t('Aus') },
        ].map((opt) => {
          const active = autoTranslate === opt.value;
          return (
            <motion.button
              key={String(opt.value)}
              whileTap={tapScaleSmall}
              onClick={() => chooseAutoTranslate(opt.value)}
              style={{
                padding: '9px 18px',
                borderRadius: 999,
                border: `1px solid ${active ? currentTheme.primary : currentTheme.border.default}`,
                background: active ? `${currentTheme.primary}22` : 'rgba(255,255,255,0.03)',
                color: active ? currentTheme.primary : currentTheme.text.secondary,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
      <p
        style={{
          color: currentTheme.text.muted,
          fontSize: '0.85rem',
          lineHeight: 1.5,
          margin: '10px 0 0 0',
        }}
      >
        {t(
          'Fremdsprachige Diskussionen und Antworten werden automatisch in deine Sprache übersetzt. Ausgeschaltet erscheint stattdessen ein Übersetzen-Button.'
        )}
      </p>

      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.08)',
          margin: '20px 0',
        }}
      />

      <h2
        className="settings-section-title"
        style={{
          color: currentTheme.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Public style={{ fontSize: 20, color: currentTheme.primary }} />
        {t('Streaming-Land')}
      </h2>
      <ThemedSelect
        value={region}
        onChange={chooseRegion}
        ariaLabel={t('Streaming-Land')}
        options={[
          { value: 'auto', label: t('Auto (aus Gerätesprache)') },
          ...REGIONS.map((r) => ({ value: r.code, label: t(r.label) })),
        ]}
      />
      <p
        style={{
          color: currentTheme.text.muted,
          fontSize: '0.85rem',
          lineHeight: 1.5,
          margin: '10px 0 0 0',
        }}
      >
        {t('Bestimmt, für welches Land Streaming-Anbieter angezeigt werden.')}
      </p>
    </motion.div>
  );
};
