import { useEffect, useState } from 'react';
import type firebase from 'firebase/compat/app';
import { dbGet, paths } from '../../../services/db/ref';
import { useOwnPhotoURL } from '../../../services/profile/ownProfilePhoto';

/** Name und Profilbild für die Begrüßung — aus der RTDB, sonst aus dem Auth-Konto. */
export function useGreetingIdentity(user: firebase.User | null) {
  const [dbDisplayName, setDbDisplayName] = useState<string | null>(null);
  const [dbPhotoURL, setDbPhotoURL] = useState<string | null>(null);
  // Reaktiv statt Einmal-Lesung: nach einem Upload aktualisiert sich der Avatar sofort.
  const ownPhotoURL = useOwnPhotoURL(dbPhotoURL || user?.photoURL);

  useEffect(() => {
    if (!user) return;
    dbGet<string>(paths.displayName(user.uid))
      .then((name) => {
        if (name) setDbDisplayName(name);
      })
      .catch(() => {}); // bewusst still: Begrüßung fällt auf den Auth-Displaynamen zurück
    // DB-Profilbild hat Vorrang — Auth-photoURL kann das Google-/Apple-Foto sein
    dbGet<string>(paths.photoURL(user.uid))
      .then((url) => {
        if (url) setDbPhotoURL(url);
      })
      .catch(() => {});
  }, [user]);

  return {
    displayName: dbDisplayName || user?.displayName || undefined,
    photoURL: ownPhotoURL || undefined,
  };
}
