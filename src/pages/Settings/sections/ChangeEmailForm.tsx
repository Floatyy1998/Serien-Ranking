import { Email } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScaleSmall } from '../../../lib/motion';
import { requestEmailChange } from '../../../services/account/emailChange';
import { t } from '../../../services/i18n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** E-Mail-Adresse ändern — nur für Konten mit Passwort-Anmeldung. */
export const ChangeEmailForm = ({ currentEmail }: { currentEmail: string }) => {
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const canSubmit = !!newEmail.trim() && !!password && !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError('');
    const target = newEmail.trim();
    if (!EMAIL_RE.test(target)) {
      setError(t('Bitte gib eine gültige E-Mail-Adresse ein.'));
      return;
    }
    setBusy(true);
    try {
      await requestEmailChange(target, password);
      setSentTo(target);
      setPassword('');
    } catch (e) {
      const code = (e as { code?: string }).code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError(t('Falsches Passwort.'));
      } else if (code === 'auth/email-already-in-use') {
        setError(t('Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet.'));
      } else if (code === 'auth/invalid-email') {
        setError(t('Bitte gib eine gültige E-Mail-Adresse ein.'));
      } else if (code === 'auth/same-email') {
        setError(t('Das ist bereits deine aktuelle E-Mail-Adresse.'));
      } else if (code === 'auth/too-many-requests') {
        setError(t('Zu viele Versuche — bitte später erneut versuchen.'));
      } else {
        setError(t('E-Mail-Adresse konnte nicht geändert werden. Bitte erneut versuchen.'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: currentTheme.text.muted, margin: 0 }}>
        {t('Aktuelle E-Mail-Adresse:')}{' '}
        <strong style={{ color: currentTheme.text.primary, wordBreak: 'break-all' }}>
          {currentEmail}
        </strong>
      </p>

      {sentTo ? (
        <p style={{ color: currentTheme.status.success, margin: 0 }}>
          {t('Wir haben dir einen Bestätigungslink an {email} geschickt.', { email: sentTo })}{' '}
          {t(
            'Erst wenn du ihn öffnest, wird die Adresse geändert. Danach meldest du dich mit der neuen Adresse und deinem bisherigen Passwort an.'
          )}
        </p>
      ) : (
        <>
          <motion.button
            whileTap={tapScaleSmall}
            onClick={() => {
              setOpen((v) => !v);
              setError('');
            }}
            className="settings-nav-btn"
            style={{ justifyContent: 'center', gap: 8, color: currentTheme.text.primary }}
          >
            <Email style={{ fontSize: 20, color: currentTheme.primary }} />
            {t('E-Mail-Adresse ändern')}
          </motion.button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}
              >
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('Neue E-Mail-Adresse')}
                  className="glass-input"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Passwort zur Bestätigung')}
                  className="glass-input"
                  autoComplete="current-password"
                />

                {error && <p style={{ color: currentTheme.status.error, margin: 0 }}>{error}</p>}

                <motion.button
                  whileTap={tapScaleSmall}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="settings-nav-btn"
                  style={{
                    justifyContent: 'center',
                    color: canSubmit ? currentTheme.text.primary : currentTheme.text.muted,
                    cursor: canSubmit ? 'pointer' : 'default',
                  }}
                >
                  {busy ? t('Wird gesendet…') : t('Bestätigungslink senden')}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};
