/**
 * WatchJourneyPage - Premium Watch Journey Experience
 *
 * Zeigt deine Watch-Trends mit professionellen Recharts-Visualisierungen.
 * Slim composition component - business logic in useWatchJourneyData hook.
 */

import { useTheme } from '../../contexts/ThemeContextDef';
import { PageHeader } from '../../components/ui';
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
        {/* Header */}
        <PageHeader
          title="Watch Journey"
          gradientTo={ACCENT_COLORS.movies}
          subtitle="Deine Trends & Insights"
          actions={
            <WatchJourneyYearPicker
              selectedYear={selectedYear}
              showYearPicker={showYearPicker}
              availableYears={availableYears}
              toggleYearPicker={toggleYearPicker}
              selectYear={selectYear}
            />
          }
        />

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
