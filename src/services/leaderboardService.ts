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
    const ref = firebase.database().ref(`users/${userId}/leaderboard/stats`);
    const snapshot = await ref.once('value');
    const current: LeaderboardStats =
      (snapshot.val() as LeaderboardStats | null) ?? getDefaultStats();
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
          .ref(`users/${userId}/leaderboard/history/${current.monthKey}`)
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
      current.streakThisMonth = 0;
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

      // streakThisMonth: Längste Streak in diesem Monat (nur Tage im aktuellen Monat)
      const dayOfMonth = new Date().getDate();
      const streakInMonth = Math.min(current.streakCurrent, dayOfMonth);
      if (streakInMonth > (current.streakThisMonth || 0)) {
        current.streakThisMonth = streakInMonth;
      }

      // streakAllTime: Längste Streak aller Zeiten
      if (current.streakCurrent > (current.streakAllTime || 0)) {
        current.streakAllTime = current.streakCurrent;
      }
    }

    current.lastUpdated = Date.now();
    await ref.set(current);

    // Öffentliche Kopie für globales Leaderboard schreiben
    // (da /users nicht mehr komplett gelesen werden darf)
    try {
      const userSnap = await firebase.database().ref(`users/${userId}`).once('value');
      const userData = userSnap.val() as Record<string, unknown> | null;
      await firebase
        .database()
        .ref(`leaderboardStats/${userId}`)
        .set({
          ...current,
          displayName:
            (userData?.displayName as string) || (userData?.username as string) || 'Unbekannt',
          photoURL: (userData?.photoURL as string) || null,
          username: (userData?.username as string) || null,
        });
    } catch {
      // Falls leaderboardStats nicht geschrieben werden kann, ignorieren
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Leaderboard] Failed to update stats: ${message}`);
  }
}

/**
 * Kopiert die bestehenden Leaderboard-Stats eines Users (und optional seiner Freunde)
 * in den öffentlichen /leaderboardStats Knoten, falls dort noch kein aktueller Eintrag existiert.
 * Wird einmalig beim Laden der Leaderboard-Seite aufgerufen.
 */
export async function seedLeaderboardStats(
  currentUserId: string,
  friendUids: string[]
): Promise<void> {
  const allUids = [currentUserId, ...friendUids];
  const currentMonth = getCurrentMonthKey();

  await Promise.all(
    allUids.map(async (uid) => {
      try {
        // Prüfe ob schon ein aktueller Eintrag existiert
        const existingSnap = await firebase
          .database()
          .ref(`leaderboardStats/${uid}/monthKey`)
          .once('value');
        if (existingSnap.val() === currentMonth) return;

        // Stats aus dem User-Knoten laden
        const statsSnap = await firebase
          .database()
          .ref(`users/${uid}/leaderboard/stats`)
          .once('value');
        const stats = statsSnap.val() as LeaderboardStats | null;
        if (!stats || stats.monthKey !== currentMonth) return;
        if (
          (stats.watchtimeThisMonth || 0) <= 0 &&
          (stats.episodesThisMonth || 0) <= 0 &&
          (stats.moviesThisMonth || 0) <= 0
        )
          return;

        // Profil laden
        const userSnap = await firebase.database().ref(`users/${uid}`).once('value');
        const userData = userSnap.val() as Record<string, unknown> | null;

        await firebase
          .database()
          .ref(`leaderboardStats/${uid}`)
          .set({
            ...stats,
            displayName:
              (userData?.displayName as string) || (userData?.username as string) || 'Unbekannt',
            photoURL: (userData?.photoURL as string) || null,
            username: (userData?.username as string) || null,
          });
      } catch {
        // Skip user bei Permission-Fehler
      }
    })
  );
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
          .ref(`users/${uid}/leaderboard/stats`)
          .once('value');
        const stats = snapshot.val() as LeaderboardStats | null;

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
              streakThisMonth: 0,
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
        const data = snapshot.val() as Record<string, unknown> | null;
        return {
          uid,
          profile: {
            displayName: (data?.displayName as string) || (data?.username as string) || 'Unbekannt',
            photoURL: (data?.photoURL as string) || undefined,
            username: (data?.username as string) || undefined,
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
 * Liest aus dem öffentlichen /leaderboardStats Knoten statt /users.
 */
export async function fetchGlobalLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  const currentMonth = getCurrentMonthKey();

  const snapshot = await firebase.database().ref('leaderboardStats').once('value');
  const data = snapshot.val() as Record<string, Record<string, unknown>> | null;
  if (!data) return [];

  const entries: GlobalLeaderboardEntry[] = [];

  for (const [uid, entry] of Object.entries(data)) {
    if ((entry.monthKey as string) !== currentMonth) continue;
    const watchtime = (entry.watchtimeThisMonth as number) || 0;
    const episodes = (entry.episodesThisMonth as number) || 0;
    const movies = (entry.moviesThisMonth as number) || 0;
    if (watchtime <= 0 && episodes <= 0 && movies <= 0) continue;

    entries.push({
      uid,
      episodesThisMonth: episodes,
      moviesThisMonth: movies,
      watchtimeThisMonth: watchtime,
      streakThisMonth: (entry.streakThisMonth as number) || 0,
      streakAllTime: (entry.streakAllTime as number) || 0,
      displayName: (entry.displayName as string) || 'Unbekannt',
      photoURL: (entry.photoURL as string) || undefined,
      username: (entry.username as string) || undefined,
      lastUpdated: (entry.lastUpdated as number) || 0,
    });
  }

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
  const existingTrophies = (trophiesSnap.val() as Record<string, unknown>) || {};
  const missingMonths = pastMonths.filter((m) => !existingTrophies[m]);
  if (missingMonths.length === 0) return;

  // Leaderboard-Stats aus öffentlichem Knoten laden (statt /users komplett)
  const statsSnap = await firebase.database().ref('leaderboardStats').once('value');
  const allStats = (statsSnap.val() as Record<string, Record<string, unknown>> | null) ?? {};
  const uids = Object.keys(allStats);

  // Für jeden fehlenden Monat archivieren
  for (const monthKey of missingMonths) {
    const entryList: { uid: string; displayName: string; photoURL?: string; score: number }[] = [];

    await Promise.all(
      uids.map(async (uid) => {
        try {
          // Erst leaderboardHistory prüfen (Snapshot vom Monats-Rollover)
          const histSnap = await firebase
            .database()
            .ref(`users/${uid}/leaderboard/history/${monthKey}`)
            .once('value');
          const hist = histSnap.val() as Record<string, number> | null;
          if (hist && hist.watchtimeThisMonth > 0) {
            const entry = allStats[uid];
            entryList.push({
              uid,
              displayName: (entry?.displayName as string) || 'Unbekannt',
              photoURL: (entry?.photoURL as string) || undefined,
              score: hist.watchtimeThisMonth,
            });
            return;
          }

          // Fallback: aktuelle leaderboardStats (falls Monat noch nicht gewechselt)
          const statsEntry = allStats[uid];
          if (!statsEntry || (statsEntry.monthKey as string) !== monthKey) return;
          const watchtime = (statsEntry.watchtimeThisMonth as number) || 0;
          if (watchtime <= 0) return;

          entryList.push({
            uid,
            displayName: (statsEntry.displayName as string) || 'Unbekannt',
            photoURL: (statsEntry.photoURL as string) || undefined,
            score: watchtime,
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
  try {
    const snapshot = await firebase.database().ref('leaderboardTrophies').once('value');
    const data = snapshot.val() as Record<string, Record<string, unknown>> | null;
    if (!data) return [];

    return Object.entries(data)
      .map(([monthKey, v]) => ({
        monthKey,
        category: (v.category as string) || 'watchtimeThisMonth',
        first: (v.first as MonthlyTrophy['first']) || null,
        second: (v.second as MonthlyTrophy['second']) || null,
        third: (v.third as MonthlyTrophy['third']) || null,
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Leaderboard] Failed to fetch trophy history: ${message}`);
    return [];
  }
}
