/**
 * Leichtgewichtiger Hook: lädt nur die Provider-Subscription-Config aus
 * Firebase (kein activityLog) und liefert das Set der aktiv abonnierten
 * Provider-Namen + ein helper für Series-Provider-Intersection.
 *
 * Gedacht für jede UI-Stelle, die "ist diese Serie auf meinen Abos?" wissen
 * will (Filter, Coloring, Recommendations).
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';
import { mergeProviderNames } from '../lib/providerMerge';
import type { ProviderSubscription } from '../types/Subscription';
import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';

interface SubsSnapshot {
  active: Set<string>;
  overrides: Record<string, string>;
}

// Modul-Cache: pro UID ein Snapshot, vermeidet doppelte Reads im selben Tab
const cache = new Map<string, SubsSnapshot>();
const pending = new Map<string, Promise<SubsSnapshot>>();

async function loadSubs(uid: string): Promise<SubsSnapshot> {
  if (cache.has(uid)) return cache.get(uid)!;
  if (pending.has(uid)) return pending.get(uid)!;
  const p = firebase
    .database()
    .ref(`users/${uid}/subscriptions`)
    .once('value')
    .then((snap) => {
      const raw = (snap.val() ?? {}) as {
        providers?: Record<string, ProviderSubscription>;
        seriesOverrides?: Record<string, string>;
      };
      const active = new Set<string>();
      for (const [name, sub] of Object.entries(raw.providers ?? {})) {
        if (sub?.active) active.add(name);
      }
      const snapshot: SubsSnapshot = {
        active,
        overrides: raw.seriesOverrides ?? {},
      };
      cache.set(uid, snapshot);
      pending.delete(uid);
      return snapshot;
    })
    .catch((err: unknown) => {
      console.error('[useActiveSubscriptions] Failed:', err);
      pending.delete(uid);
      return { active: new Set<string>(), overrides: {} };
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
  const [hasAnySubscription, setHasAnySubscription] = useState(false);
  const [loading, setLoading] = useState(!user || !cache.has(user.uid));

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadSubs(user.uid).then((snap) => {
      if (cancelled) return;
      setActiveProviders(snap.active);
      setSeriesOverrides(snap.overrides);
      setLoading(false);
    });
    // Auch hasAnySubscription separat ermitteln (auch inaktive Abos zählen)
    firebase
      .database()
      .ref(`users/${user.uid}/subscriptions/providers`)
      .once('value')
      .then((snap) => {
        if (cancelled) return;
        const raw = (snap.val() ?? {}) as Record<string, ProviderSubscription>;
        setHasAnySubscription(Object.keys(raw).length > 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
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

  return useMemo(
    () => ({
      activeProviders,
      hasAnySubscription,
      isOnActiveSub,
      seriesOverrides,
      getSeriesOverride,
      loading,
    }),
    [
      activeProviders,
      hasAnySubscription,
      isOnActiveSub,
      seriesOverrides,
      getSeriesOverride,
      loading,
    ]
  );
}
