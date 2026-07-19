import { TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { BackButton } from '../../components/ui';
import { WatchJourneyYearPicker } from './WatchJourneyYearPicker';
import { t } from '../../services/i18n';

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
  const navigate = useNavigate();
  const bgDefault = currentTheme.background.default;
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const isCurrentYear = selectedYear === new Date().getFullYear();

  return (
    <div className="wj-empty" style={{ background: bgDefault }}>
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

      <WatchJourneyYearPicker.Dropdown
        showYearPicker={showYearPicker}
        availableYears={availableYears}
        selectedYear={selectedYear}
        selectYear={selectYear}
        variant="empty"
      />

      <div className="wj-empty-content">
        <TrendingUp style={{ fontSize: 80, color: `${textSecondary}30`, marginBottom: 24 }} />
        <h2 style={{ color: textPrimary }}>
          {t('Keine Daten für {year}', { year: selectedYear })}
        </h2>
        <p style={{ color: textSecondary }}>
          {isCurrentYear
            ? t('Schau Serien und Filme, um deine persönliche Watch Journey zu sehen!')
            : t('Wähle ein anderes Jahr oder schau mehr Content!')}
        </p>
        {isCurrentYear && (
          <button
            type="button"
            onClick={() => navigate('/discover')}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              minHeight: 44,
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 700,
              background: currentTheme.primary,
              color: getOptimalTextColor(currentTheme.primary),
            }}
          >
            {t('Serien & Filme entdecken')}
          </button>
        )}
      </div>
    </div>
  );
};
