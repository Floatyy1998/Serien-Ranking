import React from 'react';
import { motion } from 'framer-motion';
import { useKeyboardNavigation } from '../../../hooks/ui/useKeyboardNavigation';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScale } from '../../../lib/motion';

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
  /** Für viele Reiter: mobil ohne Symbole, Zahl klein unter dem Namen. */
  stackCounts?: boolean;
}

/**
 * Reiterleiste mit gleitendem Unterstrich. Layout lebt in global.css
 * (.ui-tabs) — mobil volle Breite, ab 768px kompakt (max-content).
 */
export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  tabs,
  activeTab,
  onTabChange,
  style,
  className,
  stackCounts = false,
}) => {
  const { currentTheme } = useTheme();
  const classes = ['ui-tabs', stackCounts && 'ui-tabs--stacked', className].filter(Boolean);

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
    <div role="tablist" className={classes.join(' ')} onKeyDown={handleTabKeyDown} style={style}>
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
              color: isActive ? currentTheme.text.secondary : currentTheme.text.muted,
              fontWeight: isActive ? 700 : 600,
              letterSpacing: isActive ? '-0.01em' : '0',
            }}
          >
            {/* Gleitender Unterstrich unter dem aktiven Reiter */}
            {isActive && (
              <motion.div
                layoutId={indicatorLayoutId}
                className="ui-tabs__line"
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 28,
                }}
              />
            )}

            {Icon && <Icon style={{ fontSize: '18px' }} />}
            <span className={stackCounts ? 'ui-tabs__label' : undefined}>
              {tab.label}
              {tab.count !== undefined &&
                (stackCounts ? (
                  <span className="ui-tabs__count">{tab.count}</span>
                ) : (
                  ` (${tab.count})`
                ))}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
