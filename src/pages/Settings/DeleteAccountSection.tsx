import { DeleteForever, Warning } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticWarning } from '../../lib/haptics';
import { tapScaleSmall } from '../../lib/motion';
import { deleteAccount } from '../../services/accountDeletion';

/** Endgültige Konto-Löschung mit Passwort-Bestätigung (Store-Pflicht). */
export const DeleteAccountSection = () => {
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const errorColor = currentTheme.status.error;

  const handleDelete = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError('');
    try {
      await deleteAccount(password);
      window.location.href = '/';
    } catch (e) {
      const code = (e as { code?: string }).code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Falsches Passwort.');
      } else if (code === 'auth/too-many-requests') {
        setError('Zu viele Versuche — bitte später erneut versuchen.');
      } else {
        setError('Löschen fehlgeschlagen. Bitte erneut versuchen.');
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
        Konto löschen
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
                Dein Konto und <strong>alle Daten</strong> (Serien, Filme, Manga, Bewertungen,
                Statistiken, Freundschaften) werden <strong>endgültig gelöscht</strong>. Das kann
                nicht rückgängig gemacht werden.
              </span>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort zur Bestätigung"
              className="glass-input"
              autoComplete="current-password"
            />

            {error && (
              <p className="settings-delete-error" style={{ color: errorColor }}>
                {error}
              </p>
            )}

            <motion.button
              whileTap={tapScaleSmall}
              onClick={handleDelete}
              disabled={!password || busy}
              className="settings-delete-confirm-btn"
              style={{
                background: password && !busy ? errorColor : `${errorColor}30`,
                color: password && !busy ? '#fff' : `${errorColor}80`,
                cursor: password && !busy ? 'pointer' : 'default',
              }}
            >
              <DeleteForever style={{ fontSize: 20 }} />
              {busy ? 'Wird gelöscht…' : 'Konto endgültig löschen'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
