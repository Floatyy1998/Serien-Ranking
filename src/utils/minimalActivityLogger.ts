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
  activityData: any
): Promise<void> => {
  try {
    const activitiesRef = firebase.database().ref(`activities/${userId}`);

    // Add new activity
    const newActivityRef = activitiesRef.push();
    await newActivityRef.set({
      ...activityData,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });

    // Limit to max 20 activities
    const snapshot = await activitiesRef
      .orderByChild('timestamp')
      .once('value');
    const activities = snapshot.val();

    if (activities) {
      const activityKeys = Object.keys(activities);
      if (activityKeys.length > 20) {
        // Sort by timestamp and remove oldest entries
        const sortedKeys = activityKeys.sort((a, b) => {
          const timestampA = activities[a].timestamp || 0;
          const timestampB = activities[b].timestamp || 0;
          return timestampA - timestampB;
        });

        // Remove excess activities (keep only newest 20)
        const toRemove = sortedKeys.slice(0, activityKeys.length - 20);
        const updates: { [key: string]: null } = {};
        toRemove.forEach((key) => {
          updates[key] = null;
        });

        await activitiesRef.update(updates);
      }
    }
  } catch (error) {
    console.error('❌ Friend activity logging failed:', error);
  }
};

/**
 * Badge-Callback Trigger mit Duplikat-Schutz
 */
const recentlyTriggeredBadges = new Map<string, Set<string>>();

const triggerBadgeCallback = async (
  userId: string,
  newBadges: EarnedBadge[]
): Promise<void> => {
  if (newBadges.length === 0) return;

  // Filtere Badges die bereits in den letzten 5 Sekunden getriggert wurden
  const now = Date.now();
  const userRecentBadges = recentlyTriggeredBadges.get(userId) || new Set();
  const filteredBadges = newBadges.filter((badge) => {
    const badgeKey = `${badge.id}-${Math.floor(now / 5000)}`; // 5-Sekunden-Fenster
    return !userRecentBadges.has(badgeKey);
  });

  if (filteredBadges.length === 0) {
    console.log('🔄 All badges recently triggered, skipping duplicates');
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
  } else {
    console.warn('⚠️ No badge callback registered for user:', userId);
  }
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
    await badgeCounterService.recordMarathonProgress(userId, 1);

    // 5. Zeitbasierte Binge-Session-Erkennung (48h-Window)
    await badgeCounterService.recordBingeEpisode(userId);

    // 5. Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache(); // WICHTIG: Frische Daten nach Counter-Updates!
    const newBadges = await badgeSystem.checkForNewBadges();

    // 6. Badge-Callback triggern
    await triggerBadgeCallback(userId, newBadges);

    // Progress Update Event für UI
    window.dispatchEvent(new CustomEvent('badgeProgressUpdate', {
      detail: { userId, type: 'episode', newBadges }
    }));

    return newBadges;
  } catch (error) {
    console.error('❌ Episode counter update failed:', error);
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
  tmdbId: number
): Promise<EarnedBadge[]> => {
  try {
    // Friend-Activity
    await logFriendActivity(userId, {
      type: 'series_added',
      itemTitle: seriesTitle,
      tmdbId,
    });

    // Social-Counter für Badge-System
    await badgeCounterService.incrementSocialCounter(userId, 'series');

    // Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache(); // WICHTIG: Frische Daten nach Counter-Updates!
    const newBadges = await badgeSystem.checkForNewBadges();
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch (error) {
    console.error('❌ Series added logging failed:', error);
    return [];
  }
};

/**
 * Film hinzugefügt
 */
export const logMovieAdded = async (
  userId: string,
  movieTitle: string,
  tmdbId: number
): Promise<EarnedBadge[]> => {
  try {
    // Friend-Activity
    await logFriendActivity(userId, {
      type: 'movie_added',
      itemTitle: movieTitle,
      tmdbId,
    });

    // Social-Counter für Badge-System
    await badgeCounterService.incrementSocialCounter(userId, 'movie');

    // Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache(); // WICHTIG: Frische Daten nach Counter-Updates!
    const newBadges = await badgeSystem.checkForNewBadges();
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch (error) {
    console.error('❌ Movie added logging failed:', error);
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
      type: 'series_watchlisted',
      itemTitle: seriesTitle,
      tmdbId,
    });

    // Badge-Check (falls Watchlist-Badges existieren)
    const badgeSystem = getOfflineBadgeSystem(userId);
    const newBadges = await badgeSystem.checkForNewBadges();
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch (error) {
    console.error('❌ Watchlist logging failed:', error);
    return [];
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
    const activityType =
      itemType === 'movie' ? 'rating_updated_movie' : 'rating_updated';
    await logFriendActivity(userId, {
      type: activityType,
      itemTitle,
      itemType,
      rating,
      tmdbId,
    });

    // Badge-Check (Collector-Badges basieren auf echten Rating-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    const newBadges = await badgeSystem.checkForNewBadges();
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch (error) {
    console.error('❌ Rating logging failed:', error);
    return [];
  }
};

// =============================================================================
// 🚫 LEGACY COMPATIBILITY (für bestehenden Code)
// =============================================================================

/**
 * @deprecated Ersetzt durch updateEpisodeCounters()
 */
export const logEpisodeWatchedClean = updateEpisodeCounters;

/**
 * Mehrere Episoden gleichzeitig abgehakt (z.B. über Dialog)
 */
export const logBatchEpisodesWatchedClean = async (
  userId: string,
  episodes: any[]
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
  } catch (error) {
    console.error('❌ Batch episodes badge check failed:', error);
    console.error('❌ Error details:', error);
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
    await badgeCounterService.recordMarathonProgress(
      userId,
      seasonEpisodeCount
    );

    // Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache();
    const newBadges = await badgeSystem.checkForNewBadges();

    // Badge-Callback triggern
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch (error) {
    console.error('❌ Season badge check failed:', error);
    return [];
  }
};
