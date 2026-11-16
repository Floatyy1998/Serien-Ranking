import { CheckRounded, DeleteForever, Warning } from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { DELETION_PHASES, type DeletionPhase } from '../../../lib/account/deletionPhases';
import { hapticWarning } from '../../../lib/interaction/haptics';
import { deleteAccount } from '../../../services/account/accountDeletion';
import { hasPasswordProvider } from '../../../services/firebase/socialAuth';
import { t } from '../../../services/i18n';
import { SButton, SButtons, SRow } from '../kit/SettingsKit';

const phaseLabel = (phase: DeletionPhase): string => {
  switch (phase) {
    case 'data':
      return t('Deine Daten werden gelöscht');
    case 'social':
      return t('Freundschaften und Freigaben werden entfernt');
    case 'chats':
      return t('Chats werden gelöscht');
    case 'files':
      return t('Profilbild und Dateien werden entfernt');
    case 'references':
      return t('Einträge bei anderen Nutzern werden bereinigt');
    case 'auth':
      return t('Konto wird geschlossen');
    default:
      return t('Dein Konto wurde gelöscht.');
  }
};

/** Endgültige Konto-Löschung mit Passwort-Bestätigung (Store-Pflicht). */
export const DeleteAccountSection = ({ previewPhase }: { previewPhase?: DeletionPhase } = {}) => {
  const { user } = useAuth() || {};
  const [open, setOpen] = useState(!!previewPhase);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<DeletionPhase | null>(previewPhase ?? null);

  const needsPassword = hasPasswordProvider(user ?? null);
  const canDelete = needsPassword ? !!password : true;

  const handleDelete = async () => {
    if (!canDelete || busy) return;
    setBusy(true);
    setError('');
    try {
      await deleteAccount(needsPassword ? password : null, setPhase);
      setPhase('done');
      window.setTimeout(() => {
        window.location.href = '/';
      }, 1200);
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
      setPhase(null);
      setBusy(false);
    }
  };

  const activeIndex =
    phase === 'done' ? DELETION_PHASES.length : phase ? DELETION_PHASES.indexOf(phase) : -1;

  return (
    <SRow
      icon={DeleteForever}
      tone="danger"
      title={t('Konto löschen')}
      subtitle={t('Entfernt dein Konto und alle Daten endgültig')}
      trailing={
        <SButton
          variant="danger"
          disabled={busy}
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
        open && phase ? (
          <div className="st-form st-danger-zone" role="status" aria-live="polite">
            <p className="st-delete-title">
              {phase === 'done' ? t('Dein Konto wurde gelöscht.') : t('Dein Konto wird gelöscht')}
            </p>
            <ol className="st-delete-steps">
              {DELETION_PHASES.map((step, index) => (
                <li
                  key={step}
                  className={
                    index < activeIndex
                      ? 'st-delete-step is-done'
                      : index === activeIndex
                        ? 'st-delete-step is-active'
                        : 'st-delete-step'
                  }
                >
                  <span className="st-delete-mark" aria-hidden>
                    {index < activeIndex ? <CheckRounded /> : null}
                  </span>
                  <span>{phaseLabel(step)}</span>
                </li>
              ))}
            </ol>
            {phase !== 'done' && (
              <p className="st-form-hint">
                {t('Bitte lass die App geöffnet. Das kann bis zu einer Minute dauern.')}
              </p>
            )}
          </div>
        ) : open ? (
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
