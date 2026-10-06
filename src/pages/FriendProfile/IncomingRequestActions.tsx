import { CheckRounded, CloseRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';

interface IncomingRequestActionsProps {
  name: string;
  responding: boolean;
  onRespond: (accept: boolean) => void;
}

export const IncomingRequestActions = ({
  name,
  responding,
  onRespond,
}: IncomingRequestActionsProps) => {
  const { currentTheme } = useTheme();
  const onPrimary = getOptimalTextColor(currentTheme.primary);
  return (
    <>
      <p className="fp-request-hint" style={{ color: currentTheme.text.secondary }}>
        {t('{name} hat dir eine Freundschaftsanfrage geschickt', { name })}
      </p>
      <div className="fp-hero-actions fp-request-actions">
        <motion.button
          whileTap={tapScale}
          onClick={() => onRespond(false)}
          disabled={responding}
          className="fp-hero-btn fp-hero-btn--ghost"
          style={{
            border: `1px solid ${currentTheme.text.muted}55`,
            color: currentTheme.text.secondary,
          }}
        >
          <CloseRounded style={{ fontSize: 19 }} />
          {t('Ablehnen')}
        </motion.button>
        <motion.button
          whileTap={tapScale}
          onClick={() => onRespond(true)}
          disabled={responding}
          className="fp-hero-btn"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            color: onPrimary,
          }}
        >
          <CheckRounded style={{ fontSize: 19 }} />
          {t('Annehmen')}
        </motion.button>
      </div>
    </>
  );
};
