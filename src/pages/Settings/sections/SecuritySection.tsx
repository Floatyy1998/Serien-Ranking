/**
 * SecuritySection — E-Mail-Adresse ändern (alle Konten). Social-Only-Konten
 * (Google/Apple ohne Passwort) können zusätzlich ein Passwort nachrüsten,
 * z. B. für den Login der Browser-Extension.
 */

import { Key } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScaleSmall } from '../../../lib/motion';
import {
  getSocialProvider,
  hasPasswordProvider,
  linkPasswordToAccount,
} from '../../../services/firebase/socialAuth';
import { t } from '../../../services/i18n';
import { ChangeEmailForm } from './ChangeEmailForm';

export const SecuritySection = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!user) return null;
  const hasPassword = hasPasswordProvider(user);
  const socialProvider = getSocialProvider(user);
  if (hasPassword && !user.email) return null;

  const handleSave = async () => {
    if (busy) return;
    setError('');
    if (password.length < 6) {
      setError(t('Passwort muss mindestens 6 Zeichen lang sein.'));
      return;
    }
    if (password !== confirm) {
      setError(t('Passwörter stimmen nicht überein.'));
      return;
    }
    setBusy(true);
    try {
      await linkPasswordToAccount(password);
      setDone(true);
    } catch (e) {
      const code = (e as { code?: string }).code || '';
      if (code === 'auth/weak-password') {
        setError(t('Passwort ist zu schwach.'));
      } else if (code === 'auth/provider-already-linked') {
        setDone(true);
      } else {
        setError(t('Passwort konnte nicht gespeichert werden. Bitte erneut versuchen.'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
      className="settings-card"
    >
      <h2 className="settings-section-title" style={{ color: currentTheme.text.primary }}>
        {t('Anmeldung & Sicherheit')}
      </h2>

      {done ? (
        <p style={{ color: currentTheme.status.success, margin: 0 }}>
          {t(
            'Passwort gesetzt — du kannst dich jetzt zusätzlich mit E-Mail & Passwort anmelden (z. B. in der Browser-Extension).'
          )}
        </p>
      ) : hasPassword ? (
        <ChangeEmailForm currentEmail={user.email ?? ''} />
      ) : (
        <>
          {user.email && socialProvider && (
            <div style={{ marginBottom: 24 }}>
              <ChangeEmailForm currentEmail={user.email} socialProvider={socialProvider} />
            </div>
          )}

          <p style={{ color: currentTheme.text.muted, marginTop: 0 }}>
            {t(
              'Du meldest dich mit Google oder Apple an. Lege zusätzlich ein Passwort fest, um dich auch mit E-Mail & Passwort anzumelden — nötig z. B. für die Browser-Extension.'
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Neues Passwort')}
              className="glass-input"
              autoComplete="new-password"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('Passwort wiederholen')}
              className="glass-input"
              autoComplete="new-password"
            />

            {error && <p style={{ color: currentTheme.status.error, margin: 0 }}>{error}</p>}

            <motion.button
              whileTap={tapScaleSmall}
              onClick={handleSave}
              disabled={!password || !confirm || busy}
              className="settings-nav-btn"
              style={{
                justifyContent: 'center',
                gap: 8,
                color:
                  password && confirm && !busy
                    ? currentTheme.text.primary
                    : currentTheme.text.muted,
                cursor: password && confirm && !busy ? 'pointer' : 'default',
              }}
            >
              <Key style={{ fontSize: 20, color: currentTheme.primary }} />
              {busy ? t('Wird gespeichert…') : t('Passwort festlegen')}
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
};
