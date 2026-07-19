import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader } from '../../components/ui';
import { ACCENT_COLORS } from './accentColors';
import { useWatchJourneyData } from './useWatchJourneyData';
import { WatchJourneyEmptyState } from './WatchJourneyEmptyState';
import { WatchJourneyLoadingState } from './WatchJourneyLoadingState';
import { WatchJourneyTabContent } from './WatchJourneyTabContent';
import { WatchJourneyTabs } from './WatchJourneyTabs';
import { WatchJourneyYearPicker } from './WatchJourneyYearPicker';
import { t } from '../../services/i18n';
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
        <PageHeader
          title="Watch Journey"
          gradientTo={ACCENT_COLORS.movies}
          subtitle={t('Deine Trends & Insights')}
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

        <WatchJourneyYearPicker.Dropdown
          showYearPicker={showYearPicker}
          availableYears={availableYears}
          selectedYear={selectedYear}
          selectYear={selectYear}
        />

        <WatchJourneyTabs activeTab={activeTab} onTabChange={setActiveTab} />

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
