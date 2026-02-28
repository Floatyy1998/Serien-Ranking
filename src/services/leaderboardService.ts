import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { GlobalLeaderboardEntry, LeaderboardStats, MonthlyTrophy } from '../types/Leaderboard';
import { toLocalDateString } from '../lib/date/date.utils';

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayStr(): string {
  return toLocalDateString();
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
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
    const ref = firebase.database().ref(`${userId}/leaderboardStats`);
    const snapshot = await ref.once('value');
    const current: LeaderboardStats = snapshot.val() || getDefaultStats();
    const currentMonth = getCurrentMonthKey();
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    // Monat-Rollover: Alte Stats sichern, dann zurücksetzen
    const isNewMonth = current.monthKey && current.monthKey !== currentMonth;
    if (isNewMonth) {
      // Alte Monats-Daten als Snapshot speichern, damit sie archiviert werden können
      if (current.watchtimeThisMonth > 0 || current.episodesThisMonth > 0) {
        firebase
          .database()
          .ref(`${userId}/leaderboardHistory/${current.monthKey}`)
          .set({
            episodesThisMonth: current.episodesThisMonth,
            moviesThisMonth: current.moviesThisMonth,
            watchtimeThisMonth: current.watchtimeThisMonth,
            streakThisMonth: current.streakThisMonth,
            streakAllTime: current.streakAllTime,
          })
          .catch(() => {});
      }
      current.episodesThisMonth = 0;
      current.moviesThisMonth = 0;
      current.watchtimeThisMonth = 0;
      current.streakThisMonth = current.streakCurrent || 0;
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

    // Global leaderboard is now read directly from leaderboardStats nodes,
    // so no separate update is needed.
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
        const snapshot = await firebase.database().ref(`${uid}/leaderboardStats`).once('value');
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

/**
 * Lädt die globale Rangliste für den aktuellen Monat.
 * Liest direkt aus den bestehenden leaderboardStats aller User —
 * so sind die Daten immer aktuell (gleiche Quelle wie Freundes-Rangliste).
 */
export async function fetchGlobalLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  const currentMonth = getCurrentMonthKey();

  // Alle User laden für Profile
  const usersSnap = await firebase.database().ref('users').once('value');
  const usersData = usersSnap.val() as Record<string, Record<string, unknown>> | null;
  if (!usersData) return [];

  const uids = Object.keys(usersData);
  const entries: GlobalLeaderboardEntry[] = [];

  await Promise.all(
    uids.map(async (uid) => {
      try {
        const statsSnap = await firebase.database().ref(`${uid}/leaderboardStats`).once('value');
        const stats: LeaderboardStats | null = statsSnap.val();
        if (!stats || stats.monthKey !== currentMonth) return;
        if (
          stats.watchtimeThisMonth <= 0 &&
          stats.episodesThisMonth <= 0 &&
          stats.moviesThisMonth <= 0
        )
          return;

        const userData = usersData[uid];
        entries.push({
          uid,
          episodesThisMonth: stats.episodesThisMonth || 0,
          moviesThisMonth: stats.moviesThisMonth || 0,
          watchtimeThisMonth: stats.watchtimeThisMonth || 0,
          streakThisMonth: stats.streakThisMonth || 0,
          streakAllTime: stats.streakAllTime || 0,
          displayName:
            (userData?.displayName as string) || (userData?.username as string) || 'Unbekannt',
          photoURL: (userData?.photoURL as string) || undefined,
          username: (userData?.username as string) || undefined,
          lastUpdated: stats.lastUpdated || 0,
        });
      } catch {
        // Skip user if permission denied
      }
    })
  );

  return entries;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Gibt die letzten N MonthKeys zurück (ohne den aktuellen Monat).
 */
function getPastMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(getMonthKey(d));
  }
  return keys;
}

const MONTH_NAMES_SERVICE: Record<string, string> = {
  '01': 'Januar',
  '02': 'Februar',
  '03': 'März',
  '04': 'April',
  '05': 'Mai',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'August',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Dezember',
};

/**
 * Prüft bis zu 12 vergangene Monate und archiviert alle, die noch nicht archiviert sind.
 * Datenquellen: leaderboardStats (falls monthKey noch passt) + leaderboardHistory (Snapshots).
 */
