import React from 'react';
import { motion } from 'framer-motion';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScale } from '../../lib/motion';

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
  /** Zusätzliche Klassen, z. B. "ui-tabs--center" (Desktop zentriert). */
  className?: string;
}

/**
 * Segmented-Control mit gleitender Glas-Pille. Layout lebt in global.css
 * (.ui-tabs) — mobil volle Breite, ab 768px kompakt (max-content).
 */
export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  tabs,
  activeTab,
  onTabChange,
  style,
  className,
}) => {
  const { currentTheme } = useTheme();

  // Eindeutige layoutId PRO Instanz — sonst teilen sich mehrere TabSwitcher
  // auf derselben Seite (z. B. Quartal + Modus im Serien-Kalender) eine
  // einzige gleitende Pille, die dann zwischen den Leisten hin- und herspringt.
  const indicatorLayoutId = React.useId();

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
      className={className ? `ui-tabs ${className}` : 'ui-tabs'}
      onKeyDown={handleTabKeyDown}
      style={{
        background: `${currentTheme.text.muted}08`,
        border: `1px solid ${currentTheme.border.default}`,
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
            whileTap={tapScale}
            onClick={() => onTabChange(tab.id)}
            className="ui-tabs__tab"
            style={{
              color: isActive ? currentTheme.primary : currentTheme.text.muted,
              fontWeight: isActive ? 700 : 600,
              letterSpacing: isActive ? '-0.01em' : '0',
            }}
          >
            {/* Morphing background indicator — getöntes Glas statt Neon */}
            {isActive && (
              <motion.div
                layoutId={indicatorLayoutId}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-xl)',
                  background: `color-mix(in srgb, ${currentTheme.primary} 18%, rgba(255, 255, 255, 0.04))`,
                  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${currentTheme.primary} 45%, transparent), 0 4px 18px ${currentTheme.primary}22`,
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
