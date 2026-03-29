import React from 'react';
import { motion } from 'framer-motion';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useTheme } from '../../contexts/ThemeContextDef';

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
        gap: '6px',
        position: 'relative',
        zIndex: 5,
        background: `${currentTheme.text.muted}08`,
        borderRadius: '18px',
        padding: '4px',
        border: `1px solid ${currentTheme.border.default}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
              padding: '11px 16px',
              background: 'transparent',
              border: 'none',
              borderRadius: '14px',
              color: isActive ? currentTheme.text.secondary : currentTheme.text.muted,
              fontSize: '13.5px',
              fontWeight: isActive ? 700 : 600,
              letterSpacing: isActive ? '-0.01em' : '0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              position: 'relative',
              zIndex: 2,
              transition: 'color 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Morphing background indicator */}
            {isActive && (
              <motion.div
                layoutId="tabIndicator"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${currentTheme.primary}, color-mix(in srgb, ${currentTheme.primary} 55%, ${currentTheme.accent}))`,
                  boxShadow: `0 4px 24px ${currentTheme.primary}35, 0 0 40px ${currentTheme.accent || currentTheme.primary}12, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                  zIndex: -1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 28,
                }}
              />
            )}

            {Icon && <Icon style={{ fontSize: '18px' }} />}
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </motion.button>
        );
      })}
    </div>
  );
};
