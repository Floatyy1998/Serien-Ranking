// Video-Optimierung für schnelleres Laden

interface VideoOptimizationResult {
  shouldLoadVideo: boolean;
  reason?: string;
  estimatedLoadTime?: number;
}

/**
 * Prüft Netzwerkgeschwindigkeit und entscheidet ob Video geladen werden soll
 */
export async function checkVideoLoadingViability(videoUrl: string): Promise<VideoOptimizationResult> {
  try {
    // Check Network Information API falls verfügbar
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink; // Mbps
      
      console.log('[VideoOptimizer] Network info:', { effectiveType, downlink });
      
      // Bei langsamen Verbindungen Video nicht laden
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return {
          shouldLoadVideo: false,
          reason: 'Verbindung zu langsam (2G)',
        };
      }
      
      // Bei 3G nur mit Warnung
      if (effectiveType === '3g') {
        console.warn('[VideoOptimizer] 3G connection detected - video may load slowly');
      }
    }
    
    // Teste Ladegeschwindigkeit - HEAD funktioniert nicht wegen CORS
    // Stattdessen: Lade einen kleinen Teil des Videos mit Range Request
    const startTime = performance.now();
    
    try {
      // Erstelle ein verstecktes Video-Element um die Größe zu checken
      const testVideo = document.createElement('video');
      testVideo.style.position = 'fixed';
      testVideo.style.top = '-9999px';
      testVideo.preload = 'metadata';
      testVideo.muted = true;
      testVideo.src = videoUrl;
      
      const metadataPromise = new Promise<number>((resolve) => {
        let resolved = false;
        
        const cleanup = () => {
          if (testVideo.parentNode) {
            testVideo.remove();
          }
        };
        
        testVideo.addEventListener('loadedmetadata', () => {
          if (resolved) return;
          resolved = true;
          
          const loadTime = performance.now() - startTime;
          console.log(`[VideoOptimizer] Metadata loaded in ${loadTime.toFixed(0)}ms`);
          
          // Schätze Videogröße basierend auf Duration und Bitrate
          const duration = testVideo.duration;
          if (duration) {
            // Geschätzte Größe (sehr grobe Schätzung)
            const estimatedMB = duration * 0.5; // ~0.5 MB pro Sekunde für komprimiertes Video
            console.log(`[VideoOptimizer] Estimated size: ~${estimatedMB.toFixed(1)} MB (${duration.toFixed(0)}s video)`);
            
            if (estimatedMB > 50) {
              console.warn(`[VideoOptimizer] Large video detected: ~${estimatedMB.toFixed(1)} MB`);
            }
          }
          
          resolve(loadTime);
          cleanup();
        });
        
        testVideo.addEventListener('error', (e) => {
          if (resolved) return;
          resolved = true;
          console.warn('[VideoOptimizer] Video test failed:', e);
          resolve(999999);
          cleanup();
        });
        
        // Timeout nach 3 Sekunden
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.warn('[VideoOptimizer] Video test timeout');
            resolve(3000);
            cleanup();
          }
        }, 3000);
      });
      
      document.body.appendChild(testVideo);
      const loadTime = await metadataPromise;
      
      // Wenn Metadata > 2 Sekunden dauert, ist die Verbindung zu langsam
      if (loadTime > 2000) {
        return {
          shouldLoadVideo: false,
          reason: 'Metadaten-Ladezeit zu hoch',
          estimatedLoadTime: loadTime * 10 // Grobe Schätzung
        };
      }
    } catch (error) {
      console.warn('[VideoOptimizer] Could not check video metadata:', error);
    }
    
    return {
      shouldLoadVideo: true,
      estimatedLoadTime: 3000 // Optimistisch
    };
    
  } catch (error) {
    console.error('[VideoOptimizer] Error checking video viability:', error);
    return {
      shouldLoadVideo: true, // Im Zweifel versuchen
    };
  }
}

/**
 * Erstellt ein optimiertes Video-Element mit progressive loading
 */
export function createOptimizedVideoElement(videoUrl: string): HTMLVideoElement {
  const video = document.createElement('video');
  
  // Optimale Video-Einstellungen für schnelles Laden
  video.preload = 'metadata'; // Nur Metadaten initial laden
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.autoplay = true;
  
  // Setze niedrige Qualität für schnelleres initiales Laden
  video.setAttribute('playsinline', '');
  
  // Wichtig: Erst src setzen NACHDEM alle Attribute gesetzt sind
  video.src = videoUrl;
  
  // Optimierung: Pausiere Video wenn nicht sichtbar (spart Bandbreite)
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.1 }
    );
    
    // Beobachte sobald Video im DOM ist
    video.addEventListener('loadedmetadata', () => {
      observer.observe(video);
    });
  }
  
  return video;
}

/**
 * Lädt Video-Thumbnail als Placeholder
 */
export async function getVideoThumbnail(videoUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    // Kein crossOrigin wegen CORS-Problemen mit Firebase
    video.muted = true;
    
    video.addEventListener('loadeddata', () => {
      video.currentTime = 1; // Gehe zu Sekunde 1 für besseres Thumbnail
    });
    
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Konvertiere zu Blob URL für schnelles Laden
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              resolve(null);
            }
            video.remove();
          }, 'image/jpeg', 0.7);
        } else {
          resolve(null);
          video.remove();
        }
      } catch (error) {
        console.error('[VideoOptimizer] Error creating thumbnail:', error);
        resolve(null);
        video.remove();
      }
    });
    
    video.addEventListener('error', () => {
      resolve(null);
      video.remove();
    });
    
    // Timeout nach 5 Sekunden
    setTimeout(() => {
      resolve(null);
      video.remove();
    }, 5000);
  });
}