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

function toDisplayName(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) return c;
  }
  return 'Unbekannt';
}

/**
 * Liest die öffentlich lesbaren Profil-Subnodes (username/displayName/photoURL)
 * eines Users. Wird zum Backfill genutzt, wenn /leaderboardStats oder
 * /leaderboardTrophies veraltete oder fehlende Werte cachen.
 */
async function fetchProfileSubnode(
  uid: string
): Promise<{ displayName: string; photoURL?: string; username?: string }> {
  try {
    const [unameSnap, dnameSnap, photoSnap] = await Promise.all([
      firebase.database().ref(`users/${uid}/username`).once('value'),
      firebase.database().ref(`users/${uid}/displayName`).once('value'),
      firebase.database().ref(`users/${uid}/photoURL`).once('value'),
    ]);
    const uname = unameSnap.val();
    const photo = photoSnap.val();
    return {
      displayName: toDisplayName(unameSnap.val(), dnameSnap.val()),
      photoURL: typeof photo === 'string' && photo.length > 0 ? photo : undefined,
      username: typeof uname === 'string' && uname.trim().length > 0 ? uname : undefined,
    };
  } catch {
    return { displayName: 'Unbekannt' };
  }
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

    // Profil-Daten frueh laden, damit sie in den Archive-Snapshot und in
    // leaderboardStats geschrieben werden koennen (vorher wurden displayName/
    // username erst spaeter geladen, photoURL gar nicht).
    let displayName = 'Unbekannt';
    let username: string | null = null;
    let photoURL: string | null = null;
    try {
      const [dnameSnap, unameSnap, photoSnap] = await Promise.all([
        firebase.database().ref(`users/${userId}/displayName`).once('value'),
        firebase.database().ref(`users/${userId}/username`).once('value'),
        firebase.database().ref(`users/${userId}/photoURL`).once('value'),
      ]);
      displayName = toDisplayName(dnameSnap.val(), unameSnap.val());
      const uname = unameSnap.val();
      username = typeof uname === 'string' && uname.trim().length > 0 ? uname : null;
      const photo = photoSnap.val();
      photoURL = typeof photo === 'string' && photo.length > 0 ? photo : null;
    } catch {
      // defaults bleiben
    }

    // Schreib-Pfade fuer Multi-Path-Update sammeln, damit Rollover + Reset
    // atomar passieren (vorher war der History-Write fire-and-forget und
    // konnte vor dem Reset verloren gehen → User fehlte beim Archivieren).
    const writes: Record<string, unknown> = {};

    const isNewMonth = current.monthKey && current.monthKey !== currentMonth;
    if (isNewMonth) {
      if (current.watchtimeThisMonth > 0 || current.episodesThisMonth > 0) {
        const historySnapshot = {
          episodesThisMonth: current.episodesThisMonth,
          moviesThisMonth: current.moviesThisMonth,
          watchtimeThisMonth: current.watchtimeThisMonth,
          streakThisMonth: current.streakThisMonth,
          streakAllTime: current.streakAllTime,
        };
        writes[`users/${userId}/leaderboard/history/${current.monthKey}`] = historySnapshot;
        // Oeffentlicher Archiv-Knoten: ueberlebt den Reset von leaderboardStats
        // und ist fuer alle auth User lesbar, damit jeder User checkAndArchiveMonth
        // mit vollstaendigen Daten ausfuehren kann.
        writes[`leaderboardArchive/${current.monthKey}/${userId}`] = {
          ...historySnapshot,
          displayName,
          username,
          photoURL,
        };
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

    const publicEntry: Record<string, unknown> = {
      ...current,
      displayName,
      username,
      photoURL,
    };

    writes[`users/${userId}/leaderboard/stats`] = current;
    writes[`leaderboardStats/${userId}`] = publicEntry;

    await firebase.database().ref().update(writes);
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
            displayName: toDisplayName(userData?.displayName, userData?.username),
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
            displayName: toDisplayName(data?.displayName, data?.username),
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

  // Query nur Eintraege fuer den aktuellen Monat statt den kompletten
  // leaderboardStats-Baum (spart Egress: nur aktive User statt alle alten).
  const snapshot = await firebase
    .database()
    .ref('leaderboardStats')
    .orderByChild('monthKey')
    .equalTo(currentMonth)
    .once('value');
  const data = snapshot.val() as Record<string, Record<string, unknown>> | null;
  if (!data) return [];

  const entries: GlobalLeaderboardEntry[] = [];

  for (const [uid, entry] of Object.entries(data)) {
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
      displayName: toDisplayName(entry.displayName, entry.username),
      photoURL: (entry.photoURL as string) || undefined,
      username: (entry.username as string) || undefined,
      lastUpdated: (entry.lastUpdated as number) || 0,
    });
  }

  // Profil-Daten in /leaderboardStats sind nur ein Cache und können stale sein
  // (alte Namen, fehlende Bilder). Daher für jeden Eintrag die öffentlich
  // lesbaren Subnodes aus /users/{uid} nachladen und überschreiben.
  await Promise.all(
    entries.map(async (e) => {
      const profile = await fetchProfileSubnode(e.uid);
      if (profile.displayName !== 'Unbekannt' || e.displayName === 'Unbekannt') {
        e.displayName = profile.displayName;
      }
      if (profile.photoURL) e.photoURL = profile.photoURL;
      if (profile.username) e.username = profile.username;
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

type MonthEntry = { uid: string; displayName: string; photoURL?: string; score: number };

/**
 * Sammelt die maximale Watchtime pro User fuer einen Monat aus allen
 * verfuegbaren Quellen. Reihenfolge der Quellen ist egal — es zaehlt der
 * groesste gefundene Wert, damit auch unvollstaendige Schreiboperationen
 * (z. B. abgebrochenes Rollover) nicht zum Verlust fuehren.
 *
 * Quellen:
 *  1) /leaderboardArchive/{monthKey} (oeffentlich, komplett — primaere Quelle)
 *  2) /users/{uid}/leaderboard/history/{monthKey} (privater Snapshot)
 *  3) /leaderboardStats/{uid} (nur falls dessen monthKey noch zum gefragten Monat passt)
 */
async function collectMonthEntries(
  monthKey: string,
  allStats: Record<string, Record<string, unknown>>
): Promise<MonthEntry[]> {
  const archiveSnap = await firebase.database().ref(`leaderboardArchive/${monthKey}`).once('value');
  const archive = (archiveSnap.val() as Record<string, Record<string, unknown>> | null) ?? {};

  const candidateUids = new Set<string>([...Object.keys(archive), ...Object.keys(allStats)]);
  const results: MonthEntry[] = [];

  await Promise.all(
    Array.from(candidateUids).map(async (uid) => {
      try {
        const archiveEntry = archive[uid];
        const statsEntry = allStats[uid];

        const archiveWatchtime = (archiveEntry?.watchtimeThisMonth as number) || 0;
        const statsWatchtime =
          statsEntry && (statsEntry.monthKey as string) === monthKey
            ? (statsEntry.watchtimeThisMonth as number) || 0
            : 0;

        let historyWatchtime = 0;
        try {
          const histSnap = await firebase
            .database()
            .ref(`users/${uid}/leaderboard/history/${monthKey}`)
            .once('value');
          const hist = histSnap.val() as Record<string, number> | null;
          historyWatchtime = hist?.watchtimeThisMonth ?? 0;
        } catch {
          // History nicht lesbar — andere Quellen reichen ggf.
        }

        const watchtime = Math.max(archiveWatchtime, statsWatchtime, historyWatchtime);
        if (watchtime <= 0) return;

        const displayName = toDisplayName(
          archiveEntry?.displayName,
          archiveEntry?.username,
          statsEntry?.displayName,
          statsEntry?.username
        );
        const photoURL =
          (archiveEntry?.photoURL as string) || (statsEntry?.photoURL as string) || undefined;

        results.push({ uid, displayName, photoURL, score: watchtime });
      } catch {
        // Skip user
      }
    })
  );

  return results;
}

/**
 * Prüft bis zu 12 vergangene Monate und archiviert alle, die noch nicht archiviert sind.
 * Datenquellen siehe collectMonthEntries.
 */
export async function checkAndArchiveMonth(): Promise<void> {
  const pastMonths = getPastMonthKeys(12);

  const trophiesSnap = await firebase.database().ref('leaderboardTrophies').once('value');
  const existingTrophies = (trophiesSnap.val() as Record<string, unknown>) || {};
  const missingMonths = pastMonths.filter((m) => !existingTrophies[m]);
  if (missingMonths.length === 0) return;

  const statsSnap = await firebase.database().ref('leaderboardStats').once('value');
  const allStats = (statsSnap.val() as Record<string, Record<string, unknown>> | null) ?? {};

  for (const monthKey of missingMonths) {
    const entryList = await collectMonthEntries(monthKey, allStats);

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
 * Erzwingt das Neu-Berechnen des Trophys für einen einzelnen Monat. Im
 * Gegensatz zu checkAndArchiveMonth überschreibt das auch existierende Einträge
 * und nutzt für jeden User den maximalen Wert aus History-Snapshot UND
 * leaderboardStats — falls beim ersten Archivieren ein User übersprungen wurde
 * (z. B. weil sein monthKey schon weitergerollt hatte und die History noch
 * nicht geschrieben war).
 */
export async function forceRebuildArchive(monthKey: string): Promise<void> {
  const statsSnap = await firebase.database().ref('leaderboardStats').once('value');
  const allStats = (statsSnap.val() as Record<string, Record<string, unknown>> | null) ?? {};

  const entryList = await collectMonthEntries(monthKey, allStats);

  if (entryList.length === 0) return;

  const entries = entryList.sort((a, b) => b.score - a.score);
  const toEntry = (e: (typeof entries)[0] | undefined) =>
    e && e.score > 0
      ? { uid: e.uid, displayName: e.displayName, photoURL: e.photoURL || null, score: e.score }
      : null;

  await firebase
    .database()
    .ref(`leaderboardTrophies/${monthKey}`)
    .set({
      archived: true,
      category: 'watchtimeThisMonth',
      first: toEntry(entries[0]),
      second: toEntry(entries[1]),
      third: toEntry(entries[2]),
    });
}

/**
 * Lädt alle monatlichen Trophäen, sortiert nach Monat (neueste zuerst).
 */
export async function fetchTrophyHistory(): Promise<MonthlyTrophy[]> {
  try {
    const snapshot = await firebase.database().ref('leaderboardTrophies').once('value');
    const data = snapshot.val() as Record<string, Record<string, unknown>> | null;
    if (!data) return [];

    const normalizeTrophyEntry = (raw: unknown): MonthlyTrophy['first'] => {
      if (!raw || typeof raw !== 'object') return null;
      const r = raw as Record<string, unknown>;
      if (typeof r.uid !== 'string') return null;
      return {
        uid: r.uid,
        displayName: toDisplayName(r.displayName),
        photoURL: typeof r.photoURL === 'string' ? r.photoURL : undefined,
        score: typeof r.score === 'number' ? r.score : 0,
      };
    };

    const trophies = Object.entries(data)
      .map(([monthKey, v]) => ({
        monthKey,
        category: (v.category as string) || 'watchtimeThisMonth',
        first: normalizeTrophyEntry(v.first),
        second: normalizeTrophyEntry(v.second),
        third: normalizeTrophyEntry(v.third),
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    // Profil-Daten in Trophäen sind ein Snapshot vom Archivierungs-Zeitpunkt
    // und können stale sein (alte Namen, fehlende Bilder, "Unbekannt").
    // Daher für jeden Slot frische Profil-Daten aus /users/{uid} mergen.
    const uniqueUids = new Set<string>();
    trophies.forEach((t) => {
      if (t.first) uniqueUids.add(t.first.uid);
      if (t.second) uniqueUids.add(t.second.uid);
      if (t.third) uniqueUids.add(t.third.uid);
    });
    const profileMap = new Map<
      string,
      { displayName: string; photoURL?: string; username?: string }
    >();
    await Promise.all(
      Array.from(uniqueUids).map(async (uid) => {
        profileMap.set(uid, await fetchProfileSubnode(uid));
      })
    );

    const merge = (slot: MonthlyTrophy['first']): MonthlyTrophy['first'] => {
      if (!slot) return null;
      const profile = profileMap.get(slot.uid);
      if (!profile) return slot;
      return {
        ...slot,
        displayName:
          profile.displayName !== 'Unbekannt' || slot.displayName === 'Unbekannt'
            ? profile.displayName
            : slot.displayName,
        photoURL: profile.photoURL ?? slot.photoURL,
      };
    };

    return trophies.map((t) => ({
      ...t,
      first: merge(t.first),
      second: merge(t.second),
      third: merge(t.third),
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Leaderboard] Failed to fetch trophy history: ${message}`);
    return [];
  }
}
