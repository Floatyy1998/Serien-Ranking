import { AutoStories, Close, DoneAll } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';

interface VolumeHintProps {
  volume: number;
  /** Manga zählt noch Kapitel — Abhaken stellt auf Bände um. */
  tracksChapters: boolean;
  onMark: () => void;
  onDismiss: () => void;
}

/** Nach der ISBN-Suche: den gefundenen Band direkt abhaken. */
export const VolumeHint = ({ volume, tracksChapters, onMark, onDismiss }: VolumeHintProps) => {
  const { currentTheme } = useTheme();
  return (
    <motion.div
      className="md-volume-hint-wrap"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="md-volume-hint"
        style={{
          borderColor: `${currentTheme.primary}55`,
          background: `linear-gradient(150deg, ${currentTheme.primary}1f, var(--glass-light) 60%)`,
        }}
      >
        <AutoStories className="md-volume-hint-icon" style={{ color: currentTheme.primary }} />
        <div className="md-volume-hint-text">
          <strong>{t('Band {n} gefunden', { n: volume })}</strong>
          <span style={{ color: currentTheme.text.muted }}>
            {tracksChapters
              ? t('Du zählst hier Kapitel. Mit dem Abhaken zählst du ab jetzt in Bänden.')
              : t('Schon gelesen? Dann hak alle Bände bis hierhin ab.')}
          </span>
        </div>
        <button
          type="button"
          className="md-volume-hint-cta"
          onClick={onMark}
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            color: getOptimalTextColor(currentTheme.primary),
          }}
        >
          <DoneAll style={{ fontSize: 18 }} />
          {t('Bis Band {n} gelesen', { n: volume })}
        </button>
        <button
          type="button"
          className="md-volume-hint-close"
          aria-label={t('Schließen')}
          onClick={onDismiss}
          style={{ color: currentTheme.text.muted }}
        >
          <Close style={{ fontSize: 18 }} />
        </button>
      </div>
    </motion.div>
  );
};
