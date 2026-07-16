/**
 * HomeLayoutPage - Homepage & Navigation als Direkt-Manipulation:
 * Die Vorschau IST der Editor — Sektionen im Canvas ziehen/ausblenden,
 * Nav-Ziele direkt im Dock sortieren und per Palette hinzufügen.
 */

import {
  Add,
  Close,
  DragIndicator,
  MoreHoriz,
  RestartAlt,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { NAV_SLOT_ICONS } from '../../components/layout/navSlotIcons';
import { GradientText, PageHeader, PageLayout } from '../../components/ui';
import { MAX_NAV_SLOTS, NAV_SLOT_LABELS, NAV_SLOT_OPTIONS } from '../../config/navItems';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavSlots } from '../../hooks/useNavConfig';
import { hapticSelect, hapticWarning } from '../../lib/haptics';
import { resetNavSlots, setNavSlots } from '../../services/navConfig';
import type { ExpandableConfig } from './useHomeLayoutData';
import { SECTION_LABELS, useHomeLayoutData } from './useHomeLayoutData';
import './HomeLayoutPage.css';
import { tapScaleTight } from '../../lib/motion';

type SkeletonShape = 'bar' | 'banner' | 'banners' | 'posters' | 'cards' | 'tiles';

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

const BannerRow = () => (
  <div className="hl-skel-banner-row">
    <div className="hl-skel-thumb" />
    <div className="hl-skel-lines">
      <div className="hl-skel-line" style={{ width: '52%' }} />
      <div className="hl-skel-line hl-skel-line--dim" style={{ width: '34%' }} />
    </div>
    <div className="hl-skel-progress" />
  </div>
);

const SkeletonShapeBlock = ({ shape }: { shape: SkeletonShape }) => {
  switch (shape) {
    case 'bar':
      return (
        <div className="hl-skel-marquee">
          {[0, 1, 2].map((i) => (
            <div key={i} className="hl-skel-avatar" />
          ))}
          <div className="hl-skel-line hl-skel-line--dim" style={{ flex: 1 }} />
        </div>
      );
    case 'banner':
      return <BannerRow />;
    case 'banners':
      return (
        <div className="hl-skel-col">
          <BannerRow />
          <BannerRow />
        </div>
      );
    case 'posters':
      return (
        <div className="hl-skel-row">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="hl-skel-poster">
              <div className="hl-skel-line hl-skel-line--dim" />
            </div>
          ))}
        </div>
      );
    case 'cards':
      return (
        <div className="hl-skel-row">
          {[0, 1].map((i) => (
            <div key={i} className="hl-skel-card">
              <div className="hl-skel-dot" />
              <div className="hl-skel-lines">
                <div className="hl-skel-line" style={{ width: '64%' }} />
                <div className="hl-skel-line hl-skel-line--dim" style={{ width: '42%' }} />
              </div>
            </div>
          ))}
        </div>
      );
    case 'tiles':
      return (
        <div className="hl-skel-row">
          <div className="hl-skel-ring" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="hl-skel-tile">
              <div className="hl-skel-line" style={{ width: '46%' }} />
              <div className="hl-skel-line hl-skel-line--dim" style={{ width: '70%' }} />
            </div>
          ))}
        </div>
      );
  }
};

interface CanvasSectionProps {
  id: string;
  hidden: boolean;
  onToggle: () => void;
  expandable: ExpandableConfig | null;
}

