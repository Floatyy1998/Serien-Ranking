/**
 * Lädt einmal pro Session die `users/{uid}/knownProviders` aus Firebase
 * (TMDB-Live-Snapshot der Provider, vom Provider-Change-Detector gepflegt)
 * und cached das im memory. Wird als Live-Override über die statischen
 * Catalog-Daten gelegt.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';

const cache = new Map<string, Record<string, string[]>>();
const pending = new Map<string, Promise<Record<string, string[]>>>();

async function loadKnownProviders(uid: string): Promise<Record<string, string[]>> {
  if (cache.has(uid)) return cache.get(uid)!;
  if (pending.has(uid)) return pending.get(uid)!;
  const p = firebase
    .database()
    .ref(`users/${uid}/knownProviders`)
    .once('value')
    .then((snap) => {
      const raw = (snap.val() as Record<string, { providers?: string[] }> | null) ?? {};
      const flat: Record<string, string[]> = {};
      for (const [id, entry] of Object.entries(raw)) {
        if (entry?.providers && entry.providers.length > 0) flat[id] = entry.providers;
      }
      cache.set(uid, flat);
      pending.delete(uid);
      return flat;
    })
    .catch((err: unknown) => {
      console.error('[useKnownProviders] Failed:', err);
      pending.delete(uid);
      return {};
    });
  pending.set(uid, p);
  return p;
}

export function useKnownProviders(): Record<string, string[]> {
  const { user } = useAuth() || {};
  const [map, setMap] = useState<Record<string, string[]>>(() =>
    user ? (cache.get(user.uid) ?? {}) : {}
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadKnownProviders(user.uid).then((m) => {
      if (!cancelled) setMap(m);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return map;
}
