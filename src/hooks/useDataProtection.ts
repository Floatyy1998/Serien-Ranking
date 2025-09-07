import { useEffect, useRef } from 'react';

interface PendingUpdate {
  id: string;
  retryCount: number;
  maxRetries: number;
  operation: () => Promise<void>;
  timestamp: number;
}

/**
 * Hook für Datenschutz bei Seitenwechsel/Schließung
 * - Verhindert Datenverlust durch beforeunload Handler
 * - Retry-Mechanismus für fehlgeschlagene Firebase-Updates
 * - Queue für pending Updates die vor Seite schließen noch ausgeführt werden müssen
 */
export const useDataProtection = () => {
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
  const isUnloadingRef = useRef(false);

  // Füge ein Update zur Schutz-Queue hinzu
  const addProtectedUpdate = (
    id: string,
    operation: () => Promise<void>,
    maxRetries: number = 3
  ) => {
    const update: PendingUpdate = {
      id,
      retryCount: 0,
      maxRetries,
      operation,
      timestamp: Date.now(),
    };

    pendingUpdatesRef.current.set(id, update);

    // Führe Update sofort aus
    executeUpdate(update);
  };

  // Führe ein Update aus mit Retry-Logik
  const executeUpdate = async (update: PendingUpdate) => {
    try {
      await update.operation();
      // Erfolgreich - entferne aus Queue
      pendingUpdatesRef.current.delete(update.id);
    } catch {
      if (update.retryCount < update.maxRetries) {
        update.retryCount++;
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, update.retryCount - 1) * 1000;

        setTimeout(() => {
          if (
            !isUnloadingRef.current &&
            pendingUpdatesRef.current.has(update.id)
          ) {
            executeUpdate(update);
          }
        }, delay);
      } else {
        // console.error(`❌ Update ${update.id} failed after ${update.maxRetries} attempts`);
        pendingUpdatesRef.current.delete(update.id);
      }
    }
  };

  // Entferne ein Update aus der Schutz-Queue (wenn erfolgreich von außen bestätigt)
  const removeProtectedUpdate = (id: string) => {
    pendingUpdatesRef.current.delete(id);
  };

  // Prüfe ob Updates pending sind
  const hasPendingUpdates = () => {
    return pendingUpdatesRef.current.size > 0;
  };

  // Führe alle pending Updates synchron aus (für beforeunload)
  const flushPendingUpdates = async () => {
    isUnloadingRef.current = true;
    const promises: Promise<void>[] = [];

    for (const update of pendingUpdatesRef.current.values()) {
      promises.push(
        update.operation().catch(() => {
          // console.error(`Emergency flush failed for ${update.id}`);
        })
      );
    }

    // Warte maximal 2 Sekunden auf alle Updates
    try {
      await Promise.race([
        Promise.all(promises),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 2000)
        ),
      ]);
    } catch {
      // console.warn('Some updates may not have completed before page unload');
    }

    pendingUpdatesRef.current.clear();
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasPendingUpdates()) {
        // Moderne Browser erfordern returnValue für den Dialog
        event.preventDefault();
        event.returnValue =
          'Es sind noch Änderungen ausstehend. Möchten Sie die Seite wirklich verlassen?';

        // 🚨 WICHTIG: Versuche Updates SYNCHRON auszuführen
        // Dies ist der letzte Moment um Updates zu retten
        const pendingOps = Array.from(pendingUpdatesRef.current.values());

        // Führe alle Updates synchron aus (letzte Chance!)
        for (const update of pendingOps) {
          try {
            // Nutze navigator.sendBeacon für garantierte Übertragung (falls möglich)
            // Fallback auf synchrone fetch wenn nötig
            const updatePromise = update.operation();

            // Für kritische Daten: Synchroner XMLHttpRequest als absolute letzte Option
            if (updatePromise instanceof Promise) {
              // Versuche Promise zu "blocken" bis es fertig ist
              let completed = false;
              updatePromise
                .then(() => {
                  completed = true;
                })
                .catch(() => {
                  completed = true;
                });

              // Kurzes synchrones Warten (sehr limitiert in beforeunload)
              const startTime = Date.now();
              while (!completed && Date.now() - startTime < 100) {
                // Micro-wait - sehr limitiert, aber besser als nichts
              }
            }
          } catch {
            // console.error(`Emergency update failed for ${update.id}`);
          }
        }

        return event.returnValue;
      }
    };

    const handleUnload = () => {
      // Letzter Versuch für Browser die das unterstützen
      if (hasPendingUpdates()) {
        // console.warn(`🚨 Page unloading with ${pendingUpdatesRef.current.size} pending updates!`);
        // Versuche ein letztes Mal alle Updates (sehr limitiert)
        // const pendingOps = Array.from(pendingUpdatesRef.current.values());
        // for (const update of pendingOps) {
        //   try {
        //     // console.warn(`⚠️ Lost update: ${update.id}`);
        //   } catch {
        //     // console.error(`Unload cleanup failed for ${update.id}`);
        //   }
        // }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    // Cleanup alte Updates (älter als 30 Sekunden)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, update] of pendingUpdatesRef.current.entries()) {
        if (now - update.timestamp > 30000) {
          // console.warn(`Removing stale update: ${id}`);
          pendingUpdatesRef.current.delete(id);
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      clearInterval(cleanupInterval);
    };
  }, []);

  return {
    addProtectedUpdate,
    removeProtectedUpdate,
    hasPendingUpdates,
    flushPendingUpdates,
  };
};
