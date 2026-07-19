/** Sprachwahl: Auto (Browsersprache, DACH→Deutsch) / Deutsch / Englisch. Wechsel lädt die App neu. */

import { Language } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScaleSmall } from '../../lib/motion';
import type { AppLanguage } from '../../services/i18n';
import { getAppLanguageSetting, setAppLanguageSetting, t } from '../../services/i18n';

const OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

export const LanguageSection = () => {
  const { currentTheme } = useTheme();
  const [selected, setSelected] = useState<AppLanguage>(getAppLanguageSetting());

  const choose = (value: AppLanguage) => {
    if (value === selected) return;
    setSelected(value);
    setAppLanguageSetting(value);
    // Sprache ist beim Boot fixiert — Neuladen wendet sie überall an
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
      <p style={{ color: currentTheme.text.muted, marginBottom: 0, fontSize: '0.85rem' }}>
        {t('Auto nutzt die Gerätesprache: Deutsch im DACH-Raum, sonst Englisch.')}
      </p>
    </motion.div>
  );
};
