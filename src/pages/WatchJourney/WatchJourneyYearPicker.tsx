import { ExpandMore } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface YearPickerButtonProps {
  selectedYear: number;
  showYearPicker: boolean;
  availableYears: number[];
  toggleYearPicker: () => void;
  selectYear: (year: number) => void;
  variant?: 'default' | 'empty';
}

interface YearPickerDropdownProps {
  showYearPicker: boolean;
  availableYears: number[];
  selectedYear: number;
  selectYear: (year: number) => void;
  variant?: 'default' | 'empty';
}

/** Year picker button (shown in the header) */
export const WatchJourneyYearPicker: React.FC<YearPickerButtonProps> & {
  Dropdown: React.FC<YearPickerDropdownProps>;
} = ({ selectedYear, showYearPicker, toggleYearPicker, variant = 'default' }) => {
  const { currentTheme } = useTheme();
  const primaryColor = currentTheme.primary;
  const textPrimary = currentTheme.text.primary;

  const isEmptyVariant = variant === 'empty';

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggleYearPicker}
      className={`wj-year-btn ${isEmptyVariant ? 'wj-year-btn--empty' : ''}`}
      style={
        isEmptyVariant
          ? {
              border: `1px solid ${primaryColor}40`,
              background: `${primaryColor}15`,
              color: textPrimary,
            }
          : {
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
              boxShadow: `0 4px 15px ${primaryColor}40`,
            }
      }
    >
      {selectedYear}
      <motion.div animate={{ rotate: showYearPicker ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ExpandMore style={{ fontSize: 20 }} />
      </motion.div>
    </motion.button>
  );
};

/** Year picker dropdown (shown below the header) */
const YearPickerDropdown: React.FC<YearPickerDropdownProps> = ({
  showYearPicker,
  availableYears,
  selectedYear,
  selectYear,
  variant = 'default',
}) => {
  const { currentTheme } = useTheme();
  const primaryColor = currentTheme.primary;
  const bgSurface = currentTheme.background.surface;
  const textPrimary = currentTheme.text.primary;

  const isEmptyVariant = variant === 'empty';

  return (
    <AnimatePresence>
      {showYearPicker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={isEmptyVariant ? 'wj-year-dropdown--empty' : 'wj-year-dropdown'}
        >
          <div
            className="wj-year-options"
            style={{
              background: bgSurface,
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            {availableYears.map((year) => (
              <motion.button
                key={year}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectYear(year)}
                className="wj-year-option"
                style={{
                  border:
                    selectedYear === year ? 'none' : `1px solid ${currentTheme.border.default}`,
                  background: selectedYear === year ? primaryColor : bgSurface,
                  color: selectedYear === year ? currentTheme.text.secondary : textPrimary,
                  boxShadow: selectedYear === year ? `0 4px 15px ${primaryColor}40` : 'none',
                }}
              >
                {year}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

WatchJourneyYearPicker.Dropdown = YearPickerDropdown;
