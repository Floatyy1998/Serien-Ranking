/**
 * 🧹 Minimal Activity Logger v1.0
 *
 * NUR NOCH 4 Friend-Activities:
 * - Serie hinzugefügt
 * - Film hinzugefügt
 * - Serie zu Watchlist hinzugefügt
 * - Bewertung abgegeben
 *
 * Badge-System arbeitet komplett offline aus echten Daten.
 * Episode-Watching wird NICHT mehr geloggt.
 */

import firebase from 'firebase/compat/app';
import { badgeCounterService } from './badgeCounterService';
import type { EarnedBadge } from './badgeDefinitions';
import { getOfflineBadgeSystem } from './offlineBadgeSystem';
interface FriendActivityData {
  type: string;
  itemTitle: string;
  tmdbId: number;
  itemType: 'series' | 'movie';
  posterPath?: string;
  rating?: number;
}

interface BatchEpisodeEntry {
  isRewatch?: boolean;
  airDate?: string;
}

// Badge-Callback System (ersetzt activityBatchManager)
const badgeCallbacks = new Map<string, (badges: EarnedBadge[]) => void>();

// Badge-Callback Management
export const registerBadgeCallback = (
  userId: string,
  callback: (badges: EarnedBadge[]) => void
) => {
  badgeCallbacks.set(userId, callback);
};

export const removeBadgeCallback = (userId: string) => {
  badgeCallbacks.delete(userId);
};

/**
 * 🏠 Friend-Activity Logger (nur für Freunde-Feed)
 */
const logFriendActivity = async (
  userId: string,
  activityData: FriendActivityData
): Promise<void> => {
  try {
    const activitiesRef = firebase.database().ref(`users/${userId}/activities`);

    // Add new activity
    const newActivityRef = activitiesRef.push();
    await newActivityRef.set({
      ...activityData,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });

    // Limit to max 30 activities
    const snapshot = await activitiesRef.orderByChild('timestamp').once('value');
    const activities = snapshot.val();

    if (activities) {
      const activityKeys = Object.keys(activities);
      if (activityKeys.length > 30) {
        // Sort by timestamp and remove oldest entries
        const sortedKeys = activityKeys.sort((a, b) => {
          const timestampA = activities[a].timestamp || 0;
          const timestampB = activities[b].timestamp || 0;
          return timestampA - timestampB;
        });

        // Remove excess activities (keep only newest 30)
        const toRemove = sortedKeys.slice(0, activityKeys.length - 30);
        const updates: { [key: string]: null } = {};
        toRemove.forEach((key) => {
          updates[key] = null;
        });

        await activitiesRef.update(updates);
      }
    }
  } catch {
    /* ignore — non-critical write/read */
  }
};

/**
 * Badge-Callback Trigger mit Duplikat-Schutz
 */
const recentlyTriggeredBadges = new Map<string, Set<string>>();

const triggerBadgeCallback = async (userId: string, newBadges: EarnedBadge[]): Promise<void> => {
  if (newBadges.length === 0) return;

  // Filtere Badges die bereits in den letzten 5 Sekunden getriggert wurden
  const now = Date.now();
  const userRecentBadges = recentlyTriggeredBadges.get(userId) || new Set();
  const filteredBadges = newBadges.filter((badge) => {
    const badgeKey = `${badge.id}-${Math.floor(now / 5000)}`; // 5-Sekunden-Fenster
    return !userRecentBadges.has(badgeKey);
  });

  if (filteredBadges.length === 0) {
    return;
  }

  // Merke getriggerte Badges
  filteredBadges.forEach((badge) => {
    const badgeKey = `${badge.id}-${Math.floor(now / 5000)}`;
    userRecentBadges.add(badgeKey);
  });
  recentlyTriggeredBadges.set(userId, userRecentBadges);

  // Cleanup alte Einträge (älter als 10 Sekunden)
  setTimeout(() => {
    const cleanupTime = Math.floor((now - 10000) / 5000);
    const currentUserBadges = recentlyTriggeredBadges.get(userId);
    if (currentUserBadges) {
      const cleanedBadges = new Set(
        Array.from(currentUserBadges).filter((key) => {
          const keyTime = parseInt(key.split('-').pop() || '0');
          return keyTime > cleanupTime;
        })
      );
      recentlyTriggeredBadges.set(userId, cleanedBadges);
    }
  }, 10000);

  const callback = badgeCallbacks.get(userId);
  if (callback) {
    callback(filteredBadges);
  }
  // else: no callback registered yet — the badge will be picked up on next mount
};

// =============================================================================
// 📺 EPISODE COUNTER UPDATES (KEINE Activities, NUR Counter für Badges)
// =============================================================================

/**
 * Episode geschaut - NUR Counter-Updates für Badge-System
 */
