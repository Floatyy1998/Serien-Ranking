import { useEffect, useState } from 'react';
import type firebase from 'firebase/compat/app';
import {
  emptyPetItems,
  readPetItems,
  type PetItemCounts,
} from '../../components/pet/data/petItems';
import { useAuth } from '../../contexts/AuthContext';
import { dbRef, userPath } from '../../services/db/ref';
import { subscribeValue } from '../../services/db/subscribeValue';

/** Vorrat an Verbrauchsgütern, live aus dem eigenen Konto. */
export function usePetItems(): PetItemCounts {
  const { user } = useAuth() || {};
  const [items, setItems] = useState<PetItemCounts>(emptyPetItems);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeValue(
      dbRef(userPath(user.uid, 'petItems')),
      (snap: firebase.database.DataSnapshot) => setItems(readPetItems(snap.val())),
      { label: 'petItems' }
    );
  }, [user?.uid]);

  return items;
}
