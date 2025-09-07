import firebase from 'firebase/compat/app';
import { useCallback, useRef } from 'react';

interface BatchUpdate {
  path: string;
  value: any;
  timestamp: number;
}

interface BatchConfig {
  batchSize?: number; // Maximale Anzahl Updates pro Batch
  delayMs?: number; // Verzögerung bevor Batch ausgeführt wird
  maxDelayMs?: number; // Maximale Verzögerung bevor Force-Update
}

/**
 * 🚀 Firebase Batch Update Hook
 * Sammelt mehrere Updates und sendet sie als Batch an Firebase
 * Reduziert die Anzahl der Write-Operationen erheblich
 */
export function useFirebaseBatch(config: BatchConfig = {}) {
  const { batchSize = 10, delayMs = 1000, maxDelayMs = 5000 } = config;

  const batchRef = useRef<BatchUpdate[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firstUpdateRef = useRef<number | null>(null);

  const executeBatch = useCallback(async () => {
    if (batchRef.current.length === 0) return;

    try {
      const updates: Record<string, any> = {};

      // Sammle alle Updates in ein großes Update-Object
      batchRef.current.forEach(({ path, value }) => {
        updates[path] = value;
      });

      // Führe Batch-Update aus
      await firebase.database().ref().update(updates);

      // Cleanup
      batchRef.current = [];
      firstUpdateRef.current = null;
    } catch (error) {
      // // console.error('❌ Batch update failed:', error);
      // Bei Fehler: Versuche einzelne Updates
      for (const { path, value } of batchRef.current) {
        try {
          await firebase.database().ref(path).set(value);
        } catch (singleError) {
          // // console.error(`❌ Single update failed for ${path}:`, singleError);
        }
      }
      batchRef.current = [];
      firstUpdateRef.current = null;
    }
  }, []);

  const addUpdate = useCallback(
    (path: string, value: any) => {
      const now = Date.now();

      // Entferne vorherigen Update für denselben Pfad
      batchRef.current = batchRef.current.filter(
        (update) => update.path !== path
      );

      // Füge neuen Update hinzu
      batchRef.current.push({
        path,
        value,
        timestamp: now,
      });

      // Setze ersten Update-Zeitstempel
      if (!firstUpdateRef.current) {
        firstUpdateRef.current = now;
      }

      // Entferne vorherigen Timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Führe Batch aus wenn Limit erreicht oder max Delay überschritten
      const timeSinceFirst = now - (firstUpdateRef.current || now);

      if (
        batchRef.current.length >= batchSize ||
        timeSinceFirst >= maxDelayMs
      ) {
        executeBatch();
      } else {
        // Setze neuen Timer
        timeoutRef.current = setTimeout(executeBatch, delayMs);
      }
    },
    [batchSize, delayMs, maxDelayMs, executeBatch]
  );

  const flushBatch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    executeBatch();
  }, [executeBatch]);

  return {
    addUpdate,
    flushBatch,
    pendingCount: batchRef.current.length,
  };
}
