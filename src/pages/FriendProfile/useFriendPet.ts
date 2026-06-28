import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import type { Pet } from '../../types/pet.types';

interface RawPet extends Omit<Pet, 'lastFed' | 'createdAt' | 'deathTime'> {
  lastFed?: string | number;
  createdAt?: string | number;
  deathTime?: string | number;
}

export function useFriendPet(friendUid: string | undefined): {
  loading: boolean;
  pet: Pet | null;
} {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!friendUid) {
      setPet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let activePetRef: firebase.database.Reference | null = null;
    let petRef: firebase.database.Reference | null = null;
    let petHandler: ((s: firebase.database.DataSnapshot) => void) | null = null;

    activePetRef = firebase.database().ref(`users/${friendUid}/petWidget/activePetId`);

    const activeHandler = (snapshot: firebase.database.DataSnapshot) => {
      const activePetId = snapshot.val() as string | null;

      if (petRef && petHandler) {
        petRef.off('value', petHandler);
        petRef = null;
        petHandler = null;
      }

      if (!activePetId) {
        setPet(null);
        setLoading(false);
        return;
      }

      petRef = firebase.database().ref(`users/${friendUid}/pets/${activePetId}`);
      petHandler = (snap: firebase.database.DataSnapshot) => {
        const data = snap.val() as RawPet | null;
        if (!data) {
          setPet(null);
          setLoading(false);
          return;
        }
        setPet({
          ...(data as unknown as Pet),
          id: activePetId,
          lastFed: data.lastFed ? new Date(data.lastFed) : new Date(),
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          deathTime: data.deathTime ? new Date(data.deathTime) : undefined,
        });
        setLoading(false);
      };
      petRef.on('value', petHandler);
    };

    activePetRef.on('value', activeHandler);

    return () => {
      activePetRef?.off('value', activeHandler);
      if (petRef && petHandler) petRef.off('value', petHandler);
    };
  }, [friendUid]);

  return { loading, pet };
}
