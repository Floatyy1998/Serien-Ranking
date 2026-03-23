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
import { useTheme } from '../../contexts/ThemeContextDef';
import type { TabType } from './types';

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
        <div className="wj-tabs-bar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.id)}
                className="wj-tab-btn"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${primaryColor}, ${currentTheme.accent})`
                    : 'transparent',
                  color: isActive ? currentTheme.text.secondary : currentTheme.text.muted,
                  boxShadow: isActive ? `0 2px 8px ${primaryColor}40` : 'none',
                }}
              >
                {tab.icon}
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
