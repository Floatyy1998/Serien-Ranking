import { AnimatePresence, motion } from 'framer-motion';
import { WatchJourneyData, MultiYearTrendsData } from '../../services/watchJourneyService';
import { ActivityTab } from './ActivityTab';
import { GenreTab } from './GenreTab';
import { HeatmapTab } from './HeatmapTab';
import { InsightsTab } from './InsightsTab';
import { ProviderTab } from './ProviderTab';
import { SerienTab } from './SerienTab';
import { TrendsTab } from './TrendsTab';
import { TabType } from './types';

interface WatchJourneyTabContentProps {
  activeTab: TabType;
  data: WatchJourneyData;
  trendsData: MultiYearTrendsData | null;
  chartWidth: number;
}

const TAB_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const WatchJourneyTabContent: React.FC<WatchJourneyTabContentProps> = ({
  activeTab,
  data,
  trendsData,
  chartWidth,
}) => {
  return (
    <AnimatePresence mode="wait">
      {activeTab === 'trends' && trendsData && (
        <motion.div key="trends" {...TAB_ANIMATION}>
          <TrendsTab data={trendsData} />
        </motion.div>
      )}
      {activeTab === 'activity' && (
        <motion.div key="activity" {...TAB_ANIMATION}>
          <ActivityTab data={data} />
        </motion.div>
      )}
      {activeTab === 'serien' && (
        <motion.div key="serien" {...TAB_ANIMATION}>
          <SerienTab data={data} />
        </motion.div>
      )}
      {activeTab === 'insights' && (
        <motion.div key="insights" {...TAB_ANIMATION}>
          <InsightsTab data={data} />
        </motion.div>
      )}
      {activeTab === 'genre' && (
        <motion.div key="genre" {...TAB_ANIMATION}>
          <GenreTab data={data} />
        </motion.div>
      )}
      {activeTab === 'provider' && (
        <motion.div key="provider" {...TAB_ANIMATION}>
          <ProviderTab data={data} />
        </motion.div>
      )}
      {activeTab === 'heatmap' && (
        <motion.div key="heatmap" {...TAB_ANIMATION}>
          <HeatmapTab data={data} width={chartWidth + 40} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
