/**
 * Liefert Serien aus seriesWithNewSeasons, deren Provider der User aktuell
 * NICHT abonniert hat. Leichtgewichtig: liest nur die Provider-Config aus
 * Firebase, kein activityLog. Gedacht für die HomePage-Notification.
 *
 * Liefert nur Treffer, wenn der User überhaupt mindestens ein Abo gepflegt
 * hat — sonst wäre die Warnung sinnlos.
 */

import { dbRef, dbUpdate, userPath } from '../services/db/ref';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { normalizeProviderName } from '../services/detection/providerChangeDetection';
import type { ProviderSubscription } from '../types/Subscription';
import type { Series } from '../types/Series';

export interface UnsubscribedNewSeasonEntry {
  series: Series;
  providers: string[];
}

const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function useUnsubscribedNewSeasons(seriesWithNewSeasons: Series[]): {
  entries: UnsubscribedNewSeasonEntry[];
  dismiss: () => Promise<void>;
} {
  const { user } = useAuth() || {};
  const [activeProviders, setActiveProviders] = useState<Set<string>>(new Set());
  const [hasAnySubscription, setHasAnySubscription] = useState(false);
  const [dismissed, setDismissed] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      dbRef(userPath(user.uid, 'subscriptions', 'providers')).once('value'),
      dbRef(userPath(user.uid, 'unsubscribedNewSeasonDismissed')).once('value'),
    ])
      .then(([providersSnap, dismissSnap]) => {
        if (cancelled) return;
        const providers = (providersSnap.val() ?? {}) as Record<string, ProviderSubscription>;
        const active = new Set<string>();
        for (const [name, sub] of Object.entries(providers)) {
          if (sub?.active) active.add(name);
        }
        setActiveProviders(active);
        setHasAnySubscription(Object.keys(providers).length > 0);
        setDismissed((dismissSnap.val() ?? {}) as Record<string, number>);
      })
      .catch((err: unknown) => {
        console.error('[useUnsubscribedNewSeasons] Failed to load:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Snapshot von "jetzt" bei Mount — pure für useMemo (vs. impure Date.now()).
  const [now] = useState(() => Date.now());

  const entries = useMemo<UnsubscribedNewSeasonEntry[]>(() => {
    if (!hasAnySubscription) return [];
    const result: UnsubscribedNewSeasonEntry[] = [];
    for (const series of seriesWithNewSeasons) {
      const dismissAt = dismissed[String(series.id)];
      if (typeof dismissAt === 'number' && now - dismissAt < DISMISS_TTL_MS) continue;
      const raw = series.provider?.provider?.map((p) => p.name) ?? [];
      const providers = Array.from(
        new Set(raw.map((n) => normalizeProviderName(n)).filter((n): n is string => n !== null))
      );
      if (providers.length === 0) continue;
      if (providers.some((p) => activeProviders.has(p))) continue;
      result.push({ series, providers });
    }
    return result;
  }, [seriesWithNewSeasons, activeProviders, hasAnySubscription, dismissed, now]);

  const dismiss = async (): Promise<void> => {
    if (!user || entries.length === 0) return;
    const now = Date.now();
    const updates: Record<string, number> = {};
    const nextLocal: Record<string, number> = { ...dismissed };
    for (const { series } of entries) {
      updates[`users/${user.uid}/unsubscribedNewSeasonDismissed/${series.id}`] = now;
      nextLocal[String(series.id)] = now;
    }
    setDismissed(nextLocal);
    try {
      await dbUpdate(updates);
    } catch (err: unknown) {
      console.error('[useUnsubscribedNewSeasons] Failed to dismiss:', err);
    }
  };

  return { entries, dismiss };
}
