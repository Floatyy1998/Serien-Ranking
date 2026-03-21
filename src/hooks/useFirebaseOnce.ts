/**
 * useFirebaseOnce - Simple hook to fetch Firebase data once with loading/error state.
 *
 * Use this instead of raw useEffect + firebase.once() patterns:
 *
 * BEFORE (anti-pattern, repeated in many components):
 *   useEffect(() => {
 *     firebase.database().ref('path').once('value').then(snap => setState(snap.val()));
 *   }, []);
 *
 * AFTER:
 *   const { data, loading, error } = useFirebaseOnce<MyType>('path');
 *
 * Features:
 * - Skips fetch when path is null/empty (useful for conditional fetches)
 * - Cleans up / cancels on unmount via abortRef flag
 * - Typed with generics
 * - Refetch on demand
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseFirebaseOnceResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFirebaseOnce<T = unknown>(
  path: string | null | undefined
): UseFirebaseOnceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<Error | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    cancelledRef.current = false;
    setLoading(true);
    setError(null);

    firebase
      .database()
      .ref(path)
      .once('value')
      .then((snapshot) => {
        if (cancelledRef.current) return;
        setData(snapshot.exists() ? (snapshot.val() as T) : null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelledRef.current) return;
        setError(err);
        setLoading(false);
      });

    return () => {
      cancelledRef.current = true;
    };
  }, [path, fetchTrigger]);

  const refetch = useCallback(() => {
    setFetchTrigger((n) => n + 1);
  }, []);

  return { data, loading, error, refetch };
}

export default useFirebaseOnce;
