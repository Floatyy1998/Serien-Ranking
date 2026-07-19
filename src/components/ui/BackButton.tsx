import { ArrowBack } from '@mui/icons-material';
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconButton } from './IconButton';

interface BackButtonProps {
  label?: string;
  style?: React.CSSProperties;
  showHome?: boolean;
}

export const BackButton = ({ label, style, showHome = true }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const cameFromRatings = sessionStorage.getItem('cameFromRatings') === 'true';

    const isFromDetailPage =
      location.pathname.includes('/series/') || location.pathname.includes('/movie/');
    const isFromRatingDetail = location.pathname.includes('/rating/');

    // Flag, damit die Discover-Seite ihre Filter beim Zurücknavigieren behält
    if (isFromDetailPage) {
      sessionStorage.setItem('comingFromDetail', 'true');
      sessionStorage.setItem('returnUrl', window.location.pathname);
    }

    // Zurück zu den Ratings: Filter dort ebenfalls erhalten
    if ((isFromDetailPage || isFromRatingDetail) && cameFromRatings) {
      sessionStorage.removeItem('cameFromRatings');
      sessionStorage.setItem('ratingsBackNavigation', 'true');
    }

    // Nur zurückspringen, wenn es eine APP-INTERNE Vorseite gibt. React
    // Router pflegt in BrowserRouter `history.state.idx` (Position im eigenen
    // Verlauf) — idx > 0 heißt "es gibt eine vorherige In-App-Seite".
    // window.history.length war unzuverlässig: es zählt die ganze Browser-
    // Session (auch fremde Einträge), sodass navigate(-1) die App verlassen
    // konnte (z. B. Detailseite als erste Seite via Empfehlungs-Link geöffnet
    // → Zurück landete außerhalb statt auf Home).
    const historyIdx = typeof window.history.state?.idx === 'number' ? window.history.state.idx : 0;
    if (historyIdx > 0) {
      navigate(-1);
    } else {
      navigate(location.pathname.startsWith('/manga') ? '/manga' : '/');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <IconButton
        icon={<ArrowBack style={{ fontSize: '20px' }} />}
        onClick={handleBack}
        size={40}
        borderRadius="14px"
        variant="glass"
        ariaLabel={label || 'Zurück'}
        tooltip="Zurück"
        style={style}
      />
      {showHome && (
        <IconButton
          icon={
            <div
              style={{
                width: '18px',
                height: '18px',
                backgroundColor: 'var(--color-primary)',
                WebkitMaskImage: 'url(/tv-logo.svg)',
                maskImage: 'url(/tv-logo.svg)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain' as string,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat' as string,
                WebkitMaskPosition: 'center',
                maskPosition: 'center' as string,
              }}
            />
          }
          onClick={() => navigate(location.pathname.startsWith('/manga') ? '/manga' : '/')}
          size={40}
          borderRadius="14px"
          variant="glass"
          ariaLabel="Zur Startseite"
          tooltip="Zur Startseite"
          style={style}
        />
      )}
    </div>
  );
};
