import { ArrowUpward } from '@mui/icons-material';
import { useEffect, useState } from 'react';

interface ScrollToTopButtonProps {
  hasNavbar?: boolean;
}

export const ScrollToTopButton = ({ hasNavbar = true }: ScrollToTopButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('.mobile-content');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      setIsVisible(scrollTop > 200);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.querySelector('.mobile-content');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: hasNavbar ? '100px' : '20px',
        right: '16px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        zIndex: 100,
        transition: 'all 0.3s ease',
        opacity: isVisible ? 0.8 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.8';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      }}
      aria-label="Nach oben scrollen"
    >
      <ArrowUpward style={{ fontSize: '20px' }} />
    </button>
  );
};