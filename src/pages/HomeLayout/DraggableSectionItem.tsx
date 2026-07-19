/** Draggable Sektionszeile; Drag nur über den Griff (dragListener=false) — sonst blockiert framer-motion auf Touch das Scrollen. */

import { DragIndicator, ExpandMore } from '@mui/icons-material';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import type { ExpandableConfig } from './useHomeLayoutData';
import { SECTION_LABELS } from './useHomeLayoutData';
import { SectionToggleCard } from './SectionToggleCard';
import { t } from '../../services/i18n';

interface DraggableSectionItemProps {
  sectionId: string;
  isHidden: boolean;
  onToggle: () => void;
  expandableConfig: ExpandableConfig | null;
}

interface SubItemProps {
  subId: string;
  isSubHidden: boolean;
  label: string;
  onToggle: () => void;
}

const DraggableSubItem = ({ subId, isSubHidden, label, onToggle }: SubItemProps) => {
  const { currentTheme } = useTheme();
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={subId}
      value={subId}
      className={`hl-sub-item ${isSubHidden ? 'hl-sub-item--hidden' : ''}`}
      dragListener={false}
      dragControls={dragControls}
      style={{
        background: `${currentTheme.primary}08`,
      }}
      whileDrag={{
        scale: 1.02,
        boxShadow: `0 4px 12px ${currentTheme.primary}20`,
        zIndex: 10,
      }}
    >
      <span
        className="hl-grip"
        onPointerDown={(e) => {
          e.preventDefault();
          dragControls.start(e);
        }}
        aria-hidden
      >
        <DragIndicator className="hl-sub-drag-icon" style={{ color: currentTheme.text.muted }} />
      </span>
      <span
        className="hl-sub-label"
        style={{
          color: isSubHidden ? currentTheme.text.muted : currentTheme.text.primary,
        }}
      >
        {label}
      </span>
      <SectionToggleCard
        checked={!isSubHidden}
        onChange={onToggle}
        label={
          isSubHidden
            ? t('{name} einblenden', { name: label })
            : t('{name} ausblenden', { name: label })
        }
      />
    </Reorder.Item>
  );
};

export const DraggableSectionItem = ({
  sectionId,
  isHidden,
  onToggle,
  expandableConfig,
}: DraggableSectionItemProps) => {
  const { currentTheme } = useTheme();
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={sectionId}
      value={sectionId}
      className={`hl-section-item ${isHidden ? 'hl-section-item--hidden' : ''}`}
      dragListener={false}
      dragControls={dragControls}
      style={{
        background: currentTheme.background.default,
        border: `1px solid ${currentTheme.border.default}`,
      }}
      whileDrag={{
        scale: 1.02,
        boxShadow: `0 8px 24px ${currentTheme.primary}25`,
        zIndex: 10,
      }}
    >
      <div className="hl-section-row">
        <span
          className="hl-grip"
          onPointerDown={(e) => {
            e.preventDefault();
            dragControls.start(e);
          }}
          aria-hidden
        >
          <DragIndicator className="hl-drag-icon" style={{ color: currentTheme.text.muted }} />
        </span>

        <div
          className={`hl-label-area ${expandableConfig ? 'hl-label-area--expandable' : ''}`}
          onClick={
            expandableConfig
              ? (e) => {
                  e.stopPropagation();
                  expandableConfig.setExpanded(!expandableConfig.expanded);
                }
              : undefined
          }
        >
          <span
            className="hl-section-label"
            style={{
              color: isHidden ? currentTheme.text.muted : currentTheme.text.primary,
            }}
          >
            {SECTION_LABELS[sectionId] || sectionId}
          </span>
          {expandableConfig && (
            <motion.div
              animate={{ rotate: expandableConfig.expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="hl-expand-icon-wrap"
            >
              <ExpandMore className="hl-expand-icon" style={{ color: currentTheme.text.muted }} />
            </motion.div>
          )}
        </div>

        <SectionToggleCard
          checked={!isHidden}
          onChange={onToggle}
          label={
            isHidden
              ? t('{name} einblenden', { name: SECTION_LABELS[sectionId] })
              : t('{name} ausblenden', { name: SECTION_LABELS[sectionId] })
          }
        />
      </div>

      {expandableConfig && (
        <AnimatePresence>
          {expandableConfig.expanded && !isHidden && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="hl-sub-items-wrapper"
            >
              <div
                className="hl-sub-items-inner"
                style={{ borderTop: `1px solid ${currentTheme.border.default}` }}
              >
                <Reorder.Group
                  axis="y"
                  values={expandableConfig.order}
                  onReorder={expandableConfig.onReorder}
                  className="hl-sub-reorder-group"
                >
                  {expandableConfig.order.map((subId) => (
                    <DraggableSubItem
                      key={subId}
                      subId={subId}
                      isSubHidden={expandableConfig.hiddenItems.includes(subId)}
                      label={expandableConfig.labels[subId] || subId}
                      onToggle={() => expandableConfig.onToggle(subId)}
                    />
                  ))}
                </Reorder.Group>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Reorder.Item>
  );
};
