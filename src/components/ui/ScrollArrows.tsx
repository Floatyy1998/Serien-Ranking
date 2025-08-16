import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Box, Fab } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface ScrollArrowsProps {
  target?: string; // CSS selector for scroll target, defaults to window
}

export const ScrollArrows: React.FC<ScrollArrowsProps> = ({ target }) => {
  const [showArrows, setShowArrows] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const checkScrollPosition = () => {
      const scrollContainer = target 
        ? document.querySelector(target) 
        : window;
      
      if (!scrollContainer) return;

      let scrollTop: number;
      let scrollHeight: number;
      let clientHeight: number;

      if (target) {
        const element = scrollContainer as Element;
        scrollTop = element.scrollTop;
        scrollHeight = element.scrollHeight;
        clientHeight = element.clientHeight;
      } else {
        scrollTop = window.pageYOffset;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      }

      const isAtTop = scrollTop <= 10;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      
      setCanScrollUp(!isAtTop);
      setCanScrollDown(!isAtBottom);
      setShowArrows(scrollHeight > clientHeight + 100); // Only show if content is significantly longer
    };

    const scrollElement = target 
      ? document.querySelector(target) 
      : window;

    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollPosition, { passive: true });
      checkScrollPosition(); // Initial check
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [target]);

  const scrollToTop = () => {
    const scrollContainer = target 
      ? document.querySelector(target) 
      : window;

    if (scrollContainer) {
      if (target) {
        (scrollContainer as Element).scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const scrollToBottom = () => {
    const scrollContainer = target 
      ? document.querySelector(target) 
      : window;

    if (scrollContainer) {
      if (target) {
        const element = scrollContainer as Element;
        element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }
    }
  };

  if (!showArrows) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 16, md: 24 },
        bottom: { xs: 24, md: 24 },
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {canScrollUp && (
        <Fab
          size="small"
          onClick={scrollToTop}
          sx={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
            width: 40,
            height: 40,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(0,254,215,0.1)',
              color: '#00fed7',
              border: '1px solid rgba(0,254,215,0.3)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,254,215,0.2)',
            },
          }}
        >
          <KeyboardArrowUp fontSize="small" />
        </Fab>
      )}
      {canScrollDown && (
        <Fab
          size="small"
          onClick={scrollToBottom}
          sx={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
            width: 40,
            height: 40,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(0,254,215,0.1)',
              color: '#00fed7',
              border: '1px solid rgba(0,254,215,0.3)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,254,215,0.2)',
            },
          }}
        >
          <KeyboardArrowDown fontSize="small" />
        </Fab>
      )}
    </Box>
  );
};