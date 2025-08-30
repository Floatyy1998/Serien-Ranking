// Frühes Preloading von Hintergrundvideos
export const preloadBackgroundVideo = () => {
  try {
    const savedTheme = localStorage.getItem('customTheme');
    if (!savedTheme) return;
    
    const theme = JSON.parse(savedTheme);
    if (!theme.backgroundImage || !theme.backgroundIsVideo) return;
    
    // Erstelle Preload-Link für Video
    const link = document.createElement('link');
    link.rel = 'prefetch';  // Verwende prefetch statt preload
    link.href = theme.backgroundImage;
    link.setAttribute('data-background-preload', 'true');
    
    // Prüfe ob bereits ein Preload-Link existiert
    const existingLink = document.querySelector('[data-background-preload="true"]');
    if (existingLink) {
      existingLink.remove();
    }
    
    document.head.appendChild(link);
    
    // Erstelle verstecktes Video-Element zum aggressiven Vorladen
    const video = document.createElement('video');
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.preload = 'auto'; // Aggressiveres Preloading
    video.src = theme.backgroundImage;
    video.muted = true;
    video.autoplay = false;
    
    // Starte das Laden sofort
    video.load();
    
    // Behalte Video länger für besseres Caching
    video.addEventListener('canplaythrough', () => {
      // console.log('[Preload] Video fully preloaded:', theme.backgroundImage);
      // Behalte Video für 5 Sekunden im DOM für Cache
      setTimeout(() => {
        video.remove();
      }, 5000);
    });
    
    // Fehlerbehandlung
    video.addEventListener('error', () => {
      // console.warn('[Preload] Failed to preload video:', theme.backgroundImage);
      video.remove();
    });
    
    document.body.appendChild(video);
    
  } catch (error) {
    // console.error('[Preload] Error preloading background video:', error);
  }
};

// Führe Preloading so früh wie möglich aus
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', preloadBackgroundVideo);
} else {
  preloadBackgroundVideo();
}