/** Homepage & Navigation als Direkt-Manipulation: die Vorschau IST der Editor (Canvas + Dock + Palette). */

import { Add, Close, DragIndicator, MoreHoriz, RestartAlt, Visibility } from '@mui/icons-material';
import { motion, Reorder } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { NAV_SLOT_ICONS } from '../../components/layout/navSlotIcons';
import { GradientText, PageHeader, PageLayout } from '../../components/ui';
import { MAX_NAV_SLOTS, NAV_SLOT_LABELS, NAV_SLOT_OPTIONS } from '../../config/navItems';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavSlots } from '../../hooks/ui/useNavConfig';
import { hapticSelect, hapticWarning } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';
import { resetNavSlots, setNavSlots } from '../../services/settings/navConfig';
import { LayoutCanvasSection, type SkeletonShape } from './LayoutCanvasSection';
import { SECTION_LABELS, useHomeLayoutData } from './useHomeLayoutData';
import './HomeLayoutPage.css';
import { tapScaleTight } from '../../lib/motion';

const SECTION_SHAPES: Record<string, SkeletonShape> = {
  'activity-marquee': 'bar',
  countdown: 'banner',
  'continue-watching': 'banners',
  rewatches: 'banners',
  'today-episodes': 'banners',
  seasonal: 'posters',
  trending: 'posters',
  'top-rated': 'posters',
  stats: 'tiles',
};

