/**
 * Streaming-Abo-Verwaltung + Auswertung
 *
 * Liest die User-Abos aus Firebase, lädt die Watch-Events der letzten zwei
 * Jahre und berechnet pro Provider letzte Nutzung, monatliche Kosten und
 * Lücken in der Watchlist (neue Staffeln auf nicht-abonnierten Providern).
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useSeriesList } from '../contexts/SeriesListContext';
import { SUPPORTED_PROVIDERS } from '../config/menuItems';
import { normalizeProviderName } from '../lib/validation/providerChangeDetection';
import { mergeProviderNames } from '../lib/providerMerge';
import { getYearlyActivity } from '../services/watchActivity/shared';
import type { ActivityEvent } from '../types/WatchActivity';
import type { Series } from '../types/Series';
import type {
  ProviderInsight,
  ProviderSubscription,
  SubscriptionsConfig,
} from '../types/Subscription';

const DEFAULT_UNUSED_THRESHOLD_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface WatchlistGap {
  series: Series;
  providers: string[];
}

export interface UseSubscriptionsDataResult {
  loading: boolean;
  config: SubscriptionsConfig;
  insights: ProviderInsight[];
  activeInsights: ProviderInsight[];
  unusedInsights: ProviderInsight[];
  totalMonthlySpend: number;
  wastedMonthlySpend: number;
  watchlistGaps: WatchlistGap[];
  newSeasonGaps: WatchlistGap[];
  unusedThresholdDays: number;
  setUnusedThreshold: (days: number) => Promise<void>;
  updateProvider: (name: string, partial: Partial<ProviderSubscription>) => Promise<void>;
  setSeriesOverride: (seriesId: number, providerName: string | null) => Promise<void>;
  seriesOverrides: Record<string, string>;
}

function extractSeriesProviders(series: Series): string[] {
  return mergeProviderNames({ catalog: series.provider?.provider });
}

export function useSubscriptionsData(): UseSubscriptionsDataResult {
  const { user } = useAuth() || {};
  const { seriesList, allSeriesList, seriesWithNewSeasons } = useSeriesList();

  const [config, setConfig] = useState<SubscriptionsConfig>({ providers: {} });
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const currentYear = new Date().getFullYear();
    Promise.all([
      firebase.database().ref(`users/${user.uid}/subscriptions`).once('value'),
      getYearlyActivity(user.uid, currentYear),
      getYearlyActivity(user.uid, currentYear - 1),
    ])
      .then(([cfgSnap, current, previous]) => {
        if (cancelled) return;
        const raw = cfgSnap.val() as SubscriptionsConfig | null;
        setConfig({
          providers: raw?.providers ?? {},
          unusedThresholdDays: raw?.unusedThresholdDays ?? DEFAULT_UNUSED_THRESHOLD_DAYS,
          seriesOverrides: raw?.seriesOverrides ?? {},
        });
        setActivity([...current, ...previous]);
      })
      .catch((err: unknown) => {
        console.error('[useSubscriptionsData] Failed to load:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const unusedThresholdDays = config.unusedThresholdDays ?? DEFAULT_UNUSED_THRESHOLD_DAYS;

  const insights = useMemo<ProviderInsight[]>(() => {
    const now = Date.now();
    const thresholdMs = unusedThresholdDays * DAY_MS;
    const names = Array.from(SUPPORTED_PROVIDERS).sort();

    const activeNames = new Set(
      Object.entries(config.providers)
        .filter(([, v]) => v?.active)
        .map(([k]) => k)
    );

    // Catalog-Fallback: Wenn Watch-Events keinen Provider mitgespeichert haben
    // (Bug oder altes Logging), holen wir die Provider aus der Catalog-Info
    // der Serie. Der täglich laufende providers-Cron hält das aktuell.
    const providersBySeriesId: Record<number, string[]> = {};
    for (const series of allSeriesList) {
      const merged = extractSeriesProviders(series);
      if (merged.length > 0) {
        providersBySeriesId[series.id] = merged;
      }
    }

    const overrides = config.seriesOverrides ?? {};

    // Hilfsfunktion: Rohe Provider-Liste eines Events → normalisierte, deduplizierte
    // Namen. Watch-Events speichern TMDBs Originalnamen ("Apple TV+"), die
    // Subscriptions-Config kennt nur den normalisierten Namen ("Apple TV Plus").
    // Prio 1: User-Override pro Serie (z.B. "Rick and Morty schaue ich auf HBO Max")
    // Prio 2: gespeicherte providers im Event (normalisiert)
    // Prio 3: aktuelle Catalog-Info der Serie (Fallback für alte/kaputte Events)
    const normalizedProvidersFor = (event: (typeof activity)[number]): string[] => {
      const eAny = event as unknown as { seriesId?: number; movieId?: number };
      const id = eAny.seriesId ?? eAny.movieId;
      if (id != null && overrides[String(id)]) {
        return [overrides[String(id)]];
      }
      const raw = event.providers ?? (event.provider ? [event.provider] : []);
      const normalized = raw
        .map((p) => normalizeProviderName(p))
        .filter((p): p is string => p !== null);
      if (normalized.length > 0) return Array.from(new Set(normalized));
      if (id != null && providersBySeriesId[id]) return providersBySeriesId[id];
      return [];
    };

    // Phase 1: zähle exklusive Watches (Events mit genau einem Provider).
    // Das ist das härteste Signal für die tatsächliche Nutzung eines Anbieters.
    const exclusiveCount: Record<string, number> = {};
    for (const event of activity) {
      const providers = normalizedProvidersFor(event);
      if (providers.length !== 1) continue;
      const p = providers[0];
      exclusiveCount[p] = (exclusiveCount[p] ?? 0) + 1;
    }

    // Phase 2: ordne jedem Event genau einen Provider zu. Bei Multi-Provider-Events
    // bevorzugen wir aktive Abos und davon den meistgenutzten — so wandert ein
    // Watch nicht fälschlich auf einen Anbieter, der nur "auch" zur Verfügung steht.
    const attribute = (providers: string[]): string | null => {
      if (providers.length === 0) return null;
      if (providers.length === 1) return providers[0];
      const activeOnes = providers.filter((p) => activeNames.has(p));
      const candidates = activeOnes.length > 0 ? activeOnes : providers;
      let best = candidates[0];
      let bestScore = exclusiveCount[best] ?? 0;
      for (let i = 1; i < candidates.length; i++) {
        const score = exclusiveCount[candidates[i]] ?? 0;
        if (score > bestScore) {
          bestScore = score;
          best = candidates[i];
        }
      }
      return best;
    };

    const lastWatchByProvider: Record<string, number> = {};
    const lastTitleByProvider: Record<string, string> = {};
    const recentByProvider: Record<string, number> = {};
    const watchesByProvider: Record<
      string,
      { title: string; timestamp: number; seriesId: number | null }[]
    > = {};

    for (const event of activity) {
      const providers = normalizedProvidersFor(event);
      const attributed = attribute(providers);
      if (!attributed) continue;
      const ts = new Date(event.timestamp).getTime();
      if (Number.isNaN(ts)) continue;
      const eAny = event as unknown as {
        seriesTitle?: string;
        movieTitle?: string;
        seriesId?: number;
        movieId?: number;
      };
      const title = eAny.seriesTitle ?? eAny.movieTitle ?? '';
      const seriesId = eAny.seriesId ?? null;
      if ((lastWatchByProvider[attributed] ?? 0) < ts) {
        lastWatchByProvider[attributed] = ts;
        lastTitleByProvider[attributed] = title;
      }
      if (now - ts <= thresholdMs) {
        recentByProvider[attributed] = (recentByProvider[attributed] ?? 0) + 1;
      }
      if (!watchesByProvider[attributed]) watchesByProvider[attributed] = [];
      watchesByProvider[attributed].push({ title, timestamp: ts, seriesId });
    }

    return names.map((name) => {
      const sub = config.providers[name];
      const active = !!sub?.active;
      const monthlyPrice = typeof sub?.monthlyPrice === 'number' ? sub.monthlyPrice : 0;
      const cancelIfUnused = !!sub?.cancelIfUnused;

      const lastWatchedAt = lastWatchByProvider[name] ?? null;
      const lastWatchTitle = lastTitleByProvider[name] || null;
      const recentCount = recentByProvider[name] ?? 0;
      const recentWatches = (watchesByProvider[name] ?? [])
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

      const daysSinceLastWatch =
        lastWatchedAt !== null ? Math.max(0, Math.floor((now - lastWatchedAt) / DAY_MS)) : null;

      const isUnused = active && recentCount === 0;

      return {
        name,
        active,
        monthlyPrice,
        cancelIfUnused,
        lastWatchedAt,
        daysSinceLastWatch,
        recentCount,
        isUnused,
        lastWatchTitle,
        recentWatches,
      };
    });
  }, [config, activity, unusedThresholdDays, allSeriesList]);

  const activeInsights = useMemo(() => insights.filter((i) => i.active), [insights]);
  const unusedInsights = useMemo(
    () => insights.filter((i) => i.isUnused && i.cancelIfUnused),
    [insights]
  );

  const totalMonthlySpend = useMemo(
    () => activeInsights.reduce((sum, i) => sum + i.monthlyPrice, 0),
    [activeInsights]
  );
  const wastedMonthlySpend = useMemo(
    () => unusedInsights.reduce((sum, i) => sum + i.monthlyPrice, 0),
    [unusedInsights]
  );

  const activeProviderSet = useMemo(
    () => new Set(activeInsights.map((i) => i.name)),
    [activeInsights]
  );

  const watchlistGaps = useMemo<WatchlistGap[]>(() => {
    const result: WatchlistGap[] = [];
    for (const series of seriesList) {
      if (!series.watchlist) continue;
      const providers = extractSeriesProviders(series);
      if (providers.length === 0) continue;
      const hasActive = providers.some((p) => activeProviderSet.has(p));
      if (hasActive) continue;
      result.push({ series, providers });
    }
    return result;
  }, [seriesList, activeProviderSet]);

  const newSeasonGaps = useMemo<WatchlistGap[]>(() => {
    const result: WatchlistGap[] = [];
    for (const series of seriesWithNewSeasons) {
      const providers = extractSeriesProviders(series);
      if (providers.length === 0) continue;
      const hasActive = providers.some((p) => activeProviderSet.has(p));
      if (hasActive) continue;
      result.push({ series, providers });
    }
    return result;
  }, [seriesWithNewSeasons, activeProviderSet]);

  const persist = useCallback(
    async (next: SubscriptionsConfig) => {
      if (!user) return;
      await firebase.database().ref(`users/${user.uid}/subscriptions`).set(next);
    },
    [user]
  );

  const updateProvider = useCallback(
    async (name: string, partial: Partial<ProviderSubscription>) => {
      const previous: ProviderSubscription = config.providers[name] ?? { active: false };
      const merged: ProviderSubscription = { ...previous, ...partial };
      // Aufräumen: undefined Felder entfernen, damit Firebase keine null-Reste behält
      const clean: ProviderSubscription = { active: merged.active };
      if (typeof merged.monthlyPrice === 'number' && merged.monthlyPrice >= 0) {
        clean.monthlyPrice = merged.monthlyPrice;
      }
      if (merged.cancelIfUnused) clean.cancelIfUnused = true;

      const next: SubscriptionsConfig = {
        ...config,
        providers: { ...config.providers, [name]: clean },
      };
      setConfig(next);
      await persist(next);
    },
    [config, persist]
  );

  const setUnusedThreshold = useCallback(
    async (days: number) => {
      const next: SubscriptionsConfig = {
        ...config,
        unusedThresholdDays: Math.max(7, Math.min(365, Math.round(days))),
      };
      setConfig(next);
      await persist(next);
    },
    [config, persist]
  );

  const setSeriesOverride = useCallback(
    async (seriesId: number, providerName: string | null) => {
      const currentOverrides = config.seriesOverrides ?? {};
      const nextOverrides = { ...currentOverrides };
      if (providerName === null) {
        delete nextOverrides[String(seriesId)];
      } else {
        nextOverrides[String(seriesId)] = providerName;
      }
      const next: SubscriptionsConfig = {
        ...config,
        seriesOverrides: nextOverrides,
      };
      setConfig(next);
      await persist(next);
    },
    [config, persist]
  );

  return {
    loading,
    config,
    insights,
    activeInsights,
    unusedInsights,
    totalMonthlySpend,
    wastedMonthlySpend,
    watchlistGaps,
    newSeasonGaps,
    unusedThresholdDays,
    setUnusedThreshold,
    updateProvider,
    setSeriesOverride,
    seriesOverrides: config.seriesOverrides ?? {},
  };
}
