import { ArrowBack } from '@mui/icons-material';
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconButton } from './IconButton';

interface BackButtonProps {
  label?: string;
  style?: React.CSSProperties;
}

export const BackButton = ({ label, style }: BackButtonProps) => {
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

    // Always use browser back navigation
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <IconButton
        icon={<ArrowBack style={{ fontSize: '20px' }} />}
        onClick={handleBack}
        size={40}
        borderRadius="12px"
        variant="glass"
        ariaLabel={label || 'Zurück'}
        tooltip="Zurück"
        style={style}
      />
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
        onClick={() => navigate('/')}
        size={32}
        borderRadius="10px"
        variant="glass"
        ariaLabel="Zur Startseite"
        tooltip="Zur Startseite"
        style={style}
      />
    </div>
  );
};
