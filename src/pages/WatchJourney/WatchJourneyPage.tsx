/**
 * WatchJourneyPage - Premium Watch Journey Experience
 *
 * Zeigt deine Watch-Trends mit professionellen Recharts-Visualisierungen.
 * Slim composition component - business logic in useWatchJourneyData hook.
 */

import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { BackButton, GradientText } from '../../components/ui';
import { ACCENT_COLORS } from './accentColors';
import { useWatchJourneyData } from './useWatchJourneyData';
import { WatchJourneyEmptyState } from './WatchJourneyEmptyState';
import { WatchJourneyLoadingState } from './WatchJourneyLoadingState';
import { WatchJourneyTabContent } from './WatchJourneyTabContent';
import { WatchJourneyTabs } from './WatchJourneyTabs';
import { WatchJourneyYearPicker } from './WatchJourneyYearPicker';
import './WatchJourneyPage.css';

export const WatchJourneyPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const {
    loading,
    data,
    trendsData,
    activeTab,
    setActiveTab,
    selectedYear,
    showYearPicker,
    toggleYearPicker,
    selectYear,
    chartWidth,
    availableYears,
    hasData,
  } = useWatchJourneyData();

  const primaryColor = currentTheme.primary;
  const bgDefault = currentTheme.background.default;
  const textSecondary = currentTheme.text.secondary;

  if (loading) {
    return <WatchJourneyLoadingState />;
  }

  if (!hasData) {
    return (
      <WatchJourneyEmptyState
        selectedYear={selectedYear}
        showYearPicker={showYearPicker}
        availableYears={availableYears}
        toggleYearPicker={toggleYearPicker}
        selectYear={selectYear}
      />
    );
  }

  return (
    <div className="wj-container" style={{ background: bgDefault }}>
      {/* Decorative Background Gradients */}
      <div className="wj-bg-gradients">
        <div
          className="wj-bg-blob wj-bg-blob--top"
          style={{
            background: `radial-gradient(ellipse, ${primaryColor}12 0%, transparent 70%)`,
          }}
        />
        <div
          className="wj-bg-blob wj-bg-blob--right"
          style={{
            background: `radial-gradient(ellipse, ${ACCENT_COLORS.movies}10 0%, transparent 70%)`,
          }}
        />
        <div
          className="wj-bg-blob wj-bg-blob--bottom"
          style={{
            background: `radial-gradient(ellipse, ${ACCENT_COLORS.time}08 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="wj-content">
        {/* Premium Glassmorphism Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="wj-header"
          style={{ background: `${bgDefault}90` }}
        >
          <BackButton />
          <div className="wj-header-info">
            <GradientText
              as="h1"
              to={ACCENT_COLORS.movies}
              style={{ margin: 0, fontSize: 22, fontWeight: 800 }}
            >
              Watch Journey
            </GradientText>
            <p className="wj-header-subtitle" style={{ color: textSecondary }}>
              Deine Trends & Insights
            </p>
          </div>

          <WatchJourneyYearPicker
            selectedYear={selectedYear}
            showYearPicker={showYearPicker}
            availableYears={availableYears}
            toggleYearPicker={toggleYearPicker}
            selectYear={selectYear}
          />
        </motion.div>

        {/* Year Picker Dropdown */}
        <WatchJourneyYearPicker.Dropdown
          showYearPicker={showYearPicker}
          availableYears={availableYears}
          selectedYear={selectedYear}
          selectYear={selectYear}
        />

        {/* Tab Navigation */}
        <WatchJourneyTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <WatchJourneyTabContent
          activeTab={activeTab}
          data={data ?? ({} as NonNullable<typeof data>)}
          trendsData={trendsData}
          chartWidth={chartWidth}
        />
      </div>
    </div>
  );
};

export default WatchJourneyPage;
