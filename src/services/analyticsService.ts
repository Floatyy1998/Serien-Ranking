/**
 * analyticsService - Lightweight analytics via Firebase RTDB.
 *
 * Tracks only essential events:
 * - page_view (wann wer auf der Seite war)
 * - login / logout / sign_up
 * - series_added / series_deleted / movie_added / movie_deleted
 * - episode_watched / episode_unwatched
 * - rating_saved / rating_deleted
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

// ─── Types ───────────────────────────────────────────────────────────────

/** Alle erlaubten Analytics-Event-Namen als typisierte Union */
type AllowedAnalyticsEvent =
  | 'page_view'
  | 'login'
  | 'logout'
  | 'sign_up'
  | 'series_added'
  | 'series_deleted'
  | 'movie_added'
  | 'movie_deleted'
  | 'episode_watched'
  | 'episode_unwatched'
  | 'rating_saved'
  | 'rating_deleted';

interface AnalyticsEvent {
  e: AllowedAnalyticsEvent;
  p?: Record<string, unknown>;
  t: number;
}

// ─── Whitelist: only these events are stored ─────────────────────────────

const ALLOWED_EVENTS = new Set<AllowedAnalyticsEvent>([
  'page_view',
  'login',
  'logout',
  'sign_up',
  'series_added',
  'series_deleted',
  'movie_added',
  'movie_deleted',
  'episode_watched',
  'episode_unwatched',
  'rating_saved',
  'rating_deleted',
]);

// ─── Constants ───────────────────────────────────────────────────────────

const FLUSH_INTERVAL_MS = 30_000;
const MAX_BUFFER_SIZE = 50;
const CONSENT_KEY = 'analytics-consent';
const HEARTBEAT_INTERVAL_MS = 5 * 60_000;

// Globale Tages-Zähler werden pro UID auf 16 Shards verteilt — RTDB serialisiert
// Writes pro Pfad, ein einzelner increment-Pfad wird bei vielen Nutzern zum Hotspot.
export const ANALYTICS_SHARD_COUNT = 16;

export function analyticsShardOf(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h + uid.charCodeAt(i)) % ANALYTICS_SHARD_COUNT;
  return h;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function batchId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Service ─────────────────────────────────────────────────────────────

class AnalyticsService {
  private buffer: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private userId: string | null = null;
  private enabled = false;
  private flushing = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private sessionSince: number | null = null;
  private lifecycleListenersAttached = false;
  private visibilityHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;

  init(): void {
    this.enabled = localStorage.getItem(CONSENT_KEY) === 'true';
    if (!this.enabled) return;
    this.startFlushTimer();
    this.setupLifecycleListeners();
  }

  setUser(uid: string | null): void {
    if (this.userId && uid !== this.userId && this.buffer.length > 0) {
      this.flush();
    }
    this.userId = uid;
    // Meta/Praesenz nur mit Einwilligung — die DSE verspricht "ausschliesslich nach Einwilligung"
    if (uid && this.enabled) {
      this.updateMeta();
      this.updateRealtimePresence(true);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem(CONSENT_KEY, String(enabled));
    if (enabled) {
      this.startFlushTimer();
      this.setupLifecycleListeners();
      if (this.userId) {
        this.updateMeta();
        this.updateRealtimePresence(true);
      }
    } else {
      this.stopFlushTimer();
      this.teardownLifecycleListeners();
      this.updateRealtimePresence(false);
      this.buffer = [];
    }
  }

  getConsent(): boolean | null {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === null) return null;
    return v === 'true';
  }

  /**
   * Nimmt einen beliebigen string entgegen (Aufruf-Kompatibilität),
   * prüft gegen die typisierte Whitelist und speichert nur erlaubte Events.
   */
  track(eventName: string, params?: Record<string, unknown>): void {
    if (!this.enabled || !ALLOWED_EVENTS.has(eventName as AllowedAnalyticsEvent)) return;

    this.buffer.push({
      e: eventName as AllowedAnalyticsEvent,
      p: params && Object.keys(params).length > 0 ? params : undefined,
      t: Date.now(),
    });

    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0 || !this.userId || !this.enabled) return;
    this.flushing = true;

    const batch = [...this.buffer];
    this.buffer = [];
    const dateKey = todayKey();
    const id = batchId();