const CanvasSection = ({ id, hidden, onToggle, expandable }: CanvasSectionProps) => {
  const { currentTheme } = useTheme();
  const chipDragRef = useRef(false);
  // Drag nur am Griff: sonst frisst framer-motion auf Touch-Geräten jede
  // Berührung der Sektion und blockiert das Scrollen der Seite.
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={id}
      className={`hl-cv-section ${hidden ? 'hl-cv-section--off' : ''}`}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{
        scale: 1.02,
        boxShadow: `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${currentTheme.primary}40`,
        zIndex: 10,
      }}
      layout
    >
      <div className="hl-cv-head">
        <span
          className="hl-grip"
          onPointerDown={(e) => {
            e.preventDefault();
            dragControls.start(e);
          }}
          aria-hidden
        >
          <DragIndicator className="hl-cv-drag" style={{ color: currentTheme.text.muted }} />
        </span>
        <span
          className="hl-cv-label"
          style={{ color: hidden ? currentTheme.text.muted : currentTheme.text.secondary }}
        >
          {SECTION_LABELS[id] || id}
        </span>
        <motion.button
          whileTap={tapScaleTight}
          className="hl-cv-eye"
          onClick={onToggle}
          aria-label={`${SECTION_LABELS[id]} ${hidden ? 'einblenden' : 'ausblenden'}`}
          style={{ color: hidden ? currentTheme.text.muted : currentTheme.primary }}
        >
          {hidden ? <VisibilityOff /> : <Visibility />}
        </motion.button>
      </div>

      {!hidden && !expandable && <SkeletonShapeBlock shape={SECTION_SHAPES[id] || 'cards'} />}

      {!hidden && expandable && (
        <Reorder.Group
          axis="x"
          values={expandable.order}
          onReorder={expandable.onReorder}
          className="hl-cv-chips hide-scrollbar"
        >
          {expandable.order.map((sub) => {
            const off = expandable.hiddenItems.includes(sub);
            return (
              <Reorder.Item
                key={sub}
                value={sub}
                className={`hl-cv-chip ${off ? 'hl-cv-chip--off' : ''}`}
                onDragStart={() => {
                  chipDragRef.current = true;
                }}
                onDragEnd={() => {
                  setTimeout(() => {
                    chipDragRef.current = false;
                  }, 0);
                }}
                onClick={() => {
                  if (!chipDragRef.current) expandable.onToggle(sub);
                }}
                style={{
                  color: off ? currentTheme.text.muted : currentTheme.text.secondary,
                  touchAction: 'none',
                }}
              >
                {expandable.labels[sub] || sub}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}
    </Reorder.Item>
  );
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
      <PageHeader title="Layout anpassen" subtitle="Die Vorschau ist der Editor" />

      <div className="hl-content">
        <div className="hl-stage">
          {/* Links: Anleitung */}
          <div className="hl-guide liquid-glass">
            <GradientText as="h2" style={{ margin: 0 }}>
              <span className="hl-guide-title">
                Dein Zuhause.
                <br />
                Deine Regeln.
              </span>
            </GradientText>
            <p className="hl-guide-sub" style={{ color: currentTheme.text.muted }}>
              Was du hier anfasst, ist sofort deine App — keine Vorschau, das Original in klein.
            </p>

            <ul className="hl-guide-list">
              <li className="hl-guide-row" style={{ color: currentTheme.text.secondary }}>
                <span className="hl-guide-chip">
                  <DragIndicator />
                </span>
                Halten und ziehen ändert die Reihenfolge
              </li>
              <li className="hl-guide-row" style={{ color: currentTheme.text.secondary }}>
                <span className="hl-guide-chip">
                  <Visibility />
                </span>
                Das Auge blendet eine Sektion aus
              </li>
              <li className="hl-guide-row" style={{ color: currentTheme.text.secondary }}>
                <span className="hl-guide-chip">
                  <Add />
                </span>
                Die untere Leiste belegst du selbst — bis zu {MAX_NAV_SLOTS} Ziele
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
              Zurücksetzen
            </motion.button>
          </div>

          {/* Mitte: Geräte-Mockup = Editor */}
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
                  <CanvasSection
                    key={id}
                    id={id}
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
                  <span className="hl-dock-label">Home</span>
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
                      aria-label={`${NAV_SLOT_LABELS[id]} aus der Navigation entfernen`}
                    >
                      <span className="hl-dock-icon">{NAV_SLOT_ICONS[id]}</span>
                      <span className="hl-dock-label">{NAV_SLOT_LABELS[id]}</span>
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
                  <span className="hl-dock-label">Mehr</span>
                </span>
              </div>
            </div>
          </div>

          {/* Rechts: Ziel-Palette */}
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
              Antippen legt ein Ziel in die untere Leiste — Tippen in der Leiste entfernt es wieder,
              Ziehen sortiert.
            </p>

            <div className="hl-nav-palette">
              {paletteOptions.map((o) => (
                <motion.button
                  key={o.id}
                  whileTap={tapScaleTight}
                  className={`hl-pal-chip ${slotsFull ? 'hl-pal-chip--full' : ''}`}
                  onClick={() => addSlot(o.id)}
                  aria-label={`${o.label} zur Navigation hinzufügen`}
                  style={{ color: currentTheme.text.secondary }}
                >
                  <span className="hl-pal-icon">{NAV_SLOT_ICONS[o.id]}</span>
                  {o.label}
                  <Add className="hl-pal-add" style={{ color: currentTheme.primary }} />
                </motion.button>
              ))}
            </div>
            {slotsFull && (
              <p className="hl-palette-hint" style={{ color: currentTheme.text.muted }}>
                Alle {MAX_NAV_SLOTS} Plätze belegt — entferne erst ein Ziel in der Leiste.
              </p>
            )}
          </aside>
        </div>
      </div>
    </PageLayout>
  );
};
