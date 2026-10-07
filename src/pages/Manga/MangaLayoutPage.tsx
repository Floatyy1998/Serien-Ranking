/** Manga-Übersicht als Direkt-Manipulation — gleicher Editor wie bei der Startseite. */

import { AutoStories, DragIndicator, RestartAlt, TouchApp, Visibility } from '@mui/icons-material';
import { motion, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GradientText, PageHeader, PageLayout } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useMangaLayout } from '../../hooks/manga/useMangaLayout';
import { hapticSelect, hapticWarning } from '../../lib/interaction/haptics';
import { tapScaleTight } from '../../lib/motion';
import { t } from '../../services/i18n';
import {
  resetMangaLayout,
  setMangaLayoutList,
  toggleMangaLayoutItem,
} from '../../services/settings/mangaLayout';
import type { MangaLayoutListKey } from '../../config/mangaSections';
import { LayoutCanvasSection, type CanvasChips } from '../HomeLayout/LayoutCanvasSection';
import '../HomeLayout/HomeLayoutPage.css';
import './MangaLayoutPage.css';
import {
  MANGA_FOR_YOU_LABELS,
  MANGA_QUICK_ACTION_LABELS,
  MANGA_SECTION_HINTS,
  MANGA_SECTION_LABELS,
  MANGA_SECTION_SHAPES,
} from './data/mangaSectionLabels';

const SUB_LISTS: Record<string, { key: MangaLayoutListKey; labels: Record<string, string> }> = {
  'quick-actions': { key: 'quick', labels: MANGA_QUICK_ACTION_LABELS },
  'for-you': { key: 'forYou', labels: MANGA_FOR_YOU_LABELS },
};

export const MangaLayoutPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const navigate = useNavigate();
  const layout = useMangaLayout();
  const uid = user?.uid;

  const chipsFor = (sectionId: string): CanvasChips | null => {
    const sub = SUB_LISTS[sectionId];
    if (!sub) return null;
    return {
      order: layout[sub.key].order,
      hiddenItems: layout[sub.key].hidden,
      labels: sub.labels,
      onReorder: (order) => setMangaLayoutList(uid, sub.key, { order }),
      onToggle: (id) => {
        toggleMangaLayoutItem(uid, sub.key, id);
        hapticSelect();
      },
    };
  };

  return (
    <PageLayout>
      <PageHeader
        title={t('Manga-Übersicht anpassen')}
        subtitle={t('Die Vorschau ist der Editor')}
      />

      <div className="hl-content">
        <div className="hl-stage">
          <div className="hl-guide liquid-glass">
            <GradientText as="h2" style={{ margin: 0 }}>
              <span className="hl-guide-title">
                {t('Deine Manga.')}
                <br />
                {t('Deine Ordnung.')}
              </span>
            </GradientText>
            <p className="hl-guide-sub" style={{ color: currentTheme.text.muted }}>
              {t(
                'Sortiere die Manga-Übersicht so, wie du liest — was dich nicht interessiert, blendest du einfach aus.'
              )}
            </p>

            <ul className="hl-guide-list">
              <li className="hl-guide-row" style={{ color: currentTheme.text.secondary }}>
                <span className="hl-guide-chip">
                  <DragIndicator />
                </span>
                {t('Halten und ziehen ändert die Reihenfolge')}
              </li>
              <li className="hl-guide-row" style={{ color: currentTheme.text.secondary }}>
                <span className="hl-guide-chip">
                  <Visibility />
                </span>
                {t('Das Auge blendet eine Sektion aus')}
              </li>
              <li className="hl-guide-row" style={{ color: currentTheme.text.secondary }}>
                <span className="hl-guide-chip">
                  <TouchApp />
                </span>
                {t('Antippen der Chips blendet einzelne Kacheln aus')}
              </li>
            </ul>

            <motion.button
              whileTap={tapScaleTight}
              onClick={() => {
                resetMangaLayout(uid);
                hapticWarning();
              }}
              className="hl-reset-btn"
              style={{
                background: `${currentTheme.text.muted}15`,
                color: currentTheme.text.muted,
              }}
            >
              <RestartAlt className="hl-reset-icon" />
              {t('Zurücksetzen')}
            </motion.button>
          </div>

          <div className="hl-device">
            <div className="hl-screen" style={{ background: currentTheme.background.default }}>
              <div className="hl-mini-greeting">
                <div className="hl-skel-lines">
                  <div
                    className="hl-skel-line"
                    style={{ width: '30%', background: 'var(--theme-primary-40)' }}
                  />
                  <div className="hl-skel-line hl-skel-line--dim" style={{ width: '46%' }} />
                </div>
                <div className="hl-skel-avatar hl-mini-avatar" />
              </div>

              <Reorder.Group
                axis="y"
                values={layout.sections.order}
                onReorder={(order) => setMangaLayoutList(uid, 'sections', { order })}
                className="hl-canvas-list hide-scrollbar"
              >
                {layout.sections.order.map((id) => (
                  <LayoutCanvasSection
                    key={id}
                    id={id}
                    label={MANGA_SECTION_LABELS[id] || id}
                    shape={MANGA_SECTION_SHAPES[id] || 'cards'}
                    hidden={layout.sections.hidden.includes(id)}
                    onToggle={() => {
                      toggleMangaLayoutItem(uid, 'sections', id);
                      hapticSelect();
                    }}
                    expandable={chipsFor(id)}
                  />
                ))}
              </Reorder.Group>
            </div>
          </div>

          <aside className="hl-navside liquid-glass">
            <div className="hl-toolbar">
              <div className="hl-toolbar-left">
                <h2 className="hl-toolbar-title" style={{ color: currentTheme.text.primary }}>
                  {t('Was steckt wo?')}
                </h2>
              </div>
            </div>
            <ul className="ml-legend">
              {layout.sections.order.map((id) => {
                const off = layout.sections.hidden.includes(id);
                return (
                  <li key={id} className={`ml-legend-row ${off ? 'ml-legend-row--off' : ''}`}>
                    <span className="ml-legend-name">{MANGA_SECTION_LABELS[id]}</span>
                    <span className="ml-legend-hint" style={{ color: currentTheme.text.muted }}>
                      {MANGA_SECTION_HINTS[id]}
                    </span>
                  </li>
                );
              })}
            </ul>
            <motion.button
              whileTap={tapScaleTight}
              className="ml-legend-cta"
              onClick={() => navigate('/manga')}
              style={{ color: currentTheme.primary }}
            >
              <AutoStories style={{ fontSize: 18 }} />
              {t('Zur Manga-Übersicht')}
            </motion.button>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
};