    try {
      const db = firebase.database();
      const uid = this.userId;
      const updates: Record<string, unknown> = {};

      // Raw event batch
      updates[`analytics/users/${uid}/events/${dateKey}/${id}`] = {
        ts: firebase.database.ServerValue.TIMESTAMP,
        events: batch,
      };

      // Per-user daily counters
      for (const ev of batch) {
        updates[`analytics/users/${uid}/daily/${dateKey}/events/${ev.e}`] =
          firebase.database.ServerValue.increment(1);
        if (ev.e === 'page_view' && ev.p?.page) {
          updates[`analytics/users/${uid}/daily/${dateKey}/pageViews/${ev.p.page as string}`] =
            firebase.database.ServerValue.increment(1);
        }
      }
      updates[`analytics/users/${uid}/daily/${dateKey}/lastSeen`] =
        firebase.database.ServerValue.TIMESTAMP;

      // Global daily counters (geshardet, Admin-Dashboard summiert die Shards)
      const shard = analyticsShardOf(uid);
      updates[`analytics/global/daily/${dateKey}/shards/${shard}/totalEvents`] =
        firebase.database.ServerValue.increment(batch.length);
      for (const ev of batch) {
        updates[`analytics/global/daily/${dateKey}/shards/${shard}/events/${ev.e}`] =
          firebase.database.ServerValue.increment(1);
        if (ev.e === 'page_view' && ev.p?.page) {
          updates[
            `analytics/global/daily/${dateKey}/shards/${shard}/pageViews/${ev.p.page as string}`
          ] = firebase.database.ServerValue.increment(1);
        }
      }

      await db.ref().update(updates);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Analytics] Flush failed: ${message}`);
      this.buffer.unshift(...batch);
    } finally {
      this.flushing = false;
    }
  }

  /** Mark this user as active today in global DAU/MAU */
  private async updateMeta(): Promise<void> {
    if (!this.userId || !this.enabled) return;
    const db = firebase.database();
    const dateKey = todayKey();
    const mKey = monthKey();

    try {
      await db.ref().update({
        [`analytics/users/${this.userId}/meta/lastSeen`]: firebase.database.ServerValue.TIMESTAMP,
        [`analytics/global/daily/${dateKey}/activeUsers/${this.userId}`]:
          firebase.database.ServerValue.TIMESTAMP,
        [`analytics/global/monthly/${mKey}/activeUsers/${this.userId}`]:
          firebase.database.ServerValue.TIMESTAMP,
      });

      const firstSeenRef = db.ref(`analytics/users/${this.userId}/meta/firstSeen`);
      const snap = await firstSeenRef.once('value');
      if (!snap.exists()) {
        await firstSeenRef.set(firebase.database.ServerValue.TIMESTAMP);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Analytics] Meta update failed: ${message}`);
    }
  }

  /**
   * Real-time presence als Heartbeat: kein onDisconnect-Handler pro Nutzer
   * (skaliert serverseitig nicht), stattdessen ts-Stempel alle 5 Min —
   * Leser filtern auf Aktualität, ein Backend-Cron räumt veraltete Einträge ab.
   */
  private async updateRealtimePresence(online: boolean): Promise<void> {
    if (!this.userId) return;
    if (online && !this.enabled) return;
    try {
      const ref = firebase.database().ref(`analytics/global/realtime/activeUsers/${this.userId}`);
      if (online) {
        if (!this.sessionSince) this.sessionSince = Date.now();
        await ref.set({
          since: this.sessionSince,
          ts: firebase.database.ServerValue.TIMESTAMP,
          page: window.location.pathname,
        });
        this.startHeartbeat();
      } else {
        this.stopHeartbeat();
        this.sessionSince = null;
        await ref.remove();
      }
    } catch {
      // Non-critical
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.userId) return;
      firebase
        .database()
        .ref(`analytics/global/realtime/activeUsers/${this.userId}`)
        .update({
          ts: firebase.database.ServerValue.TIMESTAMP,
          page: window.location.pathname,
        })
        .catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /** Update the page in realtime presence */
  updateCurrentPage(page: string): void {
    if (!this.userId || !this.enabled) return;
    firebase
      .database()
      .ref(`analytics/global/realtime/activeUsers/${this.userId}/page`)
      .set(page)
      .catch(() => {}); // bewusst still: Analytics-Presence ist unkritisch
  }

  private startFlushTimer(): void {
    this.stopFlushTimer();
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private setupLifecycleListeners(): void {
    if (this.lifecycleListenersAttached) return;
    this.lifecycleListenersAttached = true;

    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
        this.updateRealtimePresence(false);
      } else if (document.visibilityState === 'visible') {
        this.updateRealtimePresence(true);
      }
    };
    this.beforeUnloadHandler = () => {
      this.flushSync();
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  private teardownLifecycleListeners(): void {
    if (!this.lifecycleListenersAttached) return;
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    this.lifecycleListenersAttached = false;
  }

  private flushSync(): void {
    if (this.buffer.length === 0 || !this.userId || !this.enabled) return;

    const batch = [...this.buffer];
    this.buffer = [];
    const dateKey = todayKey();
    const id = batchId();

    const url = `${(firebase.app().options as Record<string, unknown>).databaseURL}/analytics/users/${this.userId}/events/${dateKey}/${id}.json`;
    const payload = JSON.stringify({ ts: Date.now(), events: batch });
    navigator.sendBeacon(url, payload);
  }

  destroy(): void {
    this.flush();
    this.stopFlushTimer();
    this.teardownLifecycleListeners();
    this.updateRealtimePresence(false);
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────

export const analyticsService = new AnalyticsService();
