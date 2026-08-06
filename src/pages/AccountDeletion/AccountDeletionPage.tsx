import { DeleteForever } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader } from '../../components/ui';
import { t } from '../../services/i18n';

/** Öffentliche Konto-Löschungs-Seite (Pflicht-URL für Google Play; auch ausgeloggt erreichbar). */
export const AccountDeletionPage = () => {
  const { currentTheme } = useTheme();

  const card: React.CSSProperties = {
    background: 'var(--glass-light)',
    border: '1px solid var(--glass-border-light)',
    borderRadius: 'var(--radius-xl)',
    padding: '20px 22px',
    marginBottom: 16,
  };

  const h2: React.CSSProperties = {
    margin: '0 0 10px',
    fontSize: 17,
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    color: currentTheme.text.secondary,
  };

  const text: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.65,
    color: currentTheme.text.secondary,
  };

  return (
    <div
      style={{
        minHeight: 'var(--vh, 100vh)',
        background: currentTheme.background.default,
        paddingBottom: 60,
      }}
    >
      <PageHeader title={t('Konto löschen')} icon={<DeleteForever />} showBack={false} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 20px' }}>
        <p style={{ ...text, marginBottom: 20, color: currentTheme.text.muted }}>
          {t(
            'Diese Seite beschreibt, wie du dein TV-Rank-Konto (App und Web, Anbieter: Konrad Dinges) endgültig löschst und welche Daten dabei entfernt werden.'
          )}
        </p>

        <div style={card}>
          <h2 style={h2}>{t('So löschst du dein Konto')}</h2>
          <ol style={{ ...text, paddingLeft: 20, display: 'grid', gap: 6 }}>
            <li>{t('Melde dich in der TV-Rank-App oder auf tv-rank.de an.')}</li>
            <li>
              {t('Öffne')} <strong>{t('Mehr → Einstellungen')}</strong>.
            </li>
            <li>
              {t('Wähle unten')} <strong>„{t('Konto löschen')}"</strong>{' '}
              {t('und bestätige mit deinem Passwort.')}
            </li>
          </ol>
          <p style={{ ...text, marginTop: 10 }}>
            {t('Die Löschung erfolgt sofort und kann nicht rückgängig gemacht werden.')}
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>{t('Welche Daten gelöscht werden')}</h2>
          <p style={text}>
            {t(
              'Mit dem Konto werden alle zugehörigen Daten dauerhaft gelöscht: Anmeldedaten (E-Mail-Adresse), Profil und Profilbild, deine Serien-, Film- und Manga-Listen samt Watch-Verlauf, Bewertungen, Statistiken, Erfolge und virtuelle Haustiere, Freundschaften, Ranglisten-Einträge sowie ein eventuell aktiviertes öffentliches Profil. Es gibt keine zusätzliche Aufbewahrungsfrist.'
            )}
          </p>
          <p style={{ ...text, marginTop: 10 }}>
            {t(
              'Von dir verfasste Beiträge in öffentlichen Diskussionen können in anonymisierter Form erhalten bleiben.'
            )}
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>{t('Alternativ: Löschung anfordern')}</h2>
          <p style={text}>
            {t(
              'Ohne Zugriff auf dein Konto kannst du die Löschung auch per E-Mail über die Kontaktdaten im'
            )}{' '}
            <a href="/impressum" style={{ color: currentTheme.primary }}>
              {t('Impressum')}
            </a>{' '}
            {t('anfordern. Weitere Informationen zur Datenverarbeitung findest du in der')}{' '}
            <a href="/privacy" style={{ color: currentTheme.primary }}>
              {t('Datenschutzerklärung')}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};