export const updateEpisodeCounters = async (
  userId: string,
  isRewatch: boolean = false,
  airDate?: string
): Promise<EarnedBadge[]> => {
  try {
    // 1. Streak-Counter aktualisieren
    await badgeCounterService.updateStreakCounter(userId);

    // 2. Quickwatch-Counter (falls heute erschienen)
    if (airDate && !isRewatch) {
      const today = new Date().toDateString();
      const episodeDate = new Date(airDate).toDateString();
      if (today === episodeDate) {
        await badgeCounterService.incrementQuickwatchCounter(userId);
      }
    }

    // 3. Rewatch-Counter
    if (isRewatch) {
      await badgeCounterService.incrementRewatchCounter(userId);
    }

    // 4. Marathon-Counter (wöchentlich)
    await badgeCounterService.recordMarathonEpisode(userId);

    // 5. Zeitbasierte Binge-Session-Erkennung (48h-Window)
    await badgeCounterService.recordBingeEpisode(userId);

    // 5. Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache(); // WICHTIG: Frische Daten nach Counter-Updates!
    const newBadges = await badgeSystem.checkForNewBadges();

    // 6. Badge-Callback triggern
    await triggerBadgeCallback(userId, newBadges);

    // Progress Update Event für UI
    window.dispatchEvent(
      new CustomEvent('badgeProgressUpdate', {
        detail: { userId, type: 'episode', newBadges },
      })
    );

    return newBadges;
  } catch {
    return [];
  }
};

/**
 * Binge-Session für mehrere schnell geschaute Episoden
 */

// =============================================================================
// 📋 FRIEND-ACTIVITIES (NUR diese 4 werden noch geloggt)
// =============================================================================

/**
 * Serie hinzugefügt
 */
