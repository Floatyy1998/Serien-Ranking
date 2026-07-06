/**
 * Empty-State für einzelne WatchJourney-Tabs (Genre/Provider/Trends …).
 *
 * Vereinheitlicht das zuvor je Tab duplizierte Icon+Titel+Text-Muster und
 * ergänzt — wie der Haupt-Empty-State (`WatchJourneyEmptyState`) — einen
 * primären CTA, der in die Entdecken-Ansicht führt, statt den Nutzer in einer
 * Sackgasse stehen zu lassen.
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../theme/colorUtils';

interface WatchJourneyTabEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
}

export const WatchJourneyTabEmptyState: React.FC<WatchJourneyTabEmptyStateProps> = ({
  icon,
  title,
  description,
  ctaLabel = 'Serien & Filme entdecken',
  ctaTo = '/discover',
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      {icon}
      <h3 style={{ color: currentTheme.text.primary, fontSize: 18, marginBottom: 8 }}>{title}</h3>
      <p
        style={{
          color: currentTheme.text.secondary,
          fontSize: 14,
          maxWidth: 320,
          margin: '0 auto',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      <button
        type="button"
        onClick={() => navigate(ctaTo)}
        style={{
          marginTop: 24,
          minHeight: 44,
          padding: '12px 24px',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 700,
          background: currentTheme.primary,
          color: getOptimalTextColor(currentTheme.primary),
        }}
      >
        {ctaLabel}
      </button>
    </div>
  );
};
