import { Email } from '@mui/icons-material';
import { useState } from 'react';
import { requestEmailChange } from '../../../services/account/emailChange';
import type { SocialProvider } from '../../../services/firebase/socialAuth';
import { t } from '../../../services/i18n';
import { SButton, SButtons, SRow } from '../kit/SettingsKit';

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
    <SRow
      icon={Email}
      title={t('E-Mail-Adresse')}
      subtitle={currentEmail}
      trailing={
        sentTo ? undefined : (
          <SButton
            onClick={() => {
              setOpen((v) => !v);
              setError('');
            }}
          >
            {t('E-Mail-Adresse ändern')}
          </SButton>
        )
      }
      below={
        sentTo ? (
          <p className="st-form-ok">
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
        ) : open ? (
          <div className="st-form">
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
              <p className="st-form-hint">
                {t('Zur Bestätigung meldest du dich gleich noch einmal mit {provider} an.', {
                  provider: PROVIDER_NAME[socialProvider],
                })}
              </p>
            )}
            {error && <p className="st-form-error">{error}</p>}
            <SButtons>
              <SButton variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
                {busy ? t('Wird gesendet…') : t('Bestätigungslink senden')}
              </SButton>
            </SButtons>
          </div>
        ) : undefined
      }
    />
  );
};
