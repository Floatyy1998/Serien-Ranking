import { DeleteForever, Warning } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticWarning } from '../../lib/haptics';
import { tapScaleSmall } from '../../lib/motion';
import { deleteAccount } from '../../services/accountDeletion';
import { hasPasswordProvider } from '../../services/firebase/socialAuth';
import { t } from '../../services/i18n';

/** Endgültige Konto-Löschung mit Passwort-Bestätigung (Store-Pflicht). */
export const DeleteAccountSection = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const errorColor = currentTheme.status.error;
  // Social-Only-Konten haben kein Passwort — Bestätigung läuft über den Provider.
  const needsPassword = hasPasswordProvider(user ?? null);
  const canDelete = needsPassword ? !!password : true;

  const handleDelete = async () => {
    if (!canDelete || busy) return;
    setBusy(true);
    setError('');
    try {
      await deleteAccount(needsPassword ? password : null);
      window.location.href = '/';
    } catch (e) {
      const code = (e as { code?: string }).code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError(t('Falsches Passwort.'));
      } else if (code === 'auth/too-many-requests') {
        setError(t('Zu viele Versuche — bitte später erneut versuchen.'));
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/user-cancelled') {
        setError(t('Bestätigung abgebrochen.'));
      } else {
        setError(t('Löschen fehlgeschlagen. Bitte erneut versuchen.'));
      }
      setBusy(false);
    }
  };

  return (
    <div className="settings-delete-account">
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        whileTap={tapScaleSmall}
        onClick={() => {
          hapticWarning();
          setOpen((v) => !v);
          setError('');
        }}
        className="settings-delete-btn"
        style={{ color: currentTheme.text.muted }}
      >
        {t('Konto löschen')}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="settings-delete-confirm"
            style={{
              background: `${errorColor}0d`,
              border: `1px solid ${errorColor}35`,
            }}
          >
            <div className="settings-delete-warning" style={{ color: currentTheme.text.secondary }}>
              <Warning style={{ fontSize: 20, color: errorColor, flexShrink: 0 }} />
              <span>
                {t('Dein Konto und')} <strong>{t('alle Daten')}</strong>{' '}
                {t('(Serien, Filme, Manga, Bewertungen, Statistiken, Freundschaften) werden')}{' '}
                <strong>{t('endgültig gelöscht')}</strong>
                {t('. Das kann nicht rückgängig gemacht werden.')}
              </span>
            </div>

            {needsPassword ? (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('Passwort zur Bestätigung')}
                className="glass-input"
                autoComplete="current-password"
              />
            ) : (
              <p
                className="settings-delete-warning"
                style={{ color: currentTheme.text.muted, margin: 0 }}
              >
                {t('Zur Bestätigung meldest du dich gleich noch einmal mit Google bzw. Apple an.')}
              </p>
            )}

            {error && (
              <p className="settings-delete-error" style={{ color: errorColor }}>
                {error}
              </p>
            )}

            <motion.button
              whileTap={tapScaleSmall}
              onClick={handleDelete}
              disabled={!canDelete || busy}
              className="settings-delete-confirm-btn"
              style={{
                background: canDelete && !busy ? errorColor : `${errorColor}30`,
                color: canDelete && !busy ? '#fff' : `${errorColor}80`,
                cursor: canDelete && !busy ? 'pointer' : 'default',
              }}
            >
              <DeleteForever style={{ fontSize: 20 }} />
              {busy ? t('Wird gelöscht…') : t('Konto endgültig löschen')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