export const logSeriesAdded = async (
  userId: string,
  seriesTitle: string,
  tmdbId: number,
  posterPath?: string
): Promise<EarnedBadge[]> => {
  try {
    // Friend-Activity
    await logFriendActivity(userId, {
      type: 'series_added',
      itemTitle: seriesTitle,
      tmdbId,
      itemType: 'series',
      ...(posterPath && { posterPath }),
    });

    // Social-Counter für Badge-System
    await badgeCounterService.incrementSocialCounter(userId, 'series');

    // Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache(); // WICHTIG: Frische Daten nach Counter-Updates!
    const newBadges = await badgeSystem.checkForNewBadges();
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch {
    return [];
  }
};

/**
 * Film hinzugefügt
 */
export const logMovieAdded = async (
  userId: string,
  movieTitle: string,
  tmdbId: number,
  posterPath?: string
): Promise<EarnedBadge[]> => {
  try {
    // Friend-Activity
    await logFriendActivity(userId, {
      type: 'movie_added',
      itemTitle: movieTitle,
      tmdbId,
      itemType: 'movie',
      ...(posterPath && { posterPath }),
    });

    // Social-Counter für Badge-System
    await badgeCounterService.incrementSocialCounter(userId, 'movie');

    // Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache(); // WICHTIG: Frische Daten nach Counter-Updates!
    const newBadges = await badgeSystem.checkForNewBadges();
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch {
    return [];
  }
};

/**
 * Serie zu Watchlist hinzugefügt
 */
export const logWatchlistAdded = async (
  userId: string,
  seriesTitle: string,
  tmdbId: number
): Promise<EarnedBadge[]> => {
  try {
    // Friend-Activity
    await logFriendActivity(userId, {
      type: 'series_added_to_watchlist',
      itemTitle: seriesTitle,
      tmdbId,
      itemType: 'series',
    });

    // Badge-Check (falls Watchlist-Badges existieren)
    const badgeSystem = getOfflineBadgeSystem(userId);
    const newBadges = await badgeSystem.checkForNewBadges();
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch {
    return [];
  }
};

/**
 * 👁️ Episode gesehen – Friend-Feed-Aktivität (NICHT für Notifications/Badge).
 *
 * Koalesziert pro Serie innerhalb von 12h: statt einer Zeile pro Folge wird eine
 * bestehende „gesehen"-Aktivität derselben Serie aktualisiert (Zähler + letzte
 * Folge), sodass der Feed nicht zugespammt wird und der Egress niedrig bleibt.
 * Wird bewusst NUR beim Erstwatch (kein Rewatch) und NICHT beim Bulk-Marking
 * aufgerufen (siehe watchActivityCore.logEpisodeWatch).
 *
 * Wichtig: episode_watched/episodes_watched sind im Bell-Hub (useUnifiedNotifications)
 * und im Badge-Unread-Count (OptimizedFriendsProvider) ausgeschlossen – reiner Feed.
 */
const EPISODE_COALESCE_WINDOW_MS = 12 * 60 * 60 * 1000;

export const logEpisodeWatchedActivity = async (
  userId: string,
  seriesTitle: string,
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  posterPath?: string
): Promise<void> => {
  try {
    const activitiesRef = firebase.database().ref(`users/${userId}/activities`);
    const snapshot = await activitiesRef.orderByChild('timestamp').once('value');
    const activities =
      (snapshot.val() as Record<
        string,
        { type?: string; tmdbId?: number; timestamp?: number; watchedCount?: number }
      > | null) || {};
    const now = Date.now();

    // Neueste „gesehen"-Aktivität derselben Serie im Zeitfenster finden.
    let existingKey: string | null = null;
    let existingCount = 0;
    let existingTs = 0;
    for (const [key, val] of Object.entries(activities)) {
      if (
        (val.type === 'episode_watched' || val.type === 'episodes_watched') &&
        val.tmdbId === tmdbId &&
        typeof val.timestamp === 'number' &&
        now - val.timestamp < EPISODE_COALESCE_WINDOW_MS
      ) {
        if (val.timestamp > existingTs) {
          existingTs = val.timestamp;
          existingKey = key;
          existingCount = val.watchedCount || 1;
        }
      }
    }

    if (existingKey) {
      const nextCount = existingCount + 1;
      await activitiesRef.child(existingKey).update({
        type: nextCount > 1 ? 'episodes_watched' : 'episode_watched',
        itemTitle: seriesTitle,
        seasonNumber,
        episodeNumber,
        watchedCount: nextCount,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        ...(posterPath && { posterPath }),
      });
      return;
    }

    const newRef = activitiesRef.push();
    await newRef.set({
      type: 'episode_watched',
      itemTitle: seriesTitle,
      tmdbId,
      itemType: 'series',
      seasonNumber,
      episodeNumber,
      watchedCount: 1,
      ...(posterPath && { posterPath }),
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });

    // Cap bei 30 (wie logFriendActivity).
    const fresh = await activitiesRef.orderByChild('timestamp').once('value');
    const all = (fresh.val() as Record<string, { timestamp?: number }> | null) || {};
    const keys = Object.keys(all);
    if (keys.length > 30) {
      const sorted = keys.sort((a, b) => (all[a].timestamp || 0) - (all[b].timestamp || 0));
      const toRemove = sorted.slice(0, keys.length - 30);
      const updates: { [key: string]: null } = {};
      toRemove.forEach((key) => {
        updates[key] = null;
      });
      await activitiesRef.update(updates);
    }
  } catch {
    /* ignore — non-critical Feed-Write */
  }
};

/**
 * Bewertung abgegeben
 */
export const logRatingAdded = async (
  userId: string,
  itemTitle: string,
  itemType: 'series' | 'movie',
  rating: number,
  tmdbId: number
): Promise<EarnedBadge[]> => {
  try {
    // Friend-Activity (unterscheide zwischen Serie und Film)
    const activityType = itemType === 'movie' ? 'rating_updated_movie' : 'rating_updated';
    await logFriendActivity(userId, {
      type: activityType,
      itemTitle,
      itemType,
      rating,
      tmdbId,
    });

    // Badge-Check (Collector-Badges basieren auf echten Rating-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache(); // WICHTIG: Cache invalidieren für frische Rating-Daten!
    const newBadges = await badgeSystem.checkForNewBadges();
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch {
    return [];
  }
};

/**
 * Mehrere Episoden gleichzeitig abgehakt (z.B. über Dialog)
 */
export const logBatchEpisodesWatchedClean = async (
  userId: string,
  episodes: BatchEpisodeEntry[]
): Promise<EarnedBadge[]> => {
  try {
    // Alle Episoden einzeln durchgehen für zeitbasierte Binge-Erkennung
    let allNewBadges: EarnedBadge[] = [];

    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      const newBadges = await updateEpisodeCounters(
        userId,
        episode.isRewatch || false,
        episode.airDate
      );

      allNewBadges.push(...newBadges);
    }

    // Entferne Duplikate
    const uniqueBadges = allNewBadges.filter(
      (badge, index, self) => index === self.findIndex((b) => b.id === badge.id)
    );

    return uniqueBadges;
  } catch {
    return [];
  }
};

/**
 * Staffel abgehakt - Badge-Check triggern
 */
export const logSeasonWatchedClean = async (
  userId: string,
  seasonEpisodeCount: number = 1
): Promise<EarnedBadge[]> => {
  try {
    // Season-Complete ist nachträgliches Hinzufügen bereits gesehener Serien
    // KEINE Binge-Session, nur normale Counter-Updates
    await badgeCounterService.updateStreakCounter(userId);
    await badgeCounterService.recordMarathonProgress(userId, seasonEpisodeCount);

    // Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache();
    const newBadges = await badgeSystem.checkForNewBadges();

    // Badge-Callback triggern
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch {
    return [];
  }
};
