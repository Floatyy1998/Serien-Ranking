import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Mobile detection based on viewport
      setIsMobile(width < 768);
      
      // OS detection
      setIsIOS(/iphone|ipad|ipod/.test(userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
      setIsAndroid(/android/.test(userAgent));
      
      // PWA detection
      setIsPWA(window.matchMedia('(display-mode: standalone)').matches ||
               (window.navigator as any).standalone === true ||
               document.referrer.includes('android-app://'));
      
      // Update viewport height for mobile browsers
      setViewportHeight(window.innerHeight);
      
      // Set CSS variables for safe areas
      if (width < 768) {
        const root = document.documentElement;
        root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
        root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
        root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
        root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
        root.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      }
    };

    checkDevice();
    
    // Handle resize and orientation changes
    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Handle viewport height changes (mobile browser URL bar)
    const handleViewportChange = () => {
      setViewportHeight(window.innerHeight);
      document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
    };
    
    window.visualViewport?.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  return {
    isMobile,
    isIOS,
    isAndroid,
    isPWA,
    viewportHeight,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    hasNotch: isIOS && window.screen.height >= 812, // iPhone X and later
  };
};