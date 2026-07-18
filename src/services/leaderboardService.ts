import { dbRef, dbUpdate, userPath, paths } from '../services/db/ref';
import type { GlobalLeaderboardEntry, LeaderboardStats, MonthlyTrophy } from '../types/Leaderboard';
import { toLocalDateString } from '../lib/date/date.utils';
import { fetchPublicUserFields } from '../services/firebase/userDisplayData';

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
      dbRef(userPath(uid, 'username')).once('value'),
      dbRef(paths.displayName(uid)).once('value'),
      dbRef(userPath(uid, 'photoURL')).once('value'),
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

// Session-Cache für die eigenen Profil-Felder: updateLeaderboardStats läuft
// bei jedem Watch-Event — ohne Cache wären das 3 Punkt-Reads pro Episode.
const ownProfileCache = new Map<
  string,
  { ts: number; displayName: string; username: string | null; photoURL: string | null }
>();
const OWN_PROFILE_TTL_MS = 30 * 60 * 1000;

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
    const ref = dbRef(userPath(userId, 'leaderboard', 'stats'));
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
    const cached = ownProfileCache.get(userId);
    if (cached && Date.now() - cached.ts < OWN_PROFILE_TTL_MS) {
      ({ displayName, username, photoURL } = cached);
    } else {
      try {
        const [dnameSnap, unameSnap, photoSnap] = await Promise.all([
          dbRef(paths.displayName(userId)).once('value'),
          dbRef(userPath(userId, 'username')).once('value'),
          dbRef(userPath(userId, 'photoURL')).once('value'),
        ]);
        displayName = toDisplayName(dnameSnap.val(), unameSnap.val());
        const uname = unameSnap.val();
        username = typeof uname === 'string' && uname.trim().length > 0 ? uname : null;
        const photo = photoSnap.val();
        photoURL = typeof photo === 'string' && photo.length > 0 ? photo : null;
        ownProfileCache.set(userId, { ts: Date.now(), displayName, username, photoURL });
      } catch {
        // defaults bleiben
      }
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

    await dbUpdate(writes);
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
        const existingSnap = await dbRef(`leaderboardStats/${uid}/monthKey`).once('value');
        if (existingSnap.val() === currentMonth) return;

        // Stats aus dem User-Knoten laden
        const statsSnap = await dbRef(userPath(uid, 'leaderboard', 'stats')).once('value');
        const stats = statsSnap.val() as LeaderboardStats | null;
        if (!stats || stats.monthKey !== currentMonth) return;
        if (
          (stats.watchtimeThisMonth || 0) <= 0 &&
          (stats.episodesThisMonth || 0) <= 0 &&
          (stats.moviesThisMonth || 0) <= 0
        )
          return;

        // Profil laden — Punkt-Reads statt Vollknoten-Read (users/$other ist
        // unter den gehärteten Rules nicht mehr komplett lesbar).
        const profile = await fetchPublicUserFields(uid);

        await dbRef(`leaderboardStats/${uid}`).set({
          ...stats,
          displayName: toDisplayName(profile.displayName, profile.username),
          photoURL: profile.photoURL || null,
          username: profile.username || null,
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
        const snapshot = await dbRef(userPath(uid, 'leaderboard', 'stats')).once('value');
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
        // Punkt-Reads statt Vollknoten-Read (users/$other ist unter den
        // gehärteten Rules nicht mehr komplett lesbar) — genutzt werden nur
        // displayName/username/photoURL, die einzeln lesbar bleiben.
        const fields = await fetchPublicUserFields(uid);
        return {
          uid,
          profile: {
            displayName: toDisplayName(fields.displayName, fields.username),
            photoURL: fields.photoURL || undefined,
            username: fields.username || undefined,
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

  // Primär: serverseitig aggregierter Snapshot (Backend-Cron schreibt
  // leaderboardTop/{monthKey} alle 15 Min) — ein kleiner Read statt des
  // kompletten leaderboardStats-Baums + N Profil-Reads.
  try {
    const topSnap = await dbRef(`leaderboardTop/${currentMonth}`).once('value');
    const top = topSnap.val() as {
      entries?: Record<string, GlobalLeaderboardEntry> | GlobalLeaderboardEntry[];
    } | null;
    if (top?.entries) {
      const entries = Object.values(top.entries).filter(Boolean) as GlobalLeaderboardEntry[];
      if (entries.length > 0) {
        return entries.map((e) => ({
          ...e,
          displayName: toDisplayName(e.displayName, e.username),
        }));
      }
    }
  } catch {
    // Snapshot (noch) nicht vorhanden → Legacy-Pfad unten
  }

  // Fallback (nur solange der Backend-Cron den Snapshot noch nicht schreibt):
  // Query nur Eintraege fuer den aktuellen Monat statt den kompletten
  // leaderboardStats-Baum (spart Egress: nur aktive User statt alle alten).
  const snapshot = await dbRef('leaderboardStats')
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

  // Kein per-Eintrag-Profil-Nachladen mehr (3×N Punkt-Reads skalierten nicht):
  // die gecachten Profil-Felder in leaderboardStats werden bei jedem Watch-Event
  // aktualisiert; der Server-Snapshot oben liefert ohnehin frische Daten.
  return entries;
}

/**
 * Lädt alle monatlichen Trophäen, sortiert nach Monat (neueste zuerst).
 */
export async function fetchTrophyHistory(): Promise<MonthlyTrophy[]> {
  try {
    const snapshot = await dbRef('leaderboardTrophies').once('value');
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