export const HomeLayoutPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};

  const {
    sectionOrder,
    hiddenSections,
    handleSectionReorder,
    handleSectionToggle,
    handleReset,
    getExpandableConfig,
  } = useHomeLayoutData();

  const navSlots = useNavSlots();
  const dockDragRef = useRef(false);
  const paletteOptions = useMemo(
    () => NAV_SLOT_OPTIONS.filter((o) => !navSlots.includes(o.id)),
    [navSlots]
  );
  const slotsFull = navSlots.length >= MAX_NAV_SLOTS;

  const removeSlot = (id: string) => {
    setNavSlots(
      user?.uid,
      navSlots.filter((s) => s !== id)
    );
    hapticSelect();
  };

  const addSlot = (id: string) => {
    if (slotsFull) {
      hapticWarning();
      return;
    }
    setNavSlots(user?.uid, [...navSlots, id]);
    hapticSelect();
  };

  return (
    <PageLayout>
      <PageHeader title={t('Layout anpassen')} subtitle={t('Die Vorschau ist der Editor')} />

      <div className="hl-content">
        <div className="hl-stage">
          <div className="hl-guide liquid-glass">
            <GradientText as="h2" style={{ margin: 0 }}>
              <span className="hl-guide-title">
                {t('Dein Zuhause.')}
                <br />
                {t('Deine Regeln.')}
              </span>
            </GradientText>
            <p className="hl-guide-sub" style={{ color: currentTheme.text.muted }}>
              {t(
                'Was du hier anfasst, ist sofort deine App — keine Vorschau, das Original in klein.'
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
                  <Add />
                </span>
                {t('Die untere Leiste belegst du selbst — bis zu {n} Ziele', { n: MAX_NAV_SLOTS })}
              </li>
            </ul>

            <motion.button
              whileTap={tapScaleTight}
              onClick={() => {
                handleReset();
                resetNavSlots(user?.uid);
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
                    style={{ width: '44%', background: 'var(--theme-primary-40)' }}
                  />
                  <div className="hl-skel-line hl-skel-line--dim" style={{ width: '28%' }} />
                </div>
                <div className="hl-skel-avatar hl-mini-avatar" />
              </div>

              <Reorder.Group
                axis="y"
                values={sectionOrder}
                onReorder={handleSectionReorder}
                className="hl-canvas-list hide-scrollbar"
              >
                {sectionOrder.map((id) => (
                  <LayoutCanvasSection
                    key={id}
                    id={id}
                    label={SECTION_LABELS[id] || id}
                    shape={SECTION_SHAPES[id] || 'cards'}
                    hidden={hiddenSections.includes(id)}
                    onToggle={() => handleSectionToggle(id)}
                    expandable={getExpandableConfig(id)}
                  />
                ))}
              </Reorder.Group>

              <div className="hl-dock-editor liquid-glass">
                <span
                  className="hl-dock-item hl-dock-item--fixed"
                  style={{ color: currentTheme.primary }}
                >
                  <span
                    className="hl-dock-home-icon"
                    style={{ backgroundColor: 'currentColor' }}
                    aria-hidden
                  />
                  <span className="hl-dock-label">{t('Home')}</span>
                </span>

                <Reorder.Group
                  axis="x"
                  values={navSlots}
                  onReorder={(order) => setNavSlots(user?.uid, order)}
                  className="hl-dock-slots"
                >
                  {navSlots.map((id) => (
                    <Reorder.Item
                      key={id}
                      value={id}
                      className="hl-dock-item hl-dock-item--slot"
                      style={{ color: currentTheme.text.secondary, touchAction: 'none' }}
                      whileDrag={{ scale: 1.08, zIndex: 10 }}
                      onDragStart={() => {
                        dockDragRef.current = true;
                      }}
                      onDragEnd={() => {
                        setTimeout(() => {
                          dockDragRef.current = false;
                        }, 0);
                      }}
                      onClick={() => {
                        if (!dockDragRef.current) removeSlot(id);
                      }}
                      role="button"
                      aria-label={t('{name} aus der Navigation entfernen', {
                        name: t(NAV_SLOT_LABELS[id]),
                      })}
                    >
                      <span className="hl-dock-icon">{NAV_SLOT_ICONS[id]}</span>
                      <span className="hl-dock-label">{t(NAV_SLOT_LABELS[id])}</span>
                      <span className="hl-dock-remove" aria-hidden>
                        <Close style={{ fontSize: 11 }} />
                      </span>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                <span
                  className="hl-dock-item hl-dock-item--fixed"
                  style={{ color: currentTheme.text.muted }}
                >
                  <span className="hl-dock-icon">
                    <MoreHoriz />
                  </span>
                  <span className="hl-dock-label">{t('Mehr')}</span>
                </span>
              </div>
            </div>
          </div>

          <aside className="hl-navside liquid-glass">
            <div className="hl-toolbar">
              <div className="hl-toolbar-left">
                <h2 className="hl-toolbar-title" style={{ color: currentTheme.text.primary }}>
                  Navigation
                </h2>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--theme-primary-12)',
                  color: currentTheme.primary,
                }}
              >
                {navSlots.length}/{MAX_NAV_SLOTS}
              </span>
            </div>
            <p className="hl-description" style={{ color: currentTheme.text.muted }}>
              {t(
                'Antippen legt ein Ziel in die untere Leiste — Tippen in der Leiste entfernt es wieder, Ziehen sortiert.'
              )}
            </p>

            <div className="hl-nav-palette">
              {paletteOptions.map((o) => (
                <motion.button
                  key={o.id}
                  whileTap={tapScaleTight}
                  className={`hl-pal-chip ${slotsFull ? 'hl-pal-chip--full' : ''}`}
                  onClick={() => addSlot(o.id)}
                  aria-label={t('{name} zur Navigation hinzufügen', { name: t(o.label) })}
                  style={{ color: currentTheme.text.secondary }}
                >
                  <span className="hl-pal-icon">{NAV_SLOT_ICONS[o.id]}</span>
                  {t(o.label)}
                  <Add className="hl-pal-add" style={{ color: currentTheme.primary }} />
                </motion.button>
              ))}
            </div>
            {slotsFull && (
              <p className="hl-palette-hint" style={{ color: currentTheme.text.muted }}>
                {t('Alle {n} Plätze belegt — entferne erst ein Ziel in der Leiste.', {
                  n: MAX_NAV_SLOTS,
                })}
              </p>
            )}
          </aside>
        </div>
      </div>
    </PageLayout>
  );
};
