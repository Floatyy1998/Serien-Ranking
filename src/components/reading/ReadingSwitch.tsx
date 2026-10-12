import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticTap } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';
import {
  READING_TAB_PATHS,
  setReadingTab,
  type ReadingTab,
} from '../../services/settings/readingTab';
import './ReadingSwitch.css';

const TABS: { id: ReadingTab; label: () => string }[] = [
  { id: 'all', label: () => t('Alle') },
  { id: 'manga', label: () => 'Manga' },
  { id: 'books', label: () => t('Bücher') },
];

/** Umschalter oben in Lesen: Alle · Manga · Bücher. Merkt sich den Reiter fürs Dock. */
export const ReadingSwitch: React.FC<{ active: ReadingTab }> = ({ active }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    setReadingTab(active);
  }, [active]);

  return (
    <div className="rs-wrap" role="tablist" aria-label={t('Lesen')}>
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`rs-tab${selected ? ' rs-tab--on' : ''}`}
            onClick={() => {
              if (selected) return;
              hapticTap();
              navigate(READING_TAB_PATHS[tab.id], { replace: true });
            }}
            style={{ color: selected ? currentTheme.text.secondary : currentTheme.text.muted }}
          >
            {selected && (
              <motion.span
                layoutId="reading-switch-pill"
                className="rs-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}38, ${currentTheme.accent}26)`,
                  borderColor: `${currentTheme.primary}55`,
                }}
              />
            )}
            <span className="rs-label">{tab.label()}</span>
          </button>
        );
      })}
    </div>
  );
};
