import React from 'react';
import { motion } from 'framer-motion';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useTheme } from '../../contexts/ThemeContext';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ style?: React.CSSProperties }>;
  count?: number;
}

interface TabSwitcherProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  style?: React.CSSProperties;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  tabs,
  activeTab,
  onTabChange,
  style,
}) => {
  const { currentTheme } = useTheme();

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  const { onKeyDown: handleTabKeyDown } = useKeyboardNavigation({
    itemCount: tabs.length,
    currentIndex: activeIndex,
    onIndexChange: (index) => onTabChange(tabs[index].id),
    orientation: 'horizontal',
    loop: true,
  });

  return (
    <div
      role="tablist"
      onKeyDown={handleTabKeyDown}
      style={{
        display: 'flex',
        margin: '0 20px 20px 20px',
        gap: '10px',
        position: 'relative',
        zIndex: 5,
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              padding: '14px',
              background: isActive
                ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                : currentTheme.background.card,
              border: isActive ? 'none' : `1px solid ${currentTheme.border.default}`,
              borderRadius: '14px',
              color: isActive ? 'white' : currentTheme.text.primary,
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isActive ? `0 4px 15px ${currentTheme.primary}40` : 'none',
            }}
          >
            {Icon && <Icon style={{ fontSize: '20px' }} />}
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </motion.button>
        );
      })}
    </div>
  );
};
