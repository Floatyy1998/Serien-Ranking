import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useSeriesList } from '../contexts/SeriesListContext';
import { getEpisodeAirDate } from '../utils/episodeDate';
import { normalizeSeasons } from '../lib/episode/seriesMetrics';
import { backendFetch } from '../lib/backendApi';
import type { Series } from '../types/Series';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;
const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
const MID_SEASON_GAP_DAYS = 42; // 6 Wochen

export interface ProactiveRecap {
  seriesId: number;
  seriesTitle: string;
  posterUrl: string;
  triggerType: 'new-season' | 'mid-season-return';
  startsToday: boolean;
  seasonNumber: number;
  recap: string | null;
  loading: boolean;
  cacheKey: string;
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === tomorrow.getTime();
}

function isToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime();
}

interface RecapTrigger {
  series: Series;
  triggerType: 'new-season' | 'mid-season-return';
  startsToday: boolean;
  seasonNumber: number;
  episodesToRecap: { seasonIndex: number; episodes: number[] };
}

function findRecapTriggers(seriesList: Series[]): RecapTrigger[] {
  const triggers: RecapTrigger[] = [];

  for (const series of seriesList) {
    if (!series.watchlist || !series.seasons?.length) continue;

    const seasons = normalizeSeasons(series.seasons);

    for (let sIdx = 0; sIdx < seasons.length; sIdx++) {
      const season = seasons[sIdx];
      if (!season.episodes?.length) continue;

      const firstEp = season.episodes[0];
      const firstAirDate = getEpisodeAirDate(firstEp);
      if (!firstAirDate) continue;

      // Neue Staffel startet morgen/heute?
      const today = isToday(new Date(firstAirDate));
      const tomorrow = isTomorrow(new Date(firstAirDate));
      if ((today || tomorrow) && sIdx > 0) {
        const prevSeason = seasons[sIdx - 1];
        const allWatched = prevSeason.episodes?.every((ep) => ep.watched);
        if (allWatched && prevSeason.episodes?.length) {
          triggers.push({
            series,
            triggerType: 'new-season',
            startsToday: today,
            seasonNumber: season.seasonNumber + 1,
            episodesToRecap: {
              seasonIndex: sIdx - 1,
              episodes: prevSeason.episodes.map((_, i) => i),
            },
          });
          continue;
        }
      }

      // Mid-Season-Return nach 6+ Wochen?
      for (let eIdx = 1; eIdx < season.episodes.length; eIdx++) {
        const ep = season.episodes[eIdx];
        const prevEp = season.episodes[eIdx - 1];
        const epDate = getEpisodeAirDate(ep);
        const prevDate = getEpisodeAirDate(prevEp);

        if (!epDate || !prevDate) continue;

        const gapDays =
          (new Date(epDate).getTime() - new Date(prevDate).getTime()) / (1000 * 60 * 60 * 24);

        if (
          gapDays >= MID_SEASON_GAP_DAYS &&
          (isTomorrow(new Date(epDate)) || isToday(new Date(epDate)))
        ) {
          const midToday = isToday(new Date(epDate));
          // Prüfe ob User die Episoden vor der Pause geschaut hat
          const prevWatched = prevEp.watched;
          if (prevWatched) {
            const watchedEpisodes = season.episodes
              .slice(0, eIdx)
              .map((_, i) => i)
              .filter((i) => season.episodes[i].watched);

            if (watchedEpisodes.length > 0) {
              triggers.push({
                series,
                triggerType: 'mid-season-return',
                startsToday: midToday,
                seasonNumber: season.seasonNumber + 1,
                episodesToRecap: { seasonIndex: sIdx, episodes: watchedEpisodes },
              });
            }
          }
        }
      }
    }
  }

  return triggers;
}

