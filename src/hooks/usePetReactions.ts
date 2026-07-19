import { useEffect, useRef, useState } from 'react';
import type firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { dbRef, userPath } from '../services/db/ref';
import { t } from '../services/i18n';

export type PetReactionTone =
  | 'cheer'
  | 'streak'
  | 'milestone'
  | 'levelup'
  | 'love'
  | 'idle'
  | 'morning'
  | 'evening'
  | 'late'
  | 'binge'
  | 'rewatch'
  | 'movie'
  | 'rated';

export interface PetReaction {
  id: number;
  tone: PetReactionTone;
  emoji: string;
  message: string;
}

const STREAK_MILESTONES = new Set([3, 7, 14, 21, 30, 50, 100, 200, 365]);

interface SpeechLine {
  emoji: string;
  message: string;
}

// Multiple variations per tone so the pet doesn't repeat itself. Picked
// at random on each show() call. Keep messages short – the bubble is tiny.
const SPEECH_POOL: Record<PetReactionTone, SpeechLine[]> = {
  cheer: [
    { emoji: '✨', message: t('Folge gesehen!') },
    { emoji: '🎬', message: t('War sie gut?') },
    { emoji: '👀', message: t('Eine mehr!') },
    { emoji: '🌟', message: t('Top, weiter so!') },
    { emoji: '🍿', message: t('Popcorn ready?') },
    { emoji: '💫', message: t('Yes!') },
    { emoji: '🎯', message: t('Cleanup-Folge!') },
  ],
  streak: [
    { emoji: '🔥', message: t('Streak hält!') },
    { emoji: '🔥', message: t('Tag {n} – läuft!') },
    { emoji: '⚡', message: t('Combo Tag {n}') },
    { emoji: '📈', message: t('Streak {n}!') },
    { emoji: '🏃', message: t('Dranbleiben – {n} Tage') },
    { emoji: '🔥', message: t('{n} Tage in Folge') },
  ],
  milestone: [
    { emoji: '🎉', message: t('{n} Tage Streak!') },
    { emoji: '🏆', message: t('Meilenstein: {n} Tage') },
    { emoji: '🌟', message: t('{n} Tage – krass!') },
    { emoji: '👑', message: t('{n} Tage Streak – Held') },
    { emoji: '🎊', message: t('Boom, {n} Tage!') },
  ],
  levelup: [
    { emoji: '🎉', message: t('Level {n}! 🆙') },
    { emoji: '⬆️', message: t('Aufgestiegen – Level {n}!') },
    { emoji: '🏅', message: t('Level {n} erreicht!') },
    { emoji: '✨', message: t('Level {n}, stark!') },
    { emoji: '🚀', message: t('Level {n} – weiter so!') },
  ],
  love: [
    { emoji: '💕', message: t('Hab dich lieb!') },
    { emoji: '🥰', message: t('Du fütterst mich gut') },
    { emoji: '❤️', message: t('Bester Mensch') },
    { emoji: '😻', message: t('Mehr Folgen, please') },
  ],
  idle: [
    { emoji: '😴', message: t('Was guckst du heute?') },
    { emoji: '🤔', message: t('Hmm, langweilig …') },
    { emoji: '👋', message: t('Noch da?') },
    { emoji: '🍿', message: t('Lust auf ne Folge?') },
    { emoji: '📺', message: t('Watchlist offen?') },
    { emoji: '💭', message: t('Was läuft so?') },
    { emoji: '🐾', message: t('Bin da, falls du was guckst') },
    { emoji: '🎮', message: t('Pause oder Folge?') },
    { emoji: '🌙', message: t('Eine geht noch …') },
  ],
  morning: [
    { emoji: '☕', message: t('Guten Morgen!') },
    { emoji: '🌅', message: t('Schon wach?') },
    { emoji: '🥱', message: t('Frühstücks-Episode?') },
    { emoji: '🍳', message: t('Folge zum Brunch?') },
    { emoji: '☀️', message: t('Bereit für den Tag') },
  ],
  evening: [
    { emoji: '🌆', message: t('Primetime!') },
    { emoji: '🍿', message: t('Serie an?') },
    { emoji: '🛋️', message: t('Couch ruft') },
    { emoji: '🌃', message: t('Abendprogramm') },
    { emoji: '🎬', message: t('Showtime') },
  ],
  late: [
    { emoji: '🌙', message: t('Späte Folge?') },
    { emoji: '🦉', message: t('Nachteule-Modus') },
    { emoji: '😴', message: t('Noch eine, dann Schluss') },
    { emoji: '💤', message: t('Nicht zu spät!') },
    { emoji: '🌌', message: t('Last episode call') },
  ],
  binge: [
    { emoji: '🚀', message: t('Binge-Mode!') },
    { emoji: '🔥', message: t('On fire!') },
    { emoji: '⏩', message: t('Weiter, weiter!') },
    { emoji: '🍿', message: t('Du bingest gerade') },
    { emoji: '💪', message: t('Marathon läuft') },
  ],
  rewatch: [
    { emoji: '🔁', message: t('Rewatch ist heilig') },
    { emoji: '💜', message: t('Comfort show!') },
    { emoji: '🎞️', message: t('Klassiker geht immer') },
    { emoji: '📼', message: t('Old but gold') },
  ],
  movie: [
    { emoji: '🎬', message: t('Film-Abend!') },
    { emoji: '🍿', message: t('Großes Kino') },
    { emoji: '🎟️', message: t('Premiere für mich!') },
  ],
  rated: [
    { emoji: '⭐', message: t('Bewertet – stark!') },
    { emoji: '📝', message: t('Dein Urteil zählt') },
    { emoji: '🎯', message: t('Saubere Wertung') },
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function interpolate(message: string, vars: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

/**
 * Pick a random line from the pool for a given tone and fill in template
 * variables (e.g. {n} for streak length).
 */
export function pickReaction(
  tone: PetReactionTone,
  vars: Record<string, string | number> = {}
): Omit<PetReaction, 'id'> {
  const pool = SPEECH_POOL[tone] ?? SPEECH_POOL.cheer;
  const line = pickRandom(pool);
  return {
    tone,
    emoji: line.emoji,
    message: interpolate(line.message, vars),
  };
}

interface InternalEvent {
  type: 'reaction';
  reaction: PetReaction;
}

// Idle ticker: an ambient line whenever the user has been on the page for a
// while without triggering a real reaction. Keeps the pet feeling alive
// without nagging.
const IDLE_MIN_DELAY_MS = 6 * 60 * 1000; // 6 min
const IDLE_MAX_DELAY_MS = 14 * 60 * 1000; // 14 min

function pickIdleTone(): PetReactionTone {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 18 && h < 22) return 'evening';
  if (h >= 22 || h < 5) return 'late';
  return 'idle';
}

/**
 * Watches the user's streak document and emits a passive reaction whenever
 * the streak crosses a milestone or just ticked up. Also exposes an
 * imperative trigger (via window CustomEvent "pet-reaction") so other parts
 * of the app can ask the pet to celebrate – e.g. after a freshly marked
 * episode – without prop drilling.
 *
 * In addition, the pet drops occasional idle/ambient lines every 6–14 min
 * if nothing else triggered a reaction. Time-of-day shapes the message
 * (morning coffee / primetime hype / late-night warning).
 */
export function usePetReactions(uid: string | undefined): PetReaction | null {
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const prevStreakRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReactionAtRef = useRef<number>(0);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const show = (r: Omit<PetReaction, 'id'>) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setReaction({ ...r, id: Date.now() });
    lastReactionAtRef.current = Date.now();
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

  // Pet-trigger path: writers other than this tab (e.g. the Chrome extension
  // when it marks an episode as watched on Netflix/Crunchyroll/…) drop a
  // {tone, at} object here. We react whenever the timestamp is fresh
  // (within 60s) so a tab opened later doesn't replay a stale trigger.
  useEffect(() => {
    if (!uid) return;
    const ref = dbRef(userPath(uid, 'petTrigger'));
    let lastSeenAt = 0;
    const onValue = (snap: firebase.database.DataSnapshot) => {
      const data = snap.val() as { tone?: PetReactionTone; at?: number } | null;
      if (!data?.at || !data.tone) return;
      if (data.at <= lastSeenAt) return;
      lastSeenAt = data.at;
      // Ignore triggers older than a minute – they're from a previous session.
      if (Date.now() - data.at > 60_000) return;
      show(pickReaction(data.tone));
    };
    ref.on('value', onValue);
    return () => {
      ref.off('value', onValue);
    };
  }, [uid]);

  // Subscribe to streak data and react to upward changes.
  useEffect(() => {
    if (!uid) return;
    const year = new Date().getFullYear();
    const ref = dbRef(userPath(uid, 'wrapped', year, 'streak'));

    const onValue = (snap: firebase.database.DataSnapshot) => {
      const data = snap.val() as { currentStreak?: number } | null;
      const current = data?.currentStreak ?? 0;
      const previous = prevStreakRef.current;
      prevStreakRef.current = current;

      // First snapshot – just remember the value.
      if (previous === null) return;
      if (current <= previous) return;

      if (STREAK_MILESTONES.has(current)) {
        show(pickReaction('milestone', { n: current }));
        return;
      }
      if (current >= 3) {
        show(pickReaction('streak', { n: current }));
        return;
      }
      show(pickReaction('cheer'));
    };

    ref.on('value', onValue);
    return () => {
      ref.off('value', onValue);
    };
  }, [uid]);

  // Idle reactions – fire a random ambient line if nothing has happened
  // for a while. Schedules the next tick recursively so we get a fresh
  // random delay each round.
  useEffect(() => {
    const scheduleNext = () => {
      const delay = IDLE_MIN_DELAY_MS + Math.random() * (IDLE_MAX_DELAY_MS - IDLE_MIN_DELAY_MS);
      idleTimerRef.current = setTimeout(() => {
        const sinceLast = Date.now() - lastReactionAtRef.current;
        if (sinceLast >= IDLE_MIN_DELAY_MS && document.visibilityState !== 'hidden') {
          show(pickReaction(pickIdleTone()));
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return reaction;
}

/**
 * Imperative trigger – call from anywhere to ask the pet to react.
 * The widget listens via the window CustomEvent bus.
 *
 * Two usage shapes:
 *   triggerPetReaction({ tone: 'binge', emoji: '🔥', message: 'On fire!' })
 *   triggerPetReaction({ tone: 'binge' })   // random line from the binge pool
 */
export function triggerPetReaction(
  reaction:
    | Omit<PetReaction, 'id'>
    | { tone: PetReactionTone; vars?: Record<string, string | number> }
): void {
  if (typeof window === 'undefined') return;
  const detail: Omit<PetReaction, 'id'> =
    'message' in reaction && 'emoji' in reaction
      ? reaction
      : pickReaction(reaction.tone, reaction.vars);
  window.dispatchEvent(new CustomEvent('pet-reaction', { detail }));
}
