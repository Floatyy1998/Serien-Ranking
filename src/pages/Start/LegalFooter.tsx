import { Link } from 'react-router-dom';
import { t } from '../../services/i18n';

export const LegalFooter = () => (
  <footer className="start-legal-footer">
    <Link to="/privacy" className="start-legal-link" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
      {t('Datenschutz')}
    </Link>
    <Link
      to="/impressum"
      className="start-legal-link"
      style={{ color: 'rgba(255, 255, 255, 0.3)' }}
    >
      {t('Impressum')}
    </Link>
  </footer>
);
