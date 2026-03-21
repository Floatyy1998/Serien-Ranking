import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';

export interface UseFirebaseRefResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Abonniert einen Firebase Realtime Database Pfad und gibt die Daten reaktiv zurück.
 * Der Listener wird automatisch beim Unmount oder bei Pfadänderung bereinigt.
 *
 * @param path - Firebase-Datenbankpfad (z.B. "users/uid/settings"). null deaktiviert den Hook.
 *
 * @example
 * const { data, loading, error } = useFirebaseRef<UserSettings>(`users/${uid}/settings`);
 */
export function useFirebaseRef<T>(path: string | null): UseFirebaseRefResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(path !== null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (path === null) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = firebase.database().ref(path);

    const onValue = ref.on(
      'value',
      (snapshot) => {
        setData(snapshot.val() as T | null);
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      ref.off('value', onValue);
    };
  }, [path]);

  return { data, loading, error };
}
