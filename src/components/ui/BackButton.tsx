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
    // Check if we came from ratings page
    const cameFromRatings = sessionStorage.getItem('cameFromRatings') === 'true';

    // Check if we're navigating back FROM a detail page
    const isFromDetailPage =
      location.pathname.includes('/series/') || location.pathname.includes('/movie/');
    const isFromRatingDetail = location.pathname.includes('/rating/');

    // If navigating back FROM a series/movie detail page, set flag to preserve filters on Discover page
    if (isFromDetailPage) {
      sessionStorage.setItem('comingFromDetail', 'true');
      // Also save current URL so we know where we're coming from
      sessionStorage.setItem('returnUrl', window.location.pathname);
    }

    // If navigating back to ratings from a detail page, preserve filters
    if ((isFromDetailPage || isFromRatingDetail) && cameFromRatings) {
      // Clear the flag that we came from ratings
      sessionStorage.removeItem('cameFromRatings');
      // Set a flag that we're doing a back navigation to ratings
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
                width: '16px',
                height: '16px',
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
          size={32}
          borderRadius="10px"
          variant="glass"
          ariaLabel="Zur Startseite"
          tooltip="Zur Startseite"
          style={style}
        />
      )}
    </div>
  );
};
