import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { LeaderboardStats } from '../types/Leaderboard';

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getDefaultStats(): LeaderboardStats {
  return {
    episodesThisMonth: 0,
    moviesThisMonth: 0,
    watchtimeThisMonth: 0,
    streakThisMonth: 0,
    streakAllTime: 0,
    streakCurrent: 0,
    lastStreakDate: '',
    lastUpdated: 0,
    monthKey: getCurrentMonthKey(),
  };
}

/**
 * Aktualisiert die Leaderboard-Stats eines Users.
 * Wird nach jedem Watch-Event aufgerufen.
 * Streak wird unabhängig von der Homepage-Streak berechnet.
 */
export async function updateLeaderboardStats(
  userId: string,
  update: {
    episodesWatched?: number;
    moviesWatched?: number;
    watchtimeMinutes?: number;
  }
): Promise<void> {
  try {
    const ref = firebase.database().ref(`users/${userId}/leaderboardStats`);
    const snapshot = await ref.once('value');
    const current: LeaderboardStats = snapshot.val() || getDefaultStats();
    const currentMonth = getCurrentMonthKey();
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    // Monat-Rollover: Monats-Zähler zurücksetzen
    const isNewMonth = current.monthKey !== currentMonth;
    if (isNewMonth) {
      current.episodesThisMonth = 0;
      current.moviesThisMonth = 0;
      current.watchtimeThisMonth = 0;
      current.streakThisMonth = current.streakCurrent || 0; // Carry over laufende Streak
      current.monthKey = currentMonth;
    }

    // Monats-Zähler inkrementieren
    if (update.episodesWatched) {
      current.episodesThisMonth += update.episodesWatched;
    }
    if (update.moviesWatched) {
      current.moviesThisMonth += update.moviesWatched;
    }
    if (update.watchtimeMinutes) {
      current.watchtimeThisMonth += update.watchtimeMinutes;
    }

    // Streak-Berechnung (unabhängig von Homepage-Streak)
    if (current.lastStreakDate !== today) {
      if (current.lastStreakDate === yesterday) {
        // Streak geht weiter
        current.streakCurrent = (current.streakCurrent || 0) + 1;
      } else {
        // Streak unterbrochen oder erster Watch
        current.streakCurrent = 1;
      }
      current.lastStreakDate = today;

      // streakThisMonth: Längste Streak in diesem Monat
      if (current.streakCurrent > (current.streakThisMonth || 0)) {
        current.streakThisMonth = current.streakCurrent;
      }

      // streakAllTime: Längste Streak aller Zeiten
      if (current.streakCurrent > (current.streakAllTime || 0)) {
        current.streakAllTime = current.streakCurrent;
      }
    }

    current.lastUpdated = Date.now();
    await ref.set(current);
  } catch (error) {
    console.error('[Leaderboard] Error updating stats:', error);
  }
}

/**
 * Lädt Leaderboard-Daten für den aktuellen User und alle Freunde.
 */
export async function fetchLeaderboardData(
  currentUserId: string,
  friendUids: string[]
): Promise<Record<string, LeaderboardStats>> {
  const allUids = [currentUserId, ...friendUids];
  const currentMonth = getCurrentMonthKey();

  const results = await Promise.all(
    allUids.map(async (uid) => {
      try {
        const snapshot = await firebase
          .database()
          .ref(`users/${uid}/leaderboardStats`)
          .once('value');
        const stats: LeaderboardStats | null = snapshot.val();

        if (!stats) {
          return { uid, stats: getDefaultStats() };
        }

        // Monat-Validierung: Wenn monthKey veraltet, Monats-Werte als 0 behandeln
        if (stats.monthKey !== currentMonth) {
          return {
            uid,
            stats: {
              ...stats,
              episodesThisMonth: 0,
              moviesThisMonth: 0,
              watchtimeThisMonth: 0,
              streakThisMonth: stats.streakCurrent || 0, // Carry over
              monthKey: currentMonth,
            },
          };
        }

        return { uid, stats };
      } catch {
        return { uid, stats: getDefaultStats() };
      }
    })
  );

  const map: Record<string, LeaderboardStats> = {};
  for (const { uid, stats } of results) {
    map[uid] = stats;
  }
  return map;
}

/**
 * Lädt Display-Infos (Name, Avatar, Username) für eine Liste von UIDs.
 */
export async function fetchLeaderboardProfiles(
  uids: string[]
): Promise<Record<string, { displayName: string; photoURL?: string; username?: string }>> {
  const results = await Promise.all(
    uids.map(async (uid) => {
      try {
        const snapshot = await firebase.database().ref(`users/${uid}`).once('value');
        const data = snapshot.val();
        return {
          uid,
          profile: {
            displayName: data?.displayName || data?.username || 'Unbekannt',
            photoURL: data?.photoURL || undefined,
            username: data?.username || undefined,
          },
        };
      } catch {
        return {
          uid,
          profile: { displayName: 'Unbekannt' },
        };
      }
    })
  );

  const map: Record<string, { displayName: string; photoURL?: string; username?: string }> = {};
  for (const { uid, profile } of results) {
    map[uid] = profile;
  }
  return map;
}
