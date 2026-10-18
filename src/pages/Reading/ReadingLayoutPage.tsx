/** Lesen-Seite als Direkt-Manipulation — gleicher Editor wie bei der Startseite. */

import { AutoStories, DragIndicator, RestartAlt, TouchApp, Visibility } from '@mui/icons-material';
import { motion, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GradientText, PageHeader, PageLayout } from '../../components/ui';
import { READING_SECTION_AREA, type ReadingLayoutListKey } from '../../config/readingSections';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useReadingAreas } from '../../hooks/ui/useReadingAreas';
import { useReadingLayout } from '../../hooks/ui/useReadingLayout';
import { PINNED_READING_SECTION } from '../../lib/layout/readingLayout';
import { hapticSelect, hapticWarning } from '../../lib/interaction/haptics';
import { tapScaleTight } from '../../lib/motion';
import { usesArea } from '../../lib/reading/readingMedium';
import { t } from '../../services/i18n';
import {
  resetReadingLayout,
  setReadingLayoutList,
  toggleReadingLayoutItem,
} from '../../services/settings/readingLayout';
import { LayoutCanvasSection, type CanvasChips } from '../HomeLayout/LayoutCanvasSection';
import '../HomeLayout/HomeLayoutPage.css';
import '../Manga/MangaLayoutPage.css';
import {
  READING_DISCOVER_LABELS,
  READING_FOR_YOU_LABELS,
  READING_QUICK_ACTION_LABELS,
  READING_SECTION_HINTS,
  READING_SECTION_LABELS,
  READING_SECTION_SHAPES,
} from './data/readingSectionLabels';

const SUB_LISTS: Record<string, { key: ReadingLayoutListKey; labels: Record<string, string> }> = {
  'quick-actions': { key: 'quick', labels: READING_QUICK_ACTION_LABELS },
  'for-you': { key: 'forYou', labels: READING_FOR_YOU_LABELS },
  discover: { key: 'discover', labels: READING_DISCOVER_LABELS },
};

export const ReadingLayoutPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const navigate = useNavigate();
  const layout = useReadingLayout();
  const areas = useReadingAreas();
  const uid = user?.uid;

  // Bereiche eines abgewählten Lesebereichs gibt es auf der Seite nicht — hier also auch nicht.
  const applies = (id: string) => {
    const area = READING_SECTION_AREA[id];
    return area === 'both' || usesArea(areas, area);
  };
  const order = layout.sections.order.filter(applies);
  const movable = order.filter((id) => id !== PINNED_READING_SECTION);

  const chipsFor = (sectionId: string): CanvasChips | null => {
    const sub = SUB_LISTS[sectionId];
    if (!sub) return null;
    return {
      order: layout[sub.key].order,
      hiddenItems: layout[sub.key].hidden,
      labels: sub.labels,
      onReorder: (next) => setReadingLayoutList(uid, sub.key, { order: next }),
      onToggle: (id) => {
        toggleReadingLayoutItem(uid, sub.key, id);
        hapticSelect();
      },
    };
  };

  // Nicht angezeigte Bereiche behalten beim Verschieben ihren Platz am Ende.
  const reorder = (next: string[]) =>
    setReadingLayoutList(uid, 'sections', {
      order: [
        PINNED_READING_SECTION,
        ...next,
        ...layout.sections.order.filter((id) => !applies(id)),
      ],
    });

  const canvasSection = (id: string) => (
    <LayoutCanvasSection
      key={id}
      id={id}
      label={READING_SECTION_LABELS[id] || id}
      shape={READING_SECTION_SHAPES[id] || 'cards'}
      hidden={layout.sections.hidden.includes(id)}
      onToggle={() => {
        toggleReadingLayoutItem(uid, 'sections', id);
        hapticSelect();
      }}
      expandable={chipsFor(id)}
    />
  );

  return (
    <PageLayout>
      <PageHeader title={t('Lesen-Seite anpassen')} subtitle={t('Die Vorschau ist der Editor')} />

      <div className="hl-content">
        <div className="hl-stage">
          <div className="hl-guide liquid-glass">
            <GradientText as="h2" style={{ margin: 0 }}>
              <span className="hl-guide-title">
                {t('Dein Lesen.')}
                <br />
                {t('Deine Ordnung.')}
              </span>
            </GradientText>
            <p className="hl-guide-sub" style={{ color: currentTheme.text.muted }}>
              {t(
                'Sortiere die Lesen-Seite so, wie du liest — was dich nicht interessiert, blendest du einfach aus.'
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
                resetReadingLayout(uid);
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
                values={[PINNED_READING_SECTION]}
                onReorder={() => {}}
                className="hl-canvas-list hide-scrollbar"
              >
                {canvasSection(PINNED_READING_SECTION)}
              </Reorder.Group>
              <Reorder.Group
                axis="y"
                values={movable}
                onReorder={reorder}
                className="hl-canvas-list hide-scrollbar"
              >
                {movable.map(canvasSection)}
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
              {order.map((id) => {
                const off = layout.sections.hidden.includes(id);
                return (
                  <li key={id} className={`ml-legend-row ${off ? 'ml-legend-row--off' : ''}`}>
                    <span className="ml-legend-name">{READING_SECTION_LABELS[id]}</span>
                    <span className="ml-legend-hint" style={{ color: currentTheme.text.muted }}>
                      {READING_SECTION_HINTS[id]}
                    </span>
                  </li>
                );
              })}
            </ul>
            <motion.button
              whileTap={tapScaleTight}
              className="ml-legend-cta"
              onClick={() => navigate('/reading')}
              style={{ color: currentTheme.primary }}
            >
              <AutoStories style={{ fontSize: 18 }} />
              {t('Zur Lesen-Seite')}
            </motion.button>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
};
