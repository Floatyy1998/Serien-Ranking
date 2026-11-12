import { DeleteForever, Warning } from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { hapticWarning } from '../../../lib/interaction/haptics';
import { deleteAccount } from '../../../services/account/accountDeletion';
import { hasPasswordProvider } from '../../../services/firebase/socialAuth';
import { t } from '../../../services/i18n';
import { SButton, SButtons, SRow } from '../kit/SettingsKit';

/** Endgültige Konto-Löschung mit Passwort-Bestätigung (Store-Pflicht). */
export const DeleteAccountSection = () => {
  const { user } = useAuth() || {};
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
    <SRow
      icon={DeleteForever}
      tone="danger"
      title={t('Konto löschen')}
      subtitle={t('Entfernt dein Konto und alle Daten endgültig')}
      trailing={
        <SButton
          variant="danger"
          onClick={() => {
            hapticWarning();
            setOpen((v) => !v);
            setError('');
          }}
        >
          {open ? t('Abbrechen') : t('Konto löschen')}
        </SButton>
      }
      below={
        open ? (
          <div className="st-form st-danger-zone">
            <p className="st-danger-text">
              <Warning aria-hidden />
              <span>
                {t('Dein Konto und')} <strong>{t('alle Daten')}</strong>{' '}
                {t('(Serien, Filme, Manga, Bewertungen, Statistiken, Freundschaften) werden')}{' '}
                <strong>{t('endgültig gelöscht')}</strong>
                {t('. Das kann nicht rückgängig gemacht werden.')}
              </span>
            </p>
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
                {t('Zur Bestätigung meldest du dich gleich noch einmal mit Google bzw. Apple an.')}
              </p>
            )}
            {error && <p className="st-form-error">{error}</p>}
            <SButtons>
              <SButton
                variant="danger"
                icon={DeleteForever}
                onClick={handleDelete}
                disabled={!canDelete || busy}
              >
                {busy ? t('Wird gelöscht…') : t('Konto endgültig löschen')}
              </SButton>
            </SButtons>
          </div>
        ) : undefined
      }
    />
  );
};
