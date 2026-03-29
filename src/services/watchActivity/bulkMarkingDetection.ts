/**
 * Bulk-Marking Detection
 *
 * Erkennt wenn ein Nutzer viele Episoden auf einmal als gesehen markiert
 * und verteilt die Timestamps realistisch über die letzten Tage.
 */

// Bulk-Marking Detection Konstanten
const BULK_MARK_WINDOW_MS = 60000; // 60 Sekunden Zeitfenster
const BULK_MARK_THRESHOLD = 3; // Ab 3 Episoden gilt als Bulk-Marking
const EVENING_HOURS = [18, 19, 20, 21, 22, 23]; // Typische Abendstunden

// Tracker für Bulk-Marking-Erkennung
interface BulkMarkTracker {
  timestamps: number[];
  episodeCount: number;
  lastReset: number;
}

const bulkMarkTracker: BulkMarkTracker = {
  timestamps: [],
  episodeCount: 0,
  lastReset: Date.now(),
};

/**
 * Prüft ob aktuell Bulk-Marking stattfindet und gibt verteilten Timestamp zurück
 */
export function checkBulkMarkingAndGetTimestamp(): {
  isBulkMarking: boolean;
  distributedDate?: Date;
} {
  const now = Date.now();

  // Reset tracker wenn letzter Eintrag zu lange her
  if (bulkMarkTracker.timestamps.length > 0) {
    const oldestInWindow = bulkMarkTracker.timestamps.filter((t) => now - t < BULK_MARK_WINDOW_MS);
    bulkMarkTracker.timestamps = oldestInWindow;
  }

  // Aktuellen Timestamp hinzufügen
  bulkMarkTracker.timestamps.push(now);
  bulkMarkTracker.episodeCount++;

  // Prüfen ob Bulk-Marking erkannt wurde
  const recentCount = bulkMarkTracker.timestamps.length;

  if (recentCount >= BULK_MARK_THRESHOLD) {
    // Bulk-Marking erkannt! Timestamp verteilen
    const positionInBulk = recentCount - 1; // 0-indexed

    // Verteile über die letzten Tage (max 7)
    const daysBack = Math.floor(positionInBulk / EVENING_HOURS.length);
    const hourIndex = positionInBulk % EVENING_HOURS.length;

    const distributedDate = new Date();
    distributedDate.setDate(distributedDate.getDate() - Math.min(daysBack, 7));
    distributedDate.setHours(EVENING_HOURS[hourIndex]);
    distributedDate.setMinutes(Math.floor(Math.random() * 45) + 5); // 5-50 Minuten
    distributedDate.setSeconds(Math.floor(Math.random() * 60));

    return { isBulkMarking: true, distributedDate };
  }

  return { isBulkMarking: false };
}
