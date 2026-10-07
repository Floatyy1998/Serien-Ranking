/** Eine Sektion im Layout-Editor (Startseite + Manga): Mini-Skelett, Auge zum Ausblenden, Griff zum Sortieren. */

import { DragIndicator, Visibility, VisibilityOff } from '@mui/icons-material';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScaleTight } from '../../lib/motion';
import { t } from '../../services/i18n';

export type SkeletonShape = 'bar' | 'banner' | 'banners' | 'posters' | 'cards' | 'tiles' | 'grid';

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

export const SkeletonShapeBlock = ({ shape }: { shape: SkeletonShape }) => {
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
    case 'grid':
      return (
        <div className="hl-skel-grid">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
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

export interface CanvasChips {
  order: string[];
  onReorder: (newOrder: string[]) => void;
  hiddenItems: string[];
  onToggle: (id: string) => void;
  labels: Record<string, string>;
}

interface LayoutCanvasSectionProps {
  id: string;
  label: string;
  shape: SkeletonShape;
  hidden: boolean;
  onToggle: () => void;
  expandable: CanvasChips | null;
}

export const LayoutCanvasSection = ({
  id,
  label,
  shape,
  hidden,
  onToggle,
  expandable,
}: LayoutCanvasSectionProps) => {
  const { currentTheme } = useTheme();
  const chipDragRef = useRef(false);
  // Drag nur am Griff — sonst frisst framer-motion auf Touch jede Berührung und blockiert das Scrollen
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
          {label}
        </span>
        <motion.button
          whileTap={tapScaleTight}
          className="hl-cv-eye"
          onClick={onToggle}
          aria-label={
            hidden
              ? t('{name} einblenden', { name: label })
              : t('{name} ausblenden', { name: label })
          }
          style={{ color: hidden ? currentTheme.text.muted : currentTheme.primary }}
        >
          {hidden ? <VisibilityOff /> : <Visibility />}
        </motion.button>
      </div>

      {!hidden && !expandable && <SkeletonShapeBlock shape={shape} />}

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