export async function checkAndArchiveMonth(): Promise<void> {
  const pastMonths = getPastMonthKeys(12);

  // Prüfe welche Monate bereits archiviert sind
  const trophiesSnap = await firebase.database().ref('leaderboardTrophies').once('value');
  const existingTrophies = trophiesSnap.val() || {};
  const missingMonths = pastMonths.filter((m) => !existingTrophies[m]);
  if (missingMonths.length === 0) return;

  // User-Daten einmalig laden
  const usersSnap = await firebase.database().ref('users').once('value');
  const usersData = usersSnap.val() as Record<string, Record<string, unknown>> | null;
  if (!usersData) return;
  const uids = Object.keys(usersData);

  // Für jeden fehlenden Monat archivieren
  for (const monthKey of missingMonths) {
    const entryList: { uid: string; displayName: string; photoURL?: string; score: number }[] = [];

    await Promise.all(
      uids.map(async (uid) => {
        try {
          // Erst leaderboardHistory prüfen (Snapshot vom Monats-Rollover)
          const histSnap = await firebase
            .database()
            .ref(`${uid}/leaderboardHistory/${monthKey}`)
            .once('value');
          const hist = histSnap.val();
          if (hist && hist.watchtimeThisMonth > 0) {
            const userData = usersData[uid];
            entryList.push({
              uid,
              displayName:
                (userData?.displayName as string) || (userData?.username as string) || 'Unbekannt',
              photoURL: (userData?.photoURL as string) || undefined,
              score: hist.watchtimeThisMonth,
            });
            return;
          }

          // Fallback: aktuelle leaderboardStats (falls Monat noch nicht gewechselt)
          const statsSnap = await firebase.database().ref(`${uid}/leaderboardStats`).once('value');
          const stats: LeaderboardStats | null = statsSnap.val();
          if (!stats || stats.monthKey !== monthKey) return;
          if (stats.watchtimeThisMonth <= 0) return;

          const userData = usersData[uid];
          entryList.push({
            uid,
            displayName:
              (userData?.displayName as string) || (userData?.username as string) || 'Unbekannt',
            photoURL: (userData?.photoURL as string) || undefined,
            score: stats.watchtimeThisMonth,
          });
        } catch {
          // Skip user
        }
      })
    );

    if (entryList.length === 0) continue;

    const entries = entryList.sort((a, b) => b.score - a.score);

    const toEntry = (e: (typeof entries)[0] | undefined) =>
      e && e.score > 0
        ? { uid: e.uid, displayName: e.displayName, photoURL: e.photoURL || null, score: e.score }
        : null;

    const trophyData = {
      archived: true,
      category: 'watchtimeThisMonth',
      first: toEntry(entries[0]),
      second: toEntry(entries[1]),
      third: toEntry(entries[2]),
    };

    await firebase.database().ref(`leaderboardTrophies/${monthKey}`).set(trophyData);

    // Benachrichtigungen nur für den letzten Monat senden (nicht für uralte)
    if (monthKey === pastMonths[0]) {
      const [, monthNum] = monthKey.split('-');
      const monthLabel = MONTH_NAMES_SERVICE[monthNum] || monthNum;
      const placeLabels = ['1. Platz', '2. Platz', '3. Platz'];

      const winners = [trophyData.first, trophyData.second, trophyData.third];
      await Promise.all(
        winners.map(async (winner, idx) => {
          if (!winner) return;
          try {
            await firebase
              .database()
              .ref(`users/${winner.uid}/notifications`)
              .push({
                type: 'trophy_won',
                title: 'Trophäe gewonnen!',
                message: `Du hast den ${placeLabels[idx]} in der Watchtime-Rangliste für ${monthLabel} erreicht!`,
                timestamp: Date.now(),
                read: false,
                data: {
                  monthKey,
                  place: idx + 1,
                  score: winner.score,
                },
              });
          } catch {
            // Notification-Fehler ignorieren
          }
        })
      );
    }
  }
}

/**
 * Lädt alle monatlichen Trophäen, sortiert nach Monat (neueste zuerst).
 */
export async function fetchTrophyHistory(): Promise<MonthlyTrophy[]> {
  const snapshot = await firebase.database().ref('leaderboardTrophies').once('value');
  const data = snapshot.val();
  if (!data) return [];

  const trophies: MonthlyTrophy[] = Object.entries(data)
    .map(([monthKey, val]: [string, unknown]) => {
      const v = val as Record<string, unknown>;
      return {
        monthKey,
        category: (v.category as string) || 'watchtimeThisMonth',
        first: (v.first as MonthlyTrophy['first']) || null,
        second: (v.second as MonthlyTrophy['second']) || null,
        third: (v.third as MonthlyTrophy['third']) || null,
      };
    })
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  return trophies;
}
