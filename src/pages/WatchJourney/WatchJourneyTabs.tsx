import {
  AutoGraph,
  Category,
  MovieFilter,
  Schedule,
  Subscriptions,
  Timeline,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import type { TabType } from './types';
import { tapScale } from '../../lib/motion';

interface TabDefinition {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDefinition[] = [
  { id: 'trends', label: 'Trends', icon: <Timeline style={{ fontSize: 18 }} /> },
  { id: 'activity', label: 'Aktivität', icon: <TrendingUp style={{ fontSize: 18 }} /> },
  { id: 'serien', label: 'Serien', icon: <MovieFilter style={{ fontSize: 18 }} /> },
  { id: 'insights', label: 'Insights', icon: <AutoGraph style={{ fontSize: 18 }} /> },
  { id: 'genre', label: 'Genres', icon: <Category style={{ fontSize: 18 }} /> },
  { id: 'provider', label: 'Streaming', icon: <Subscriptions style={{ fontSize: 18 }} /> },
  { id: 'heatmap', label: 'Zeiten', icon: <Schedule style={{ fontSize: 18 }} /> },
];

interface WatchJourneyTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const WatchJourneyTabs: React.FC<WatchJourneyTabsProps> = ({ activeTab, onTabChange }) => {
  const { currentTheme } = useTheme();
  const primaryColor = currentTheme.primary;

  return (
    <>
      {/* Tab bar */}
      <div className="wj-tabs-scroll">
        <div className="wj-tabs-bar" role="tablist" aria-label="Watch-Journey-Ansichten">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                whileTap={tapScale}
                onClick={() => onTabChange(tab.id)}
                className="wj-tab-btn"
                style={{
                  background: isActive
                    ? `color-mix(in srgb, ${primaryColor} 18%, rgba(255, 255, 255, 0.04))`
                    : 'transparent',
                  color: isActive ? primaryColor : currentTheme.text.muted,
                  boxShadow: isActive
                    ? `inset 0 0 0 1px ${primaryColor}50, 0 2px 10px ${primaryColor}22`
                    : 'none',
                }}
              >
                {tab.icon}
                <span className="wj-tab-label">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Title */}
      <div className="wj-tab-title">
        <h2>{TABS.find((t) => t.id === activeTab)?.label}</h2>
      </div>
    </>
  );
};

export { TABS };
