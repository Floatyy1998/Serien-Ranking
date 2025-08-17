import { useEffect, useState } from 'react';

export function UpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Prüfe ob es ein verfügbares Update gibt
    const checkForUpdate = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          setHasUpdate(true);
          setShowNotification(true);
        }
      }
    };

    // Initial check
    checkForUpdate();

    // Lausche auf Service Worker Events
    const handleUpdateAvailable = (_event: CustomEvent) => {
      // Zeige Update-Notification nur wenn noch nicht gezeigt
      if (!hasUpdate) {
        setHasUpdate(true);
        setShowNotification(true);
      }
    };

    window.addEventListener(
      'sw-update-available',
      handleUpdateAvailable as EventListener
    );

    return () => {
      window.removeEventListener(
        'sw-update-available',
        handleUpdateAvailable as EventListener
      );
    };
  }, [hasUpdate]);

  const handleUpdate = async () => {
    setShowNotification(false);
    setHasUpdate(false);
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          // Aktiviere den wartenden Service Worker
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Der controllerchange Event wird automatisch einen Reload auslösen
          // (siehe setupEventListeners in serviceWorkerManager)
        }
      }
    } catch (error) {
      console.error('Update fehlgeschlagen:', error);
      // Bei Fehler manueller Reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification || !hasUpdate) return null;

  return (
    <div
      className='fixed bottom-4 right-4 bg-primary text-black px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-up max-w-md'
      style={{
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <span className="flex-1">Ein Update ist verfügbar!</span>
      <div className="flex gap-2">
        <button
          onClick={handleUpdate}
          className='bg-black text-primary px-3 py-1 rounded hover:bg-gray-900 transition-colors whitespace-nowrap'
        >
          Aktualisieren
        </button>
        <button
          onClick={handleDismiss}
          className='text-black hover:text-gray-700 transition-colors'
          aria-label="Später"
          title="Später aktualisieren"
        >
          Später
        </button>
      </div>
    </div>
  );
}
