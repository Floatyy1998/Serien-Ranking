import React, { useEffect, useRef, useState } from 'react';
import { checkVideoLoadingViability } from '../../utils/videoOptimizer';

export const BackgroundMedia: React.FC = () => {
  // Initialisiere aus localStorage für sofortiges Rendern
  const getInitialMedia = () => {
    try {
      const savedTheme = localStorage.getItem('customTheme');
      if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        return {
          url: theme.backgroundImage || null,
          isVideo: theme.backgroundIsVideo || false,
          opacity: theme.backgroundImageOpacity || 0.5,
          blur: theme.backgroundImageBlur || 0
        };
      }
    } catch (e) {}
    return { url: null, isVideo: false, opacity: 0.5, blur: 0 };
  };
  
  const initial = getInitialMedia();
  const [mediaUrl, setMediaUrl] = useState<string | null>(initial.url);
  const [isVideo, setIsVideo] = useState(initial.isVideo);
  const [opacity, setOpacity] = useState(initial.opacity);
  const [blur, setBlur] = useState(initial.blur);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Starte mit Loading=true für Videos, false für Bilder
  const [isVideoLoading, setIsVideoLoading] = useState(initial.isVideo);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const preloadLinkRef = useRef<HTMLLinkElement | null>(null);

  // Preload-Funktion für Videos
  const preloadVideo = (url: string) => {
    // Entferne alten Preload-Link falls vorhanden
    if (preloadLinkRef.current) {
      preloadLinkRef.current.remove();
    }
    
    // Verwende prefetch statt preload für Videos
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    preloadLinkRef.current = link;
  };

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
            
            // Preload video im Hintergrund
            if (theme.backgroundIsVideo && theme.backgroundImage) {
              // Setze Loading auf true wenn es ein Video ist
              setIsVideoLoading(true);
              
              // Prüfe ob Video geladen werden sollte
              checkVideoLoadingViability(theme.backgroundImage).then(result => {
                if (!result.shouldLoadVideo) {
                  console.warn('[BackgroundMedia] Skipping video load:', result.reason);
                  setVideoLoadFailed(true);
                  setIsVideoLoading(false);
                } else {
                  // Video kann geladen werden
                  preloadVideo(theme.backgroundImage);
                }
              });
            } else if (!theme.backgroundIsVideo) {
              // Für Bilder kein Loading
              setIsVideoLoading(false);
              // Video ist nicht kritisch für App-Start
            }

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
            // Video ist nicht kritisch für App-Start
          }
        } else {
          // No theme saved - clean up completely
          cleanupMedia();
          // Video ist nicht kritisch für App-Start
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
      
      // Entferne Preload-Link
      if (preloadLinkRef.current) {
        preloadLinkRef.current.remove();
        preloadLinkRef.current = null;
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
      // Prüfe ob sich die URL wirklich geändert hat
      const savedTheme = localStorage.getItem('customTheme');
      if (savedTheme) {
        try {
          const theme = JSON.parse(savedTheme);
          if (theme.backgroundImage !== mediaUrl) {
            // Nur neu laden wenn sich die URL geändert hat
            loadBackgroundMedia();
          } else {
            // Nur Eigenschaften aktualisieren
            setOpacity(theme.backgroundImageOpacity || 0.5);
            setBlur(theme.backgroundImageBlur || 0);
          }
        } catch (error) {
          loadBackgroundMedia();
        }
      } else {
        loadBackgroundMedia();
      }
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
  
  if (isVideo && (isMobile || videoLoadFailed)) {
    // Bei Mobile oder Ladefehler: Zeige statisches Bild als Fallback
    return (
      <div
        className="background-video-fallback"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${mediaUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: opacity * 0.3,
          filter: `blur(${blur + 10}px)`,
          zIndex: -1,
        }}
      />
    );
  }

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        className='background-video'
        src={mediaUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: -2,
          opacity: isVideoLoading ? 0 : opacity,
          filter: `blur(${blur}px)`,
          // Hardware-Beschleunigung erzwingen
          transform: 'translateZ(0) scale(1.05)',
          WebkitTransform: 'translateZ(0) scale(1.05)',
          transition: 'opacity 0.3s ease-in-out',
          willChange: 'opacity',
          pointerEvents: 'none',
        }}
        onLoadedMetadata={() => {
          console.log('[BackgroundMedia] Video metadata loaded');
          // Zeige Video schon bei Metadaten
          setIsVideoLoading(false);
          // Video metadata geladen
        }}
        onLoadedData={() => {
          console.log('[BackgroundMedia] Video data loaded');
          
          // Fallback: Manuell abspielen falls Autoplay fehlschlägt
          if (videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
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
          }
        }}
        onError={(e) => {
          const videoError = videoRef.current?.error;
          console.error('[BackgroundMedia] Video loading error:', {
            error: e,
            src: mediaUrl,
            videoElement: videoRef.current,
            readyState: videoRef.current?.readyState,
            networkState: videoRef.current?.networkState,
            errorCode: videoError?.code,
            errorMessage: videoError?.message
          });
          
          // Nur bei temporären Fehlern wiederholen
          if (videoError?.code === MediaError.MEDIA_ERR_NETWORK) {
            setIsVideoLoading(true);
            setTimeout(() => {
              if (videoRef.current && mediaUrl) {
                console.log('[BackgroundMedia] Retrying video load...');
                videoRef.current.load();
                videoRef.current.play().catch(err => {
                  console.error('[BackgroundMedia] Retry failed:', err);
                  setIsVideoLoading(false);
                  setVideoLoadFailed(true);
                });
              }
            }, 2000);
          } else {
            // Bei anderen Fehlern Fallback anzeigen
            setIsVideoLoading(false);
            setVideoLoadFailed(true);
          }
        }}
      />
    );
  }

  // For images, we rely on CSS background-image
  return null;
};
