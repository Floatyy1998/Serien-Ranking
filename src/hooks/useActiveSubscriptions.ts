/**
 * Leichtgewichtiger Hook: lädt nur die Provider-Subscription-Config aus
 * Firebase (kein activityLog) und liefert das Set der aktiv abonnierten
 * Provider-Namen + ein helper für Series-Provider-Intersection.
 *
 * Gedacht für jede UI-Stelle, die "ist diese Serie auf meinen Abos?" wissen
 * will (Filter, Coloring, Recommendations).
 */

import { dbRef, userPath } from '../services/db/ref';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mergeProviderNames } from '../lib/providerMerge';
import type { ProviderSubscription } from '../types/Subscription';
import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';

interface SubsSnapshot {
  active: Set<string>;
  overrides: Record<string, string>;
  /** Live-Schnappschuss der Provider je Serie (users/$uid/knownProviders).
   *  Der Katalog wird nur einmal taeglich aktualisiert; die Detailseite fragt
   *  TMDB beim Oeffnen live und legt das Ergebnis hier ab. Ohne diese Quelle
   *  zeigen Listen- und Kalenderansichten bis zu einen Tag lang einen anderen
   *  Provider als die Detailseite. */
  known: Record<string, string[]>;
}

// Modul-Cache: pro UID ein Snapshot, vermeidet doppelte Reads im selben Tab
const cache = new Map<string, SubsSnapshot>();
const pending = new Map<string, Promise<SubsSnapshot>>();
// Gemountete Hooks, die bei invalidate() sofort neu laden sollen (z.B. Override
// auf der Detailseite gesetzt → Homepage-Karten zeigen sonst den alten Provider).
const listeners = new Set<() => void>();

async function loadSubs(uid: string): Promise<SubsSnapshot> {
  const cached = cache.get(uid);
  if (cached) return cached;
  const inFlight = pending.get(uid);
  if (inFlight) return inFlight;
  const p = Promise.all([
    dbRef(userPath(uid, 'subscriptions')).once('value'),
    dbRef(userPath(uid, 'knownProviders')).once('value'),
  ])
    .then(([snap, knownSnap]) => {
      const raw = (snap.val() ?? {}) as {
        providers?: Record<string, ProviderSubscription>;
        seriesOverrides?: Record<string, string>;
      };
      const active = new Set<string>();
      for (const [name, sub] of Object.entries(raw.providers ?? {})) {
        if (sub?.active) active.add(name);
      }
      const knownRaw = (knownSnap.val() ?? {}) as Record<string, { providers?: string[] }>;
      const known: Record<string, string[]> = {};
      for (const [seriesId, eintrag] of Object.entries(knownRaw)) {
        if (Array.isArray(eintrag?.providers) && eintrag.providers.length) {
          known[seriesId] = eintrag.providers;
        }
      }
      const snapshot: SubsSnapshot = {
        active,
        overrides: raw.seriesOverrides ?? {},
        known,
      };
      cache.set(uid, snapshot);
      pending.delete(uid);
      return snapshot;
    })
    .catch((err: unknown) => {
      console.error('[useActiveSubscriptions] Failed:', err);
      pending.delete(uid);
      return { active: new Set<string>(), overrides: {}, known: {} };
    });
  pending.set(uid, p);
  return p;
}

export function invalidateActiveSubscriptions(uid?: string): void {
  if (uid) {
    cache.delete(uid);
    pending.delete(uid);
  } else {
    cache.clear();
    pending.clear();
  }
  for (const notify of listeners) notify();
}

export interface UseActiveSubscriptionsResult {
  activeProviders: Set<string>;
  /** True wenn der User mindestens ein Abo gepflegt hat (egal ob aktiv). */
  hasAnySubscription: boolean;
  /** True wenn die Serie auf einem der aktiven Abos läuft. */
  isOnActiveSub: (item: Series | Movie) => boolean;
  /** seriesId → vom User manuell zugewiesener Provider-Name. */
  seriesOverrides: Record<string, string>;
  /** Liefert den Override-Provider-Namen für eine Serie, falls gesetzt. */
  getSeriesOverride: (seriesId: number | string) => string | null;
  getKnownProviders: (seriesId: number | string) => string[];
  loading: boolean;
}

export function useActiveSubscriptions(): UseActiveSubscriptionsResult {
  const { user } = useAuth() || {};
  const initial = user ? cache.get(user.uid) : undefined;
  const [activeProviders, setActiveProviders] = useState<Set<string>>(
    () => initial?.active ?? new Set()
  );
  const [seriesOverrides, setSeriesOverrides] = useState<Record<string, string>>(
    () => initial?.overrides ?? {}
  );
  const [knownProviders, setKnownProviders] = useState<Record<string, string[]>>(
    () => initial?.known ?? {}
  );
  const [hasAnySubscription, setHasAnySubscription] = useState(false);
  const [loading, setLoading] = useState(!user || !cache.has(user.uid));

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const refresh = () => {
      loadSubs(user.uid).then((snap) => {
        if (cancelled) return;
        setActiveProviders(snap.active);
        setSeriesOverrides(snap.overrides);
        setKnownProviders(snap.known);
        setLoading(false);
      });
    };
    refresh();
    listeners.add(refresh);
    // Auch hasAnySubscription separat ermitteln (auch inaktive Abos zählen)
    dbRef(userPath(user.uid, 'subscriptions', 'providers'))
      .once('value')
      .then((snap) => {
        if (cancelled) return;
        const raw = (snap.val() ?? {}) as Record<string, ProviderSubscription>;
        setHasAnySubscription(Object.keys(raw).length > 0);
      })
      .catch((error) => console.error('Abo-Status konnte nicht geladen werden:', error));
    return () => {
      cancelled = true;
      listeners.delete(refresh);
    };
  }, [user]);

  const isOnActiveSub = useCallback(
    (item: Series | Movie): boolean => {
      if (activeProviders.size === 0) return false;
      const override = seriesOverrides[String(item.id)];
      if (override) return activeProviders.has(override);
      const names = mergeProviderNames({ catalog: item.provider?.provider });
      return names.some((p) => activeProviders.has(p));
    },
    [activeProviders, seriesOverrides]
  );

  const getSeriesOverride = useCallback(
    (seriesId: number | string): string | null => seriesOverrides[String(seriesId)] ?? null,
    [seriesOverrides]
  );

  /** Zuletzt live gefundene Provider-Namen einer Serie (ohne Logo). */
  const getKnownProviders = useCallback(
    (seriesId: number | string): string[] => knownProviders[String(seriesId)] ?? [],
    [knownProviders]
  );

  return useMemo(
    () => ({
      activeProviders,
      hasAnySubscription,
      isOnActiveSub,
      seriesOverrides,
      getSeriesOverride,
      getKnownProviders,
      loading,
    }),
    [
      activeProviders,
      hasAnySubscription,
      isOnActiveSub,
      seriesOverrides,
      getSeriesOverride,
      getKnownProviders,
      loading,
    ]
  );
}
