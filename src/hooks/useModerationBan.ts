import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface ModerationBanState {
  discussions: boolean;
  tickets: boolean;
  /** Ablauf-Timestamps (ms) — undefined bei permanentem/keinem Ban. */
  discussionsUntil?: number;
  ticketsUntil?: number;
}

const NO_BAN: ModerationBanState = { discussions: false, tickets: false };

/** Alles über ~10 Jahren gilt als permanent (Anzeige ohne Datum). */
export const isPermanentBan = (until?: number): boolean =>
  !!until && until > Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;

/** Liest den eigenen Ban-Status (moderation/bans/$uid) — Rules erzwingen ihn serverseitig. */
export const useModerationBan = (): ModerationBanState => {
  const { user } = useAuth() || {};
  const [ban, setBan] = useState<ModerationBanState>(NO_BAN);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const { dbRef } = await import('../services/db/ref');
        const snap = await dbRef(`moderation/bans/${user.uid}`).once('value');
        const val = snap.val() as { discussionsUntil?: number; ticketsUntil?: number } | null;
        if (cancelled || !val) return;
        const now = Date.now();
        setBan({
          discussions: (val.discussionsUntil || 0) > now,
          tickets: (val.ticketsUntil || 0) > now,
          discussionsUntil: val.discussionsUntil,
          ticketsUntil: val.ticketsUntil,
        });
      } catch {
        /* kein Zugriff = kein Ban */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  return ban;
};
