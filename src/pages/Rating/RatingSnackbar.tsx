import { Check } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface RatingSnackbarProps {
  open: boolean;
  message: string;
}

export const RatingSnackbar = ({ open, message }: RatingSnackbarProps) => {
  const { currentTheme } = useTheme();

  if (!open) return null;

  return (
    <div
      className="rate-snackbar"
      style={{
        background: currentTheme.status.success,
      }}
    >
      <Check className="rate-snackbar-icon" />
      <span className="rate-snackbar-text">{message}</span>
    </div>
  );
};
