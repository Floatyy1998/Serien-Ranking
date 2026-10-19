import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAndroidBack } from '../../hooks/ui/useAndroidBack';
import { t } from '../../services/i18n';

/** WhatsApp-Abfrage: eigene Nachrichten für alle oder nur für mich, fremde nur für mich. */
export const ChatDeleteDialog = ({
  count,
  canDeleteForAll,
  onDeleteForAll,
  onDeleteForMe,
  onClose,
}: {
  count: number | null;
  canDeleteForAll: boolean;
  onDeleteForAll: () => void;
  onDeleteForMe: () => void;
  onClose: () => void;
}) => {
  const { currentTheme } = useTheme();
  useAndroidBack(count !== null, onClose);

  return createPortal(
    <AnimatePresence>
      {count !== null && (
        <motion.div
          className="ch-del-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="ch-del"
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            style={{ color: currentTheme.text.primary }}
          >
            <h3>
              {count === 1 ? t('Nachricht löschen?') : t('{count} Nachrichten löschen?', { count })}
            </h3>
            <p style={{ color: currentTheme.text.muted }}>
              {canDeleteForAll
                ? t('„Für alle löschen“ entfernt die Nachricht auch bei deinem Gegenüber.')
                : t('Die Nachricht verschwindet nur bei dir.')}
            </p>
            <div className="ch-del-actions">
              {canDeleteForAll && (
                <button
                  type="button"
                  onClick={onDeleteForAll}
                  style={{ color: currentTheme.status.error }}
                >
                  {t('Für alle löschen')}
                </button>
              )}
              <button
                type="button"
                onClick={onDeleteForMe}
                style={{ color: currentTheme.status.error }}
              >
                {t('Für mich löschen')}
              </button>
              <button type="button" onClick={onClose}>
                {t('Abbrechen')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
