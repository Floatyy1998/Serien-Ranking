import { AutoStories, Close, DoneAll, LibraryBooks } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';

interface VolumeHintProps {
  volume: number;
  /** Manga zählt noch Kapitel — Abhaken stellt auf Bände um. */
  tracksChapters: boolean;
  hasProgress?: boolean;
  /** Fehlt, wenn der Band schon gelesen ist. */
  onMark?: () => void;
  /** Fehlt, wenn der Band schon im Regal steht. */
  onOwn?: () => void;
  onDismiss: () => void;
}

export const VolumeHint = ({
  volume,
  tracksChapters,
  hasProgress = false,
  onMark,
  onOwn,
  onDismiss,
}: VolumeHintProps) => {
  const { currentTheme } = useTheme();
  const ownFirst = !!onOwn && (!onMark || (tracksChapters && hasProgress));
  const filled = {
    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
    color: getOptimalTextColor(currentTheme.primary),
  };
  const ghost = { color: currentTheme.text.secondary };

  const text = !onMark
    ? t('Steht der Band bei dir im Regal?')
    : !onOwn
      ? tracksChapters
        ? t('Du zählst hier Kapitel. Mit dem Abhaken zählst du ab jetzt in Bänden.')
        : t('Schon gelesen? Dann hak alle Bände bis hierhin ab.')
      : tracksChapters
        ? t(
            '„Im Besitz“ merkt sich nur diesen Band. „Gelesen“ zählt ab jetzt in Bänden statt Kapiteln.'
          )
        : t('„Im Besitz“ merkt sich nur diesen Band. „Gelesen“ hakt alle Bände bis hierhin ab.');

  const ownButton = onOwn && (
    <button
      key="own"
      type="button"
      className={`md-volume-hint-cta${ownFirst ? '' : ' md-volume-hint-cta--ghost'}`}
      onClick={onOwn}
      style={ownFirst ? filled : ghost}
    >
      <LibraryBooks style={{ fontSize: 18 }} />
      {t('Band {n} im Besitz', { n: volume })}
    </button>
  );
  const markButton = onMark && (
    <button
      key="mark"
      type="button"
      className={`md-volume-hint-cta${ownFirst ? ' md-volume-hint-cta--ghost' : ''}`}
      onClick={onMark}
      style={ownFirst ? ghost : filled}
    >
      <DoneAll style={{ fontSize: 18 }} />
      {t('Bis Band {n} gelesen', { n: volume })}
    </button>
  );

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
          <span style={{ color: currentTheme.text.muted }}>{text}</span>
        </div>
        <div className="md-volume-hint-actions">
          {ownFirst ? [ownButton, markButton] : [markButton, ownButton]}
        </div>
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
