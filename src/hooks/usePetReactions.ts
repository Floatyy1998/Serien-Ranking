import { useEffect, useRef, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

export type PetReactionTone = 'cheer' | 'streak' | 'milestone' | 'love';

export interface PetReaction {
  id: number;
  tone: PetReactionTone;
  emoji: string;
  message: string;
}

const STREAK_MILESTONES = new Set([3, 7, 14, 21, 30, 50, 100, 200, 365]);

interface InternalEvent {
  type: 'reaction';
  reaction: PetReaction;
}

/**
 * Watches the user's streak document and emits a passive reaction whenever
 * the streak crosses a milestone or just ticked up. Also exposes an
 * imperative trigger (via window CustomEvent "pet-reaction") so other parts
 * of the app can ask the pet to celebrate – e.g. after a freshly marked
 * episode – without prop drilling.
 */
export function usePetReactions(uid: string | undefined): PetReaction | null {
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const prevStreakRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to surface a reaction and auto-dismiss it.
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const show = (r: Omit<PetReaction, 'id'>) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setReaction({ ...r, id: Date.now() });
    dismissTimerRef.current = setTimeout(() => setReaction(null), 4200);
  };

  // Listen for imperative triggers from anywhere in the app.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<InternalEvent['reaction']>).detail;
      if (!detail) return;
      show(detail);
    };
    window.addEventListener('pet-reaction', handler as EventListener);
    return () => window.removeEventListener('pet-reaction', handler as EventListener);
  }, []);

  // Subscribe to streak data and react to upward changes.
  useEffect(() => {
    if (!uid) return;
    const year = new Date().getFullYear();
    const ref = firebase.database().ref(`users/${uid}/wrapped/${year}/streak`);

    const onValue = (snap: firebase.database.DataSnapshot) => {
      const data = snap.val() as { currentStreak?: number } | null;
      const current = data?.currentStreak ?? 0;
      const previous = prevStreakRef.current;
      prevStreakRef.current = current;

      // First snapshot – just remember the value.
      if (previous === null) return;
      if (current <= previous) return;

      if (STREAK_MILESTONES.has(current)) {
        show({
          tone: 'milestone',
          emoji: current >= 100 ? '🏆' : current >= 30 ? '🌟' : '🎉',
          message: `${current} Tage Streak!`,
        });
        return;
      }
      if (current >= 3) {
        show({
          tone: 'streak',
          emoji: '🔥',
          message: `+1 · Streak ${current}`,
        });
        return;
      }
      show({ tone: 'cheer', emoji: '✨', message: 'Folge gesehen!' });
    };

    ref.on('value', onValue);
    return () => {
      ref.off('value', onValue);
    };
  }, [uid]);

  return reaction;
}

/**
 * Imperative trigger – call from anywhere to ask the pet to react.
 * The widget listens via the window CustomEvent bus.
 */
export function triggerPetReaction(reaction: Omit<PetReaction, 'id'>): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('pet-reaction', { detail: reaction }));
}
