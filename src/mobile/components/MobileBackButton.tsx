import { ArrowBack } from '@mui/icons-material';
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileBackButtonProps {
  label?: string;
  style?: React.CSSProperties;
}

export const MobileBackButton = ({ label, style }: MobileBackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if we came from ratings page
    const cameFromRatings = sessionStorage.getItem('cameFromRatings') === 'true';
    
    // Check if we're navigating back FROM a detail page
    const isFromDetailPage = location.pathname.includes('/series/') || 
                            location.pathname.includes('/movie/') ||
                            location.pathname.includes('/rating/');
    
    // If navigating back to ratings from a detail page, preserve filters
    if (isFromDetailPage && cameFromRatings) {
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
