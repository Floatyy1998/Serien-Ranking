import { TrendingUp } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContextDef';
import { BackButton } from '../../components/ui';
import { WatchJourneyYearPicker } from './WatchJourneyYearPicker';

interface WatchJourneyEmptyStateProps {
  selectedYear: number;
  showYearPicker: boolean;
  availableYears: number[];
  toggleYearPicker: () => void;
  selectYear: (year: number) => void;
}

export const WatchJourneyEmptyState: React.FC<WatchJourneyEmptyStateProps> = ({
  selectedYear,
  showYearPicker,
  availableYears,
  toggleYearPicker,
  selectYear,
}) => {
  const { currentTheme } = useTheme();
  const bgDefault = currentTheme.background.default;
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;

  return (
    <div className="wj-empty" style={{ background: bgDefault }}>
      {/* Header with Year Picker */}
      <div className="wj-empty-header">
        <BackButton />
        <div style={{ flex: 1 }}>
          <h1 className="wj-empty-title" style={{ color: textPrimary }}>
            Watch Journey
          </h1>
        </div>
        <WatchJourneyYearPicker
          selectedYear={selectedYear}
          showYearPicker={showYearPicker}
          availableYears={availableYears}
          toggleYearPicker={toggleYearPicker}
          selectYear={selectYear}
          variant="empty"
        />
      </div>

      {/* Year Picker Dropdown */}
      <WatchJourneyYearPicker.Dropdown
        showYearPicker={showYearPicker}
        availableYears={availableYears}
        selectedYear={selectedYear}
        selectYear={selectYear}
        variant="empty"
      />

      {/* Empty State Content */}
      <div className="wj-empty-content">
        <TrendingUp style={{ fontSize: 80, color: `${textSecondary}30`, marginBottom: 24 }} />
        <h2 style={{ color: textPrimary }}>Keine Daten für {selectedYear}</h2>
        <p style={{ color: textSecondary }}>
          {selectedYear === new Date().getFullYear()
            ? 'Schau Serien und Filme, um deine persönliche Watch Journey zu sehen!'
            : 'Wähle ein anderes Jahr oder schau mehr Content!'}
        </p>
      </div>
    </div>
  );
};