async function fetchRecapForTrigger(trigger: RecapTrigger, uid?: string): Promise<string | null> {
  if (!BACKEND_URL) return null;

  const season = trigger.series.seasons[trigger.episodesToRecap.seasonIndex];
  if (!season) return null;

  // Hole TMDB-Beschreibungen für die Episoden
  const seasonNum = season.seasonNumber + 1;
  let episodes: { seasonNumber: number; episodeNumber: number; name: string; overview: string }[] =
    [];

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${trigger.series.id}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=de-DE`
    );
    if (res.ok) {
      const data = await res.json();
      episodes = trigger.episodesToRecap.episodes
        .map((eIdx) => {
          const ep = season.episodes[eIdx];
          const tmdbEp = data.episodes?.find(
            (t: { episode_number: number }) => t.episode_number === (ep.episode_number || eIdx + 1)
          );
          return {
            seasonNumber: seasonNum,
            episodeNumber: ep.episode_number || eIdx + 1,
            name: tmdbEp?.name || ep.name || `Episode ${eIdx + 1}`,
            overview: tmdbEp?.overview || '',
          };
        })
        .filter((ep) => ep.overview);
    }
  } catch {
    // Fallback ohne TMDB-Beschreibungen
    episodes = trigger.episodesToRecap.episodes.map((eIdx) => {
      const ep = season.episodes[eIdx];
      return {
        seasonNumber: seasonNum,
        episodeNumber: ep.episode_number || eIdx + 1,
        name: ep.name || `Episode ${eIdx + 1}`,
        overview: '',
      };
    });
  }

  if (episodes.length === 0) return null;

  try {
    const res = await backendFetch('/ai/recap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesTitle: trigger.series.title,
        originalTitle: trigger.series.original_name || trigger.series.title,
        episodes,
        uid,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.recap || null;
    }
  } catch {
    // Graceful fail
  }

  return null;
}

function buildRecaps(
  triggers: RecapTrigger[],
  user: { uid: string } | null | undefined,
  dismissed: Set<string>
): ProactiveRecap[] {
  if (triggers.length === 0 || !user) return [];

  return triggers
    .filter((t) => {
      const cacheKey = `proactive-recap-${t.series.id}-${t.triggerType}-S${t.seasonNumber}`;
      return !dismissed.has(cacheKey);
    })
    .map((t) => {
      const cacheKey = `proactive-recap-${t.series.id}-${t.triggerType}-S${t.seasonNumber}`;
      const cached = sessionStorage.getItem(cacheKey);
      return {
        seriesId: t.series.id,
        seriesTitle: t.series.title,
        posterUrl: t.series.poster?.poster || '',
        triggerType: t.triggerType,
        startsToday: t.startsToday,
        seasonNumber: t.seasonNumber,
        recap: cached || null,
        loading: false,
        cacheKey,
      };
    });
}

export function useProactiveRecaps() {
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList();

  const triggers = useMemo(() => findRecapTriggers(seriesList), [seriesList]);

  // Dismissed-Keys aus Firebase laden — multi-device-synchron, anders als das
  // bisherige localStorage. UID-getaggt damit User-Wechsel keinen stale State zeigt.
  const [dismissedState, setDismissedState] = useState<{ uid: string; keys: Set<string> } | null>(
    null
  );

  useEffect(() => {
    if (!user) return; // beim Logout greift der derived useMemo (UID-Mismatch → leeres Set)
    const uid = user.uid;
    let cancelled = false;
    const ref = firebase.database().ref(`users/${uid}/proactiveRecapDismissed`);
    ref
      .once('value')
      .then((snap) => {
        if (cancelled) return;
        const val = (snap.val() as Record<string, number | boolean> | null) || {};
        setDismissedState({ uid, keys: new Set(Object.keys(val)) });
      })
      .catch(() => {
        if (cancelled) return;
        // Offline / Permission: leeres Set, damit nichts geblockt wird
        setDismissedState({ uid, keys: new Set() });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dismissedKeys = useMemo(
    () => (user && dismissedState?.uid === user.uid ? dismissedState.keys : new Set<string>()),
    [user, dismissedState]
  );

  // Cleanup: Dismiss-Einträge für nicht mehr existierende Trigger entfernen.
  // Triggers sind tagesabhängig — nach z.B. einem Monat sind alte Einträge irrelevant.
  useEffect(() => {
    if (!user || !dismissedState || dismissedState.uid !== user.uid) return;
    if (dismissedState.keys.size === 0) return;
    const activeKeys = new Set(
      triggers.map((t) => `proactive-recap-${t.series.id}-${t.triggerType}-S${t.seasonNumber}`)
    );
    const stale: string[] = [];
    dismissedState.keys.forEach((k) => {
      if (!activeKeys.has(k)) stale.push(k);
    });
    if (stale.length === 0) return;
    const updates: Record<string, null> = {};
    stale.forEach((k) => {
      updates[`users/${user.uid}/proactiveRecapDismissed/${k}`] = null;
    });
    firebase
      .database()
      .ref()
      .update(updates)
      // bewusst still: Best-effort-Cleanup, veraltete Dismiss-Keys stören nicht
      .catch(() => {});
  }, [user, dismissedState, triggers]);

  // Dismiss-Liste ist erst nach dem Firebase-Read verlässlich. Solange sie
  // (für einen eingeloggten User) noch lädt, KEINE Recaps liefern — sonst
  // blitzt ein bereits weggeklickter Recap bei jedem HomePage-Mount für <1s
  // auf, bis dismissedKeys eintrifft und ihn wieder herausfiltert.
  const dismissedReady = !user || dismissedState?.uid === user.uid;

  const initialRecaps = useMemo(
    () => (dismissedReady ? buildRecaps(triggers, user, dismissedKeys) : []),
    [dismissedReady, triggers, user, dismissedKeys]
  );

  // Mutable state for loading updates (recap content fetched lazily)
  const [recapOverrides, setRecapOverrides] = useState<Record<string, Partial<ProactiveRecap>>>({});

  const recaps = useMemo(
    () =>
      initialRecaps.map((r) =>
        recapOverrides[r.cacheKey] ? { ...r, ...recapOverrides[r.cacheKey] } : r
      ),
    [initialRecaps, recapOverrides]
  );

  const fetchRecap = useCallback(
    async (cacheKey: string) => {
      const trigger = triggers.find(
        (t) => `proactive-recap-${t.series.id}-${t.triggerType}-S${t.seasonNumber}` === cacheKey
      );
      if (!trigger) return;

      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setRecapOverrides((prev) => ({ ...prev, [cacheKey]: { recap: cached, loading: false } }));
        return;
      }

      setRecapOverrides((prev) => ({ ...prev, [cacheKey]: { loading: true } }));

      const recap = await fetchRecapForTrigger(trigger, user?.uid);
      if (recap) {
        sessionStorage.setItem(cacheKey, recap);
      }

      setRecapOverrides((prev) => ({ ...prev, [cacheKey]: { recap, loading: false } }));
    },
    [triggers, user]
  );

  const dismiss = useCallback(
    (cacheKey: string) => {
      if (!user) return;
      const uid = user.uid;
      setDismissedState((prev) => {
        const current = prev?.uid === uid ? prev.keys : new Set<string>();
        if (current.has(cacheKey)) return prev;
        const next = new Set(current);
        next.add(cacheKey);
        return { uid, keys: next };
      });
      firebase
        .database()
        .ref(`users/${uid}/proactiveRecapDismissed/${cacheKey}`)
        .set(Date.now())
        // bewusst still: lokaler State ist schon gesetzt, Firebase-Write ist Best-effort
        .catch(() => {});
    },
    [user]
  );

  return { recaps, dismiss, fetchRecap };
}
