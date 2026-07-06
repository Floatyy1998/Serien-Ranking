import type firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { dbRef, dbGet, userPath } from '../lib/db/ref';

/**
 * Listens for incoming pet_gift notifications and applies their effects
 * (hunger/happiness deltas) to the receiver's active pet. Marks each
 * notification's `applied` flag so the same gift is never applied twice,
 * even if the listener re-fires after a tab refresh.
 *
 * The notification itself stays in the bell so the receiver can see
 * who sent what — only the `applied` flag is added.
 */
export function usePetGiftReceiver(): void {
  const { user } = useAuth() || {};

  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    const notifRef = dbRef(userPath(uid, 'notifications'))
      .orderByChild('timestamp')
      .limitToLast(20);

    const handler = async (snap: firebase.database.DataSnapshot) => {
      const data = snap.val() as Record<string, RawGiftNotification> | null;
      if (!data) return;

      for (const [notifId, notif] of Object.entries(data)) {
        if (notif?.type !== 'pet_gift') continue;
        if (notif.applied === true) continue;
        const giftData = notif.data;
        if (!giftData) continue;
        if (typeof giftData.hungerDelta !== 'number' || typeof giftData.happinessDelta !== 'number')
          continue;

        try {
          const activePetId = await dbGet<string>(userPath(uid, 'petWidget', 'activePetId'));
          if (!activePetId) continue;

          const petRef = dbRef(userPath(uid, 'pets', activePetId));
          const petSnap = await petRef.once('value');
          const pet = petSnap.val() as {
            hunger?: number;
            happiness?: number;
            isAlive?: boolean;
          } | null;
          if (!pet) continue;
          if (pet.isAlive === false) {
            await dbRef(userPath(uid, 'notifications', notifId, 'applied')).set(true);
            continue;
          }

          const currentHunger = typeof pet.hunger === 'number' ? pet.hunger : 50;
          const currentHappiness = typeof pet.happiness === 'number' ? pet.happiness : 50;
          const newHunger = Math.max(0, Math.min(100, currentHunger + giftData.hungerDelta));
          const newHappiness = Math.max(
            0,
            Math.min(100, currentHappiness + giftData.happinessDelta)
          );

          await Promise.all([
            petRef.update({ hunger: newHunger, happiness: newHappiness }),
            dbRef(userPath(uid, 'notifications', notifId, 'applied')).set(true),
          ]);
        } catch (err) {
          console.error('[usePetGiftReceiver] apply failed', err);
        }
      }
    };

    notifRef.on('value', handler);
    return () => {
      notifRef.off('value', handler);
    };
  }, [user?.uid]);
}

interface RawGiftNotification {
  type?: string;
  applied?: boolean;
  data?: {
    hungerDelta?: number;
    happinessDelta?: number;
  };
}
