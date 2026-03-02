/**
 * HomeLayoutPage - Homepage Section Customization
 * Composition-only component: drag-to-reorder sections and toggle visibility
 */

import { RestartAlt, ViewQuilt } from '@mui/icons-material';
import { motion, Reorder } from 'framer-motion';
import { PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { DraggableSectionItem } from './DraggableSectionItem';
import { useHomeLayoutData } from './useHomeLayoutData';
import './HomeLayoutPage.css';

export const HomeLayoutPage = () => {
  const { currentTheme } = useTheme();

  const {
    sectionOrder,
    hiddenSections,
    handleSectionReorder,
    handleSectionToggle,
    handleReset,
    getExpandableConfig,
  } = useHomeLayoutData();

  return (
    <PageLayout>
      <PageHeader
        title="Homepage Layout"
        gradientFrom={currentTheme.text.primary}
        gradientTo={currentTheme.primary}
      />

      <div className="hl-content">
        {/* Header with reset */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hl-toolbar"
        >
          <div className="hl-toolbar-left">
            <ViewQuilt className="hl-toolbar-icon" style={{ color: currentTheme.primary }} />
            <h2 className="hl-toolbar-title" style={{ color: currentTheme.text.primary }}>
              Sektionen
            </h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="hl-reset-btn"
            style={{
              background: `${currentTheme.text.muted}15`,
              color: currentTheme.text.muted,
            }}
          >
            <RestartAlt className="hl-reset-icon" />
            Zurücksetzen
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="hl-description"
          style={{ color: currentTheme.text.muted }}
        >
          Ziehe Sektionen um die Reihenfolge zu ändern. Schalte den Toggle um, um Sektionen
          auszublenden.
        </motion.p>

        {/* Section List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hl-section-list"
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <Reorder.Group
            axis="y"
            values={sectionOrder}
            onReorder={handleSectionReorder}
            className="hl-reorder-group"
          >
            {sectionOrder.map((sectionId) => (
              <DraggableSectionItem
                key={sectionId}
                sectionId={sectionId}
                isHidden={hiddenSections.includes(sectionId)}
                onToggle={() => handleSectionToggle(sectionId)}
                expandableConfig={getExpandableConfig(sectionId)}
              />
            ))}
          </Reorder.Group>
        </motion.div>
      </div>
    </PageLayout>
  );
};
