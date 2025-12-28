import { ArrowBack } from '@mui/icons-material';
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    const isFromDetailPage = location.pathname.includes('/series/') ||
                            location.pathname.includes('/movie/');
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
    <button
      onClick={handleBack}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        color: 'white',
        transition: 'all 0.2s ease',
        ...style,
      }}
      aria-label={label || 'Zurück'}
    >
      <ArrowBack style={{ fontSize: '20px' }} />
    </button>
  );
};
