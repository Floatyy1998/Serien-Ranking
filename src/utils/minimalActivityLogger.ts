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
 * 🍿 Zeitbasierte Binge-Session Erkennung
 * Prüft ob Episodes in kurzer Zeit abgehakt wurden (auch einzeln)
 */
const checkForTimeBingeSession = async (
  userId: string,
  tmdbId: number
): Promise<void> => {
  try {
    const now = Date.now();
    const timeWindows = [
      { window: 2 * 60 * 60 * 1000, name: '2hours' }, // 2 Stunden
      { window: 4 * 60 * 60 * 1000, name: '4hours' }, // 4 Stunden
      { window: 24 * 60 * 60 * 1000, name: '1day' }, // 1 Tag
    ];

    // Hole letzte Episode-Aktivitäten des Users
    const episodeActivitiesRef = firebase
      .database()
      .ref(`episodeActivity/${userId}`);
    const snapshot = await episodeActivitiesRef
      .orderByChild('timestamp')
      .startAt(now - 24 * 60 * 60 * 1000)
      .once('value');

    const activities = snapshot.exists()
      ? (Object.values(snapshot.val()) as any[])
      : [];

    // Aktueller Zeitstempel hinzufügen
    activities.push({
      tmdbId,
      timestamp: now,
      episodeId: `${tmdbId}-episode-${now}`,
    });

    // Prüfe verschiedene Zeitfenster
    for (const { window, name } of timeWindows) {
      const cutoff = now - window;
      const recentEpisodes = activities.filter((a) => a.timestamp >= cutoff);

      if (recentEpisodes.length >= 3) {
        // Mindestens 3 Episoden für Binge

        // Prüfe ob es eine neue Binge-Session ist (nicht schon erkannt)
        const bingeKey = `${name}-${Math.floor(now / window)}`;
        const existingBinge = await firebase
          .database()
          .ref(`badgeCounters/${userId}/timeBingeSessions/${bingeKey}`)
          .once('value');

        if (!existingBinge.exists()) {
          // Neue Binge-Session!
          await badgeCounterService.recordBingeSession(
            userId,
            recentEpisodes.length,
            name
          );

          // Speichere diese Binge-Session um Duplikate zu vermeiden
          await firebase
            .database()
            .ref(`badgeCounters/${userId}/timeBingeSessions/${bingeKey}`)
            .set({
              episodes: recentEpisodes.length,
              timeframe: name,
              timestamp: now,
            });

          break; // Nur eine Binge-Session pro Episode-Update
        }
      }
    }

    // Speichere aktuelle Episode-Aktivität (NUR für Binge-Tracking, wird nach 24h gelöscht)
    await episodeActivitiesRef.push({
      tmdbId,
      timestamp: now,
      episodeId: `${tmdbId}-episode-${now}`,
    });

    // Cleanup alte Aktivitäten (älter als 24h) - nur wenn wir Activities haben
    if (snapshot.exists()) {
      const oldActivities = Object.entries(snapshot.val()).filter(
        ([_key, activity]: [string, any]) =>
          activity.timestamp < now - 24 * 60 * 60 * 1000
      );
      for (const [key, _activity] of oldActivities) {
        await episodeActivitiesRef.child(key).remove();
      }
    }
  } catch (error) {
    console.error('❌ Time-based binge check failed:', error);
  }
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
    const snapshot = await activitiesRef.orderByChild('timestamp').once('value');
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
        toRemove.forEach(key => {
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
  const filteredBadges = newBadges.filter(badge => {
    const badgeKey = `${badge.id}-${Math.floor(now / 5000)}`; // 5-Sekunden-Fenster
    return !userRecentBadges.has(badgeKey);
  });

  if (filteredBadges.length === 0) {
    console.log('🔄 All badges recently triggered, skipping duplicates');
    return;
  }

  // Merke getriggerte Badges
  filteredBadges.forEach(badge => {
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
        Array.from(currentUserBadges).filter(key => {
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
  tmdbId: number,
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

    // 4.5. Zeitbasierte Binge-Erkennung (neue Funktion)
    await checkForTimeBingeSession(userId, tmdbId);

    // 5. Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache(); // WICHTIG: Frische Daten nach Counter-Updates!
    const newBadges = await badgeSystem.checkForNewBadges();

    // 6. Badge-Callback triggern
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch (error) {
    console.error('❌ Episode counter update failed:', error);
    return [];
  }
};

/**
 * Binge-Session für mehrere schnell geschaute Episoden
 */
export const recordBingeSession = async (
  userId: string,
  episodeCount: number
): Promise<EarnedBadge[]> => {
  try {
    let timeframe = '';
    if (episodeCount >= 3 && episodeCount < 8) {
      timeframe = '2hours';
    } else if (episodeCount >= 8 && episodeCount < 12) {
      timeframe = '4hours';
    } else if (episodeCount >= 12) {
      timeframe = '1day';
    }

    if (timeframe) {
      await badgeCounterService.recordBingeSession(
        userId,
        episodeCount,
        timeframe
      );
    }

    // Badge-Check (Cache invalidieren für frische Counter-Daten)
    const badgeSystem = getOfflineBadgeSystem(userId);
    badgeSystem.invalidateCache(); // WICHTIG: Frische Daten nach Counter-Updates!
    const newBadges = await badgeSystem.checkForNewBadges();
    await triggerBadgeCallback(userId, newBadges);

    return newBadges;
  } catch (error) {
    console.error('❌ Binge session recording failed:', error);
    return [];
  }
};

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
    // Behandle als Binge-Session wenn genug Episoden
    if (episodes.length >= 3) {
      return await recordBingeSession(userId, episodes.length);
    }

    // Bei weniger als 3 Episoden: Einzelne Episode-Counter-Updates
    let allNewBadges: EarnedBadge[] = [];

    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      const newBadges = await updateEpisodeCounters(
        userId,
        episode.tmdbId || 0,
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
    // Behandle als Binge-Session wenn genug Episoden
    if (seasonEpisodeCount >= 3) {
      return await recordBingeSession(userId, seasonEpisodeCount);
    }

    // Sonst normale Episode-Counter-Updates
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
