import { Email } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScaleSmall } from '../../../lib/motion';
import { requestEmailChange } from '../../../services/account/emailChange';
import type { SocialProvider } from '../../../services/firebase/socialAuth';
import { t } from '../../../services/i18n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROVIDER_NAME: Record<SocialProvider, string> = { google: 'Google', apple: 'Apple' };

/** socialProvider gesetzt → Social-Only-Konto, Bestätigung über den Provider statt Passwort. */
export const ChangeEmailForm = ({
  currentEmail,
  socialProvider = null,
}: {
  currentEmail: string;
  socialProvider?: SocialProvider | null;
}) => {
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const needsPassword = !socialProvider;
  const canSubmit = !!newEmail.trim() && (!needsPassword || !!password) && !busy;

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
      await requestEmailChange(target, needsPassword ? password : null);
      setSentTo(target);
      setPassword('');
    } catch (e) {
      const code = (e as { code?: string }).code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError(t('Falsches Passwort.'));
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/user-cancelled') {
        setError(t('Bestätigung abgebrochen.'));
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
          {socialProvider
            ? t(
                'Erst wenn du ihn öffnest, wird die Adresse geändert. Anmelden kannst du dich weiter wie gewohnt mit {provider}.',
                { provider: PROVIDER_NAME[socialProvider] }
              )
            : t(
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
                  <p style={{ color: currentTheme.text.muted, margin: 0 }}>
                    {t('Zur Bestätigung meldest du dich gleich noch einmal mit {provider} an.', {
                      provider: PROVIDER_NAME[socialProvider],
                    })}
                  </p>
                )}

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
