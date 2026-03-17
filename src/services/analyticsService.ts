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

interface AnalyticsEvent {
  e: string;
  p?: Record<string, unknown>;
  t: number;
}

// ─── Whitelist: only these events are stored ─────────────────────────────

const ALLOWED_EVENTS = new Set([
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

  init() {
    this.enabled = localStorage.getItem(CONSENT_KEY) === 'true';
    if (!this.enabled) return;
    this.startFlushTimer();
    this.setupLifecycleListeners();
  }

  setUser(uid: string | null) {
    if (this.userId && uid !== this.userId && this.buffer.length > 0) {
      this.flush();
    }
    this.userId = uid;
    if (uid) {
      this.updateMeta();
      this.updateRealtimePresence(true);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem(CONSENT_KEY, String(enabled));
    if (enabled) {
      this.startFlushTimer();
      this.setupLifecycleListeners();
    } else {
      this.stopFlushTimer();
      this.buffer = [];
    }
  }

  getConsent(): boolean | null {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === null) return null;
    return v === 'true';
  }

  track(eventName: string, params?: Record<string, unknown>) {
    if (!this.enabled || !ALLOWED_EVENTS.has(eventName)) return;

    this.buffer.push({
      e: eventName,
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

      // Global daily counters
      updates[`analytics/global/daily/${dateKey}/totalEvents`] =
        firebase.database.ServerValue.increment(batch.length);
      for (const ev of batch) {
        updates[`analytics/global/daily/${dateKey}/events/${ev.e}`] =
          firebase.database.ServerValue.increment(1);
        if (ev.e === 'page_view' && ev.p?.page) {
          updates[`analytics/global/daily/${dateKey}/pageViews/${ev.p.page as string}`] =
            firebase.database.ServerValue.increment(1);
        }
      }

      await db.ref().update(updates);
    } catch (err) {
      console.error('[Analytics] Flush failed:', err);
      this.buffer.unshift(...batch);
    } finally {
      this.flushing = false;
    }
  }

  /** Mark this user as active today in global DAU/MAU */
  private async updateMeta() {
    if (!this.userId) return;
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
      console.error('[Analytics] Meta update failed:', err);
    }
  }

  /** Real-time presence tracking */
  private async updateRealtimePresence(online: boolean) {
    if (!this.userId) return;
    try {
      const ref = firebase.database().ref(`analytics/global/realtime/activeUsers/${this.userId}`);
      if (online) {
        await ref.set({
          since: firebase.database.ServerValue.TIMESTAMP,
          page: window.location.pathname,
        });
        ref.onDisconnect().remove();
      } else {
        await ref.remove();
      }
    } catch {
      // Non-critical
    }
  }

  /** Update the page in realtime presence */
  updateCurrentPage(page: string) {
    if (!this.userId || !this.enabled) return;
    firebase
      .database()
      .ref(`analytics/global/realtime/activeUsers/${this.userId}/page`)
      .set(page)
      .catch(() => {});
  }

  private startFlushTimer() {
    this.stopFlushTimer();
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  private stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private setupLifecycleListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
        this.updateRealtimePresence(false);
      } else if (document.visibilityState === 'visible') {
        this.updateRealtimePresence(true);
      }
    });

    window.addEventListener('beforeunload', () => {
      this.flushSync();
    });
  }

  private flushSync() {
    if (this.buffer.length === 0 || !this.userId || !this.enabled) return;

    const batch = [...this.buffer];
    this.buffer = [];
    const dateKey = todayKey();
    const id = batchId();

    const url = `${(firebase.app().options as Record<string, unknown>).databaseURL}/analytics/users/${this.userId}/events/${dateKey}/${id}.json`;
    const payload = JSON.stringify({ ts: Date.now(), events: batch });
    navigator.sendBeacon(url, payload);
  }

  destroy() {
    this.flush();
    this.stopFlushTimer();
    this.updateRealtimePresence(false);
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────

export const analyticsService = new AnalyticsService();
