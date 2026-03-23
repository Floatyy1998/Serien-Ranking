/**
 * DraggableSectionItem - A single draggable section row with optional expandable sub-items
 * Inline styles ONLY for theme colors, CSS classes for layout
 */

import { DragIndicator, ExpandMore } from '@mui/icons-material';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { ExpandableConfig } from './useHomeLayoutData';
import { SECTION_LABELS } from './useHomeLayoutData';
import { SectionToggleCard } from './SectionToggleCard';

interface DraggableSectionItemProps {
  sectionId: string;
  isHidden: boolean;
  onToggle: () => void;
  expandableConfig: ExpandableConfig | null;
}

export const DraggableSectionItem = ({
  sectionId,
  isHidden,
  onToggle,
  expandableConfig,
}: DraggableSectionItemProps) => {
  const { currentTheme } = useTheme();

  return (
    <Reorder.Item
      key={sectionId}
      value={sectionId}
      className={`hl-section-item ${isHidden ? 'hl-section-item--hidden' : ''}`}
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
      {/* Main row */}
      <div className="hl-section-row">
        <DragIndicator className="hl-drag-icon" style={{ color: currentTheme.text.muted }} />

        {/* Label + optional expand button */}
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
          label={`${SECTION_LABELS[sectionId]} ${isHidden ? 'einblenden' : 'ausblenden'}`}
        />
      </div>

      {/* Expandable sub-items */}
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
                  {expandableConfig.order.map((subId) => {
                    const isSubHidden = expandableConfig.hiddenItems.includes(subId);
                    return (
                      <Reorder.Item
                        key={subId}
                        value={subId}
                        className={`hl-sub-item ${isSubHidden ? 'hl-sub-item--hidden' : ''}`}
                        style={{
                          background: `${currentTheme.primary}08`,
                        }}
                        whileDrag={{
                          scale: 1.02,
                          boxShadow: `0 4px 12px ${currentTheme.primary}20`,
                          zIndex: 10,
                        }}
                      >
                        <DragIndicator
                          className="hl-sub-drag-icon"
                          style={{ color: currentTheme.text.muted }}
                        />
                        <span
                          className="hl-sub-label"
                          style={{
                            color: isSubHidden
                              ? currentTheme.text.muted
                              : currentTheme.text.primary,
                          }}
                        >
                          {expandableConfig.labels[subId] || subId}
                        </span>
                        <SectionToggleCard
                          checked={!isSubHidden}
                          onChange={() => expandableConfig.onToggle(subId)}
                          label={`${expandableConfig.labels[subId]} ${isSubHidden ? 'einblenden' : 'ausblenden'}`}
                        />
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Reorder.Item>
  );
};
