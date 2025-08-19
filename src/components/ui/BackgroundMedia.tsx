import React, { useEffect, useRef, useState } from 'react';

export const BackgroundMedia: React.FC = () => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [opacity, setOpacity] = useState(0.5);
  const [blur, setBlur] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Load background media settings from localStorage
    const loadBackgroundMedia = () => {
      try {
        const savedTheme = localStorage.getItem('customTheme');
        if (savedTheme) {
          const theme = JSON.parse(savedTheme);
          if (theme.backgroundImage) {
            // Debug logging
            console.log('[BackgroundMedia] Loading media:', {
              url: theme.backgroundImage,
              isVideo: theme.backgroundIsVideo,
              opacity: theme.backgroundImageOpacity,
              blur: theme.backgroundImageBlur
            });
            
            setMediaUrl(theme.backgroundImage);
            setIsVideo(theme.backgroundIsVideo || false);
            setOpacity(theme.backgroundImageOpacity || 0.5);
            setBlur(theme.backgroundImageBlur || 0);

            // Add class to body
            document.body.classList.add('has-background-image');
            if (theme.backgroundIsVideo) {
              document.body.classList.add('has-background-video');
              // Videos auf Mobile nie erlauben
              document.body.classList.remove('allow-mobile-video');
            } else {
              document.body.classList.remove('has-background-video');
              document.body.classList.remove('allow-mobile-video');
            }

            // Für Bilder auch CSS-Variablen setzen (falls loadBackgroundImage noch nicht gelaufen ist)
            if (!theme.backgroundIsVideo) {
              const root = document.documentElement;
              root.style.setProperty(
                '--background-image',
                `url(${theme.backgroundImage})`
              );
              root.style.setProperty(
                '--background-image-opacity',
                String(theme.backgroundImageOpacity || 0.5)
              );
              root.style.setProperty(
                '--background-image-blur',
                `${theme.backgroundImageBlur || 0}px`
              );
            }
          } else {
            // No background image/video - clean up completely
            cleanupMedia();
          }
        } else {
          // No theme saved - clean up completely
          cleanupMedia();
        }
      } catch (error) {
        console.error('Error loading background media:', error);
        cleanupMedia();
      }
    };

    const cleanupMedia = () => {
      // Stop video if playing
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }

      // Clear state
      setMediaUrl(null);
      setIsVideo(false);

      // Remove all classes and styles
      document.body.classList.remove('has-background-image');
      document.body.classList.remove('has-background-video');
      document.body.classList.remove('allow-mobile-video');

      // Remove CSS variables
      const root = document.documentElement;
      root.style.removeProperty('--background-image');
      root.style.removeProperty('--background-image-opacity');
      root.style.removeProperty('--background-image-blur');
    };

    // Sofort beim Mount laden
    loadBackgroundMedia();

    // Listen for theme changes
    const handleThemeChange = () => {
      loadBackgroundMedia();
    };

    window.addEventListener('themeChanged', handleThemeChange);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      cleanupMedia();
    };
  }, []);

  if (!mediaUrl) return null;

  // Auf Mobile: Videos nicht anzeigen
  const isMobile = window.innerWidth <= 768;
  
  if (isVideo && isMobile) {
    // Auf Mobile werden Videos einfach nicht gerendert
    return null;
  }

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        key={mediaUrl} // Force re-render when URL changes
        className='background-video'
        src={mediaUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          opacity,
          filter: `blur(${blur}px)`,
          // Hardware-Beschleunigung erzwingen
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
        onLoadedData={() => {
          console.log('[BackgroundMedia] Video loaded successfully');
          
          // Fallback: Manuell abspielen falls Autoplay fehlschlägt
          if (videoRef.current) {
            videoRef.current.play().catch(error => {
              console.warn('[BackgroundMedia] Video autoplay failed:', error);
              
              // Bei erstem User-Klick/Touch versuchen abzuspielen
              const playOnInteraction = () => {
                if (videoRef.current) {
                  console.log('[BackgroundMedia] Trying to play video on user interaction');
                  videoRef.current.play().catch(e => {
                    console.error('[BackgroundMedia] Video play failed even with interaction:', e);
                  });
                }
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
              };
              document.addEventListener('click', playOnInteraction, { once: true });
              document.addEventListener('touchstart', playOnInteraction, { once: true });
            });
          }
        }}
        onError={(e) => {
          console.error('[BackgroundMedia] Video loading error:', {
            error: e,
            src: mediaUrl,
            videoElement: videoRef.current
          });
        }}
      />
    );
  }

  // For images, we rely on CSS background-image
  return null;
};
