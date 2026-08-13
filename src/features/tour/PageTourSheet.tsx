import { createElement } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BottomSheet } from '../../components/ui';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { PageTour } from '../../lib/pageTour';
import { getTourIcon } from './tourIcons';
import { t } from '../../services/i18n';

interface PageTourSheetProps {
  tour: PageTour | null;
  onClose: () => void;
}

export const PageTourSheet = ({ tour, onClose }: PageTourSheetProps) => {
  const { currentTheme } = useTheme();
  const muted = currentTheme.text?.muted || 'rgba(255,255,255,0.5)';

  return (
    <BottomSheet isOpen={tour !== null} onClose={onClose} ariaLabel={t('Das kannst du hier')}>
      {tour && (
        <div style={{ padding: '0 20px 28px' }}>
          <p
            style={{
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: muted,
              margin: '0 0 4px',
            }}
          >
            {t('Das kannst du hier')}
          </p>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>{t(tour.title)}</h3>
          <p style={{ fontSize: '14px', color: muted, margin: '0 0 20px' }}>{t(tour.intro)}</p>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '16px' }}>
            {tour.actions.map((action) => (
              <li
                key={action.title}
                style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    display: 'grid',
                    placeItems: 'center',
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  }}
                >
                  {createElement(getTourIcon(action.icon), {
                    style: { fontSize: '22px', color: getOptimalTextColor(currentTheme.primary) },
                  })}
                </span>
                <span style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: '15px', fontWeight: 600 }}>
                    {t(action.title)}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      lineHeight: 1.45,
                      color: muted,
                      marginTop: '2px',
                    }}
                  >
                    {t(action.text)}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={onClose}
            style={{
              marginTop: '24px',
              width: '100%',
              padding: '14px 22px',
              borderRadius: 'var(--radius-lg)',
              background: currentTheme.primary,
              border: 'none',
              color: getOptimalTextColor(currentTheme.primary),
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('Alles klar')}
          </button>
        </div>
      )}
    </BottomSheet>
  );
};
