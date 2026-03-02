import { Link } from 'react-router-dom';

export const LegalFooter = () => (
  <footer className="start-legal-footer">
    <Link to="/privacy" className="start-legal-link" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
      Datenschutz
    </Link>
    <Link
      to="/impressum"
      className="start-legal-link"
      style={{ color: 'rgba(255, 255, 255, 0.3)' }}
    >
      Impressum
    </Link>
  </footer>
);
