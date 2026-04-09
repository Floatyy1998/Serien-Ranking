/**
 * Shared utilities für Watch Activity Module
 *
 * Pfad-Funktionen, Event-Helfer und gemeinsame Konstanten.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { ActivityEvent } from '../../types/WatchActivity';
import { checkBulkMarkingAndGetTimestamp } from './bulkMarkingDetection';

// ============================================================================
// KONSTANTEN
// ============================================================================

const WRAPPED_BASE = 'wrapped';
const LAST_CLEANUP_KEY = 'wrapped_last_cleanup_year';

// ============================================================================
// PFAD-FUNKTIONEN
// ============================================================================

export function getEventsPath(userId: string, year: number): string {
  return `users/${userId}/${WRAPPED_BASE}/${year}/events`;
}

export function getBingeSessionsPath(userId: string, year: number): string {
  return `users/${userId}/${WRAPPED_BASE}/${year}/bingeSessions`;
}

export function getStreakPath(userId: string, year: number): string {
  return `users/${userId}/${WRAPPED_BASE}/${year}/streak`;
}

export function getWrappedBasePath(userId: string): string {
  return `users/${userId}/${WRAPPED_BASE}`;
}

// ============================================================================
// HILFSFUNKTIONEN
// ============================================================================

export function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function generateEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Erstellt Basis-Metadaten für jedes Event
 */
export function createBaseEventData(): {
  timestamp: string;
  month: number;
  dayOfWeek: number;
  hour: number;
  deviceType: 'mobile' | 'desktop' | 'tablet';
} {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    month: now.getMonth() + 1,
    dayOfWeek: now.getDay(),
    hour: now.getHours(),
    deviceType: detectDeviceType(),
  };
}

/**
 * Erstellt Basis-Metadaten für Episode-Events mit Bulk-Marking-Erkennung
 * Gibt auch zurück ob Bulk-Marking erkannt wurde (für Binge-Skipping)
 */
export function createEpisodeEventData(): {
  eventData: ReturnType<typeof createBaseEventData>;
  isBulkMarking: boolean;
} {
  const { isBulkMarking, distributedDate } = checkBulkMarkingAndGetTimestamp();

  // Bei Bulk-Marking verwende verteilten Timestamp
  const dateToUse = isBulkMarking && distributedDate ? distributedDate : new Date();

  return {
    eventData: {
      timestamp: dateToUse.toISOString(),
      month: dateToUse.getMonth() + 1,
      dayOfWeek: dateToUse.getDay(),
      hour: dateToUse.getHours(),
      deviceType: detectDeviceType(),
    },
    isBulkMarking,
  };
}

/**
 * Entfernt undefined und null Werte aus einem Objekt
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
}

// ============================================================================
// CLEANUP FUNKTION (DEAKTIVIERT - Daten werden für Journey behalten)
// ============================================================================

export async function cleanupOldYearData(_userId: string): Promise<void> {
  // DEAKTIVIERT: Wir behalten alle historischen Daten für die Watch Journey
  // Die Daten werden jetzt jahresübergreifend für Trend-Analysen genutzt
  return;
}

// ============================================================================
// EVENT SPEICHERN
// ============================================================================

export async function saveEvent(userId: string, event: ActivityEvent): Promise<boolean> {
  const eventId = generateEventId();
  const year = new Date(event.timestamp).getFullYear();
  const eventPath = `${getEventsPath(userId, year)}/${eventId}`;

  try {
    await cleanupOldYearData(userId);

    const cleanEvent = cleanObject(event as unknown as Record<string, unknown>);

    await firebase.database().ref(eventPath).set(cleanEvent);

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to save event: ${message}`);
    return false;
  }
}

// ============================================================================
// CLEANUP/ADMIN
// ============================================================================

export async function clearAllWrappedData(userId: string): Promise<void> {
  try {
    await firebase.database().ref(getWrappedBasePath(userId)).remove();
    localStorage.removeItem(LAST_CLEANUP_KEY);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to clear wrapped data: ${message}`);
    throw error;
  }
}

// ============================================================================
// DATA RETRIEVAL
// ============================================================================

export async function getYearlyActivity(userId: string, year: number): Promise<ActivityEvent[]> {
  const eventsPath = getEventsPath(userId, year);
  try {
    const snapshot = await firebase.database().ref(eventsPath).once('value');

    const data = snapshot.val() as Record<string, ActivityEvent> | null;

    if (data) {
      return Object.values(data);
    }

    return [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to load events: ${message}`);
    return [];
  }
}

export async function getEventsForYear(userId: string, year: number): Promise<ActivityEvent[]> {
  return getYearlyActivity(userId, year);
}
